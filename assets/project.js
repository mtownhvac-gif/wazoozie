import {takeAskHandoff} from './ask-handoff.mjs';
import {receiptTracking} from './receipt-tracking.js';
import {entryContext} from './lead-context.mjs';
import {neighborCode} from './neighbor-config.mjs';
import {BUSINESSES, INTENTS, CONSENT_VERSION, PROJECT_QUESTIONS, PROJECT_GROUPS} from './project-config.mjs';

const $ = selector => document.querySelector(selector);
const form = $('#projectForm');
const params = new URLSearchParams(location.search);
const incomingNeighbor=neighborCode(params.get('neighbor'));
if (incomingNeighbor) document.querySelector('#neighborCredit').hidden=false;
const requestedIntent = params.get('intent');
let selected = Object.hasOwn(INTENTS, requestedIntent) ? requestedIntent : (BUSINESSES[params.get('provider')]?.defaultIntent || null);
function newReference() {
  if (crypto.randomUUID) return crypto.randomUUID();
  // Secure UUID fallback for local HTTP previews.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}
const id = newReference();
const startedAt = Date.now();
let captureReady = false;
let emailProviders = [];
let deliveryStatus = "not_sent";
let pendingRequest;
let pendingMonth;
let availabilityCheck = 0;
let checkingAvailability = false;
const lockedControls = new Map();
function lockRequest(locked) {
  if (locked && !lockedControls.size) {
    // Keep call, copy and download available while protecting the exact request
    // from edits during an uncertain save or an explicit idempotent retry.
    for (const control of [...form.querySelectorAll('input,select,textarea,[data-back],#projectNext1,#projectNext2,#retryCapture'), $('#keepNeighborCredit')].filter(Boolean)) {
      if (control.closest('#reviewConnections')) continue;
      lockedControls.set(control, control.disabled);
      control.disabled = true;
    }
  } else if (!locked) {
    for (const [control, disabled] of lockedControls) control.disabled = disabled;
    lockedControls.clear();
  }
}
async function requestJSON(url, options = {}, timeout = 12000) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      (async () => { const response = await fetch(url, {...options, signal: controller.signal}); return {response, result: await response.json()}; })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Request timed out.')); }, timeout); })
    ]);
  } finally { clearTimeout(timer); }
}
function emailChoice() {
  const allowed = selected && emailProviders.includes(INTENTS[selected].provider);
  $('#projectSave').textContent = saving ? 'Saving your brief…' : pendingRequest ? 'Retry the same request →' : allowed ? 'Submit request →' : 'Save my project brief →';
  const heading=$('#projectContactHeading'),note=$('#projectContactNote');
  if(heading)heading.textContent=allowed?'Ask Wazoozie to arrange an introduction':'Keep a copy of your notes';
  if(note)note.textContent=allowed?'Add your details to email a request to Wazoozie Help for review and forwarding. If you book directly, enter your details only on the business’s booking page.':'Use the email button above to send your request to wazooziehelp@gmail.com for review and forwarding. Saving a copy here does not send an email.';
  $('#submissionConsent').textContent = allowed ? 'I agree to Wazoozie saving my contact information and project details and emailing it to wazooziehelp@gmail.com for the Wazoozie team to review and forward to the business I selected.' : 'I agree to Wazoozie saving my contact information and project details for review and follow-up about this project.';
}
let saving = false;
let submitted;
const make = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (className) el.className = className;
  return el;
};
function businessLink(text, url, className) {
  const a = make('a', text, className);
  a.href = url;
  return a;
}
const fieldErrors = new Map();
const fieldLabels = {details:'Project details',name:'Your name',phone:'Phone',email:'Email',town:'Town',zip:'ZIP code',consent:'Permission to save or send'};
function fieldMessage(field) {
  const value = field.value.trim();
  if (field.name === 'details' && value.length < 15) return 'Describe the job in at least 15 characters.';
  if (field.name === 'name' && value.length < 2) return 'Enter your name (at least 2 characters).';
  if (field.name === 'town' && value.length < 2) return 'Enter your town (at least 2 characters).';
  if (field.name === 'phone' && !/^\d{10,15}$/.test(value.replace(/\D/g,''))) return 'Enter a phone number with 10 to 15 digits.';
  if (field.name === 'zip' && !/^\d{5}$/.test(value)) return 'Enter a five-digit ZIP code.';
  if (field.name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a complete email address, or leave this optional field blank.';
  if (field.name === 'consent' && !field.checked) return 'Review the privacy notice and check the permission box before saving or sending.';
  return field.checkValidity() ? '' : field.validationMessage;
}
function setFieldError(field, message) {
  if (!field.id) field.id = 'project-field-' + field.name;
  const errorId = field.id + '-error';
  let note = document.getElementById(errorId);
  if (!note) { note = make('span', '', 'project-field-error'); note.id = errorId; field.closest('label').append(note); }
  note.textContent = message; note.hidden = !message;
  const described = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  if (message) { described.add(errorId); field.setAttribute('aria-invalid','true'); fieldErrors.set(field, message); }
  else { described.delete(errorId); field.removeAttribute('aria-invalid'); fieldErrors.delete(field); }
  if (described.size) field.setAttribute('aria-describedby',[...described].join(' ')); else field.removeAttribute('aria-describedby');
}
function error(message = '') {
  $('#projectError').replaceChildren();
  if (message) { $('#projectError').textContent = message; $('#projectError').focus(); }
}
function validationSummary(focus = false) {
  const summary = $('#projectError'); summary.replaceChildren();
  if (!fieldErrors.size) return;
  summary.append(make('strong', 'Check ' + fieldErrors.size + (fieldErrors.size === 1 ? ' highlighted field.' : ' highlighted fields.')));
  const list = make('ul');
  for (const [field, message] of fieldErrors) {
    const item = make('li'), link = businessLink((fieldLabels[field.name] || 'Field') + ': ' + message, '#' + field.id);
    link.addEventListener('click', event => { event.preventDefault(); field.closest('details')?.setAttribute('open',''); field.focus(); });
    item.append(link); list.append(item);
  }
  summary.append(list);
  if (focus) summary.focus();
}
function validateStep(step, consent = false) {
  for (const [field] of fieldErrors) setFieldError(field, '');
  for (const field of $(`#projectStep${step}`).querySelectorAll('input,select,textarea')) {
    if (field.disabled || field.readOnly) continue;
    if (field.name === 'consent' && !consent) continue;
    const message = fieldMessage(field); if (message) setFieldError(field, message);
  }
  validationSummary(true);
  return !fieldErrors.size;
}
form.addEventListener('input', event => {
  const field = event.target;
  if (fieldErrors.has(field)) { setFieldError(field, fieldMessage(field)); validationSummary(); }
});
form.addEventListener('change', event => {
  const field = event.target;
  if (fieldErrors.has(field)) { setFieldError(field, fieldMessage(field)); validationSummary(); }
});
function showStep(number) {
  if (saving || pendingRequest) return;
  for (const [field] of fieldErrors) setFieldError(field, '');
  error();
  for (let i = 1; i <= 3; i++) {
    $(`#projectStep${i}`).hidden = i !== number;
    const progress = $(`#progress${i}`);
    if (i === number) progress.setAttribute('aria-current', 'step');
    else progress.removeAttribute('aria-current');
  }
  $(`#projectStep${number} h2`).focus();
}
function showBusiness() {
  emailChoice();
  const quick = $('#projectQuickConnect');
  const dock=$('#projectConnectionDock');if(dock){dock.hidden=!selected;if(selected)dock.replaceChildren(directActions(BUSINESSES[INTENTS[selected].provider],true));}
  $('#projectNext1').disabled = !selected;
  quick.hidden = !selected;
  if (!selected) {
    const copy = make('div', '', 'project-business-copy');
    copy.append(make('div','YOUR HOME. YOUR NEXT PROJECT.','eyebrow'),make('h2','Start with what needs doing.'),make('p','Choose a project to see the business to contact and the details worth having ready.'),make('p','Browse freely. Contact details are only needed if you choose to prepare and save a project brief.'));
    $('#projectBusiness').replaceChildren(copy);
    return;
  }
  const intent = INTENTS[selected];
  const detail = $('#projectServiceDetail');
  const hasDetail = selected === 'comfort' || intent.parent === 'comfort';
  $('#projectServiceDetailLabel').hidden = !hasDetail;
  if (hasDetail) detail.value = selected;
  for (const radio of document.querySelectorAll('#projectChoices input')) radio.checked = radio.value === selected || radio.value === intent.parent;
  const provider = BUSINESSES[INTENTS[selected].provider];
  const aside = $('#projectBusiness');
  aside.replaceChildren();
  const image = make('img');
  image.src = `/assets/${provider.image}.jpg`;
  image.alt = INTENTS[selected].provider === 'middletown' ? 'Conventional tank Water Heater and Heil Furnace installation published by Middletown HVAC' : 'Illustrative home-service scene';
  image.width = 600; image.height = 500;
  const copy = make('div', '', 'project-business-copy');
  copy.append(make('div', intent.scopeCheck ? 'DISCUSS YOUR PROJECT WITH' : 'YOUR SELECTED BUSINESS', 'eyebrow'), make('h2', provider.name), make('p', INTENTS[selected].description), make('p', 'Confirm your address, project fit and availability directly before scheduling.'));
  if (intent.scopeCheck) copy.append(make('p', intent.scopeCheck, 'project-fit-note'));
  if (provider.booking) copy.append(businessLink('Book online with Middletown ↗', provider.booking, 'btn primary'));
  copy.append(businessLink('Get to know this business →', `/businesses/${provider.slug}/`), businessLink(`Call ${provider.phone}`, `tel:${provider.tel}`));
  copy.append(make('p', INTENTS[selected].provider === 'middletown' ? 'Actual work · Published by Middletown HVAC' : 'Illustrative imagery · Not a customer project', 'project-photo-label'));
  aside.append(image, copy);
  const prompts = $('#projectPrompts');
  const list = make('ul', '', 'guide-checklist');
  for (const question of PROJECT_QUESTIONS[selected]) list.append(make('li', question));
  prompts.replaceChildren(make('h3', 'A few useful things to include.'), list);
  form.elements.details.placeholder = PROJECT_QUESTIONS[selected][0] + ' Tell us what you know; it’s fine to be unsure.';
  quick.replaceChildren(make('h3', 'Call or schedule directly'), make('p', `Contact ${provider.name} directly. The planner below is optional.`), directActions(provider),make('p',provider.booking?'Online booking opens Housecall Pro. Enter your contact details there; your planner notes are not sent to the booking page.':'Call the business to arrange a time. A saved brief is not an appointment.','project-muted'));
}
for (const group of PROJECT_GROUPS) {
  const fieldset = make('fieldset', '', 'project-choice-group');
  fieldset.append(make('legend', group.label));
  const grid = make('div', '', 'project-choice-grid');
  for (const key of group.intents) {
    const intent = INTENTS[key];
    const label = make('label', '', 'project-choice');
    const radio = make('input');
    radio.type = 'radio'; radio.name = 'intent'; radio.value = key;
    radio.addEventListener('change', () => {
      selected = key;
      form.elements.consent.checked = false;
      showBusiness();
    });
    label.append(radio, make('strong', intent.label), make('small', intent.description));
    grid.append(label);
  }
  fieldset.append(grid);
  $('#projectChoices').append(fieldset);
}
for (const key of ['comfort','boiler','replacement','maintenance','secondopinion']) {
  const option = make('option', key === 'comfort' ? 'Repair or a comfort problem' : INTENTS[key].label);
  option.value = key;
  $('#projectServiceDetail').append(option);
}
$('#projectServiceDetail').addEventListener('change', event => {
  selected = event.target.value;
  form.elements.consent.checked = false;
  showBusiness();
});

showBusiness();
if(params.get('entry')==='ask'&&selected){const carried=takeAskHandoff(sessionStorage,selected);if(carried){form.elements.details.value=carried;form.elements.consent.checked=false;const notice=make('p','Your planning notes were brought over from Ask Wazoozie. Review and edit them before you choose to send a request. Nothing has been sent.','project-muted');form.elements.details.insertAdjacentElement('afterend',notice);}}
form.addEventListener('input',()=>{if(!saving && !pendingRequest && !$('#projectStep3').hidden)review(values());});
$('#projectNext1').addEventListener('click', () => { if (selected) showStep(2); });
for (const button of document.querySelectorAll('[data-back]')) button.addEventListener('click', () => showStep(Number(button.dataset.back)));
function updateNotices() {
  const state = form.elements.state.value;
  $('#coverageNotice').textContent = state === 'PA' ? 'Each business confirms coverage for your exact address before scheduling.' : 'New Jersey and Delaware provider coverage is not confirmed. Call the business before making plans; saving a brief does not confirm service in your area.';
  $('#urgentNotice').hidden = form.elements.timing.value !== 'Urgent';
}
form.elements.state.addEventListener('change', updateNotices);
form.elements.timing.addEventListener('change', updateNotices);
function values() {
  const data = Object.fromEntries(new FormData(form));
  return {...data, ...(incomingNeighbor && document.querySelector('#keepNeighborCredit').checked ? {neighborCode:incomingNeighbor} : {}), provider: INTENTS[selected].provider, intent: selected, notifyProvider: emailProviders.includes(INTENTS[selected].provider), consent: form.elements.consent.checked, consentVersion: CONSENT_VERSION, id, startedAt, entryContext:entryContext(params.get('entry')), source: ['partner-ryan', 'partner-liberator', 'partner-cooke', 'neighbor'].includes(params.get('ref')) ? params.get('ref') : 'start-page'};
}
function review(data) {
  const list = make('dl');
  const fields = [['Business to contact', BUSINESSES[data.provider].name], ['Project', INTENTS[data.intent].label], ['Location & timing', `${data.town?data.town+', '+data.state+' '+data.zip:'Add your location below if you send a request'} · ${data.timing}`], ['About the property', data.property==='Other'&&data.role==='Other'?'Not specified':`${data.property} · ${data.role}`], ['What you’d like help with', data.details], ['Equipment / project type', data.equipment || 'Not specified']];
  if(data.name||data.phone||data.email)fields.push(['Your contact details',`${data.name}\n${data.phone}${data.email?'\n'+data.email:''}`]);
  if (data.neighborCode) fields.push(['Neighbor introduction', 'Attach this introduction when saving. Any Middletown HVAC service credit requires a qualifying paid job and office verification; saving alone earns nothing. No referrer contact details are shared.']);
  if (INTENTS[data.intent].scopeCheck) fields.push(['Project fit to confirm', INTENTS[data.intent].scopeCheck]);
  for (const [label, value] of fields) list.append(make('dt', label), make('dd', value));
  $('#projectReview').replaceChildren(list);
  if (data.timing === 'Urgent') $('#projectReview').prepend(make('p', 'Need help urgently? Call the business directly to ask about availability. This form is not emergency dispatch. For an immediate threat to life or safety, call 911.', 'project-notice'));
  const connection = $('#reviewConnections');
  connection.replaceChildren(make('h3', 'Choose how to get in touch.'), directActions(BUSINESSES[data.provider]), shareActions(data, false), make('p', BUSINESSES[data.provider].booking?'Book in Housecall Pro or call the office. Your planner details are not sent to the booking page.':'Call the business to arrange a time. You can copy your notes to share yourself; saving a brief below does not notify this business.'));
}
$('#projectNext2').addEventListener('click', () => {
  if (saving || pendingRequest || !validateStep(2)) return;
  review(values()); showStep(3);
});
async function checkAvailability() {
  if (saving || pendingRequest || checkingAvailability) return;
  const sequence = ++availabilityCheck;
  checkingAvailability = true;
  $('#projectSave').disabled = true;
  $('#retryCapture').disabled = true;
  $('#captureStatus').textContent = 'Checking project-brief availability…';
  const priorDelivery = selected && emailProviders.includes(INTENTS[selected].provider);
  captureReady = false;
  emailProviders = [];
  try {
    const {response, result: capability} = await requestJSON('/api/project-capabilities', {cache:'no-store'});
    if (sequence !== availabilityCheck) return;
    captureReady = response.ok && capability?.captureReady === true;
    emailProviders = captureReady && Array.isArray(capability.emailProviders) ? capability.emailProviders.filter(key => Object.hasOwn(BUSINESSES,key)) : [];
  } catch { captureReady = false; emailProviders = []; }
  finally { checkingAvailability = false; }
  const deliveryChanged = priorDelivery !== (selected && emailProviders.includes(INTENTS[selected].provider));
  if (deliveryChanged) form.elements.consent.checked = false;
  emailChoice();
  $('#projectSave').disabled = !captureReady || saving;
  $('#retryCapture').disabled = false;
  $('#retryCapture').hidden = captureReady;
  $('#captureStatus').textContent = captureReady ? 'Project saving is available. Review your request and consent before submitting.' : 'Project saving is currently unavailable. Your details have not been sent. Email your brief to Wazoozie Help or call the business directly.';
  if (deliveryChanged && !$('#projectStep3').hidden) $('#captureStatus').textContent += ' The available sending option changed. Please review the permission text again.';
}
checkAvailability();
$('#retryCapture').addEventListener('click', checkAvailability);
function briefText(data, saved = true) {
  return ['WAZOOZIE · YOUR PROJECT BRIEF', `Reference: WZ-${id.slice(0, 8).toUpperCase()}`, '', `Business: ${BUSINESSES[data.provider].name}`, `Phone: ${BUSINESSES[data.provider].phone}`, ...(data.neighborCode && data.provider === 'middletown' ? [`Wazoozie referral: https://wazoozie.com/start/?neighbor=${data.neighborCode}`, 'Please record this introduction before booking. Any referral service credit requires office verification of the qualifying paid job.'] : []), `Service: ${INTENTS[data.intent].label}`, `Location: ${data.town}, ${data.state} ${data.zip}`, `Timing: ${data.timing}`, `Property: ${data.property} / ${data.role}`, `Equipment / project type: ${data.equipment || 'Not specified'}`, '', data.details, '', `Name: ${data.name}`, `Phone: ${data.phone}`, `Email: ${data.email || 'Not supplied'}`, '', saved ? `Saved with Wazoozie. ${deliveryStatus === 'automation_accepted' ? 'The email service accepted the request for Wazoozie Help to review and forward; inbox delivery is not confirmed.' : deliveryStatus === 'pending' ? 'Email request queued for retry; call if you need help.' : 'No automatic email has been confirmed.'} No appointment has been booked.` : 'Prepared in the homeowner’s browser. No appointment has been booked. Please confirm coverage, timing and any diagnostic charge.'].join('\n');
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitted || saving || checkingAvailability || !captureReady) return;
  // Enter on an earlier step must never submit hidden contact fields.
  if ($('#projectStep3').hidden) return;
  if (pendingRequest && pendingMonth !== new Date().toISOString().slice(0,7)) return error('This request can no longer be safely retried here. Contact Wazoozie Help with reference WZ-' + id.slice(0,8).toUpperCase() + ' to confirm receipt before starting another brief.');
  if (!pendingRequest && !validateStep(3, true)) return;
  error();
  const data = pendingRequest || values();
  if (!pendingRequest) pendingMonth = new Date().toISOString().slice(0,7);
  pendingRequest = data;
  saving = true; lockRequest(true); form.setAttribute('aria-busy','true');
  $('#projectSave').disabled = true; emailChoice();
  try {
    const {response, result} = await requestJSON('/api/project-briefs', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)}, 20000);
    if (!response.ok) {
      // A definite validation/rate-limit rejection is editable. Network failures,
      // 5xx and malformed replies may follow a successful save, so retain the
      // same reference and payload for a user-triggered retry.
      if (response.status >= 400 && response.status < 500) { pendingRequest = undefined; lockRequest(false); }
      throw new Error(result?.error || 'We could not confirm that your brief was saved. Retry or call the business directly.');
    }
    if (result?.status !== 'saved' || (result.reference && result.reference !== id)) throw new Error('The save response was incomplete.');
    submitted = data; pendingRequest = undefined;
    deliveryStatus = result.providerDelivery;
    $('#receiptDelivery').textContent = deliveryStatus === 'automation_accepted' ? 'Saved privately. The email service accepted your request for Wazoozie Help to review and forward. Inbox delivery is not confirmed, and no appointment has been booked.' : deliveryStatus === 'pending' ? 'Saved privately. Your email request is waiting for retry. Call the business directly if you need help soon; no appointment has been booked.' : deliveryStatus === 'failed' ? 'Saved privately, but automatic email could not be confirmed. Please call the business directly.' : 'Saved privately with Wazoozie. The business has not been notified, and no appointment has been booked.';
    document.querySelector('#neighborCredit').hidden=true;
    if(data.neighborCode) document.querySelector('#receiptNeighborStatus').textContent=result.referralAttributed ? 'Your neighbor introduction was credited with this saved brief.' : 'Your project was saved, but this neighbor link could not be credited. It may have expired.';
    const dock=$('#projectConnectionDock');if(dock)dock.hidden=true;
    form.hidden = true;
    $('#projectReceipt').hidden = false;
    $('#receiptMessage').textContent = `WZ-${id.slice(0, 8).toUpperCase()} · ${INTENTS[data.intent].label} with ${BUSINESSES[data.provider].name}.`;
    const provider = BUSINESSES[data.provider];
    $('#receiptActions').append(businessLink(`Call ${provider.phone}`, `tel:${provider.tel}`, 'btn primary'));
    if (provider.booking) $('#receiptActions').append(businessLink('Book online with Middletown ↗', provider.booking, 'btn outline'));
    $('#projectQuickConnect').hidden = true;
    $('#receiptShare').replaceChildren(shareActions(data, true));
    receiptTracking(document,$('#projectReceipt'),{intent:data.intent,delivery:deliveryStatus});
    $('#projectReceipt').focus();
  } catch (failure) {
    error(pendingRequest ? 'We could not confirm whether your request was saved. Your details are still here and held unchanged for a safe retry. Choose “Retry the same request” or call the business directly. Do not start another brief for the same request.' : failure.message || 'We could not confirm the save. Your next step is to retry or call directly.');
  } finally { saving = false; form.removeAttribute('aria-busy'); $('#projectSave').disabled = !captureReady; emailChoice(); }
});
function directActions(provider, compact = false) {
  const actions = make('div', '', 'project-actions');
  actions.append(businessLink(compact?'Call':`Call ${provider.phone}`, `tel:${provider.tel}`, 'btn primary'));
  if (provider.booking) actions.append(businessLink(compact?'Book online':'Book online with Middletown ↗', provider.booking, 'btn outline'));
  return actions;
}
function download(data, saved) {
  const url = URL.createObjectURL(new Blob([briefText(data, saved)], {type: 'text/plain;charset=utf-8'}));
  const link = businessLink('', url); link.download = `wazoozie-project-${id.slice(0, 8)}.txt`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function shareActions(data, saved) {
  const provider = {...BUSINESSES[data.provider], email:'wazooziehelp@gmail.com'};
  const container = make('div');
  const actions = make('div', '', 'project-actions');
  if (provider.email) {
    const subject = `Wazoozie project inquiry · ${INTENTS[data.intent].label}`;
    actions.append(businessLink(`Email my brief to Wazoozie Help ↗`, `mailto:${provider.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(briefText(data, saved))}`, 'btn primary'));
    container.append(make('p', `Your email draft is addressed only to ${provider.email}. You must send it yourself. Wazoozie reviews your request and forwards it to the appropriate business. If your email app does not open, copy or download your brief.`, 'project-muted'));
  }
  const copy = make('button', 'Copy my brief', 'btn outline');
  copy.type = 'button';
  const status = make('p', '', 'project-copy-status');
  status.setAttribute('role', 'status');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(briefText(data, saved));
      status.textContent = 'Copied. Paste your brief into a message to your selected business.';
    } catch {
      status.textContent = 'Select and copy your brief below.';
      const fallback = make('textarea', '', 'project-copy-fallback');
      fallback.value = briefText(data, saved); fallback.readOnly = true;
      fallback.setAttribute('aria-label', 'Your project brief to copy');
      container.append(fallback); fallback.focus(); fallback.select();
      copy.disabled = true;
    }
  });
  actions.append(copy);
  if (!saved) {
    const button = make('button', 'Download my brief ↓', 'btn outline');
    button.type = 'button'; button.addEventListener('click', () => download(data, false));
    actions.append(button);
  }
  container.append(actions, status);
  return container;
}
$('#downloadBrief').addEventListener('click', () => { if (submitted) download(submitted, true); });
