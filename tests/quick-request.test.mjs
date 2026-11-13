import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {validateBrief} from '../server/brief-validation.mjs';
let sequence=0;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function page(handler) {
 const dom=new JSDOM(readFileSync('dist/request/index.html','utf8'),{url:'https://wazoozie.com/request/?intent=comfort&entry=home'}),d=dom.window.document,previous=new Map(),requests=[],timers=new Map();
 for(const key of ['document','location','FormData']){previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});}
 const originalFetch=globalThis.fetch,originalNow=Date.now,originalTimer=setTimeout,originalClear=clearTimeout;let now=originalNow();Date.now=()=>now;
 globalThis.fetch=async(url,options)=>{requests.push({url,options});if(handler)return handler(url,options);return Response.json(url.includes('capabilities')?{captureReady:true,emailProviders:['middletown','ryan']}:{reference:JSON.parse(options.body).id,status:'saved',providerDelivery:'automation_accepted'});};
 globalThis.setTimeout=(callback,delay)=>{if([12000,20000].includes(delay)){const token={};timers.set(token,{callback,delay});return token;}return originalTimer(callback,delay);};globalThis.clearTimeout=token=>timers.has(token)?timers.delete(token):originalClear(token);
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

test('mobile contact controls lead directly to requests and all service choices remain reachable',()=>{
 const dom=new JSDOM(readFileSync('dist/index.html','utf8')),d=dom.window.document;
 assert.equal(d.querySelector('.account-top-link').getAttribute('href'),'/request/');
 assert.ok(d.querySelector('a.btn.primary[href="/request/"]'));
 assert.equal(d.querySelectorAll('.project-finder-choice').length,8);
 assert.ok(d.querySelector('.local-proof a[href="/projects/"]'));
 assert.equal(d.querySelectorAll('.local-proof figure img').length,2);
 dom.window.close();
});
