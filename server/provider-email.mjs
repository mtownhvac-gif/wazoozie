import {INTENTS} from '../project-config.mjs';
// Zapier's inherited email action renders HTML: escape every homeowner value.
const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validWebhook(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'hooks.zapier.com' && /^\/hooks\/catch\/\d+\/[A-Za-z0-9_-]+\/$/.test(u.pathname) && !u.username && !u.password && !u.search && !u.hash && !u.port; } catch { return false; }
}
export function emailPayload(b) {
  const lines = [`Reference: WZ-${b.id.slice(0,8).toUpperCase()}`,`Project: ${INTENTS[b.intent].label}`,`Location: ${b.town}, ${b.state} ${b.zip}`,`Timing: ${b.timing}`,`Property: ${b.property} / ${b.role}`,`Equipment: ${b.equipment || 'Not supplied'}`,'',b.details,'','Homeowner explicitly requested this email. No appointment has been booked.'];
  return {reference:b.id,name:escape(b.name),phone:escape(b.phone),email:escape(b.email),source:'Wazoozie project request',page:'https://wazoozie.com/start/',message:lines.map(escape).join('<br>'),transcript:''};
}
