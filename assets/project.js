import {BUSINESSES, INTENTS, CONSENT_VERSION} from './project-config.mjs';

const $ = selector => document.querySelector(selector);
const form = $('#projectForm');
const params = new URLSearchParams(location.search);
const requestedIntent = params.get('intent');
let selected = Object.hasOwn(INTENTS, requestedIntent) ? requestedIntent : Object.keys(INTENTS).find(key => INTENTS[key].provider === params.get('provider')) || 'comfort';
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
  const provider = BUSINESSES[INTENTS[selected].provider];
  const aside = $('#projectBusiness');
  aside.replaceChildren();
  const image = make('img');
  image.src = `/assets/${provider.image}.jpg`;
  image.alt = INTENTS[selected].provider === 'middletown' ? 'Published Middletown HVAC outdoor ductless installation' : 'Illustrative home-service scene';
  image.width = 600; image.height = 500;
  const copy = make('div', '', 'project-business-copy');
  copy.append(make('div', 'YOUR SELECTED BUSINESS', 'eyebrow'), make('h2', provider.name), make('p', INTENTS[selected].description), make('p', 'Confirm your address, project fit and availability directly before scheduling.'));
  copy.append(businessLink('Get to know this business →', `/businesses/${provider.slug}/`), businessLink(`Call ${provider.phone}`, `tel:${provider.tel}`));
  copy.append(make('p', INTENTS[selected].provider === 'middletown' ? 'Actual work · Published by Middletown HVAC' : 'Illustrative imagery · Not a customer project', 'project-photo-label'));
  aside.append(image, copy);
}
for (const [key, intent] of Object.entries(INTENTS)) {
  const label = make('label', '', 'project-choice');
  const radio = make('input');
  radio.type = 'radio'; radio.name = 'intent'; radio.value = key; radio.checked = key === selected;
  radio.addEventListener('change', () => { selected = key; showBusiness(); });
  label.append(radio, make('strong', intent.label), make('small', intent.description));
  $('#projectChoices').append(label);
}
showBusiness();
$('#projectNext1').addEventListener('click', () => showStep(2));
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
  return {...data, provider: INTENTS[selected].provider, intent: selected, consent: form.elements.consent.checked, consentVersion: CONSENT_VERSION, id, startedAt, source: ['partner-ryan', 'partner-liberator', 'partner-cooke', 'neighbor'].includes(params.get('ref')) ? params.get('ref') : 'start-page'};
}
function review(data) {
  const list = make('dl');
  const fields = [['Selected business', BUSINESSES[data.provider].name], ['Project', INTENTS[data.intent].label], ['Location & timing', `${data.town}, ${data.state} ${data.zip} · ${data.timing}`], ['About the property', `${data.property} · ${data.role}`], ['What you’d like help with', data.details], ['Equipment / project type', data.equipment || 'Not specified'], ['Your contact details', `${data.name}\n${data.phone}${data.email ? '\n' + data.email : ''}`]];
  for (const [label, value] of fields) list.append(make('dt', label), make('dd', value));
  $('#projectReview').replaceChildren(list);
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
    captureReady = response.ok && (await response.json()).captureReady === true;
  } catch { captureReady = false; }
  $('#projectSave').disabled = !captureReady;
  $('#captureStatus').textContent = captureReady ? 'Project saving is available. Your selected business is not automatically notified.' : 'Project saving is currently unavailable. Your details have not been sent. Use the direct contact link for your selected business.';
}
checkAvailability();
function briefText(data) {
  return ['WAZOOZIE · YOUR PROJECT BRIEF', `Reference: WZ-${id.slice(0, 8).toUpperCase()}`, '', `Business: ${BUSINESSES[data.provider].name}`, `Phone: ${BUSINESSES[data.provider].phone}`, `Service: ${INTENTS[data.intent].label}`, `Location: ${data.town}, ${data.state} ${data.zip}`, `Timing: ${data.timing}`, `Property: ${data.property} / ${data.role}`, `Equipment / project type: ${data.equipment || 'Not specified'}`, '', data.details, '', `Name: ${data.name}`, `Phone: ${data.phone}`, `Email: ${data.email || 'Not supplied'}`, '', 'Saved with Wazoozie. The business has not been notified. No appointment has been booked. Contact the business directly to arrange service.'].join('\n');
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
    form.hidden = true;
    $('#projectReceipt').hidden = false;
    $('#receiptMessage').textContent = `WZ-${id.slice(0, 8).toUpperCase()} · ${INTENTS[data.intent].label} with ${BUSINESSES[data.provider].name}.`;
    const provider = BUSINESSES[data.provider];
    $('#receiptActions').append(businessLink(`Call ${provider.phone}`, `tel:${provider.tel}`, 'btn primary'));
    if (provider.booking) $('#receiptActions').append(businessLink('Book with Middletown ↗', provider.booking, 'btn outline'));
    $('#projectReceipt').focus();
  } catch (failure) { error(failure.message || 'We could not confirm the save. Your next step is to retry or call directly.'); }
  finally { saving = false; $('#projectSave').disabled = !captureReady; $('#projectSave').textContent = 'Save my project brief →'; }
});
$('#downloadBrief').addEventListener('click', () => {
  if (!submitted) return;
  const url = URL.createObjectURL(new Blob([briefText(submitted)], {type: 'text/plain;charset=utf-8'}));
  const link = businessLink('', url); link.download = `wazoozie-project-${id.slice(0, 8)}.txt`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
