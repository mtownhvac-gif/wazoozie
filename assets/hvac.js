import {BUSINESSES} from './project-config.mjs';
import {HVAC_CONSENT_VERSION, HVAC_INTENTS} from './hvac-config.mjs';

const root = document.querySelector('.hvac-page');
if (root) {
  const $ = id => document.getElementById(id);
  const start = $('hvac-start'), form = $('hvac-form');
  const business = BUSINESSES.middletown;
  const labels = {comfort:'Repair / I’m not sure', replacement:'A new system', maintenance:'Maintenance', secondopinion:'A second opinion', boiler:'Boilers & radiators'};
  let startedAt = Date.now();
  let pending = false, ready = false, deliveryReady = false, sending = false, attempt = null;
  $('hvac-send').addEventListener('click',()=>{sending=true;form.requestSubmit();sending=false;});
  const initial = new URLSearchParams(location.search).get('intent');
  if (HVAC_INTENTS.includes(initial)) start.elements.intent.value = initial;

  function setStep(next) {
    start.hidden = next;
    $('hvac-next').hidden = !next;
    $('hvac-step-title').textContent = next ? 'Your project. Your next step.' : 'What needs attention?';
    $('hvac-progress').textContent = next ? '2 · Your next step  /  No appointment booked' : '1 · Your project  /  2 · Your next step';
    $('hvac-step-title').focus();
  }
  start.addEventListener('submit', event => {
    event.preventDefault();
    start.elements.zip.setCustomValidity(start.elements.zip.value === '00000' ? 'Enter your five-digit project ZIP.' : '');
    if (!start.reportValidity()) return;
    $('hvac-summary').textContent = `${labels[start.elements.intent.value]} · Project ZIP ${start.elements.zip.value}`;
    setStep(true);
  });
  // Without JavaScript, never fall back to a GET form that places a ZIP in the URL.
  $('hvac-continue').disabled = false;
  $('hvac-back').addEventListener('click', () => { if (!pending) setStep(false); });

  function contactValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g,'').length >= 10 && value.replace(/\D/g,'').length <= 15);
  }
  function data() {
    const contact = form.elements.contact.value.trim();
    form.elements.contact.setCustomValidity(contactValid(contact) ? '' : 'Enter a valid phone number or email address.');
    const details = form.elements.details.value.trim();
    form.elements.details.setCustomValidity(details.length >= 15 ? '' : 'Please add at least 15 characters about your project.');
    form.elements.name.setCustomValidity(form.elements.name.value.trim().length >= 2 ? '' : 'Please enter at least two characters for your name.');
    if (!form.reportValidity()) return null;
    const intent = start.elements.intent.value, zip = start.elements.zip.value.trim();
    if (!HVAC_INTENTS.includes(intent) || (!/^\d{5}$/.test(zip) || zip === '00000')) { setStep(false); start.reportValidity(); return null; }
    return {intent, zip, name:form.elements.name.value.trim(), contact, details, timing:form.elements.timing.value, company:form.elements.company.value.trim()};
  }
  // Do not leave an old preview or success notice beside newly edited data.
  for (const source of [form, start]) source.addEventListener('input', () => {
    $('hvac-email').hidden = true;
    $('hvac-open-email').removeAttribute('href');
    $('hvac-result').textContent = '';
    start.elements.zip.setCustomValidity('');
    form.elements.contact.setCustomValidity('');
    form.elements.details.setCustomValidity('');
    form.elements.name.setCustomValidity('');
    form.elements.consent.setCustomValidity('');
  });
  async function capabilities() {
    $('hvac-retry-capability').disabled = true;
    try {
      const response = await fetch('/api/project-capabilities', {headers:{Accept:'application/json'}, cache:'no-store'});
      const body = response.ok ? await response.json() : null;
      ready = body?.captureReady === true;
      deliveryReady=body?.deliveryReady===true;
    } catch { ready = false; deliveryReady=false; }
    $('hvac-send-choice').hidden=!deliveryReady;
    $('hvac-send').hidden=!deliveryReady;
    $('hvac-save').disabled = !ready;
    $('hvac-retry-capability').hidden = ready;
    $('hvac-retry-capability').disabled = false;
    $('hvac-capture-status').textContent = ready ? (deliveryReady ? 'Save privately keeps your request with Wazoozie. Email my inquiry queues an email only with your extra permission.' : 'Saving is available. A saved request stays with Wazoozie; it is not sent to Middletown.') : 'Private saving is unavailable right now. You can still call, open booking, or preview and copy an email.';
  }
  $('hvac-retry-capability').addEventListener('click', capabilities);
  capabilities();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !ready) return;
    const value = data();
    if (!value) return;
    if (!form.elements.consent.checked) {
      form.elements.consent.setCustomValidity('Please agree before saving privately with Wazoozie.');
      form.elements.consent.reportValidity(); return;
    }
    const send=sending;
    if(send&&(!deliveryReady||!$('hvac-send-consent').checked)){ $('hvac-result').textContent='Check the email permission box before requesting delivery.';return;}
    const body = {...value, consent:true, consentVersion:HVAC_CONSENT_VERSION,...(send?{sendInquiry:true,sendConsentVersion:'hvac-send-2026-11-v1'}:{})};
    const fingerprint = JSON.stringify(body);
    if (attempt?.fingerprint !== fingerprint) attempt = {fingerprint, id:crypto.randomUUID(), receipt:null};
    if (attempt.receipt && !send) { $('hvac-result').textContent = attempt.receipt; return; }
    const currentAttempt = attempt;
    pending = true;
    const controls = [...form.elements, ...start.elements, $('hvac-back')];
    const disabledBefore = controls.map(control => control.disabled);
    controls.forEach(control => { control.disabled = true; });
    $('hvac-save').textContent = 'Saving…';
    $('hvac-result').textContent = 'Saving privately with Wazoozie…';
    try {
      // An old tab must recover without discarding the draft or looping on expiry.
      if (Date.now() - startedAt > 7200000) startedAt = Date.now();
      const wait = Math.max(0, 2100 - (Date.now() - startedAt));
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      const response = await fetch('/api/hvac-requests', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...body,id:currentAttempt.id,startedAt}), referrerPolicy:'no-referrer'});
      const receipt = await response.json();
      if (!response.ok || receipt?.status !== 'saved' || receipt?.provider !== 'Middletown HVAC' || !(send?['queued','accepted','delivered','failed']:['not_sent']).includes(receipt?.providerDelivery) || receipt?.reference !== currentAttempt.id) throw new Error('No valid save receipt');
      currentAttempt.receipt = send ? `Saved privately. Reference: ${receipt.reference}. Email status: ${receipt.providerDelivery==='accepted'?'accepted by the email provider':receipt.providerDelivery}. This does not confirm the business read it. No appointment or dispatch is booked. Call or open booking for direct contact.` : `Saved privately with Wazoozie. Reference: ${receipt.reference}. Middletown HVAC has not been notified. No appointment or dispatch is booked. Call, open booking or send your own email to contact the business.`;
      $('hvac-result').textContent = currentAttempt.receipt;
    } catch {
      $('hvac-result').textContent = send ? 'We could not confirm the request status. Retry the same details to check; an email may already be queued. Call Middletown for direct help. No appointment is confirmed.' : 'We could not confirm a save. You can retry this same request, or call Middletown directly. No provider notification or appointment has been confirmed.';
    } finally {
      pending = false;
      controls.forEach((control, index) => { control.disabled = disabledBefore[index]; });
      $('hvac-save').textContent = 'Save privately with Wazoozie';
    }
  });
  $('hvac-preview').addEventListener('click', () => {
    if (pending) return;
    form.elements.consent.setCustomValidity('');
    const value = data();
    if (!value) return;
    const body = `Hello Middletown HVAC,\n\nI’d like to discuss this project:\nService: ${labels[value.intent]}\nProject ZIP: ${value.zip}\nName: ${value.name}\nPhone or email: ${value.contact}\nTiming: ${value.timing}\n\n${value.details}\n\nPlease confirm address coverage, scope and availability. This is an inquiry, not a confirmed appointment.\n\nPrepared with Wazoozie.`;
    $('hvac-email-body').value = body;
    $('hvac-open-email').href = `mailto:${business.email}?subject=${encodeURIComponent('HVAC project inquiry via Wazoozie')}&body=${encodeURIComponent(body)}`;
    $('hvac-email').hidden = false;
    $('hvac-copy-status').textContent = '';
    $('hvac-email-title').focus();
  });
  $('hvac-open-email').addEventListener('click', () => {
    $('hvac-copy-status').textContent = 'Email draft requested. Nothing has been sent by Wazoozie. If your email app did not open, copy the request below.';
  });
  $('hvac-copy').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText($('hvac-email-body').value);
      $('hvac-copy-status').textContent = 'Copied. Paste into your email app and send it when you’re ready.';
    } catch {
      $('hvac-email-body').focus(); $('hvac-email-body').select();
      $('hvac-copy-status').textContent = 'Select and copy the request above, then paste it into your email app.';
    }
  });
}
