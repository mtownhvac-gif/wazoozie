import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {deliveryReady,makeDelivery,handleDeliveryWebhook} from '../server/delivery.mjs';
const config={INQUIRY_DELIVERY_ENABLED:'1',MIDDLETOWN_DELIVERY_CONFIRMED:'1',RESEND_API_KEY:'synthetic',RESEND_WEBHOOK_SECRET:'synthetic',WAZOOZIE_FROM:'inquiries@example.invalid',WAZOOZIE_OPERATOR_EMAIL:'office@example.invalid',MIDDLETOWN_INQUIRY_EMAIL:'service@mtownhvac.com'};
test('delivery fails closed and recipients never come from visitor input',()=>{
 assert.equal(deliveryReady({}),false);assert.equal(deliveryReady(config),true);
 assert.equal(deliveryReady({...config,MIDDLETOWN_DELIVERY_CONFIRMED:'0'}),false);
 const b={id:crypto.randomUUID(),provider:'middletown',email:'visitor@example.invalid',details:'Synthetic',recipient:'attacker@example.invalid'};
 const d=makeDelivery(b,config,'middletown:2026-11');assert.deepEqual(d.map(v=>v.payload.to[0]),['service@mtownhvac.com','office@example.invalid']);
 assert.equal(makeDelivery(b,{...config,WAZOOZIE_OPERATOR_EMAIL:'service@mtownhvac.com'},'middletown:2026-11').length,1);
 assert.throws(()=>makeDelivery({...b,provider:'other'},config,'other'));
});
test('private outbox is atomic with save, deduplicates retries and stops ambiguous old sends',async()=>{
 const source=await readFile(new URL('../server/project-store.mjs',import.meta.url),'utf8');
 const script=`let calls=0;const fetch=async()=>{calls++;return Response.json({id:'synthetic-email'});};\n${source}\nexport class TestInbox extends ProjectInbox {async dispatchTest(){await Promise.all([this.dispatchDelivery(),this.dispatchDelivery()]);return calls;} }\nexport default {fetch(){return new Response('test');}};`;
 const mf=new Miniflare(convertV4MiniflareOptions({cf:false,unsafeInspectDurableObjects:true,modules:true,script,compatibilityDate:'2026-11-04',bindings:config,durableObjects:{PROJECT_INBOX:{className:'TestInbox',useSQLite:true}}}));
 try{
  const ns=await mf.getDurableObjectNamespace('PROJECT_INBOX'),store=ns.get(ns.idFromName('delivery-test'));
  const sql=await mf.unsafeGetDurableObjectStorage(undefined,'TestInbox',{name:'delivery-test'});
  const b={id:crypto.randomUUID(),provider:'middletown',intent:'comfort',name:'Synthetic',phone:'2025550100',email:'',town:'',zip:'19063',state:'',details:'Synthetic local test',timing:'Planning ahead',role:'',property:'',equipment:'',source:'hvac-page',consentVersion:'save',sendConsentVersion:'send'};
  const d=makeDelivery(b,config,'middletown:2026-11');
  assert.equal((await store.saveBrief(b,'fingerprint','client',Date.now(),d)).deliveryState,'queued');
  assert.equal((await store.saveBrief(b,'fingerprint','client',Date.now(),d)).status,200);
  assert.equal((await sql.exec('SELECT count(*) AS n FROM delivery_outbox'))[0].n,2);
  assert.equal(await store.dispatchTest(),2);assert.equal(await store.dispatchTest(),2);
  assert.equal((await sql.exec("SELECT count(*) AS n FROM delivery_outbox WHERE state='accepted'"))[0].n,2);
  await store.deliveryEvent('event-1','synthetic-email','failed',Date.now());await store.deliveryEvent('event-2','synthetic-email','delivered',Date.now());
  assert.equal((await sql.exec("SELECT count(*) AS n FROM delivery_outbox WHERE state='failed'"))[0].n,2);
  await sql.exec("UPDATE delivery_outbox SET state='queued',first_attempt=?,attempts=1,next_at=0",Date.now()-24*3600000);
  assert.equal(await store.dispatchTest(),2);assert.equal((await sql.exec("SELECT count(*) AS n FROM delivery_outbox WHERE state='failed'"))[0].n,2);
  const old={...b,id:crypto.randomUUID()};await store.saveBrief(old,'old','other',Date.now());
  assert.equal((await sql.exec('SELECT count(*) AS n FROM delivery_outbox WHERE brief_id=?',old.id))[0].n,0);
 }finally{await mf.dispose();}
});
test('webhook rejects forged and stale requests before touching private storage',async()=>{
 const request=new Request('https://wazoozie.com/api/delivery-webhook',{method:'POST',body:'{}'});
 let called=false;const r=await handleDeliveryWebhook(request,{...config,PROJECT_INBOX:{getByName(){called=true;}}});assert.equal(r.status,400);assert.equal(called,false);
});
test('authentic webhook routes only the signed provider inbox and rejects replays outside tolerance',async()=>{
 const secretBytes=new TextEncoder().encode('synthetic-webhook-test-key-32-bytes');
 const secret='whsec_'+btoa(String.fromCharCode(...secretBytes));
 const raw=JSON.stringify({type:'email.delivered',data:{email_id:'email-test',tags:{inbox:'middletown-2026-11'}}});
 const stamp=String(Math.floor(Date.now()/1000)),id='event-synthetic';
 const key=await crypto.subtle.importKey('raw',secretBytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${id}.${stamp}.${raw}`)))));
 let routed;const env={RESEND_WEBHOOK_SECRET:secret,PROJECT_INBOX:{getByName(name){routed=name;return {async deliveryEvent(...args){assert.equal(args[0],id);assert.equal(args[1],'email-test');assert.equal(args[2],'delivered');}};}}};
 const req=(timestamp)=>new Request('https://wazoozie.com/api/delivery-webhook',{method:'POST',headers:{'svix-id':id,'svix-timestamp':timestamp,'svix-signature':'v1,'+signature},body:raw});
 assert.equal((await handleDeliveryWebhook(req(stamp),env)).status,200);assert.equal(routed,'middletown:2026-11');
 assert.equal((await handleDeliveryWebhook(req(String(Number(stamp)-1000)),env)).status,400);
});

// Exercise failure transitions in the real private SQLite object; the provider is local and synthetic.
async function scenario(run){
 const source=await readFile(new URL('../server/project-store.mjs',import.meta.url),'utf8');
 const script=`let mode='timeout',calls=[];const fetch=async(url,options)=>{calls.push({key:options.headers['Idempotency-Key'],body:options.body});if(mode==='timeout')throw Error('synthetic timeout');if(mode==='quota')return Response.json({name:'daily_quota_exceeded'},{status:429});if(mode==='auth')return Response.json({name:'invalid_api_key'},{status:401});if(mode==='concurrent')return Response.json({name:'concurrent_idempotent_requests'},{status:409});if(mode==='conflict')return Response.json({name:'invalid_idempotent_request'},{status:409});return Response.json({id:'email-synthetic-'+calls.length});};\n${source}\nexport class TestInbox extends ProjectInbox {async mode(value){mode=value;} async calls(){return calls;} async run(){await this.dispatchDelivery();} async expiry(){await this.alarm();} async alarmAt(){return this.ctx.storage.getAlarm();}}\nexport default {fetch(){return new Response('test');}};`;
 const mf=new Miniflare(convertV4MiniflareOptions({cf:false,unsafeInspectDurableObjects:true,modules:true,script,compatibilityDate:'2026-11-04',bindings:config,durableObjects:{PROJECT_INBOX:{className:'TestInbox',useSQLite:true}}}));
 try{const ns=await mf.getDurableObjectNamespace('PROJECT_INBOX'),store=ns.get(ns.idFromName('scenario'));const sql=await mf.unsafeGetDurableObjectStorage(undefined,'TestInbox',{name:'scenario'});await run(store,sql);}finally{await mf.dispose();}
}
const synthetic=()=>({id:crypto.randomUUID(),provider:'middletown',intent:'comfort',name:'Synthetic',phone:'2025550100',email:'',town:'',zip:'19063',state:'',details:'Synthetic local test only',timing:'Planning ahead',role:'',property:'',equipment:'',source:'hvac-page',consentVersion:'save',sendConsentVersion:'send'});
test('timeouts, quotas and concurrent provider requests retry the identical payload and key',()=>scenario(async(store,sql)=>{
 const brief=synthetic(),jobs=makeDelivery(brief,{...config,WAZOOZIE_OPERATOR_EMAIL:'service@mtownhvac.com'},'middletown:2026-11');
 await store.saveBrief(brief,'fingerprint','client',Date.now(),jobs);
 assert.ok(await store.alarmAt(),'recovery wake-up exists with pending records');
 for(const mode of ['timeout','quota','concurrent']){
  await store.mode(mode);await sql.exec('UPDATE delivery_outbox SET next_at=0');await store.run();
  const row=(await sql.exec('SELECT * FROM delivery_outbox'))[0];assert.equal(row.state,'queued');assert.ok(row.next_at>Date.now());
 }
 await store.mode('ok');await sql.exec('UPDATE delivery_outbox SET next_at=0');await store.run();
 assert.equal((await sql.exec('SELECT state FROM delivery_outbox'))[0].state,'accepted');
 const calls=await store.calls();assert.equal(calls.length,4);assert.equal(new Set(calls.map(c=>c.key)).size,1);assert.equal(new Set(calls.map(c=>c.body)).size,1);
 assert.equal((await sql.exec('SELECT count(*) AS n FROM project_briefs'))[0].n,1);
}));
test('permanent authorization and payload conflicts stop without erasing the saved request',()=>scenario(async(store,sql)=>{
 for(const mode of ['auth','conflict']){
  const b=synthetic();await store.saveBrief(b,b.id,b.id,Date.now(),makeDelivery(b,{...config,WAZOOZIE_OPERATOR_EMAIL:'service@mtownhvac.com'},'middletown:2026-11'));
  await store.mode(mode);await store.run();assert.equal((await sql.exec('SELECT state FROM delivery_outbox WHERE brief_id=?',b.id))[0].state,'failed');
 }
 assert.equal((await sql.exec('SELECT count(*) AS n FROM project_briefs'))[0].n,2);
}));
test('early callbacks are reconciled and duplicate callbacks cannot resurrect a failed message',()=>scenario(async(store,sql)=>{
 const b=synthetic();await store.saveBrief(b,b.id,b.id,Date.now(),makeDelivery(b,{...config,WAZOOZIE_OPERATOR_EMAIL:'service@mtownhvac.com'},'middletown:2026-11'));
 await store.deliveryEvent('event-early','email-synthetic-1','failed',Date.now());
 await store.mode('ok');await store.run();assert.equal((await sql.exec('SELECT state FROM delivery_outbox'))[0].state,'failed');
 await store.deliveryEvent('event-early','email-synthetic-1','delivered',Date.now());
 assert.equal((await sql.exec('SELECT count(*) AS n FROM delivery_events'))[0].n,1);
 assert.equal((await sql.exec('SELECT state FROM delivery_outbox'))[0].state,'failed');
}));
test('retention deletes expired pending delivery before dispatch and never backfills old briefs',()=>scenario(async(store,sql)=>{
 const b=synthetic();await store.saveBrief(b,b.id,b.id,Date.now(),makeDelivery(b,{...config,WAZOOZIE_OPERATOR_EMAIL:'service@mtownhvac.com'},'middletown:2026-11'));
 await sql.exec('UPDATE delivery_outbox SET created_at=?',Date.now()-91*86400000);await store.mode('ok');await store.expiry();
 assert.equal((await store.calls()).length,0);assert.equal((await sql.exec('SELECT count(*) AS n FROM delivery_outbox'))[0].n,0);
}));
test('public HVAC send route requires current send consent and returns no contact details',async()=>{
 const {handleIntake}=await import('../server/intake.mjs');
 const {HVAC_CONSENT_VERSION}=await import('../hvac-config.mjs');
 let calls=0;
 const env={...config,PROJECT_INBOX:{getByName(){return {async saveBrief(brief,fingerprint,client,now,jobs){calls++;assert.equal(brief.sendConsentVersion,'hvac-send-2026-11-v1');assert.ok(jobs.length);return {status:201,deliveryState:'queued'};}};}}};
 const value={id:crypto.randomUUID(),intent:'comfort',startedAt:Date.now()-5000,name:'Synthetic QA',contact:'qa@example.invalid',zip:'19063',details:'Synthetic inquiry to test explicit delivery only.',timing:'Planning ahead',consent:true,consentVersion:HVAC_CONSENT_VERSION,sendInquiry:true};
 const request=input=>new Request('https://wazoozie.com/api/hvac-requests',{method:'POST',headers:{origin:'https://wazoozie.com','content-type':'application/json'},body:JSON.stringify(input)});
 assert.equal((await handleIntake(request(value),env)).status,400);assert.equal(calls,0);
 assert.equal((await handleIntake(request({...value,sendConsentVersion:'hvac-send-2026-11-v1',consent:false}),env)).status,400);assert.equal(calls,0);
 const receipt=await (await handleIntake(request({...value,sendConsentVersion:'hvac-send-2026-11-v1'}),env)).json();
 assert.equal(receipt.providerDelivery,'queued');assert.equal(calls,1);
 assert.equal(JSON.stringify(receipt).includes('qa@example.invalid'),false);assert.equal(JSON.stringify(receipt).includes(value.details),false);
 const off={...env,INQUIRY_DELIVERY_ENABLED:'0'};
 assert.equal((await handleIntake(request({...value,sendConsentVersion:'hvac-send-2026-11-v1'}),off)).status,400);assert.equal(calls,1);
});
