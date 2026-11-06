import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const slugs=['surprise-repair-quote','one-room-too-hot-too-cold','car-repair-estimate-changed'];
test('situation guides provide sourced questions and relevant contact paths without forced intake',()=>{
 for(const slug of slugs){
  const dom=new JSDOM(readFileSync(new URL('../dist/guides/'+slug+'/index.html',import.meta.url),'utf8')),d=dom.window.document;
  assert.equal(d.querySelectorAll('h1').length,1);assert.ok(d.querySelector('[data-situation-question]'));assert.ok(d.querySelector('.situation-sources a[href^="https://"]'));assert.equal(d.querySelectorAll('main form').length,0);
  if(slug==='car-repair-estimate-changed'){assert.ok(d.querySelector('.situation-next a[href="/auto-mechanics/"]'));assert.equal(d.querySelector('.situation-next a[href*="mtownhvac"]'),null);}
  dom.window.close();
 }
});
test('article question copying falls back honestly without storage or transmission',async()=>{
 const dom=new JSDOM(readFileSync(new URL('../dist/guides/surprise-repair-quote/index.html',import.meta.url),'utf8'),{url:'https://wazoozie.com/guides/surprise-repair-quote/',runScripts:'outside-only'}),w=dom.window;
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('blocked')}}});
 w.eval(readFileSync(new URL('../assets/situation-guides.js',import.meta.url),'utf8'));w.document.querySelector('[data-copy-situation]').click();await new Promise(r=>setTimeout(r,0));
 assert.match(w.document.querySelector('.situation-copy-status').textContent,/Select and copy/);assert.match(w.document.querySelector('.situation-copy-text').value,/complete scope/);assert.equal(w.localStorage.length,0);w.close();
});
