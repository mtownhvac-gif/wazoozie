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
 assert.ok(validateBrief({...valid(),provider:'hart',intent:'doors'}).error);
 assert.equal(validateBrief({...valid(),notifyProvider:false}).brief.notifyProvider,false);
 assert.ok(validWebhook('https://hooks.zapier.com/hooks/catch/123/test/'));
 for(const u of ['https://evil.invalid/hooks/catch/123/test/','http://hooks.zapier.com/hooks/catch/123/test/','https://hooks.zapier.com/hooks/catch/123/test/?x=1'])assert.equal(validWebhook(u),false);
 const payload=emailPayload(valid());assert.ok(!payload.message.includes('<script>'));assert.match(payload.message,/&lt;script&gt;/);assert.equal(payload.reference.length,36);
});
test('delivery capability is advertised only for a complete Zapier hook',async()=>{
 const {handleIntake}=await import('../server/intake.mjs');
 for(const [hook,enabled] of [[undefined,false],['not-a-url',false],['https://hooks.zapier.com/hooks/catch/123/test/',true]]){
  const response=await handleIntake(new Request('https://wazoozie.com/api/project-capabilities'),{PROJECT_INBOX:{},MIDDLETOWN_ZAPIER_WEBHOOK:hook});
  assert.deepEqual((await response.json()).emailProviders,enabled?['middletown']:[]);
 }
});
test('durable email outbox saves before sending, retries failures and does not resend accepted duplicates',async()=>{
 const bundled=await build({stdin:{contents:"import {ProjectInbox} from './server/project-store.mjs';import {handleIntake} from './server/intake.mjs';export class TestInbox extends ProjectInbox {async runDeliveryAlarm(){return this.alarm();}};export default {fetch:handleIntake};",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 let calls=0,fail=true,received;
 const mf=new Miniflare(convertV4MiniflareOptions({unsafeInspectDurableObjects:true,modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-11-04',bindings:{MIDDLETOWN_ZAPIER_WEBHOOK:'https://hooks.zapier.com/hooks/catch/123/test/'},durableObjects:{PROJECT_INBOX:{className:'TestInbox',useSQLite:true}},outboundService:async request=>{calls++;received=await request.json();return new Response('{}',{status:fail?503:200});}}));
 try {
  const input=valid();const call=()=>mf.dispatchFetch('https://wazoozie.com/api/project-briefs',{method:'POST',headers:{Origin:'https://wazoozie.com','Content-Type':'application/json'},body:JSON.stringify(input)});
  let response=await call();assert.equal(response.status,201);assert.equal((await response.json()).providerDelivery,'pending');assert.equal(calls,1);
  response=await call();assert.equal(response.status,200);assert.equal((await response.json()).providerDelivery,'pending');assert.equal(calls,1,'duplicate must honor backoff');
  const name='middletown:'+new Date().toISOString().slice(0,7);const sql=await mf.unsafeGetDurableObjectStorage(undefined,'TestInbox',{name});
  assert.equal((await sql.exec('SELECT count(*) AS n FROM project_briefs'))[0].n,1);
  let outbox=(await sql.exec('SELECT state,attempts,last_result,last_http_status FROM email_outbox'))[0];
  assert.deepEqual(outbox,{state:'pending',attempts:1,last_result:'provider_error',last_http_status:503});
  await sql.exec('UPDATE email_outbox SET next_attempt=0');fail=false;
  const ns=await mf.getDurableObjectNamespace('PROJECT_INBOX');await ns.get(ns.idFromName(name)).runDeliveryAlarm();
  outbox=(await sql.exec('SELECT state,attempts,last_result,last_http_status FROM email_outbox'))[0];
  assert.deepEqual(outbox,{state:'automation_accepted',attempts:2,last_result:'accepted',last_http_status:200});
  response=await call();assert.equal((await response.json()).providerDelivery,'automation_accepted');assert.equal(calls,2);assert.match(received.message,/&lt;script&gt;/);
  response=await call();assert.equal((await response.json()).providerDelivery,'automation_accepted');assert.equal(calls,2);
  input.id=crypto.randomUUID();input.notifyProvider=false;response=await call();assert.equal((await response.json()).providerDelivery,'not_sent');assert.equal(calls,2,'save-only never emails');
 } finally {await mf.dispose();}
});
