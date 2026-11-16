import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {validateBrief} from '../server/brief-validation.mjs';
import {CONSENT_VERSION} from '../project-config.mjs';
const page=path=>new JSDOM(readFileSync(new URL(`../dist/${path}index.html`,import.meta.url),'utf8')).window.document;
test('MH41 core pages render a single shared form and service choices before scripts',()=>{
 for(const path of ['','request/','services/water-heaters/','businesses/middletown-hvac/']){
  const d=page(path);assert.equal(d.querySelectorAll('#quickRequest').length,1,path);
  assert.ok(d.querySelectorAll('#quickRequest select[name=intent] option').length>2,path);
  assert.equal(d.querySelectorAll('[name=referrer_name]').length,1,path);
  assert.match(d.querySelector('label[for=request-referrer]').textContent,/Who sent you\? \(optional\)/);
  assert.equal(d.querySelector('#requestDialog'),null,path);
  assert.match(d.body.textContent,/wazooziehelp@gmail.com/);
  assert.match(d.querySelector('#receipt-referral').textContent,/completed, paid/);
 }
});
test('MH41 optional referrer is bounded and blank does not change legacy canonical payload',()=>{
 const input={id:crypto.randomUUID(),startedAt:Date.now()-5000,provider:'middletown',intent:'comfort',name:'Synthetic Test',phone:'202-555-0100',email:'test@example.invalid',town:'Media',zip:'19063',state:'PA',details:'Synthetic request, not a real customer.',timing:'Planning ahead',role:'Homeowner',property:'House',source:'start-page',consent:true,consentVersion:CONSENT_VERSION};
 assert.equal(validateBrief({...input,referrer_name:'  Neighbor  '}).brief.referrer_name,'Neighbor');
 assert.equal(Object.hasOwn(validateBrief({...input,referrer_name:''}).brief,'referrer_name'),false);
 assert.ok(validateBrief({...input,referrer_name:'x'.repeat(101)}).error);
 assert.ok(validateBrief({...input,referrer_name:{}}).error);
});
