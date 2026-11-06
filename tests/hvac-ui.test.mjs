import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {BUSINESSES} from '../project-config.mjs';
import {HVAC_CONSENT_VERSION, HVAC_INTENTS} from '../hvac-config.mjs';
import {validateHvacRequest} from '../server/hvac-validation.mjs';
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function setup(fetcher, url='https://wazoozie.com/hvac/?intent=maintenance') {
  let html=await readFile('templates/hvac.html','utf8');
  for(const key of ['tel','phone','email','booking']) html=html.replaceAll('{{'+key+'}}',BUSINESSES.middletown[key]);
  const dom=new JSDOM(html,{url,runScripts:'outside-only'});
  dom.window.fetch=fetcher;
  const now=Date.now();
  dom.window.Date.now=()=>now-5000;
  const code=(await readFile('assets/hvac.js','utf8')).replace(/^import .*;\n/gm,'');
  dom.window.eval(`const BUSINESSES=${JSON.stringify(BUSINESSES)};const HVAC_CONSENT_VERSION=${JSON.stringify(HVAC_CONSENT_VERSION)};const HVAC_INTENTS=${JSON.stringify(HVAC_INTENTS)};\n${code}`);
  dom.window.Date.now=()=>now;
  await tick();
  return {dom,d:dom.window.document,$:id=>dom.window.document.getElementById(id)};
}
function next({dom,$}){
  $('hvac-zip').value='19063';
  $('hvac-start').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));
}
function fill({$}) {
  $('hvac-timing').value='Planning ahead';$('hvac-name').value='Test Person';$('hvac-contact').value='test@example.com';$('hvac-details').value='The upstairs room is not heating evenly.';
}
function submit({dom,$}) { $('hvac-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true})); }
const response=body=>({ok:true,json:async()=>body});
test('an expired form waits for a fresh request age and saves without losing the draft', async()=>{
 let now=Date.now()+7200001, posted, delay;
 const app=await setup(async(url,opts)=>{
  if(url.includes('capabilities'))return response({captureReady:true});
  posted=JSON.parse(opts.body);assert.equal(validateHvacRequest(posted,now).error,undefined);
  return response({status:'saved',reference:posted.id,provider:'Middletown HVAC',providerDelivery:'not_sent'});
 });
 try{
  app.dom.window.Date.now=()=>now;
  app.dom.window.setTimeout=(callback,ms)=>{delay=ms;now+=ms;callback();};
  next(app);fill(app);app.$('hvac-consent').checked=true;submit(app);await tick();
  assert.equal(delay,2100);assert.equal(posted.details,'The upstairs room is not heating evenly.');
  assert.equal(app.$('hvac-name').value,'Test Person');assert.match(app.$('hvac-result').textContent,/Saved privately/);
 }finally{app.dom.window.close();}
});
test('without JavaScript the ZIP form cannot submit and direct contact remains available', async()=>{
 const dom=new JSDOM(await readFile('templates/hvac.html','utf8'));
 try{assert.equal(dom.window.document.getElementById('hvac-continue').disabled,true);assert.equal(dom.window.document.querySelectorAll('.hvac-provider a[href^="tel:"]').length,1);}finally{dom.window.close();}
});
test('service and ZIP lead to named provider without requiring contact data; back retains selections', async()=>{
 const app=await setup(async()=>response({captureReady:true}));
 try{next(app);assert.equal(app.$('hvac-next').hidden,false);assert.match(app.$('hvac-summary').textContent,/Maintenance.*19063/);assert.equal(app.$('hvac-name').value,'');assert.equal(app.d.querySelectorAll('a[href^="tel:"]').length,2);app.$('hvac-back').click();assert.equal(app.$('hvac-start').hidden,false);assert.equal(app.$('hvac-zip').value,'19063');assert.equal(app.$('hvac-start').elements.intent.value,'maintenance');assert.equal(app.$('hvac-consent').checked,false);}finally{app.dom.window.close();}
});
test('failed and invalid receipts never claim success; retries preserve identity, edits change it, repeated clicks do not post twice',async()=>{
 const calls=[];let resolvePost;
 const app=await setup(async(url,opts)=>{
  if(url.includes('capabilities')) return response({captureReady:true});
  calls.push(JSON.parse(opts.body));return new Promise(resolve=>{resolvePost=resolve;});
 });
 try{
  next(app);fill(app);submit(app);assert.equal(calls.length,0);
  app.$('hvac-consent').checked=true;app.$('hvac-consent').dispatchEvent(new app.dom.window.Event('input',{bubbles:true}));
  submit(app);submit(app);assert.equal(calls.length,1);assert.equal(app.$('hvac-save').disabled,true);
  resolvePost({ok:false,json:async()=>({error:'unavailable'})});await tick();
  assert.match(app.$('hvac-result').textContent,/could not confirm/);
  submit(app);assert.equal(calls[0].id,calls[1].id);resolvePost(response({status:'saved',reference:'HVAC-123',provider:'Middletown HVAC',providerDelivery:'sent'}));await tick();
  assert.match(app.$('hvac-result').textContent,/could not confirm/);
  app.$('hvac-details').value+=' A changed detail.';app.$('hvac-details').dispatchEvent(new app.dom.window.Event('input',{bubbles:true}));submit(app);
  assert.notEqual(calls[1].id,calls[2].id);assert.equal(calls[2].consentVersion,HVAC_CONSENT_VERSION);
  resolvePost(response({status:'saved',reference:calls[2].id,provider:'Middletown HVAC',providerDelivery:'not_sent'}));await tick();
  assert.match(app.$('hvac-result').textContent,/Saved privately/);assert.match(app.$('hvac-result').textContent,/has not been notified/);
  submit(app);assert.equal(calls.length,3);
 }finally{app.dom.window.close();}
});
test('unavailable capture leaves email preview and manual copy working without consent or transmission',async()=>{
 const calls=[];const app=await setup(async(url)=>{calls.push(url);throw new Error('offline');});
 try{
  assert.equal(app.$('hvac-save').disabled,true);next(app);fill(app);
  app.$('hvac-details').value='<img src=x onerror=alert(1)> This is test text.';
  app.$('hvac-preview').click();assert.equal(app.$('hvac-email').hidden,false);assert.equal(app.$('hvac-consent').checked,false);
  assert.match(app.$('hvac-open-email').href,/^mailto:service@mtownhvac.com/);assert.match(app.$('hvac-email-body').value,/<img/);assert.equal(app.d.querySelectorAll('img[src="x"]').length,0);assert.equal(calls.length,1);
  app.$('hvac-copy').click();await tick();assert.match(app.$('hvac-copy-status').textContent,/Select and copy/);
  app.$('hvac-name').dispatchEvent(new app.dom.window.Event('input',{bubbles:true}));assert.equal(app.$('hvac-email').hidden,true);assert.equal(app.$('hvac-open-email').hasAttribute('href'),false);
 }finally{app.dom.window.close();}
});
test('capability retry preserves typed details, ZIP zero and missing timing are rejected',async()=>{
 let checks=0,posts=0;
 const app=await setup(async(url)=>{if(url.includes('capabilities'))return response({captureReady:++checks>1});posts++;return response({});});
 try{
  app.$('hvac-zip').value='00000';app.$('hvac-start').dispatchEvent(new app.dom.window.Event('submit',{cancelable:true}));assert.equal(app.$('hvac-next').hidden,true);
  next(app);fill(app);app.$('hvac-retry-capability').click();await tick();assert.equal(app.$('hvac-save').disabled,false);assert.equal(app.$('hvac-name').value,'Test Person');assert.equal(app.$('hvac-zip').value,'19063');
  app.$('hvac-consent').checked=true;app.$('hvac-timing').value='';submit(app);assert.equal(posts,0);
 }finally{app.dom.window.close();}
});

test('a saved receipt for a different UUID fails closed; matching retry receipt succeeds',async()=>{
 const calls=[];
 const app=await setup(async(url,opts)=>{
  if(url.includes('capabilities')) return response({captureReady:true});
  const body=JSON.parse(opts.body);calls.push(body);
  return response({status:'saved',reference:calls.length===1?'00000000-0000-4000-8000-000000000000':body.id,provider:'Middletown HVAC',providerDelivery:'not_sent'});
 });
 try{
  next(app);fill(app);app.$('hvac-consent').checked=true;submit(app);await tick();
  assert.match(app.$('hvac-result').textContent,/could not confirm/);
  assert.doesNotMatch(app.$('hvac-result').textContent,/Saved privately/);
  submit(app);await tick();assert.equal(calls[0].id,calls[1].id);
  assert.match(app.$('hvac-result').textContent,/Saved privately/);
  assert.ok(app.$('hvac-result').textContent.includes(calls[1].id));
 }finally{app.dom.window.close();}
});
