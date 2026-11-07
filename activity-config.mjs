import {BUSINESSES} from './project-config.mjs';
export const CONTACT_ACTIONS = ['call_click', 'booking_click', 'email_draft_click', 'website_click', 'pricing_tool_click'];
export const PAGE_CONTEXTS = ['home', 'planner', 'help', 'profile', 'service', 'guide', 'other'];

export function validateActivity(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const keys = Object.keys(input).sort().join(',');
  if (keys !== 'action,context,provider') return null;
  if (!CONTACT_ACTIONS.includes(input.action) || !PAGE_CONTEXTS.includes(input.context) || !Object.hasOwn(BUSINESSES, input.provider)) return null;
  return {action: input.action, context: input.context, provider: input.provider};
}

export function pageContext(path) {
  if (path === '/') return 'home';
  if (path === '/start/') return 'planner';
  if (path === '/help/') return 'help';
  if (path.startsWith('/businesses/')) return 'profile';
  if (path.startsWith('/services/')) return 'service';
  if (path.startsWith('/guides/') || path === '/before-you-approve/') return 'guide';
  return 'other';
}

// Classify only known business destinations; never retain the URL or its parameters.
export function contactActivityForURL(url) {
  for (const [provider,business] of Object.entries(BUSINESSES)) {
    if (url.protocol === 'tel:' && url.pathname.replace(/\D/g, '') === business.tel.replace(/\D/g, '')) return {action:'call_click',provider};
    if (url.protocol === 'mailto:' && business.email && url.pathname.toLowerCase() === business.email.toLowerCase()) return {action:'email_draft_click',provider};
    if (business.booking && url.origin === new URL(business.booking).origin && url.pathname === new URL(business.booking).pathname) return {action:'booking_click',provider};
  }
  if (url.protocol === 'https:' && ['mtownhvac.com','www.mtownhvac.com'].includes(url.hostname)) {
    const path=url.pathname.replace(/\/$/,'')||'/';
    if (['/install-estimate','/ductless-estimator'].includes(path)) return {action:'pricing_tool_click',provider:'middletown'};
    if (path==='/' || path==='/conversion' || path==='/services' || path.startsWith('/services/')) return {action:'website_click',provider:'middletown'};
  }
  return null;
}
