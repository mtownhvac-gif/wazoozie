import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {validateApplication} from '../server/application-validation.mjs';
import {APPLICATION_CONSENT_VERSION} from '../contractor-config.mjs';
const read=path=>readFileSync(new URL('../dist'+path+'index.html',import.meta.url),'utf8');
test('new local referrals preserve exact identity and direct contacts without homeowner intake',()=>{
 const contacts={'c-and-j-automotive-upper-chichester':'+16104853103','caitlin-kerezsi':'+16103689912','megan-kerezsi':'+16103684189','libbi-skivo':'+12153162843'};
 for(const [slug,phone] of Object.entries(contacts)){
  const dom=new JSDOM(read('/businesses/'+slug+'/'));const main=dom.window.document.querySelector('main');
  assert.ok(main.querySelector(`a[href="tel:${phone}"]`));
  assert.equal(main.querySelectorAll('a[href*="/start/"],form').length,0);
  assert.match(main.textContent,/Recommended by Wazoozie’s owner/);
  assert.match(main.textContent,/does not claim an independent license/);
  dom.window.close();
 }
});
test('local business applications accept new categories without publishing or inventing checks',()=>{
 const data={id:crypto.randomUUID(),startedAt:Date.now()-5000,businessName:'Synthetic Business',contactName:'Synthetic Test',phone:'202-555-0100',email:'test@example.invalid',town:'Media',state:'PA',coverage:'Media and nearby towns',insurance:'discuss',interest:'standard',consent:true,consentVersion:APPLICATION_CONSENT_VERSION};
 for(const category of ['automotive','vehiclewraps','realestate'])assert.ok(validateApplication({...data,services:[category]}).application);
 assert.ok(validateApplication({...data,services:['unrecognized']} ).error);
 const dom=new JSDOM(read('/for-contractors/'));
 assert.ok(dom.window.document.querySelector('input[name="services"][value="automotive"]'));
 assert.ok(dom.window.document.querySelector('input[name="services"][value="realestate"]'));dom.window.close();
});
test('ductless discovery stays contextual and preserves distinct referral destinations',()=>{
 const home=new JSDOM(read('/'));assert.ok(home.window.document.querySelector('.journal-home-reads a[href="/services/ductless-mini-splits/"]'));home.window.close();
 const page=new JSDOM(read('/services/ductless-mini-splits/'));
 assert.ok(page.window.document.querySelector('#ductless-room-title'));
 assert.ok(page.window.document.querySelector('a[href^="https://www.mtownhvac.com/ductless-estimator/"]'));page.window.close();
 const auto=new JSDOM(read('/auto-mechanics/'));assert.equal(auto.window.document.querySelector('main a[href*="ductless"]'),null);auto.window.close();
});
