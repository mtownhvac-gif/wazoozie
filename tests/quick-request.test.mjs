import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {saveEstimateHandoff} from '../assets/estimate-handoff.mjs';
import {validateBrief} from '../server/brief-validation.mjs';
let sequence=0;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function page(handler,{search='?intent=comfort&entry=home',notes,intent='secondopinion',age=0}={}) {
 const dom=new JSDOM(readFileSync('dist/request/index.html','utf8'),{url:'https://wazoozie.com/request/'+search}),d=dom.window.document,previous=new Map(),requests=[],timers=new Map();
 for(const key of ['document','location','FormData','sessionStorage']){previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});}
 const originalFetch=globalThis.fetch,originalNow=Date.now,originalTimer=setTimeout,originalClear=clearTimeout;let now=originalNow();Date.now=()=>now;
 globalThis.fetch=async(url,options)=>{requests.push({url,options});if(handler)return handler(url,options);return Response.json(url.includes('capabilities')?{captureReady:true,emailProviders:['middletown','ryan']}:{reference:JSON.parse(options.body).id,status:'saved',providerDelivery:'automation_accepted'});};
 globalThis.setTimeout=(callback,delay)=>{if([12000,20000].includes(delay)){const token={};timers.set(token,{callback,delay});return token;}return originalTimer(callback,delay);};globalThis.clearTimeout=token=>timers.has(token)?timers.delete(token):originalClear(token);
 if(notes)saveEstimateHandoff(dom.window.sessionStorage,intent,notes,now-age);
 await import(`../dist/assets/quick-request.js?test=${++sequence}`);await tick();now+=2200;
 const form=d.getElementById('quickRequest');
 return {dom,d,form,$:id=>d.getElementById(id),posts:()=>requests.filter(x=>x.options?.method==='POST'),
 complete(){for(const [key,value] of Object.entries({name:'Synthetic Test',phone:'202-555-0100',town:'Media',zip:'19063',timing:'This week',details:'Synthetic test. Please ignore this heating request.'}))form.elements[key].value=value;form.elements.consent.checked=true;},
 submit(){form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));},
 expire(delay){const timer=[...timers.values()].find(t=>t.delay===delay);assert.ok(timer);timer.callback();},
 close(){dom.window.close();globalThis.fetch=originalFetch;Date.now=originalNow;globalThis.setTimeout=originalTimer;globalThis.clearTimeout=originalClear;for(const [key,value] of previous){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
 };
}
test('the short request names the recipient, requires consent, and produces a valid backend payload without assuming homeowner status',async()=>{
 const e=await page();try{assert.match(e.$('request-business').textContent,/Middletown HVAC/);assert.ok(e.$('request-business').querySelector('a[href="tel:+16105006416"]'));e.complete();e.form.elements.consent.checked=false;e.submit();await tick();assert.equal(e.posts().length,0);e.form.elements.consent.checked=true;e.submit();await tick();assert.equal(e.posts().length,1);const payload=JSON.parse(e.posts()[0].options.body);const result=validateBrief(payload);assert.equal(result.error,undefined);assert.equal(payload.role,'Other');assert.equal(payload.property,'Other');assert.equal(payload.notifyProvider,true);assert.equal(payload.entryContext,'home');assert.equal(e.$('request-receipt').hidden,false);assert.match(e.$('request-delivery').textContent,/Inbox delivery is not yet confirmed/);assert.match(e.$('request-receipt').textContent,/No appointment has been booked/);assert.equal(e.dom.window.localStorage.length,0);assert.equal(e.dom.window.sessionStorage.length,0);}finally{e.close();}
});
test('the form fails closed when alerts are not configured, while direct phone contact stays available',async()=>{
 const e=await page(async()=>Response.json({captureReady:true,emailProviders:[]}));try{e.complete();e.submit();await tick();assert.equal(e.posts().length,0);assert.equal(e.$('request-send').disabled,true);assert.ok(e.$('request-business').querySelector('a[href^="tel:"]'));assert.match(e.$('request-status').textContent,/unavailable/);}finally{e.close();}
});
test('changing service changes the named recipient and clears consent',async()=>{
 const e=await page();try{e.complete();e.form.elements.intent.value='electrical';e.form.elements.intent.dispatchEvent(new e.dom.window.Event('change'));assert.equal(e.form.elements.consent.checked,false);assert.match(e.$('request-permission').textContent,/Ryan Dugan/);e.form.elements.consent.checked=true;e.submit();await tick();assert.equal(JSON.parse(e.posts()[0].options.body).provider,'ryan');}finally{e.close();}
});
test('timeouts lock the exact request, ignore a late response, prevent double sends and retry with identical content',async()=>{
 let posts=0,late;const e=await page(async(url,options)=>url.includes('capabilities')?Response.json({captureReady:true,emailProviders:['middletown']}):++posts===1?new Promise(resolve=>{late=resolve;}):Response.json({status:'saved',reference:JSON.parse(options.body).id,providerDelivery:'pending'}));
 try{e.complete();e.submit();e.submit();await tick();assert.equal(e.posts().length,1);assert.equal(e.form.elements.name.disabled,true);assert.match(e.$('request-status').textContent,/Sending your request/);e.expire(20000);await tick();assert.match(e.$('request-send').textContent,/Retry the same/);assert.equal(e.$('request-send').disabled,false);late(Response.json({status:'saved',reference:JSON.parse(e.posts()[0].options.body).id,providerDelivery:'automation_accepted'}));await tick();assert.equal(e.$('request-receipt').hidden,true);e.submit();await tick();assert.equal(e.posts().length,2);assert.equal(e.posts()[0].options.body,e.posts()[1].options.body);assert.equal(e.$('request-receipt').hidden,false);assert.match(e.$('request-delivery').textContent,/another delivery attempt/);}finally{e.close();}
});
test('mismatched receipts never show success and definite validation errors allow correction',async()=>{
 let mode='invalid';const e=await page(async(url)=>url.includes('capabilities')?Response.json({captureReady:true,emailProviders:['middletown']}):mode==='invalid'?Response.json({error:'Please check your phone.'},{status:400}):Response.json({status:'saved',reference:'wrong-reference',providerDelivery:'automation_accepted'}));
 try{e.complete();e.submit();await tick();assert.equal(e.form.elements.phone.disabled,false);assert.match(e.$('request-error').textContent,/check your phone/);mode='wrong';e.submit();await tick();assert.equal(e.$('request-receipt').hidden,true);assert.equal(e.form.elements.phone.disabled,true);assert.match(e.$('request-send').textContent,/Retry/);}finally{e.close();}
});

