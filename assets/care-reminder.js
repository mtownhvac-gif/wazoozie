const topics = {
  checklist: ['Revisit my seasonal home checklist', '/seasonal-home-checklist/'],
  painting: ['Plan my painting project', '/guides/painting-estimate-checklist/'],
  electrical: ['Plan my electrical project', '/guides/electrical-project-estimate/'],
  plumbing: ['Plan my plumbing project', '/guides/prepare-for-plumbing-service/'],
  windows: ['Plan my window project', '/guides/window-replacement-questions/'],
  comfort: ['Plan heating and cooling care', '/project-kit/?intent=maintenance'],
  budget: ['Revisit my home project budget', '/project-budget/']
};
export function calendarEntry(topic, date, uid, stamp) {
  if (!Object.hasOwn(topics, topic) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[a-z0-9-]{1,80}$/i.test(uid) || !/^\d{8}T\d{6}Z$/.test(stamp)) return null;
  const start = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0,10) !== date || start.getUTCFullYear() < 2000 || start.getUTCFullYear() > 9998) return null;
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  const compact = value => value.toISOString().slice(0,10).replaceAll('-', '');
  const [title, path] = topics[topic];
  // All event text comes from the fixed catalog; no arbitrary input enters the file.
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wazoozie//Home Care//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${uid}@wazoozie.com`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${compact(start)}`,`DTEND;VALUE=DATE:${compact(end)}`,`SUMMARY:${title}`,`URL:https://wazoozie.com${path}`,'DESCRIPTION:Review your project with Wazoozie. No visit is booked.','TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
const form = document.querySelector('#care-reminder');
if (form) form.addEventListener('submit', event => {
  event.preventDefault();
  const status = document.querySelector('#care-status');
  const stamp = new Date().toISOString().replaceAll('-','').replaceAll(':','').replace(/\.\d{3}/,'');
  const uid = crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  const content = calendarEntry(form.elements.topic.value,form.elements.date.value,uid,stamp);
  if (!content) { status.textContent = 'Choose a valid date and a listed topic.'; return; }
  const url = URL.createObjectURL(new Blob([content], {type:'text/calendar;charset=utf-8'}));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'wazoozie-home-care.ics';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url),10000);
  status.textContent = 'Calendar file prepared. Open the download and review it in your calendar. Nothing has been booked or emailed.';
});
