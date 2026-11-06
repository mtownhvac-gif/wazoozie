import {entryContext} from '../lead-context.mjs';
import {INTENTS} from '../project-config.mjs';
// Zapier's inherited email action renders HTML: escape every homeowner value.
const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validWebhook(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'hooks.zapier.com' && /^\/hooks\/catch\/\d+\/[A-Za-z0-9_-]+\/$/.test(u.pathname) && !u.username && !u.password && !u.search && !u.hash && !u.port; } catch { return false; }
}
export function emailPayload(b,receivedAt=Date.now()) {
  const lines = [`Reference: WZ-${b.id.slice(0,8).toUpperCase()}`,`Project: ${INTENTS[b.intent].label}`,`Received (UTC): ${new Date(receivedAt).toISOString()}`,`Request-link context: ${entryContext(b.entryContext)}`,`Referral source: ${['partner-ryan','partner-liberator','partner-cooke','neighbor'].includes(b.source)?b.source:'start-page'}`,`Location: ${b.town}, ${b.state} ${b.zip}`,`Timing: ${b.timing}`,`Property: ${b.property} / ${b.role}`,`Equipment: ${b.equipment || 'Not supplied'}`,'',b.details,'','Homeowner explicitly requested this email. No appointment has been booked.','','FOLLOW-UP CHECKLIST','1. Record this reference in the private follow-up tracker; exclude tests from customer totals.','2. Confirm service fit and coverage, then record an actual contact attempt and next action.','3. Mark contacted only after reaching the customer; mark booked only after an appointment is agreed.','4. Record completion or the reason the request closed without a booking.','Email automation acceptance is not inbox delivery, customer contact or a booking.'];
  return {reference:b.id,name:escape(b.name),phone:escape(b.phone),email:escape(b.email),source:'Wazoozie project request',page:'https://wazoozie.com/start/',message:lines.map(escape).join('<br>'),transcript:''};
}
