import {neighborCode} from '../neighbor-config.mjs';
import {BUSINESSES, INTENTS, CONSENT_VERSION} from '../project-config.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';

export function validateBrief(data, now = Date.now()) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {error: 'Invalid request.'};
  if (data.company) return {error: 'Request not accepted.'};
  const age = now - data.startedAt;
  if (!Number.isFinite(data.startedAt) || age < 2000 || age > 7200000) return {error: 'Please reopen the form and try again.'};
  if (!UUID.test(data.id || '')) return {error: 'Please reopen the project form.'};
  if (!Object.hasOwn(INTENTS, data.intent) || !Object.hasOwn(BUSINESSES, data.provider) || INTENTS[data.intent].provider !== data.provider) {
    return {error: 'Choose a service and its listed business.'};
  }
  if (data.consent !== true || data.consentVersion !== CONSENT_VERSION) return {error: 'Please review and accept the project-brief consent.'};

  for (const [key, limit] of Object.entries({name:100,phone:35,email:180,town:100,zip:5,state:2,details:2500,timing:30,role:30,property:30,equipment:120,source:100})) {
    if (data[key] !== undefined && (typeof data[key] !== 'string' || data[key].length > limit)) return {error: 'One or more fields is too long or invalid.'};
  }
  const brief = {
    id: data.id, provider: data.provider, intent: data.intent,
    name: text(data.name, 100), phone: text(data.phone, 35), email: text(data.email, 180),
    town: text(data.town, 100), zip: text(data.zip, 5), state: text(data.state, 2),
    details: text(data.details, 2500), timing: text(data.timing, 30), role: text(data.role, 30),
    property: text(data.property, 30), equipment: text(data.equipment, 120),
    source: ['partner-ryan','partner-liberator','partner-cooke','neighbor'].includes(data.source) ? data.source : 'start-page', consentVersion: CONSENT_VERSION
  };
  if (data.neighborCode !== undefined && !neighborCode(data.neighborCode)) return {error:'Invalid neighbor link. Remove the referral credit or start a fresh project.'};
  if (data.neighborCode) brief.neighborCode = data.neighborCode;
  const digits = brief.phone.replace(/\D/g, '');
  if (brief.name.length < 2 || digits.length < 10 || digits.length > 15) return {error: 'Enter your name and a valid phone number.'};
  if (brief.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brief.email)) return {error: 'Enter a valid email address or leave it blank.'};
  if (brief.town.length < 2 || !/^\d{5}$/.test(brief.zip) || !['PA', 'NJ', 'DE'].includes(brief.state)) return {error: 'Enter your town, five-digit ZIP code, and state.'};
  if (brief.details.length < 15 || !['This week', 'Planning ahead', 'Urgent'].includes(brief.timing)) return {error: 'Describe the project and choose your timing.'};
  if (!['Homeowner', 'Landlord / manager', 'Tenant', 'Other'].includes(brief.role) || !['House', 'Condo / apartment', 'Rental property', 'Other'].includes(brief.property)) return {error: 'Choose the property type and your relationship to it.'};
  return {brief};
}
