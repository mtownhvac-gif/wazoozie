import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {validateNeighbor} from '../server/neighbor-validation.mjs';
import {handleIntake} from '../server/intake.mjs';
import {validateBrief} from '../server/brief-validation.mjs';
import {NEIGHBOR_CONSENT_VERSION,neighborLink} from '../neighbor-config.mjs';
import {CONSENT_VERSION} from '../project-config.mjs';
const code='a'.repeat(32);
const valid=()=>({id:crypto.randomUUID(),startedAt:Date.now()-5000,name:'Synthetic Neighbor',email:'referrer@example.invalid',phone:'',consent:true,consentVersion:NEIGHBOR_CONSENT_VERSION});
const brief=()=>({id:crypto.randomUUID(),startedAt:Date.now()-5000,provider:'hart',intent:'doors',name:'Synthetic Homeowner',phone:'202-555-0100',town:'Media',zip:'19063',state:'PA',details:'Synthetic test only: replace the front door.',timing:'Planning ahead',role:'Homeowner',property:'House',consent:true,consentVersion:CONSENT_VERSION,neighborCode:code});
const req=(body,path='/api/neighbor-referrals')=>new Request('https://wazoozie.com'+path,{method:'POST',headers:{origin:'https://wazoozie.com','content-type':'application/json'},body:JSON.stringify(body)});

test('neighbor links contain only an opaque code on the canonical site',()=>{
 assert.equal(neighborLink(code),'https://wazoozie.com/start/?neighbor='+code);
 for(const bad of ['https://other.test','referrer@example.invalid','<script>', 'a'.repeat(33),null])assert.equal(neighborLink(bad),'');
});
test('referrers require bounded contact information, consent and bot checks',()=>{
 assert.ok(validateNeighbor(valid()).referral);
 assert.ok(validateNeighbor({...valid(),email:'',phone:'202-555-0100'}).referral);
 for(const patch of [{email:'',phone:''},{name:'x'},{phone:'bad'},{email:'bad'},{consent:false},{consentVersion:'old'},{fax:'spam'},{id:'bad'},{startedAt:Date.now()+1000},{name:'x'.repeat(101)}])assert.ok(validateNeighbor({...valid(),...patch}).error,JSON.stringify(patch));
});
test('referral issue receipts expose no contact information and have no public read API',async()=>{
 assert.equal((await handleIntake(new Request('https://wazoozie.com/api/neighbor-referrals'),{})).status,405);
 let stored;
 const env={PROJECT_INBOX:{getByName(name){assert.equal(name,'neighbors:v1');return {async saveNeighbor(data){stored=data;return {status:201,code};}};}}};
 const r=await handleIntake(req(valid()),env);assert.equal(r.status,201);
 const data=await r.json();assert.deepEqual(Object.keys(data).sort(),['code','expiresInDays','status']);
 assert.equal(data.code,code);assert.equal(stored.name,'Synthetic Neighbor');
 assert.equal(r.headers.get('cache-control'),'no-store');
});
test('neighbor issuance rejects cross-origin requests and handles retries and outages honestly',async()=>{
 const foreign=req(valid());foreign.headers.set('origin','https://other.test');
 assert.equal((await handleIntake(foreign,{PROJECT_INBOX:{}})).status,403);
 assert.equal((await handleIntake(req(valid()),{})).status,503);
 for(const status of [200,409,429]){
  const env={PROJECT_INBOX:{getByName(){return {saveNeighbor:async()=>({status,code})};}}};
  assert.equal((await handleIntake(req(valid()),env)).status,status);
 }
 const env={PROJECT_INBOX:{getByName(){throw Error('outage');}}};
 assert.equal((await handleIntake(req(valid()),env)).status,503);
});
test('saved projects accept only valid referral codes and bind attribution to the chosen business',async()=>{
 assert.ok(validateBrief({...brief(),neighborCode:'https://bad.test'}).error);
 for(const known of [true,false]){
  let saved;
  const env={PROJECT_INBOX:{getByName(name){return name==='neighbors:v1'?{hasNeighbor:async value=>{assert.equal(value,code);return known;}}:{saveBrief:async value=>{saved=value;return {status:201};}};}}};
  const r=await handleIntake(req(brief(),'/api/project-briefs'),env);
  assert.equal(r.status,201);const result=await r.json();
  assert.equal(result.referralAttributed,known);assert.equal(saved.neighborCode,known?code:undefined);
  assert.equal(result.provider,'Hart Builders, Inc.');assert.equal(result.providerDelivery,'not_sent');
  assert.ok(!JSON.stringify(result).includes(code));
 }
});

