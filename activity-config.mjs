import {BUSINESSES} from './project-config.mjs';
export const CONTACT_ACTIONS = ['call_click', 'booking_click', 'email_draft_click', 'website_click'];
export const PAGE_CONTEXTS = ['home', 'hvac', 'planner', 'help', 'profile', 'service', 'guide', 'other'];

export function validateActivity(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const keys = Object.keys(input).sort().join(',');
  if (keys !== 'action,context,provider') return null;
  if (!CONTACT_ACTIONS.includes(input.action) || !PAGE_CONTEXTS.includes(input.context) || !Object.hasOwn(BUSINESSES, input.provider)) return null;
  return {action: input.action, context: input.context, provider: input.provider};
}

export function pageContext(path) {
  if (path === '/') return 'home';
  if (path === '/hvac/') return 'hvac';
  if (path === '/start/') return 'planner';
  if (path === '/help/') return 'help';
  if (path.startsWith('/businesses/')) return 'profile';
  if (path.startsWith('/services/')) return 'service';
  if (path.startsWith('/guides/') || path === '/before-you-approve/') return 'guide';
  return 'other';
}
