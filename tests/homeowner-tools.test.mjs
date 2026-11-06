import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {initHomeownerTools, parsePrice, priceDifference} from '../dist/assets/homeowner-tools.js';
async function page(path,query=''){
 const dom=new JSDOM(await readFile('dist/'+path+'/index.html','utf8'),{url:'https://wazoozie.com/'+path+'/'+query});
 let requests=0;dom.window.fetch=()=>{requests++;throw Error('No transmission allowed');};
 initHomeownerTools(dom.window.document);return {dom,doc:dom.window.document,requests:()=>requests};
}
test('estimate arithmetic handles currency, equal prices and invalid or extreme entries',()=>{
 assert.equal(parsePrice('$8,500.25'),850025);
 for(const bad of ['', '0','-200','free','10.999','Infinity','1000000001','1e6','<script>','8,5','1,00,000'])assert.equal(parsePrice(bad),null);
 assert.deepEqual(priceDifference('8500','10000'),{cents:150000,percent:1500/8500*100});
 assert.deepEqual(priceDifference('8500','8500'),{cents:0,percent:0});
 assert.equal(priceDifference('8500',''),null);
});
test('project sheet uses validated routes, treats free text as text, and supports blocked clipboard',async()=>{
 const {dom,doc,requests}=await page('project-kit','?intent=windows');
 try{
  assert.equal(doc.querySelector('#kit-intent').value,'windows');
  assert.match(doc.querySelector('#kit-business').textContent,/Hart Builders/);
  assert.ok(doc.querySelector('#kit-business a[href="tel:+12153505502"]'));
  const goal=doc.querySelector('#kit-goal');goal.value='<img src=x onerror=alert(1)> Fix the draft';goal.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  assert.equal(doc.querySelector('#kit-preview img'),null);assert.match(doc.querySelector('#kit-preview').textContent,/<img/);
  doc.querySelector('#kit-copy').click();await new Promise(r=>setImmediate(r));
  assert.equal(doc.querySelector('#kit-copy-fallback').hidden,false);
  assert.match(doc.querySelector('#kit-copy-fallback').value,/Fix the draft/);
  assert.match(doc.querySelector('#kit-copy-fallback').value,/215-350-5502/);
  assert.match(doc.querySelector('#kit-status').textContent,/Copy command/);
  assert.equal(dom.window.localStorage.length,0);assert.equal(requests(),0);
 }finally{dom.window.close();}
 const other=await page('project-kit','?intent=__proto__');try{assert.equal(other.doc.querySelector('#kit-intent').value,'comfort');}finally{other.dom.window.close();}
});
test('comparison keeps scope across trade changes, identifies unknowns, clears and prints without transmission',async()=>{
 const {dom,doc,requests}=await page('compare');
 try{
  const input=(id,value)=>{const field=doc.querySelector(id);field.value=value;field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
  input('#compare-total-a','$8,500');input('#compare-total-b','10000');assert.match(doc.querySelector('#compare-summary').textContent,/\$1,500.00/);
  input('#compare-trade-a','Keep the existing thermostat');
  const kind=doc.querySelector('#compare-kind');kind.value='hvac';kind.dispatchEvent(new dom.window.Event('change'));
  assert.equal(doc.querySelector('#compare-trade-a').value,'Keep the existing thermostat');assert.match(doc.querySelector('[data-compare-row="trade"]').textContent,/venting/);
  assert.match(doc.querySelector('#compare-gaps').textContent,/Still to clarify/);
  input('#compare-total-b','unknown');assert.equal(doc.querySelector('#compare-total-b').getAttribute('aria-invalid'),'true');
  let printed=0;dom.window.print=()=>printed++;doc.querySelector('[data-tool-print]').click();assert.equal(printed,1);
  doc.querySelector('#compare-clear').click();assert.equal(doc.querySelector('#compare-trade-a').value,'');assert.equal(doc.querySelector('#compare-total-b').getAttribute('aria-invalid'),'false');
  assert.equal(doc.activeElement.id,'compare-name-a');assert.equal(dom.window.localStorage.length,0);assert.equal(requests(),0);
 }finally{dom.window.close();}
});