async function domPage(name,query=''){
 const dom=new JSDOM(await readFile(new URL(`../dist/${name}/index.html`,import.meta.url),'utf8'),{url:`https://wazoozie.com/${name}/${query}`});
 const before=new Map();
 for(const key of ['document','location','history','navigator','FormData']){before.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]});}
 const fetchBefore=globalThis.fetch;
 return {dom,doc:dom.window.document,close(){for(const [key,descriptor]of before){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}globalThis.fetch=fetchBefore;dom.window.close();}};
}
test('neighbor form creates a copyable code without placing contact details in the share link',async()=>{
 const env=await domPage('neighbors');
 try{
  let payload;globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/neighbor-referrals');payload=JSON.parse(options.body);return Response.json({status:'created',code});};
  await import(`../dist/assets/neighbors.js?dom=${Date.now()}`);
  const form=env.doc.querySelector('#neighborForm');form.elements.name.value='Synthetic Neighbor';form.elements.email.value='referrer@example.invalid';form.elements.consent.checked=true;
  form.dispatchEvent(new env.dom.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setImmediate(resolve));
  assert.equal(env.doc.querySelector('#neighborReceipt').hidden,false);assert.equal(form.hidden,true);
  assert.equal(env.doc.querySelector('#neighborLink').value,neighborLink(code));assert.equal(payload.consentVersion,NEIGHBOR_CONSENT_VERSION);
  assert.ok(!env.doc.querySelector('#neighborReceipt').textContent.includes('referrer@example.invalid'));
  let copied;Object.defineProperty(env.dom.window.navigator,'clipboard',{value:{writeText:async value=>{copied=value;}},configurable:true});
  env.doc.querySelector('#copyNeighbor').click();await new Promise(resolve=>setImmediate(resolve));assert.equal(copied,neighborLink(code));
  env.doc.querySelector('#copyNeighborNote').click();await new Promise(resolve=>setImmediate(resolve));
  assert.match(copied,/I may earn a \$25 service credit/);assert.match(copied,/completed and paid/);assert.match(copied,/before booking/);assert.match(copied,/reward-terms/);
  assert.match(env.doc.querySelector('#neighborStatus').textContent,/Nothing has been sent/);
  Object.defineProperty(env.dom.window.navigator,'clipboard',{value:{writeText:async()=>{throw Error('blocked');}},configurable:true});
  env.doc.querySelector('#copyNeighborNote').click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(env.doc.querySelector('#neighborNoteLabel').hidden,false);assert.match(env.doc.querySelector('#neighborNote').value,/I may earn a \$25/);
 }finally{env.close();}
});

test('Middletown reward terms distinguish verified paid referrals from attribution and other providers',async()=>{
 const dom=new JSDOM(await readFile(new URL('../dist/neighbors/index.html',import.meta.url),'utf8'));
 try{
  const terms=dom.window.document.querySelector('#reward-terms').textContent;
  for(const phrase of ['18 or older','different household','before booking','90 days','paid in full','office','One $25 referral credit per invoice','Earned credits do not expire','does not receive a discount','No other listed business'])assert.ok(terms.includes(phrase),phrase);
  assert.match(dom.window.document.querySelector('#neighborReceipt').textContent,/not earned yet/);
  assert.doesNotMatch(dom.window.document.querySelector('#neighborReceipt').textContent,/no reward or discount promised/);
  const home=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(home,/referral-promo-title/);assert.match(home,/Refer a friend\. Earn \$25/);
 }finally{dom.window.close();}
});

