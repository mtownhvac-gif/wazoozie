import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {FEELINGS, PERIODS, MAX_ROOMS, emptyRoom, initialState, normalizeMap, summarizeMap, visitBrief, mountComfortMap} from '../assets/comfort-map.mjs';

const fixture = fs.readFileSync('dist/comfort-map/index.html', 'utf8');
const nextTick = () => new Promise(resolve => setTimeout(resolve, 5));
function app(setup = () => {}, url = 'https://wazoozie.com/comfort-map/') {
  const dom = new JSDOM(fixture, {url, runScripts: 'outside-only'}), w = dom.window, d = w.document;
  w.fetch = () => {throw new Error('Map must not make network requests');};
  for (const key of ['localStorage', 'sessionStorage', 'indexedDB']) Object.defineProperty(w, key, {get() {throw new Error('Map must not access storage');}});
  setup(w);
  const mounted = mountComfortMap(w);
  const change = (selector, value, type = 'change') => {
    const input = d.querySelector(selector); input.value = value; input.dispatchEvent(new w.Event(type, {bubbles: true})); return input;
  };
  return {dom, w, d, mounted, change};
}

test('starts empty, makes unknowns explicit and does not invent comfortable rooms', () => {
  const result = summarizeMap(initialState());
  assert.equal(result.observed, 0); assert.equal(result.unknown, 6); assert.equal(result.concerns, 0);
  assert.deepEqual(result.state.rooms[0], emptyRoom());
  assert.ok(result.findings.some(value => value.includes('No answer has been assumed')));
  assert.ok(!result.findings.some(value => value.startsWith('Every observed')));
});

test('normalization bounds rooms and text, rejects prototype-like enum values and invalid dates', () => {
  const normalized = normalizeMap({basis: 'invalid', date: '2026-02-30', mode: 'constructor', duration: '__proto__', notes: 'x'.repeat(2000), rooms: Array.from({length: 20}, () => ({name: 'N'.repeat(90), level: 'toString', observations: {morning: '__proto__', afternoon: 'warm', evening: 'unknown'}}))});
  assert.equal(normalized.rooms.length, MAX_ROOMS); assert.equal(normalized.rooms[0].name.length, 50); assert.equal(normalized.notes.length, 1500);
  assert.equal(normalized.mode, 'unknown'); assert.equal(normalized.duration, 'unknown'); assert.equal(normalized.basis, 'pattern'); assert.equal(normalized.date, '');
  assert.deepEqual(normalized.rooms[0].observations, {morning: 'unseen', afternoon: 'warm', evening: 'unseen'});
  assert.equal(normalizeMap({date: '2024-02-29'}).date, '2024-02-29'); assert.equal(normalizeMap({date: '2025-02-29'}).date, '');
  assert.equal(normalizeMap({rooms: []}).rooms.length, 1); assert.equal(normalizeMap(null).rooms.length, 1);
});

test('the summary counts all finite combinations without turning blanks into observations', () => {
  for (const a of Object.keys(FEELINGS)) for (const b of Object.keys(FEELINGS)) for (const c of Object.keys(FEELINGS)) {
    const values = [a, b, c];
    const result = summarizeMap({rooms: [{observations: Object.fromEntries(Object.keys(PERIODS).map((key, i) => [key, values[i]]))}]});
    assert.equal(result.observed, values.filter(value => value !== 'unseen').length);
    assert.equal(result.unknown, values.filter(value => value === 'unseen').length);
    assert.equal(result.concerns, values.filter(value => ['warm', 'cool'].includes(value)).length);
    assert.ok(!JSON.stringify(result).includes('diagnosed'));
  }
});

