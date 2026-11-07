import {pageContext,contactActivityForURL} from './activity-config.mjs';

// Count explicit contact-link clicks only. Never transmit the link's URL,
// query string, email body, phone input or any project-form value.
document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href]');
  if (!anchor || event.defaultPrevented || event.button > 0) return;
  let url;
  try { url = new URL(anchor.href, location.origin); } catch { return; }
  const activity=contactActivityForURL(url);
  if (!activity) return;
  const {action,provider}=activity;
  const body = JSON.stringify({action, provider, context: pageContext(location.pathname)});
  fetch('/api/contact-activity', {method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true, referrerPolicy:'no-referrer'}).catch(() => {});
});
