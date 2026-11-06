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
function emailChoice() {
  const allowed = selected && emailProviders.includes(INTENTS[selected].provider);
  $('#projectSave').textContent = allowed ? 'Submit request →' : 'Save my project brief →';
  $('#submissionConsent').textContent = allowed ? 'I agree to Wazoozie saving my contact information and project details and sharing this request with the business I selected so its office can follow up.' : 'I agree to Wazoozie saving my contact information and project details for review and follow-up about this project.';
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
function error(message = '') {
  $('#projectError').textContent = message;
  if (message) $('#projectError').focus();
}
function showStep(number) {
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
  if (provider.booking) copy.append(businessLink('Book with Middletown ↗', provider.booking, 'btn primary'));
  copy.append(businessLink('Get to know this business →', `/businesses/${provider.slug}/`), businessLink(`Call ${provider.phone}`, `tel:${provider.tel}`));
  copy.append(make('p', INTENTS[selected].provider === 'middletown' ? 'Actual work · Published by Middletown HVAC' : 'Illustrative imagery · Not a customer project', 'project-photo-label'));
  aside.append(image, copy);
  const prompts = $('#projectPrompts');
  const list = make('ul', '', 'guide-checklist');
  for (const question of PROJECT_QUESTIONS[selected]) list.append(make('li', question));
  prompts.replaceChildren(make('h3', 'A few useful things to include.'), list);
  form.elements.details.placeholder = PROJECT_QUESTIONS[selected][0] + ' Tell us what you know; it’s fine to be unsure.';
  quick.replaceChildren(make('h3', 'Ready to speak with someone?'), make('p', `Contact ${provider.name} directly. Project planning below is optional.`), directActions(provider));
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
  return {...data, ...(incomingNeighbor && document.querySelector('#keepNeighborCredit').checked ? {neighborCode:incomingNeighbor} : {}), provider: INTENTS[selected].provider, intent: selected, notifyProvider: emailProviders.includes(INTENTS[selected].provider), consent: form.elements.consent.checked, consentVersion: CONSENT_VERSION, id, startedAt, source: ['partner-ryan', 'partner-liberator', 'partner-cooke', 'neighbor'].includes(params.get('ref')) ? params.get('ref') : 'start-page'};
}
function review(data) {
  const list = make('dl');
  const fields = [['Business to contact', BUSINESSES[data.provider].name], ['Project', INTENTS[data.intent].label], ['Location & timing', `${data.town}, ${data.state} ${data.zip} · ${data.timing}`], ['About the property', `${data.property} · ${data.role}`], ['What you’d like help with', data.details], ['Equipment / project type', data.equipment || 'Not specified'], ['Your contact details', `${data.name}\n${data.phone}${data.email ? '\n' + data.email : ''}`]];
  if (data.neighborCode) fields.push(['Neighbor introduction', 'Attach this neighbor’s referral credit when saving. No referrer contact details are shared.']);
  if (INTENTS[data.intent].scopeCheck) fields.push(['Project fit to confirm', INTENTS[data.intent].scopeCheck]);
  for (const [label, value] of fields) list.append(make('dt', label), make('dd', value));
  $('#projectReview').replaceChildren(list);
  const connection = $('#reviewConnections');
  connection.replaceChildren(make('h3', 'Put your plan to work.'), directActions(BUSINESSES[data.provider]), shareActions(data, false), make('p', 'Calling and booking connect directly to the business. An email link opens a draft in your own email app; review and send it yourself. Saving below is optional.'));
}
$('#projectNext2').addEventListener('click', () => {
  for (const input of $('#projectStep2').querySelectorAll('input,select,textarea')) {
    if (!input.reportValidity()) return;
  }
  const data = values();
  if (data.phone.replace(/\D/g, '').length < 10 || data.phone.replace(/\D/g, '').length > 15) return error('Enter a valid phone number so the office can reach you.');
  if (data.details.trim().length < 15 || data.town.trim().length < 2 || data.name.trim().length < 2) return error('Add your name, town and a little more detail about the project.');
  review(data); showStep(3);
});
async function checkAvailability() {
  try {
    const response = await fetch('/api/project-capabilities', {cache: 'no-store'});
    const capability = await response.json();
    captureReady = response.ok && capability.captureReady === true;
    emailProviders = response.ok && Array.isArray(capability.emailProviders) ? capability.emailProviders : [];
    emailChoice();
  } catch { captureReady = false; }
  $('#projectSave').disabled = !captureReady;
  $('#retryCapture').hidden = captureReady;
  $('#captureStatus').textContent = captureReady ? 'Project saving is available. Review your request and consent before submitting.' : 'Project saving is currently unavailable. Your details have not been sent. Use the direct contact link for your selected business.';
}
checkAvailability();
$('#retryCapture').addEventListener('click', checkAvailability);
function briefText(data, saved = true) {
  return ['WAZOOZIE · YOUR PROJECT BRIEF', `Reference: WZ-${id.slice(0, 8).toUpperCase()}`, '', `Business: ${BUSINESSES[data.provider].name}`, `Phone: ${BUSINESSES[data.provider].phone}`, `Service: ${INTENTS[data.intent].label}`, `Location: ${data.town}, ${data.state} ${data.zip}`, `Timing: ${data.timing}`, `Property: ${data.property} / ${data.role}`, `Equipment / project type: ${data.equipment || 'Not specified'}`, '', data.details, '', `Name: ${data.name}`, `Phone: ${data.phone}`, `Email: ${data.email || 'Not supplied'}`, '', saved ? `Saved with Wazoozie. ${deliveryStatus === 'automation_accepted' ? 'Zapier accepted the Middletown email request; inbox delivery is not confirmed.' : deliveryStatus === 'pending' ? 'Email request queued for retry; call if you need help.' : 'No automatic email has been confirmed.'} No appointment has been booked.` : 'Prepared in the homeowner’s browser. No appointment has been booked. Please confirm coverage, timing and any diagnostic charge.'].join('\n');
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (saving || !captureReady) return;
  if (!form.elements.consent.checked) return error('Please review the privacy notice and check the consent box before saving.');
  error(); saving = true;
  $('#projectSave').disabled = true; $('#projectSave').textContent = 'Saving your brief…';
  try {
    const data = values();
    const response = await fetch('/api/project-briefs', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'We could not confirm that your brief was saved. Retry or call the business directly.');
    submitted = data;
    deliveryStatus = result.providerDelivery;
    $('#receiptDelivery').textContent = deliveryStatus === 'automation_accepted' ? 'Saved privately. Your selected business’s email service accepted the request. Inbox delivery is not confirmed, and no appointment has been booked.' : deliveryStatus === 'pending' ? 'Saved privately. Your email request is waiting for retry. Call the business directly if you need help soon; no appointment has been booked.' : deliveryStatus === 'failed' ? 'Saved privately, but automatic email could not be confirmed. Please call the business directly.' : 'Saved privately with Wazoozie. The business has not been notified, and no appointment has been booked.';
    document.querySelector('#neighborCredit').hidden=true;
    if(data.neighborCode) document.querySelector('#receiptNeighborStatus').textContent=result.referralAttributed ? 'Your neighbor introduction was credited with this saved brief.' : 'Your project was saved, but this neighbor link could not be credited. It may have expired.';
    form.hidden = true;
    $('#projectReceipt').hidden = false;
    $('#receiptMessage').textContent = `WZ-${id.slice(0, 8).toUpperCase()} · ${INTENTS[data.intent].label} with ${BUSINESSES[data.provider].name}.`;
    const provider = BUSINESSES[data.provider];
    $('#receiptActions').append(businessLink(`Call ${provider.phone}`, `tel:${provider.tel}`, 'btn primary'));
    if (provider.booking) $('#receiptActions').append(businessLink('Book with Middletown ↗', provider.booking, 'btn outline'));
    $('#projectQuickConnect').hidden = true;
    $('#receiptShare').replaceChildren(shareActions(data, true));
    $('#projectReceipt').focus();
  } catch (failure) { error(failure.message || 'We could not confirm the save. Your next step is to retry or call directly.'); }
  finally { saving = false; $('#projectSave').disabled = !captureReady; emailChoice(); }
});
function directActions(provider) {
  const actions = make('div', '', 'project-actions');
  actions.append(businessLink(`Call ${provider.phone}`, `tel:${provider.tel}`, 'btn primary'));
  if (provider.booking) actions.append(businessLink('Book with Middletown ↗', provider.booking, 'btn outline'));
  return actions;
}
function download(data, saved) {
  const url = URL.createObjectURL(new Blob([briefText(data, saved)], {type: 'text/plain;charset=utf-8'}));
  const link = businessLink('', url); link.download = `wazoozie-project-${id.slice(0, 8)}.txt`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function shareActions(data, saved) {
  const provider = BUSINESSES[data.provider];
  const container = make('div');
  const actions = make('div', '', 'project-actions');
  if (provider.email) {
    const subject = `Wazoozie project inquiry · ${INTENTS[data.intent].label}`;
    actions.append(businessLink(`Email my brief to ${provider.name} ↗`, `mailto:${provider.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(briefText(data, saved))}`, 'btn primary'));
    container.append(make('p', `Your email draft is addressed only to ${provider.email}. You must send it yourself. If your email app does not open, copy or download your brief.`, 'project-muted'));
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