test('copying a saved receipt keeps the reference and chosen contact without copying homeowner details or sending again',async()=>{
 const e=await page(undefined,{search:'?intent=electrical&entry=home&private=DO-NOT-COPY'});let copied;
 try{
  Object.defineProperty(e.dom.window.navigator,'clipboard',{value:{async writeText(text){copied=text;}},configurable:true});
  e.$('receipt-copy').click();await tick();assert.equal(copied,undefined,'no receipt before a confirmed save');
  e.complete();e.form.elements.name.value='PRIVATE HOMEOWNER';e.form.elements.details.value='PRIVATE PROJECT';e.submit();await tick();
  assert.equal(copied,undefined,'saving must not write the clipboard automatically');
  e.$('receipt-copy').click();await tick();
  assert.ok(copied.includes(e.$('request-reference').textContent));
  assert.match(copied,/Ryan Dugan Electric LLC/);assert.match(copied,/445-258-9962/);
  assert.match(copied,/Inbox delivery is not yet confirmed/);assert.match(copied,/No appointment has been booked/);
  assert.doesNotMatch(copied,/PRIVATE|DO-NOT-COPY|202-555-0100|19063|Middletown HVAC/);
  assert.match(e.$('receipt-copy-status').textContent,/Receipt copied/);
  assert.equal(e.posts().length,1);assert.equal(e.dom.window.localStorage.length,0);assert.equal(e.dom.window.sessionStorage.length,0);
 }finally{e.close();}
});

test('blocked or missing clipboard access leaves a selectable honest receipt and does not disturb the saved request',async()=>{
 for(const delivery of ['pending','failed','not_sent']){
  const e=await page(async(url,options)=>Response.json(url.includes('capabilities')?{captureReady:true,emailProviders:['middletown']}:{reference:JSON.parse(options.body).id,status:'saved',providerDelivery:delivery}));
  try{
   if(delivery!=='not_sent')Object.defineProperty(e.dom.window.navigator,'clipboard',{value:{async writeText(){throw Error('Permission denied');}},configurable:true});
   e.complete();e.submit();await tick();e.$('receipt-copy').click();await tick();
   const text=e.$('receipt-copy-text');
   assert.equal(e.$('receipt-copy-fallback').hidden,false);assert.equal(text.readOnly,true);
   assert.equal(e.d.activeElement,text);assert.equal(text.selectionStart,0);assert.equal(text.selectionEnd,text.value.length);
   assert.ok(text.value.includes(e.$('request-delivery').textContent));assert.match(text.value,/Middletown HVAC/);
   assert.match(text.value,/No appointment has been booked/);assert.doesNotMatch(e.$('receipt-copy-status').textContent,/Receipt copied/);
   assert.equal(e.$('request-receipt').hidden,false);assert.equal(e.posts().length,1);
  }finally{e.close();}
 }
});

test('mobile contact controls lead directly to requests and all service choices remain reachable',()=>{
 const dom=new JSDOM(readFileSync('dist/index.html','utf8')),d=dom.window.document;
 assert.equal(d.querySelector('.account-top-link').getAttribute('href'),'/request/');
 assert.ok(d.querySelector('a.btn.primary[href="/request/"]'));
 assert.equal(d.querySelectorAll('.project-finder-choice').length,6);
 assert.ok(d.querySelector('.local-proof a[href="/projects/"]'));
 assert.equal(d.querySelectorAll('.local-proof figure img').length,2);
 dom.window.close();
});

test('estimate questions arrive only through a fresh matching handoff, with new consent and no automatic post',async()=>{
 const notes='Synthetic selected question: who handles the permit?';const e=await page(undefined,{search:'?intent=secondopinion&entry=estimate-check',notes});try{assert.equal(e.form.elements.details.value,notes);assert.equal(e.form.elements.consent.checked,false);assert.equal(e.posts().length,0);assert.equal(e.dom.window.sessionStorage.length,0);assert.match(e.form.textContent,/Nothing has been sent yet/);assert.doesNotMatch(e.dom.window.location.href,/permit/);e.complete();e.form.elements.details.value=notes;e.submit();await tick();const payload=JSON.parse(e.posts()[0].options.body);assert.equal(payload.entryContext,'estimate-check');assert.equal(payload.details,notes);assert.equal(payload.provider,'middletown');assert.equal(validateBrief(payload).error,undefined);}finally{e.close();}
});
test('expired and wrong-service estimate handoffs are removed without prefilling or submitting',async()=>{
 for(const [search,age] of [['?intent=water&entry=estimate-check',0],['?intent=secondopinion&entry=estimate-check',600001]]){const e=await page(undefined,{search,notes:'Synthetic selected questions',age});try{assert.equal(e.form.elements.details.value,'');assert.equal(e.posts().length,0);assert.equal(e.dom.window.sessionStorage.length,0);assert.equal(e.form.elements.consent.checked,false);}finally{e.close();}}
});
