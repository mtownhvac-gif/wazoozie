import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
let sequence=0;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function page(handler){
 const dom=new JSDOM(readFileSync('dist/for-contractors/index.html','utf8'),{url:'https://wazoozie.com/for-contractors/'}),d=dom.window.document,previous=new Map(),requests=[],timers=new Map();
 for(const key of ['document','location','FormData']){previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});}
 const originalFetch=fetch,originalNow=Date.now,originalTimer=setTimeout,originalClear=clearTimeout;let now=originalNow();Date.now=()=>now;
 globalThis.fetch=async(url,options)=>{requests.push({url,options});return handler(url,options);};
 globalThis.setTimeout=(callback,delay)=>{if([12000,20000].includes(delay)){const token={};timers.set(token,{callback,delay});return token;}return originalTimer(callback,delay);};
 globalThis.clearTimeout=token=>timers.has(token)?timers.delete(token):originalClear(token);
 await import(`../dist/assets/contractors.js?retry=${++sequence}`);await tick();
 const form=d.querySelector('#contractorForm');
 return {dom,d,form,$:id=>d.getElementById(id),posts:()=>requests.filter(x=>x.options?.method==='POST'),
 fill(){for(const [key,value] of Object.entries({businessName:'Synthetic business',contactName:'Synthetic Test',phone:'202-555-0100',email:'test@example.invalid',town:'Media',coverage:'Media and nearby towns',insurance:'yes',notes:'Synthetic test only'}))form.elements[key].value=value;form.querySelector('input[value="carpentry"]').checked=true;form.elements.consent.checked=true;},
 submit(){form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));},
 expire(delay){const timer=[...timers.values()].find(t=>t.delay===delay);assert.ok(timer);timer.callback();},
 nextMonth(){const date=new Date(now);now=Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1);},
 close(){dom.window.close();globalThis.fetch=originalFetch;Date.now=originalNow;globalThis.setTimeout=originalTimer;globalThis.clearTimeout=originalClear;for(const [key,value] of previous){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
 };
}
const capability=()=>Response.json({captureReady:true});
const receipt=options=>({reference:JSON.parse(options.body).id,status:'awaiting_review',published:false,charged:false,officeDelivery:'pending'});

test('a stalled application holds its exact payload for retry, ignores late success, and keeps a useful manual email draft',async()=>{
 let calls=0,late;const e=await page(async(url,options)=>url.includes('capabilities')?capability():++calls===1?new Promise(resolve=>{late=resolve;}):Response.json(receipt(options)));
 try{
  e.fill();e.submit();e.submit();await tick();assert.equal(e.posts().length,1);assert.equal(e.form.elements.businessName.disabled,true);
  e.expire(20000);await tick();assert.equal(e.posts()[0].options.signal.aborted,true);assert.match(e.$('submitApplication').textContent,/Retry the same application/);assert.equal(e.$('submitApplication').disabled,false);
  late(Response.json(receipt(e.posts()[0].options)));await tick();assert.equal(e.$('applicationReceipt').hidden,true);
  // Even a programmatic edit cannot alter the frozen retry payload.
  e.form.elements.businessName.value='Changed after uncertain save';e.$('retryApplication').click();e.submit();await tick();
  assert.equal(e.posts().length,2);assert.equal(e.posts()[0].options.body,e.posts()[1].options.body);assert.equal(e.$('applicationReceipt').hidden,false);
  assert.match(e.$('applicationReceipt').textContent,/office notification is not confirmed/);
  const draft=e.$('applicationReceipt').querySelector('a.btn.primary');draft.addEventListener('click',event=>event.preventDefault());draft.click();
  const body=new URL(draft.href).searchParams.get('body');assert.match(body,/businessName: Synthetic business\n/);assert.match(body,/services: carpentry/);assert.match(body,/phone: 202-555-0100/);assert.doesNotMatch(body,/Changed after|consentVersion|startedAt|fax:/);
  e.submit();await tick();assert.equal(e.posts().length,2);assert.equal(e.dom.window.localStorage.length,0);assert.equal(e.dom.window.sessionStorage.length,0);
 }finally{e.close();}
});

test('validation errors allow corrections; conflicts and incomplete delivery receipts keep a safe retry',async()=>{
 let mode='validation';const e=await page(async(url,options)=>url.includes('capabilities')?capability():mode==='validation'?Response.json({error:'Check your phone.'},{status:400}):mode==='conflict'?Response.json({error:'Reference conflict.'},{status:409}):mode==='incomplete'?Response.json({...receipt(options),officeDelivery:undefined}):Response.json(receipt(options)));
 try{
  e.fill();e.submit();await tick();assert.equal(e.form.elements.phone.disabled,false);assert.match(e.$('applicationError').textContent,/Check your phone/);
  e.form.elements.phone.value='202-555-0101';mode='conflict';e.submit();await tick();assert.equal(e.form.elements.phone.disabled,true);assert.equal(e.$('applicationReceipt').hidden,true);
  mode='incomplete';e.submit();await tick();assert.equal(e.$('applicationReceipt').hidden,true);assert.equal(e.posts()[1].options.body,e.posts()[2].options.body);
  mode='success';e.submit();await tick();assert.equal(e.$('applicationReceipt').hidden,false);assert.equal(e.posts()[2].options.body,e.posts()[3].options.body);
 }finally{e.close();}
});

test('uncertain applications are not resubmitted into a new monthly storage partition',async()=>{
 const e=await page(async url=>url.includes('capabilities')?capability():Response.json({error:'Synthetic failure'},{status:503}));
 try{e.fill();e.submit();await tick();e.nextMonth();e.submit();await tick();assert.equal(e.posts().length,1);assert.match(e.$('applicationError').textContent,/confirm reference WZ-B-/);assert.equal(e.form.elements.businessName.disabled,true);}finally{e.close();}
});

test('a stalled availability check times out and can be explicitly checked again',async()=>{
 let calls=0;const e=await page(async()=>++calls===1?new Promise(()=>{}):capability());
 try{assert.equal(e.$('submitApplication').disabled,true);e.expire(12000);await tick();assert.equal(e.$('retryApplication').hidden,false);e.$('retryApplication').click();await tick();assert.equal(e.$('submitApplication').disabled,false);assert.equal(e.posts().length,0);}finally{e.close();}
});