test('contrasts describe selected time slots rather than claim a cause or a measured temperature', () => {
  const state = initialState(); state.rooms[0].name = 'Back bedroom'; state.rooms[0].observations.afternoon = 'warm'; state.rooms[1].observations.afternoon = 'cool';
  const result = summarizeMap(state);
  assert.ok(result.findings.includes('Both “too warm” and “too cool” appear in your afternoon entries.'));
  assert.match(result.question, /similar conditions/); assert.equal(result.observed, 2); assert.equal(result.unknown, 4);
  assert.ok(!/\d+ degrees|duct leak|needs replacement|oversized/i.test(result.findings.join(' ')));
});

test('different feelings across a room’s day produce an observation question, not a repair recommendation', () => {
  const state = initialState(); state.rooms[0].name = 'Office'; state.rooms[0].observations.morning = 'okay'; state.rooms[0].observations.evening = 'cool';
  const result = summarizeMap(state);
  assert.ok(result.findings.some(value => value === 'Office has different feelings marked across the day.'));
  assert.match(result.question, /different across the day/);
});

test('all observed comfortable values do not certify safety or imply unobserved rooms are comfortable', () => {
  const state = initialState(); state.rooms[0].observations.morning = 'okay';
  const result = summarizeMap(state);
  assert.equal(result.concerns, 0); assert.equal(result.unknown, 5);
  assert.match(result.findings.join(' '), /does not assess equipment condition or rule out a problem/);
});

test('plain-text brief includes all entries, unknowns, context and limits without personal-data-bearing links', () => {
  const state = initialState(); state.basis = 'day'; state.date = '2026-11-11'; state.mode = 'heat'; state.duration = 'recurring';
  state.rooms[0].name = 'Private room name'; state.rooms[0].level = 'upper'; state.rooms[0].observations.morning = 'cool'; state.notes = 'PRIVATE NOTES <script>literal</script>';
  const brief = visitBrief(state);
  for (const expected of ['2026-11-11', 'Heating', 'It comes and goes', 'Private room name — Upper floor', 'Morning: Too cool', 'Evening: Not observed', state.notes, 'Nothing has been sent', 'not measured temperatures', 'visit charge']) assert.ok(brief.includes(expected), expected);
  assert.ok(!brief.includes('?notes=')); assert.ok(!brief.includes('?room='));
  assert.match(visitBrief({...state, basis: 'pattern'}), /entries may not describe the same day/);
  assert.ok(!visitBrief({...state, basis: 'pattern'}).includes('2026-11-11'));
});

test('a hazardous note places safety guidance into the map and exported brief', () => {
  const state = {...initialState(), notes: 'I smell gas in the hallway.'};
  assert.equal(summarizeMap(state).urgent, true); assert.match(visitBrief(state), /URGENT SAFETY GUIDANCE/);
  assert.match(visitBrief(state), /Contact emergency services or your utility from a safe location/);
});

test('mount ignores URL payloads and never accesses browser storage or network', () => {
  const {d, mounted, change, dom} = app(undefined, 'https://wazoozie.com/comfort-map/?name=SECRET&notes=secret#room=bedroom');
  assert.equal(d.querySelector('#cm-app').hidden, false);
  assert.equal(mounted.getState().rooms[0].name, ''); assert.ok(!d.querySelector('#cm-brief').textContent.includes('SECRET'));
  change('#cm-name-0', 'My room', 'input'); change('#cm-0-morning', 'cool'); change('#cm-notes', 'Normal observation', 'input');
  assert.equal(mounted.getState().rooms[0].observations.morning, 'cool');
  assert.equal(mountComfortMap(dom.window), null); dom.window.close();
});

test('room edits preserve focus and render hostile text literally, including in the printable brief', () => {
  const {d, change, dom} = app();
  const input = d.querySelector('#cm-name-0'); input.focus();
  const hostile = '<img src=x onerror=alert(1)>';
  change('#cm-name-0', hostile, 'input'); change('#cm-notes', '<script>private()</script>', 'input'); change('#cm-0-morning', 'cool');
  assert.equal(d.activeElement, input); assert.equal(d.querySelectorAll('#cm-picture img').length, 0); assert.equal(d.querySelectorAll('#cm-print-sheet script').length, 0);
  assert.ok(d.querySelector('#cm-picture').textContent.includes(hostile)); assert.ok(d.querySelector('#cm-print-text').textContent.includes('<script>private()</script>'));
  assert.equal(d.querySelector('#cm-0-morning').parentElement.dataset.feeling, 'cool'); dom.window.close();
});

