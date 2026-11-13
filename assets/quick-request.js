import {BUSINESSES, INTENTS, CONSENT_VERSION} from './project-config.mjs';
import {entryContext} from './lead-context.mjs';
const $ = id => document.getElementById(id);
const form = $('quickRequest'), service = form.elements.intent;
const params = new URLSearchParams(location.search);
const startedAt = Date.now(), id = crypto.randomUUID();
let ready = false, providers = [], pending, pendingMonth, busy = false, complete = false;
for (const [value, intent] of Object.entries(INTENTS)) {
  const option = document.createElement('option'); option.value = value; option.textContent = intent.label; service.append(option);
}
if (Object.hasOwn(INTENTS, params.get('intent'))) service.value = params.get('intent');
function selectedBusiness() { return BUSINESSES[INTENTS[service.value]?.provider]; }
function contacts(business) {
  const box = document.createElement('div');
  for (const [href, text] of [[`tel:${business.tel}`, `Call ${business.phone}`], [`/businesses/${business.slug}/`, 'Business details →']]) {
    const link = document.createElement('a'); link.href = href; link.textContent = text; box.append(link);
  }
  return box;
}
function update() {
  const business = selectedBusiness(), container = $('request-business');
  container.replaceChildren();
  const text = document.createElement('p');
  if (business) {
    const name = document.createElement('strong'); name.textContent = business.name;
    text.textContent = 'Your request is for:'; container.append(text, name, contacts(business));
    $('request-permission').textContent = `I agree to Wazoozie saving these details and emailing them to wazooziehelp@gmail.com for review and forwarding to ${business.name}.`;
  } else { text.textContent = 'Choose a service to see the business and its phone number.'; container.append(text); }
  const available = ready && providers.includes(INTENTS[service.value]?.provider);
  $('request-send').disabled = busy || complete || (!pending && !available);
  $('request-send').textContent = busy ? 'Sending…' : pending ? 'Retry the same request →' : 'Send request →';
  $('request-status').textContent = pending ? 'We could not confirm receipt. Retry the same request below, or call the business with your reference. Your details are kept here until you leave this page.' : available ? 'Ready when you are. Wazoozie Help reviews and forwards your request.' : ready && !business ? 'Choose a service to continue.' : 'Online requests are unavailable for this service right now. Please call directly or email wazooziehelp@gmail.com.';
  $('request-recheck').hidden = busy || complete || !!pending || available;
  $('request-urgent').hidden = form.elements.timing.value !== 'Urgent';
  $('request-coverage').textContent = form.elements.state.value === 'PA' ? 'The business confirms coverage for your address before scheduling.' : 'Service in New Jersey and Delaware is not confirmed. Call the business to check coverage before sending.';
}
function lock(locked) {
  for (const input of form.querySelectorAll('input,select,textarea')) input.disabled = locked;
}
async function requestJSON(url, options = {}, timeout = 12000) {
  const controller = new AbortController(); let timer;
  try {
    return await Promise.race([
      (async () => {const response = await fetch(url, {...options, signal:controller.signal}); return {response, result:await response.json()};})(),
      new Promise((_, reject) => { timer = setTimeout(() => {controller.abort(); reject(new Error('The request timed out.'));}, timeout); })
    ]);
  } finally { clearTimeout(timer); }
}
async function check() {
  if (busy || pending || complete) return;
  ready = false; providers = []; busy = true; update();
  $('request-status').textContent = 'Checking request availability…';
  try {
    const {response, result} = await requestJSON('/api/project-capabilities', {cache:'no-store'});
    ready = response.ok && result?.captureReady === true;
    providers = ready && Array.isArray(result.emailProviders) ? result.emailProviders.filter(key => Object.hasOwn(BUSINESSES,key)) : [];
  } catch { ready = false; }
  busy = false; update();
}
service.addEventListener('change', () => { form.elements.consent.checked = false; update(); });
for (const field of ['state', 'timing']) form.elements[field].addEventListener('change', update);
$('request-recheck').addEventListener('click', check);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || complete || (!pending && (!ready || !providers.includes(INTENTS[service.value]?.provider) || !form.reportValidity()))) return;
  const error = $('request-error'); error.hidden = true;
  if (pending && pendingMonth !== new Date().toISOString().slice(0,7)) {
    error.textContent = `Please call the business with reference WZ-${id.slice(0,8).toUpperCase()} to check receipt before starting another request.`; error.hidden = false; return;
  }
  if (!pending) {
    if (Date.now() - startedAt < 2100) {error.textContent = 'Please take a moment to review your details, then send.'; error.hidden = false; return;}
    const data = Object.fromEntries(new FormData(form));
    pending = {...data,id,startedAt,provider:INTENTS[data.intent].provider,notifyProvider:true,consent:form.elements.consent.checked,consentVersion:CONSENT_VERSION,equipment:'',source:'start-page',entryContext:entryContext(params.get('entry'))};
    pendingMonth = new Date().toISOString().slice(0,7);
  }
  busy = true; lock(true); form.setAttribute('aria-busy','true'); update();
  try {
    const {response, result} = await requestJSON('/api/project-briefs', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pending)},20000);
    if (!response.ok) {
      // A conflict or uncertain response must retain the exact payload and ID.
      if ([400,422,429].includes(response.status)) { pending = undefined; lock(false); }
      throw new Error(result?.error || 'We could not confirm receipt. Please retry or call directly.');
    }
    if (result?.status !== 'saved' || result.reference !== id || !['automation_accepted','pending','failed','not_sent'].includes(result.providerDelivery)) throw new Error('We could not confirm receipt. Please retry the same request or call directly.');
    complete = true;
    $('request-reference').textContent = `Reference: WZ-${id.slice(0,8).toUpperCase()}`;
    $('request-delivery').textContent = result.providerDelivery === 'automation_accepted' ? 'The email service accepted your request for Wazoozie Help to review and forward. Inbox delivery is not yet confirmed.' : result.providerDelivery === 'pending' ? 'Your request is saved. The email alert is waiting for another delivery attempt. Please call if you need help soon.' : 'Your request is saved, but the email alert could not be confirmed. Please call the business directly.';
    $('receipt-contact').replaceChildren(contacts(selectedBusiness()));
    form.hidden = true; $('request-receipt').hidden = false; $('request-receipt').focus(); pending = undefined;
  } catch (exception) {
    error.textContent = `${exception.message}${pending ? ` Reference: WZ-${id.slice(0,8).toUpperCase()}.` : ''}`; error.hidden = false;
  } finally { busy = false; form.removeAttribute('aria-busy'); update(); }
});
update(); check();
