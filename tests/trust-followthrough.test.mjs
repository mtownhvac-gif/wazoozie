import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {initBooking} from '../dist/assets/booking.js';
import {coverageFor} from '../coverage-config.mjs';
import {PROJECT_STAGES} from '../project-progress.mjs';
import {validateAccountData} from '../server/account-http.mjs';
import {receiptTracking} from '../dist/assets/receipt-tracking.js';
import {contactOutcome} from '../dist/assets/contact-outcome.js';
import {validateActivity} from '../activity-config.mjs';
import {HOME_LIST_KEY,sanitizeList,matchingProjects,initConcierge} from '../dist/assets/project-concierge.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
test('location evidence distinguishes published coverage from unknown coverage without hiding businesses by default',()=>{
 const dom=new JSDOM(readFileSync('dist/book/index.html','utf8'),{url:'https://wazoozie.com/book/?town=Media'}),d=dom.window.document;initBooking(d);
 const cards=[...d.querySelectorAll('.booking-card')],visible=()=>cards.filter(c=>!c.hidden);
 assert.equal(visible().length,13);assert.match(d.querySelector('[data-business="middletown-hvac"] .booking-coverage').textContent,/Published coverage includes Media/);
 assert.match(d.querySelector('[data-business="cooke-carpentry-construction"] .booking-coverage').textContent,/needs confirmation/);
 const check=d.querySelector('#booking-coverage-only');check.checked=true;check.dispatchEvent(new dom.window.Event('change'));assert.deepEqual(visible().map(c=>c.dataset.business),['middletown-hvac']);
 const town=d.querySelector('#booking-town');town.value='Unrecorded town';town.dispatchEvent(new dom.window.Event('input'));assert.equal(visible().length,0);assert.match(d.querySelector('#booking-count').textContent,/other businesses may also serve/);
 town.value='<img src=x onerror=alert(1)>';town.dispatchEvent(new dom.window.Event('input'));assert.equal(d.querySelector('.booking-coverage img'),null);
 d.querySelector('#booking-reset').click();assert.equal(visible().length,13);assert.equal(town.value,'');assert.equal(check.checked,false);dom.window.close();
 assert.equal(coverageFor('middletown-hvac','MEDIA, PA').match,true);assert.equal(coverageFor('cooke-carpentry-construction','Media').match,false);assert.equal(coverageFor('middletown-hvac','Philadelphia').match,false);
});
test('all profiles explain evidence limits; only sourced coverage receives a coverage-check date',()=>{
 const book=new JSDOM(readFileSync('dist/book/index.html','utf8'));
 for(const card of book.window.document.querySelectorAll('[data-business]')){const slug=card.dataset.business,dom=new JSDOM(readFileSync('dist/businesses/'+slug+'/index.html','utf8')),d=dom.window.document;
  const facts=d.querySelector('.profile-facts');assert.ok(facts,slug);assert.match(facts.textContent,/not a current inspection/);
  if(slug==='middletown-hvac'){assert.match(facts.textContent,/coverage only/);assert.ok(facts.querySelector('a[href="https://www.mtownhvac.com/contact/"]'));}else{assert.match(facts.textContent,/Not independently recorded/);assert.doesNotMatch(facts.textContent,/Source read 2026/);}dom.window.close();
 }book.window.close();
 const home=new JSDOM(readFileSync('dist/index.html','utf8'));assert.equal(home.window.document.querySelector('#home-town-query').name,'town');home.window.close();
});
test('explicit receipt tracking saves only category and next step, never overwrites later progress or sends anything',()=>{
 const dom=new JSDOM('<section id="receipt"></section>',{url:'https://wazoozie.com/start/'}),d=dom.window.document,storage=memory();dom.window.fetch=()=>assert.fail('No request allowed');
 receiptTracking(d,d.querySelector('#receipt'),{intent:'comfort',delivery:'automation_accepted'},storage);assert.equal(storage.getItem(HOME_LIST_KEY),null);d.querySelector('button').click();
 assert.deepEqual(JSON.parse(storage.getItem(HOME_LIST_KEY)),{version:1,items:[{intent:'comfort',stage:'waiting'}]});assert.match(d.querySelector('[role="status"]').textContent,/Saved on this device/);
 storage.setItem(HOME_LIST_KEY,JSON.stringify({version:1,items:[{intent:'comfort',stage:'done'}]}));receiptTracking(d,d.querySelector('#receipt'),{intent:'comfort',delivery:'pending'},storage);d.querySelector('button').click();assert.equal(JSON.parse(storage.getItem(HOME_LIST_KEY)).items[0].stage,'done');assert.equal(d.querySelectorAll('#receiptTrack').length,1);
 receiptTracking(d,d.querySelector('#receipt'),{intent:'water',delivery:'not_sent'},storage);d.querySelector('button').click();assert.equal(JSON.parse(storage.getItem(HOME_LIST_KEY)).items[1].stage,'calling');
 receiptTracking(d,d.querySelector('#receipt'),{intent:'water',delivery:'failed'},{getItem(){throw Error('denied');}});d.querySelector('button').click();assert.match(d.querySelector('[role="status"]').textContent,/could not save/);dom.window.close();
});
test('homeowner-reported stages survive local and account validation without inventing provider confirmation',()=>{
 for(const stage of Object.keys(PROJECT_STAGES)){const projects=[{intent:'comfort',stage}];assert.deepEqual(sanitizeList({version:1,items:projects}),projects);assert.deepEqual(validateAccountData({version:0,projects,favorites:[]}).projects,projects);}
 assert.equal(validateAccountData({version:0,projects:[{intent:'comfort',stage:'provider_verified'}],favorites:[]}),null);
 const storage=memory();storage.setItem(HOME_LIST_KEY,JSON.stringify({version:1,items:[{intent:'comfort',stage:'waiting'}]}));const dom=new JSDOM(readFileSync('dist/my-home/index.html','utf8'),{url:'https://wazoozie.com/my-home/'}),d=dom.window.document;initConcierge(d,storage);
 const select=d.querySelector('.home-project select');select.value='booked';select.dispatchEvent(new dom.window.Event('change'));assert.match(d.querySelector('.home-project-next').textContent,/has not verified/);assert.equal(JSON.parse(storage.getItem(HOME_LIST_KEY)).items[0].stage,'booked');dom.window.close();assert.deepEqual(matchingProjects('car'),[]);
});