test('add and remove preserve remaining observations, enforce the six-room limit and move keyboard focus', () => {
  const {d, change, mounted, dom} = app();
  change('#cm-name-0', 'Keep this room', 'input'); change('#cm-0-evening', 'warm');
  for (let n = 0; n < 7; n++) d.querySelector('#cm-add').click();
  assert.equal(mounted.getState().rooms.length, 6); assert.equal(d.querySelector('#cm-add').disabled, true); assert.equal(d.activeElement.id, 'cm-name-5');
  d.querySelector('[data-remove="1"]').click();
  assert.equal(mounted.getState().rooms.length, 5); assert.equal(d.activeElement.id, 'cm-name-1'); assert.equal(d.querySelector('#cm-add').disabled, false);
  assert.equal(mounted.getState().rooms[0].name, 'Keep this room'); assert.equal(mounted.getState().rooms[0].observations.evening, 'warm');
  while (mounted.getState().rooms.length > 1) d.querySelector('[data-remove="1"]').click();
  assert.equal(d.querySelector('[data-remove="0"]').disabled, true); dom.window.close();
});

test('single-day context shows the date; remembered patterns do not accidentally export an old date', () => {
  const {d, change, dom} = app();
  assert.equal(d.querySelector('#cm-date-label').hidden, true); change('#cm-basis', 'day'); change('#cm-date', '2026-11-11');
  assert.equal(d.querySelector('#cm-date-label').hidden, false); assert.ok(d.querySelector('#cm-brief').textContent.includes('2026-11-11'));
  change('#cm-basis', 'pattern'); assert.equal(d.querySelector('#cm-date-label').hidden, true); assert.ok(!d.querySelector('#cm-brief').textContent.includes('2026-11-11')); dom.window.close();
});

test('copy is explicit, includes entered context and never sends an inquiry', async () => {
  let copied = '';
  const {d, change, dom} = app(w => Object.defineProperty(w.navigator, 'clipboard', {value: {writeText: async value => {copied = value;}}}));
  change('#cm-notes', 'Keep this observation', 'input'); assert.equal(copied, ''); d.querySelector('#cm-copy').click(); await nextTick();
  assert.ok(copied.includes('Keep this observation')); assert.match(d.querySelector('#cm-status').textContent, /Nothing was sent/); assert.equal(d.querySelector('#cm-copy-fallback').hidden, true); dom.window.close();
});

test('unavailable clipboard provides selectable text without losing entries', async () => {
  const {d, change, mounted, dom} = app();
  change('#cm-notes', 'Still here', 'input'); d.querySelector('#cm-copy').click(); await nextTick();
  assert.equal(d.querySelector('#cm-copy-fallback').hidden, false); assert.equal(d.activeElement.id, 'cm-copy-text'); assert.ok(d.activeElement.value.includes('Still here')); assert.equal(mounted.getState().notes, 'Still here'); dom.window.close();
});

test('an interrupted clipboard operation cannot resurrect notes after clearing', async () => {
  let reject;
  const {d, change, dom} = app(w => Object.defineProperty(w.navigator, 'clipboard', {value: {writeText: () => new Promise((_, no) => {reject = no;})}}));
  change('#cm-notes', 'SECRET TO CLEAR', 'input'); d.querySelector('#cm-copy').click(); d.querySelector('#cm-clear').click(); d.querySelector('#cm-clear-yes').click();
  reject(new Error('Clipboard permission refused')); await nextTick();
  assert.equal(d.querySelector('#cm-copy-fallback').hidden, true); assert.ok(!d.querySelector('#cm-copy-text').value.includes('SECRET TO CLEAR')); assert.match(d.querySelector('#cm-status').textContent, /Map cleared/); dom.window.close();
});

