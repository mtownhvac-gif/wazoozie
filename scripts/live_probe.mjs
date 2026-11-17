// Looks at the deployed wazoozie.com from outside and prints what it finds. Read-only unless SEND_TEST_LEAD=1,
// which posts one clearly labeled test request through the same endpoint the request form uses.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {BUSINESSES, INTENTS, CONSENT_VERSION} from '../project-config.mjs';
import {liveIntakeFailures, validTestReceipt} from './live_probe_validation.mjs';

const BASE = process.env.WAZOOZIE_BASE || 'https://wazoozie.com';
const sha = text => createHash('sha256').update(text.replace(/\s+/g, '')).digest('hex').slice(0, 12);
const get = async path => {
  try {
    const r = await fetch(BASE + path, {headers: {'User-Agent': 'Mozilla/5.0 (compatible; wazoozie-live-probe/1.0)', 'Cache-Control': 'no-cache'}, redirect: 'manual', signal: AbortSignal.timeout(20000)});
    return {status: r.status, location: r.headers.get('location'), body: await r.text()};
  } catch (error) { return {status: 0, body: String(error)}; }
};

console.log(`=== Live probe of ${BASE} at ${new Date().toISOString()} ===`);
const files = [['/', 'dist/index.html'], ['/request/', 'dist/request/index.html'], ['/assets/quick-request.js', 'dist/assets/quick-request.js'],
  ['/assets/project-config.mjs', 'dist/assets/project-config.mjs'], ['/pricing-guide/', 'dist/pricing-guide/index.html'], ['/local-help/', 'dist/local-help/index.html'],
  ['/neighbors/', 'dist/neighbors/index.html'], ['/sitemap.xml', 'dist/sitemap.xml'], ['/robots.txt', 'dist/robots.txt']];
const live = {};
const pages = {};
for (const [path, file] of files) {
  const r = await get(path); live[path] = r.body; pages[path] = r;
  let local = null; try { local = await readFile(file, 'utf8'); } catch {}
  console.log(`${path.padEnd(32)} ${String(r.status).padEnd(4)} ${local === null ? 'no local file' : sha(r.body) === sha(local) ? 'same as this commit' : 'DIFFERENT from this commit'} ${r.location || ''}`);
}
const home = live['/'] || '';
const count = (text, needle) => text.split(needle).length - 1;
console.log('\nHomepage:');
console.log('  bytes', home.length, '| <form> tags', (home.match(/<form[^>]*>/g) || []).join(' '));
console.log('  script files', (home.match(/<script[^>]*src="[^"]+"/g) || []).map(s => s.replace(/.*src="/, '').replace('"', '')).join(', '));
console.log('  links to /request/', count(home, 'href="/request/'), '| mailto: links', count(home, 'mailto:'), "| inline mailto submit handler", /requestForm'\)\.addEventListener\('submit'/.test(home));
for (const word of ['Bryan', 'Cordy', 'operated by', 'HVACBusiness', 'wazooziehelp@gmail.com', 'hello@wazoozie.com'])
  console.log(`  mentions of "${word}" on / : ${count(home, word)}, on /pricing-guide/ : ${count(live['/pricing-guide/'] || '', word)}, on /local-help/ : ${count(live['/local-help/'] || '', word)}`);
const request = live['/request/'] || '';
console.log('\nRequest page: form present', request.includes('id="quickRequest"'), '| loads quick-request.js', request.includes('quick-request.js'));
const cap = await get('/api/project-capabilities');
let capability;
try { capability = JSON.parse(cap.body); } catch {}
console.log('\nCapabilities:', cap.status, JSON.stringify({capabilityVersion:capability?.capabilityVersion,captureReady:capability?.captureReady,emailProviders:capability?.emailProviders}));
const failures = liveIntakeFailures(pages, capability);
if (cap.status !== 200) failures.push('Capability endpoint: expected HTTP 200');
for (const failure of failures) console.error('FAIL:', failure);
if (failures.length) process.exitCode = 1;

if (process.env.SEND_TEST_LEAD === '1' && failures.length === 0) {
  const intent = Object.keys(INTENTS).find(key => INTENTS[key].provider === 'middletown');
  const id = crypto.randomUUID();
  const payload = {id, startedAt: Date.now() - 20000, intent, provider: 'middletown', notifyProvider: true, consent: true, consentVersion: CONSENT_VERSION,
    name: 'TEST Wazoozie form check', phone: '610-555-0100', email: '', town: 'Glen Mills', zip: '19342', state: 'PA',
    details: 'TEST LEAD. Not a customer. Internal intake and alert-queue check. Email-service acceptance does not verify inbox receipt. Please exclude from customer totals.',
    timing: 'Planning ahead', role: 'Other', property: 'Other', equipment: '', source: 'start-page', entryContext: 'direct'};
  const r = await fetch(BASE + '/api/project-briefs', {method: 'POST', headers: {'Content-Type': 'application/json', 'Origin': 'https://wazoozie.com', 'User-Agent': 'Mozilla/5.0 (compatible; wazoozie-live-probe/1.0)'}, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000)});
  console.log(`\nTEST LEAD posted for ${BUSINESSES.middletown.name}, intent ${intent}. Reference WZ-${id.slice(0, 8).toUpperCase()}`);
  let result;
  try { result = await r.json(); } catch {}
  const accepted = validTestReceipt(r.status, result, id);
  console.log('  HTTP', r.status, '| valid saved receipt and alert state:', accepted);
  console.log('  Inbox receipt is not verified by this check.');
  if (!accepted) process.exitCode = 1;
}