test('simple referral shares without a form, account, stored identity or network request',async()=>{
 const env=await domPage('neighbors');
 try{
  globalThis.fetch=()=>assert.fail('Sharing a text must not submit any data');
  let copied='';Object.defineProperty(env.dom.window.navigator,'clipboard',{value:{writeText:async value=>{copied=value;}},configurable:true});
  await import(`../dist/assets/neighbors.js?simple=${Date.now()}`);
  env.doc.querySelector('#copySimpleReferral').click();await new Promise(resolve=>setImmediate(resolve));
  assert.match(copied,/Tell their office I sent you before booking/);assert.match(copied,/I may earn a \$25 service credit/);assert.match(copied,/businesses\/middletown-hvac/);
  assert.match(env.doc.querySelector('#simpleReferralStatus').textContent,/Nothing has been sent/);
  assert.equal(env.doc.querySelector('#neighborForm').closest('details').open,false);
  assert.equal(env.dom.window.localStorage.length,0);
  Object.defineProperty(env.dom.window.navigator,'clipboard',{value:{writeText:async()=>{throw Error('blocked');}},configurable:true});
  env.doc.querySelector('#copySimpleReferral').click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(env.doc.querySelector('#simpleReferralFallback').hidden,false);assert.equal(env.doc.querySelector('#simpleReferralText').value,copied);
 }finally{env.close();}
});
test('project planner offers removable neighbor credit and keeps door requests with Hart',async()=>{
 const env=await domPage('start','?intent=doors&neighbor='+code);
 try{
  const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,options});return Response.json({captureReady:true,status:'saved',referralAttributed:true});};
  await import(`../dist/assets/project.js?neighbor=${Date.now()}`);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(env.doc.querySelector('#neighborCredit').hidden,false);
  assert.ok(env.doc.querySelector('#projectBusiness').textContent.includes('Hart Builders'));
  const form=env.doc.querySelector('#projectForm');
  for(const [key,value]of Object.entries({name:'Synthetic Homeowner',phone:'202-555-0100',town:'Media',zip:'19063',details:'Synthetic test only, replace the front door.'}))form.elements[key].value=value;
  form.elements.consent.checked=true;env.doc.querySelector('#keepNeighborCredit').checked=false;
  env.doc.querySelector('#projectNext1').click();env.doc.querySelector('#projectNext2').click();
  form.dispatchEvent(new env.dom.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setImmediate(resolve));
  const data=JSON.parse(requests.find(r=>r.url==='/api/project-briefs').options.body);assert.equal(data.provider,'hart');assert.equal(data.neighborCode,undefined);
 }finally{env.close();}
});

test('keeping a neighbor introduction records the code and explains the conditions for service credit',async()=>{
 const env=await domPage('start','?intent=comfort&neighbor='+code);
 try{
  let sent;globalThis.fetch=async(url,options)=>{if(url.includes('capabilities'))return Response.json({captureReady:true});sent=JSON.parse(options.body);return Response.json({status:'saved',referralAttributed:true});};
  await import(`../dist/assets/project.js?kept=${Date.now()}`);await new Promise(resolve=>setImmediate(resolve));
  const form=env.doc.querySelector('#projectForm');for(const [key,value]of Object.entries({name:'Synthetic Homeowner',phone:'202-555-0100',town:'Media',zip:'19063',details:'Synthetic test: home comfort project.'}))form.elements[key].value=value;
  form.elements.consent.checked=true;env.doc.querySelector('#projectNext1').click();env.doc.querySelector('#projectNext2').click();
  form.dispatchEvent(new env.dom.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setImmediate(resolve));
  assert.equal(sent.neighborCode,code);assert.equal(sent.provider,'middletown');
  assert.match(env.doc.querySelector('#receiptNeighborStatus').textContent,/attached to this request/);
  assert.match(env.doc.querySelector('#receiptNeighborStatus').textContent,/requires office verification of a qualifying paid job/);
  assert.equal(env.doc.querySelector('#neighborCredit').hidden,true);
 }finally{env.close();}
});