test('contact outcome sharing is voluntary, bounded and separate from saved progress; errors permit retry',async()=>{
 const dom=new JSDOM('<section id="card"></section>',{url:'https://wazoozie.com/my-home/'}),d=dom.window.document;let calls=[],ok=false;
 dom.window.fetch=async(url,options)=>{assert.equal(url,'/api/contact-activity');assert.equal(options.credentials,'omit');calls.push(JSON.parse(options.body));return {ok};};
 contactOutcome(d,d.querySelector('#card'),'middletown');assert.equal(calls.length,0);
 const select=d.querySelector('select'),button=d.querySelector('button');assert.equal(button.disabled,true);select.value='reported_no_reply';select.dispatchEvent(new dom.window.Event('change'));assert.equal(calls.length,0);button.click();await new Promise(r=>setTimeout(r,0));assert.equal(button.disabled,false);assert.match(d.querySelector('[role="status"]').textContent,/could not be shared/);
 ok=true;button.click();await new Promise(r=>setTimeout(r,0));assert.equal(calls.length,2);assert.deepEqual(calls[1],{provider:'middletown',action:'reported_no_reply',context:'other'});assert.ok(validateActivity(calls[1]));assert.equal(validateActivity({...calls[1],town:'private'}),null);assert.match(d.querySelector('[role="status"]').textContent,/no business or customer was messaged/);assert.equal(button.disabled,true);dom.window.close();
});
