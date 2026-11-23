import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {CONSENT_VERSION} from '../project-config.mjs';
import {validateBrief} from '../server/brief-validation.mjs';
import {validWebhook,emailPayload} from '../server/provider-email.mjs';
const valid=()=>({id:crypto.randomUUID(),startedAt:Date.now()-5000,provider:'middletown',intent:'comfort',name:'Synthetic <Homeowner>',phone:'202-555-0100',email:'synthetic@example.invalid',town:'Media',zip:'19063',state:'PA',details:'Synthetic <script>alert(1)</script> request only.',timing:'Planning ahead',role:'Homeowner',property:'House',equipment:'',source:'start-page',consent:true,consentVersion:CONSENT_VERSION,notifyProvider:true});
test('email requires a separate boolean choice for Middletown; secrets and HTML stay bounded',()=>{
 assert.ok(validateBrief({...valid(),notifyProvider:'true'}).error);
 assert.ok(validateBrief({...valid(),provider:'cooke',intent:'carpentry'}).brief);
 assert.equal(validateBrief({...valid(),notifyProvider:false}).brief.notifyProvider,false);
 assert.ok(validWebhook('https://hooks.zapier.com/hooks/catch/123/test/'));
 for(const u of ['https://evil.invalid/hooks/catch/123/test/','http://hooks.zapier.com/hooks/catch/123/test/','https://hooks.zapier.com/hooks/catch/123/test/?x=1'])assert.equal(validWebhook(u),false);
 const payload=emailPayload(valid());assert.ok(!payload.message.includes('<script>'));assert.match(payload.message,/&lt;script&gt;/);assert.equal(payload.reference.length,36);
});
test('delivery capability is advertised only for a complete Zapier hook',async()=>{
 const {handleIntake}=await import('../server/intake.mjs');
 for(const [hook,enabled] of [[undefined,false],['not-a-url',false],['https://hooks.zapier.com/hooks/catch/123/test/',true]]){
  const response=await handleIntake(new Request('https://wazoozie.com/api/project-capabilities'),{PROJECT_INBOX:{},MIDDLETOWN_ZAPIER_WEBHOOK:hook});
  const capability=await response.json();assert.equal(capability.capabilityVersion,2);assert.deepEqual(capability.emailProviders,enabled?['middletown','rolledright','ryan','liberator','cooke']:[]);
 }
});

