import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {BUSINESSES,INTENTS} from '../project-config.mjs';
import {initNetworkContact} from '../dist/assets/network-contact.js';
const doc=path=>new JSDOM(readFileSync('dist/'+path+'/index.html','utf8'),{url:'https://wazoozie.com/'+path+'/'}).window.document;

test('every home-service recommendation identifies its recipient and keeps useful preparation and direct calls',()=>{
 for(const [key,business] of Object.entries(BUSINESSES)){
  const d=doc('businesses/'+business.slug),panel=d.querySelector('[data-network-business]');
  assert.equal(panel.dataset.networkBusiness,key);assert.equal(INTENTS[panel.dataset.networkIntent].provider,key);
  assert.ok(panel.querySelector('a[href="tel:'+business.tel+'"]'));
  assert.equal(panel.querySelectorAll('[data-callback-slot] a').length,0,'callback is not promised before availability check');
  assert.match(d.querySelector('.network-evidence').textContent,/recommend/i);
  assert.equal(d.querySelector('.profile-next-step').querySelectorAll('li').length,3);
  assert.ok(!/documents (?:are not|have not been) recorded/i.test(d.querySelector('main').textContent));
  if(key==='ryan')assert.match(d.querySelector('.network-reason').textContent,/Middletown HVAC uses Ryan Dugan Electric/);
  if(key==='middletown'){
   assert.match(d.querySelector('.network-reason').textContent,/go directly to Middletown HVAC/);
   assert.doesNotMatch(d.querySelector('main').textContent,/related Wazoozie business|operated by Bryan Cordy/i);
  }
  d.defaultView.close();
 }
});

test('callback routes appear only for a matching enabled recipient and never submit a request',async()=>{
 const d=doc('businesses/middletown-hvac'),calls=[];
 await initNetworkContact(d,{fetcher:async(url,options)=>{calls.push({url,options});return Response.json({captureReady:true,emailProviders:['middletown','ryan','untrusted']});}});
 const a=d.querySelector('[data-callback-slot] a');assert.equal(a.getAttribute('href'),'/start/?intent=comfort');assert.equal(a.textContent,'Request a callback');
 assert.match(d.querySelector('[data-callback-status]').textContent,/Selected business: Middletown HVAC/);
 assert.equal(calls.length,1);assert.equal(calls[0].url,'/api/project-capabilities');assert.equal(calls[0].options.method,undefined);
 await initNetworkContact(d,{fetcher:async()=>Response.json({captureReady:true,emailProviders:['ryan']})});
 assert.equal(d.querySelector('[data-callback-slot] a'),null);
 assert.ok(d.querySelector('a[href="tel:+16105006416"]'));d.defaultView.close();
});

test('callback failure, disabled capture, malformed capability and incorrect routing leave direct contact usable',async()=>{
 for(const response of [()=>{throw Error('offline')},()=>Response.json({captureReady:false,emailProviders:['middletown']}),()=>Response.json({captureReady:true,emailProviders:'middletown'}),()=>new Response('',{status:503})]){
  const d=doc('businesses/middletown-hvac');await initNetworkContact(d,{fetcher:response});assert.equal(d.querySelector('[data-callback-slot] a'),null);assert.ok(d.querySelector('a[href="tel:+16105006416"]'));d.defaultView.close();
 }
 const d=doc('businesses/ryan-dugan-electric');d.querySelector('[data-network-business]').dataset.networkIntent='comfort';await initNetworkContact(d,{fetcher:async()=>Response.json({captureReady:true,emailProviders:['ryan']})});assert.equal(d.querySelector('[data-callback-slot] a'),null);d.defaultView.close();
});

test('service recipients use the shared catalog and neutral pages offer the whole network',()=>{
 for(const [intent,config] of Object.entries(INTENTS)){
  const d=doc('services/'+config.service),panel=d.querySelector('[data-network-business]');
  assert.equal(panel?.dataset.networkBusiness,config.provider,config.service);d.defaultView.close();
 }
 for(const path of ['about','how-it-works','facts','our-standards','delaware-valley']){
  const d=doc(path);assert.ok(d.querySelector('.network-wide-next a[href="/local-help/"]'));assert.equal(d.querySelector('.network-wide-next a[href^="tel:"]'),null);d.defaultView.close();
 }
 const about=doc('about');for(const b of Object.values(BUSINESSES))assert.ok(about.querySelector('article a[href="/businesses/'+b.slug+'/"]'));about.defaultView.close();
 const how=doc('how-it-works');assert.match(how.querySelector('.network-how').textContent,/Saving notes alone does not notify a business/);assert.match(how.querySelector('.network-how').textContent,/receipt tells you whether it was sent, is waiting to send or couldn’t be sent/);how.defaultView.close();
});
