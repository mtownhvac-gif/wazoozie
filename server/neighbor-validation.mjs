import {NEIGHBOR_CONSENT_VERSION} from '../neighbor-config.mjs';
export function validateNeighbor(input, now = Date.now()) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.fax) return {error:'Request not accepted.'};
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id || '')) return {error:'Reopen this page and try again.'};
  if (!Number.isFinite(input.startedAt) || now-input.startedAt<2000 || now-input.startedAt>7200000) return {error:'Reopen this page and try again.'};
  if (input.consent !== true || input.consentVersion !== NEIGHBOR_CONSENT_VERSION) return {error:'Please review and accept the referral privacy notice.'};
  for (const [key,limit] of Object.entries({name:100,email:180,phone:35})) {
    if (input[key] !== undefined && (typeof input[key] !== 'string' || input[key].length>limit)) return {error:'Check your contact details.'};
  }
  const referral={id:input.id,name:(input.name||'').trim(),email:(input.email||'').trim().toLowerCase(),phone:(input.phone||'').trim(),consentVersion:NEIGHBOR_CONSENT_VERSION};
  if (referral.name.length<2) return {error:'Please enter your name.'};
  if (!referral.email && !referral.phone) return {error:'Add your email or phone so we can identify your referral privately.'};
  if (referral.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(referral.email)) return {error:'Check your email address.'};
  if (referral.phone && !/^\d{10,15}$/.test(referral.phone.replace(/\D/g,''))) return {error:'Check your phone number.'};
  return {referral};
}
