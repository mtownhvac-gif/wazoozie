import {BUSINESSES} from './project-config.mjs';
import {pageContext} from './activity-config.mjs';

// Count explicit contact-link clicks only. Never transmit the link's URL,
// query string, email body, phone input or any project-form value.
document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href]');
  if (!anchor || event.defaultPrevented || event.button > 0) return;
  let url;
  try { url = new URL(anchor.href, location.origin); } catch { return; }
  let action;
  let provider;
  for (const [key, business] of Object.entries(BUSINESSES)) {
    if (url.protocol === 'tel:' && url.pathname.replace(/\D/g, '') === business.tel.replace(/\D/g, '')) action = 'call_click';
    else if (url.protocol === 'mailto:' && business.email && url.pathname.toLowerCase() === business.email.toLowerCase()) action = 'email_draft_click';
    else if (business.booking && url.origin === new URL(business.booking).origin && url.pathname === new URL(business.booking).pathname) action = 'booking_click';
    else if (key === 'middletown' && url.protocol === 'https:' && ['mtownhvac.com','www.mtownhvac.com'].includes(url.hostname) && url.pathname === '/') action = 'website_click';
    else continue;
    provider = key; break;
  }
  if (!provider) return;
  const body = JSON.stringify({action, provider, context: pageContext(location.pathname)});
  fetch('/api/contact-activity', {method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true, referrerPolicy:'no-referrer'}).catch(() => {});
});
