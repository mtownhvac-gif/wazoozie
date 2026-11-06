import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const source=readFileSync(new URL('../assets/care-reminder.js',import.meta.url),'utf8').replace('export function calendarEntry','function calendarEntry');
function setup(){
 const dom=new JSDOM(readFileSync(new URL('../dist/home-care-reminder/index.html',import.meta.url),'utf8'),{url:'https://wazoozie.com/home-care-reminder/',runScripts:'outside-only'});
 dom.window.eval(source+'\nwindow.entry=calendarEntry;');return dom.window;
}
test('calendar handles leap days and year boundaries with exclusive all-day end dates',()=>{
 const w=setup();
 const leap=w.entry('painting','2028-02-29','test-1','20261106T120000Z');
 assert.match(leap,/DTSTART;VALUE=DATE:20280229\r\nDTEND;VALUE=DATE:20280301/);
 assert.match(w.entry('windows','2026-12-31','test-2','20261106T120000Z'),/DTEND;VALUE=DATE:20270101/);
 assert.match(leap,/URL:https:\/\/wazoozie.com\/guides\/painting-estimate-checklist\//);w.close();
});
test('calendar rejects impossible dates, unknown topics and injected fields',()=>{
 const w=setup();
 for(const date of ['2026-02-29','2026-13-01','2026-04-31','today','2026-11-06\r\nSUMMARY:bad'])assert.equal(w.entry('checklist',date,'test','20261106T120000Z'),null);
 assert.equal(w.entry('fake','2026-11-06','test','20261106T120000Z'),null);
 assert.equal(w.entry('checklist','2026-11-06','test\r\nATTENDEE:bad','20261106T120000Z'),null);w.close();
});
test('each trade guide routes to its matching intent without an HVAC promotion',()=>{
 const routes={'painting-estimate-checklist':'painting','electrical-project-estimate':'electrical','prepare-for-plumbing-service':'plumbing','window-replacement-questions':'windows'};
 for(const [slug,intent] of Object.entries(routes)){
  const dom=new JSDOM(readFileSync(new URL(`../dist/guides/${slug}/index.html`,import.meta.url),'utf8'));
  const main=dom.window.document.querySelector('main');
  assert.ok(main.querySelector(`a[href="/start/?intent=${intent}"]`));
  assert.equal(main.querySelectorAll('a[href*="intent=comfort"],a[href*="provider=middletown"]').length,0);
  dom.window.close();
 }
});
