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
