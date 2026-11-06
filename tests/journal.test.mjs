import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
function setup(){const dom=new JSDOM(readFileSync(new URL('../dist/home-tips/index.html',import.meta.url),'utf8'),{url:'https://wazoozie.com/home-tips/',runScripts:'outside-only'});dom.window.eval(readFileSync(new URL('../assets/journal.js',import.meta.url),'utf8'));return dom.window;}
test('field notes render without JavaScript and filter by topic plus search',()=>{
 const w=setup();const d=w.document;const cards=[...d.querySelectorAll('[data-journal-topic]')];
 assert.equal(cards.length,24);assert.equal(cards.filter(c=>!c.hidden).length,24);
 const filter=d.querySelector('[data-journal-filter="finishes"]');filter.click();
 assert.equal(cards.filter(c=>!c.hidden).length,4);assert.equal(filter.getAttribute('aria-pressed'),'true');
 const search=d.querySelector('#journal-search');search.value='windows';search.dispatchEvent(new w.Event('input'));
 assert.equal(cards.filter(c=>!c.hidden).length,1);
 assert.match(cards.find(c=>!c.hidden).querySelector('a').href,/window-replacement-questions/);w.close();
});
test('no-result searches reset fully and inspiration stays within the filtered topic',()=>{
 const w=setup();const d=w.document;const search=d.querySelector('#journal-search');
 d.querySelector('[data-journal-filter="electrical"]').click();w.Math.random=()=>0;
 d.querySelector('#journal-surprise').click();const title=d.querySelector('#journal-pick-title').textContent;
 assert.match(d.querySelector('#journal-pick-link').getAttribute('href'),/electrical/);
 d.querySelector('#journal-surprise').click();assert.notEqual(d.querySelector('#journal-pick-title').textContent,title);
 search.value='<img src=x onerror=alert(1)>';search.dispatchEvent(new w.Event('input'));
 assert.equal(d.querySelector('#journal-empty').hidden,false);assert.equal(d.querySelector('#journal-surprise').disabled,true);assert.equal(d.querySelector('#journal-spotlight').hidden,true);
 d.querySelector('#journal-reset').click();assert.equal(search.value,'');assert.equal(d.querySelectorAll('[data-journal-topic]:not([hidden])').length,24);w.close();
});