test('the office message alone retains the callback details, reference and selected business without changing the envelope',()=>{
 for(const [provider,intent,business] of [['middletown','comfort','Middletown HVAC'],['ryan','electrical','Ryan Dugan Electric LLC']]){
  const brief={...valid(),provider,intent};const payload=emailPayload(brief,Date.UTC(2026,10,23,12));
  const lines=payload.message.split('<br>');
  assert.ok(lines.includes('Selected business: '+business));
  assert.ok(lines.includes('Reference: WZ-'+brief.id.slice(0,8).toUpperCase()));
  assert.ok(lines.includes('Name: Synthetic &lt;Homeowner&gt;'));
  assert.ok(lines.includes('Phone: 202-555-0100'));
  assert.ok(lines.includes('Email: synthetic@example.invalid'));
  assert.equal(payload.reference,brief.id);assert.equal(payload.name,'Synthetic &lt;Homeowner&gt;');
  assert.equal(payload.phone,brief.phone);assert.equal(payload.email,brief.email);
  assert.equal(payload.source,'Wazoozie project request');assert.equal(payload.page,'https://wazoozie.com/start/');
  assert.match(payload.message,/No appointment has been booked/);
  assert.match(payload.message,/Email automation acceptance is not inbox delivery/);
  assert.doesNotMatch(payload.message,/<script>|Synthetic <Homeowner>/);
 }
 const withoutEmail=emailPayload({...valid(),email:''});
 assert.ok(withoutEmail.message.split('<br>').includes('Email: Not supplied'));
 assert.equal(withoutEmail.email,'','an omitted homeowner email must not become an invented reply address');
 const escaped=emailPayload({...valid(),name:'Synthetic & "Test"',email:'test+<tag>@example.invalid'});
 assert.ok(escaped.message.includes('Name: Synthetic &amp; &quot;Test&quot;'));
 assert.ok(escaped.message.includes('Email: test+&lt;tag&gt;@example.invalid'));
 assert.doesNotMatch(escaped.message,/&amp;lt;|<tag>/);
});
test('durable email outbox saves before sending, retries failures and does not resend accepted duplicates',async()=>{
 const bundled=await build({stdin:{contents:"import {ProjectInbox} from './server/project-store.mjs';import {handleIntake} from './server/intake.mjs';export class TestInbox extends ProjectInbox {async runDeliveryAlarm(){return this.alarm();}};export default {fetch:handleIntake};",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 let calls=0,fail=true,received,failureStatus=503;
 const mf=new Miniflare(convertV4MiniflareOptions({unsafeInspectDurableObjects:true,modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-11-04',bindings:{MIDDLETOWN_ZAPIER_WEBHOOK:'https://hooks.zapier.com/hooks/catch/123/test/'},durableObjects:{PROJECT_INBOX:{className:'TestInbox',useSQLite:true}},outboundService:async request=>{calls++;received=await request.json();return new Response('{}',{status:fail?failureStatus:200,headers:fail?{'Retry-After':'3600'}:{}});}}));
 try {
  const input=valid();const call=()=>mf.dispatchFetch('https://wazoozie.com/api/project-briefs',{method:'POST',headers:{Origin:'https://wazoozie.com','Content-Type':'application/json'},body:JSON.stringify(input)});
  let response=await call();assert.equal(response.status,201);assert.equal((await response.json()).providerDelivery,'pending');assert.equal(calls,1);
  response=await call();assert.equal(response.status,200);assert.equal((await response.json()).providerDelivery,'pending');assert.equal(calls,1,'duplicate must honor backoff');
  const name='middletown:'+new Date().toISOString().slice(0,7);const sql=await mf.unsafeGetDurableObjectStorage(undefined,'TestInbox',{name});
  assert.equal((await sql.exec('SELECT count(*) AS n FROM project_briefs'))[0].n,1);
  let outbox=(await sql.exec('SELECT state,attempts,last_result,last_http_status FROM email_outbox'))[0];
  assert.deepEqual(outbox,{state:'pending',attempts:1,last_result:'provider_error',last_http_status:503});
  const retry=(await sql.exec('SELECT next_attempt,last_attempt FROM email_outbox'))[0];
  assert.equal(retry.next_attempt-retry.last_attempt,3600000,'persist the requested wait in SQLite');
  const ns=await mf.getDurableObjectNamespace('PROJECT_INBOX');const store=ns.get(ns.idFromName(name));
  await store.runDeliveryAlarm();assert.equal(calls,1,'an early alarm must not send during the requested wait');
  await sql.exec('UPDATE email_outbox SET next_attempt=0');fail=false;
  await store.runDeliveryAlarm();
  outbox=(await sql.exec('SELECT state,attempts,last_result,last_http_status FROM email_outbox'))[0];
  assert.deepEqual(outbox,{state:'automation_accepted',attempts:2,last_result:'accepted',last_http_status:200});
  response=await call();assert.equal((await response.json()).providerDelivery,'automation_accepted');assert.equal(calls,2);assert.match(received.message,/&lt;script&gt;/);
  response=await call();assert.equal((await response.json()).providerDelivery,'automation_accepted');assert.equal(calls,2);
  input.id=crypto.randomUUID();input.notifyProvider=false;response=await call();assert.equal((await response.json()).providerDelivery,'not_sent');assert.equal(calls,2,'save-only never emails');
  input.id=crypto.randomUUID();input.notifyProvider=true;fail=true;failureStatus=429;
  response=await call();assert.equal((await response.json()).providerDelivery,'pending');assert.equal(calls,3);
  const limited=(await sql.exec('SELECT state,attempts,next_attempt,last_attempt,last_result FROM email_outbox WHERE id=?',input.id))[0];
  assert.equal(limited.state,'pending');assert.equal(limited.attempts,1);assert.equal(limited.last_result,'rate_limited');
  assert.equal(limited.next_attempt-limited.last_attempt,3600000);
  response=await call();assert.equal((await response.json()).providerDelivery,'pending');assert.equal(calls,3,'throttled duplicate must keep the persisted wait');
 } finally {await mf.dispose();}
});
