import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';

test('persisted office alerts survive runtime restarts and actual alarm retries without duplicate saves or accepted sends', {timeout:60000}, async()=>{
 const bundled=await build({stdin:{resolveDir:process.cwd(),contents:`
  import {ProjectInbox} from './server/project-store.mjs';
  export class TestInbox extends ProjectInbox {
    async deliveryAlarm(){return this.ctx.storage.getAlarm();}
    async armDue(){
      this.ctx.storage.sql.exec("UPDATE email_outbox SET next_attempt=0 WHERE state='pending'");
      await this.ctx.storage.setAlarm(Date.now()+50);
    }
  }
  export default {fetch(){return new Response('Local restart drill');}};
 `},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 const directory=await mkdtemp(join(tmpdir(),'wazoozie-alert-restart-'));
 const received=[];
 let mf;
 const boot=status=>new Miniflare(convertV4MiniflareOptions({
  name:'office-alert-restart-drill',resourcePersistencePath:directory,
  unsafeInspectDurableObjects:true,modules:true,script:bundled.outputFiles[0].text,
  compatibilityDate:'2026-11-04',
  bindings:{MIDDLETOWN_ZAPIER_WEBHOOK:'https://hooks.zapier.com/hooks/catch/123/test/'},
  durableObjects:{PROJECT_INBOX:{className:'TestInbox',useSQLite:true}},
  // Every outbound request is intercepted; this test cannot notify a real inbox.
  outboundService:async request=>{assert.equal(new URL(request.url).hostname,'hooks.zapier.com');received.push(await request.json());return new Response('{}',{status});}
 }));
 const contexts=async()=>{
  const ns=await mf.getDurableObjectNamespace('PROJECT_INBOX');
  return Promise.all(['brief','application'].map(async kind=>({
    kind,store:ns.get(ns.idFromName(kind)),sql:await mf.unsafeGetDurableObjectStorage('office-alert-restart-drill','TestInbox',{name:kind})
  })));
 };
 const row=async context=>(await context.sql.exec('SELECT id,state,attempts,next_attempt,last_result FROM email_outbox'))[0];
 const waitFor=async(context,state,attempts)=>{
  for(let i=0;i<200;i++){
   const value=await row(context);
   if(value?.state===state&&value.attempts===attempts)return value;
   await delay(25);
  }
  assert.fail(`${context.kind}: scheduled alarm did not reach ${state} after ${attempts} attempts`);
 };
 const now=Date.now()+60000;
 const common={phone:'202-555-0100',email:'test@example.invalid',town:'Media',state:'PA',consentVersion:'test'};
 const data={
  brief:{...common,id:crypto.randomUUID(),name:'Synthetic test',provider:'middletown',intent:'comfort',zip:'19063',details:'Synthetic local restart drill only',timing:'Planning ahead',role:'Homeowner',property:'House',equipment:'',source:'start-page',notifyProvider:true},
  application:{...common,id:crypto.randomUUID(),businessName:'Synthetic business',contactName:'Synthetic test',website:'',coverage:'Media',registration:'',insurance:'yes',services:['carpentry'],interest:'sponsored',notes:''}
 };
 const save=async context=>context.kind==='brief'
  ?context.store.saveBrief(data.brief,'same','client',now)
  :context.store.saveApplication(data.application,'same','client',now);
 try{
  mf=boot(503);
  for(const context of await contexts()){
   assert.equal((await save(context)).status,201);
   assert.equal((await row(context)).attempts,0);
   assert.equal(await context.store.deliveryAlarm(),now+1000);
  }
  assert.equal(received.length,0);
  await mf.dispose();mf=undefined;

  // A fresh runtime must reopen both saved data and the pending delivery alarm.
  mf=boot(503);
  const backoff=new Map();
  for(const context of await contexts()){
   assert.equal((await row(context)).id,data[context.kind].id);
   assert.equal(await context.store.deliveryAlarm(),now+1000);
   await context.store.armDue();
   const pending=await waitFor(context,'pending',1);
   assert.equal(pending.last_result,'provider_error');
   assert.ok(pending.next_attempt>Date.now());backoff.set(context.kind,pending.next_attempt);
  }
  assert.equal(received.length,2);
  await mf.dispose();mf=undefined;

  // Backoff survives another restart; automatic alarms, rather than a homeowner
  // resubmission or direct sendEmail call, perform the successful retry.
  mf=boot(200);
  for(const context of await contexts()){
   const pending=await row(context);
   assert.equal(pending.attempts,1);assert.equal(pending.next_attempt,backoff.get(context.kind));
   assert.ok(await context.store.deliveryAlarm());
   await context.store.armDue();await waitFor(context,'automation_accepted',2);
  }
  assert.equal(received.length,4);
  for(const kind of ['brief','application']){
   const attempts=received.filter(payload=>payload.reference===data[kind].id);
   assert.equal(attempts.length,2);assert.deepEqual(attempts[0],attempts[1]);
  }
  await mf.dispose();mf=undefined;

  // Accepted alerts stay accepted across restart and identical homeowner retry.
  mf=boot(200);
  for(const context of await contexts()){
   assert.equal((await row(context)).state,'automation_accepted');
   assert.equal((await save(context)).status,200);
   assert.equal(await context.store.deliverBrief(data[context.kind].id),'automation_accepted');
   const table=context.kind==='brief'?'project_briefs':'contractor_applications';
   assert.equal((await context.sql.exec('SELECT count(*) AS n FROM '+table))[0].n,1);
   assert.equal((await context.sql.exec('SELECT count(*) AS n FROM email_outbox'))[0].n,1);
   assert.equal((await context.sql.exec('SELECT count FROM submission_limits'))[0].count,1);
   assert.equal((await context.sql.exec('SELECT count FROM contact_counts'))[0].count,1);
   assert.equal((await row(context)).attempts,2);
  }
  assert.equal(received.length,4,'accepted alerts must not be sent again');
 }finally{
  try{if(mf)await mf.dispose();}
  finally{await rm(directory,{recursive:true,force:true});}
 }
});