test('download creates only a text blob with a fixed filename and safely reports browser responsibility', async () => {
  let created, anchor;
  const {d, change, dom} = app(w => {
    w.URL.createObjectURL = blob => {created = blob; return 'blob:local-map';};
    w.URL.revokeObjectURL = () => {};
    w.HTMLAnchorElement.prototype.click = function () {anchor = {href: this.href, download: this.download};};
  });
  change('#cm-name-0', 'Private name', 'input'); d.querySelector('#cm-download').click();
  assert.equal(created.type, 'text/plain;charset=utf-8'); assert.deepEqual(anchor, {href: 'blob:local-map', download: 'wazoozie-comfort-map.txt'});
  assert.equal(d.querySelector('a[download]'), null); assert.match(d.querySelector('#cm-status').textContent, /Check your browser’s downloads/); dom.window.close();
});

test('download and printing failures retain a manual-copy path; print holds the full current brief', () => {
  let printed = 0;
  const {d, change, dom} = app(w => {w.print = () => {printed += 1;};});
  change('#cm-notes', 'A long observation. '.repeat(75), 'input'); d.querySelector('#cm-download').click();
  assert.equal(d.querySelector('#cm-copy-fallback').hidden, false); assert.match(d.querySelector('#cm-status').textContent, /Download is unavailable/);
  d.querySelector('#cm-print').click(); assert.equal(printed, 1); assert.equal(d.querySelector('#cm-print-text').textContent, d.querySelector('#cm-brief').textContent);
  dom.window.print = () => {throw new Error('No print');}; d.querySelector('#cm-print').click(); assert.match(d.querySelector('#cm-status').textContent, /Printing is unavailable/); dom.window.close();
});

test('clear requires a separate confirmation and preserves entries when cancelled', () => {
  const {d, change, mounted, dom} = app(); change('#cm-notes', 'KEEP', 'input'); change('#cm-0-afternoon', 'cool');
  d.querySelector('#cm-clear').click(); assert.equal(d.activeElement.id, 'cm-clear-no'); assert.equal(mounted.getState().notes, 'KEEP');
  d.querySelector('#cm-clear-no').click(); assert.equal(d.querySelector('#cm-clear-confirm').hidden, true); assert.equal(mounted.getState().notes, 'KEEP');
  d.querySelector('#cm-clear').click(); d.querySelector('#cm-clear-yes').click(); assert.deepEqual(mounted.getState(), initialState()); assert.equal(d.activeElement.id, 'cm-name-0');
  assert.ok(!d.querySelector('#cm-brief').textContent.includes('KEEP')); dom.window.close();
});

test('safety-sensitive free text shows a visible alert and clears it when removed', () => {
  const {d, change, dom} = app(); change('#cm-notes', 'The CO alarm sounds', 'input');
  assert.equal(d.querySelector('#cm-urgent').hidden, false); assert.equal(d.querySelector('#cm-urgent').getAttribute('role'), 'alert');
  assert.match(d.querySelector('#cm-question').textContent, /Do not use this map to assess/);
  change('#cm-notes', '', 'input'); assert.equal(d.querySelector('#cm-urgent').hidden, true); dom.window.close();
});

test('contact destinations never inherit room notes, date, state, query text or claimed availability', () => {
  const {d, change, dom} = app(); const before = [...d.querySelectorAll('.cm-contact a')].map(a => a.href);
  change('#cm-name-0', 'Private home location', 'input'); change('#cm-notes', 'Sensitive personal narrative', 'input'); change('#cm-mode', 'heat');
  assert.deepEqual([...d.querySelectorAll('.cm-contact a')].map(a => a.href), before);
  assert.equal(before[0], 'tel:+16105006416'); assert.equal(new URL(before[1]).hostname, 'book.housecallpro.com'); assert.equal(new URL(before[1]).searchParams.get('utm_content'), 'comfort-map');
  assert.ok(before.every(url => !/Private|Sensitive/.test(url))); assert.match(d.querySelector('.cm-contact').textContent, /not sent/); assert.match(d.querySelector('.cm-contact').textContent, /editorial/); dom.window.close();
});

test('controls have labels, fieldset legends, explicit button types, visible focus and non-color-only states', () => {
  const {d, dom} = app();
  for (const input of d.querySelectorAll('#cm-app input,#cm-app select,#cm-app textarea')) assert.ok(input.labels.length, input.id);
  for (const button of d.querySelectorAll('#cm-app button')) assert.equal(button.type, 'button');
  for (const fieldset of d.querySelectorAll('.cm-room')) assert.ok(fieldset.querySelector('legend'));
  for (const select of d.querySelectorAll('[data-period]')) assert.deepEqual([...select.options].map(option => option.textContent), Object.values(FEELINGS).map(value => value.label));
  for (const cell of d.querySelectorAll('.cm-picture-cell')) {assert.equal(cell.getAttribute('role'), 'img'); assert.ok(cell.getAttribute('aria-label').includes('Not observed'));}
  assert.ok(fs.readFileSync('assets/comfort-map.css', 'utf8').includes(':focus-visible')); dom.window.close();
});

test('print hiding is scoped to the map and cannot blank linked service or profile pages', () => {
  const css = fs.readFileSync('assets/comfort-map.css', 'utf8');
  const dom = new JSDOM('<style>' + css + '</style><main><section id="business">Profile content</section><section class="cm-promo">Map preview</section></main>');
  const rules = [...dom.window.document.styleSheets[0].cssRules];
  const print = rules.find(rule => rule.conditionText === 'print'); assert.ok(print);
  const hidden = [...print.cssRules].filter(rule => rule.style?.display === 'none'); assert.ok(hidden.length >= 3);
  for (const rule of hidden) assert.equal(dom.window.document.querySelectorAll(rule.selectorText).length, 0, rule.selectorText + ' must not hide content outside the map');
  const map = new JSDOM(fixture, {runScripts: 'outside-only'});
  for (const selector of ['body:has(#comfort-map)>*:not(main)', 'body:has(#comfort-map) main>*:not(.comfort-map)']) assert.ok(css.includes(selector));
  assert.ok(css.includes('white-space:pre-wrap;overflow-wrap:anywhere'));
  assert.equal(map.window.document.querySelector('#cm-print-text').tagName, 'PRE'); dom.window.close(); map.window.close();
});

test('build publishes discoverable metadata, useful no-script fallback and truthful privacy context', () => {
  assert.match(fixture, /<link rel="canonical" href="https:\/\/wazoozie.com\/comfort-map\/">/);
  assert.ok(fs.readFileSync('dist/sitemap.xml', 'utf8').includes('https://wazoozie.com/comfort-map/'));
  for (const path of ['explore', 'services/heating-cooling', 'services/second-opinion', 'businesses/middletown-hvac']) assert.ok(fs.readFileSync('dist/' + path + '/index.html', 'utf8').includes('href="/comfort-map/"'));
  const dom = new JSDOM(fixture, {runScripts: 'outside-only'});
  assert.match(dom.window.document.querySelector('.cm-no-script').textContent, /610-500-6416/);
  assert.equal(dom.window.document.querySelector('.cm-direct a').getAttribute('href'), 'tel:+16105006416');
  assert.match(fs.readFileSync('dist/privacy/index.html', 'utf8'), /not saved in browser storage, submitted to Wazoozie or included in business links/);
  assert.ok(!fixture.includes('world-first')); dom.window.close();
});
