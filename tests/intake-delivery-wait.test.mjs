import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {CONSENT_VERSION} from '../project-config.mjs';
import {APPLICATION_CONSENT_VERSION} from '../contractor-config.mjs';
import worker from '../worker.mjs';
const brief=()=>({id:crypto.randomUUID(),startedAt:Date.now()-5000,provider:'middletown',intent:'comfort',name:'Synthetic test',phone:'202-555-0100',email:'test@example.invalid',town:'Media',zip:'19063',state:'PA',details:'Synthetic local slow-alert test only.',timing:'Planning ahead',role:'Homeowner',property:'House',equipment:'',source:'start-page',consent:true,consentVersion:CONSENT_VERSION,notifyProvider:true});
const request=(data,path='/api/project-briefs')=>new Request('https://wazoozie.com'+path,{method:'POST',headers:{Origin:'https://wazoozie.com','Content-Type':'application/json'},body:JSON.stringify(data)});

test('the production Worker retains late delivery work and returns a truthful pending receipt after saving',async()=>{
 let finish;const delivery=new Promise(resolve=>{finish=resolve;});const background=[];let saved=false;
 const data=brief();const env={PROJECT_INBOX:{getByName(){return {async saveBrief(){saved=true;return {status:201};},deliverBrief(id){assert.equal(saved,true);assert.equal(id,data.id);return delivery;}};}}};
 const response=await worker.fetch(request(data),env,{waitUntil(task){background.push(task);}});
 assert.equal(response.status,201);assert.equal((await response.json()).providerDelivery,'pending');assert.equal(background.length,1);
 finish('automation_accepted');assert.equal(await background[0],'automation_accepted','late acceptance remains background work, not a second submission');
});

test('the production Worker keeps fast acceptance and transport failure honest',async()=>{
 for(const fails of [false,true]){
  const background=[];const env={PROJECT_INBOX:{getByName(){return {async saveBrief(){return {status:201};},async deliverBrief(){if(fails)throw Error('Synthetic transport failure');return 'automation_accepted';}};}}};
  const response=await worker.fetch(request(brief()),env,{waitUntil(task){background.push(task);}});
  assert.equal(response.status,201);assert.equal((await response.json()).providerDelivery,fails?'pending':'automation_accepted');await Promise.all(background);
 }
});

test('slow office handoffs acknowledge committed SQLite briefs and applications while one background send completes', {timeout:30000},async()=>{
 const bundled=await build({entryPoints:['entry.mjs'],bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 let release,calls=0;
 const mf=new Miniflare(convertV4MiniflareOptions({unsafeInspectDurableObjects:true,modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-11-04',
  bindings:{MIDDLETOWN_ZAPIER_WEBHOOK:'https://hooks.zapier.com/hooks/catch/123/test/'},durableObjects:{PROJECT_INBOX:{className:'ProjectInbox',useSQLite:true},HOME_ACCOUNTS:{className:'HomeAccounts',useSQLite:true}},
  outboundService:async()=>{calls++;return new Promise(resolve=>{release=()=>resolve(new Response('{}'));});}
 }));
 try{
  for(const kind of ['brief','application']){
   const b=brief(),data=kind==='brief'?b:{id:crypto.randomUUID(),startedAt:b.startedAt,businessName:'Synthetic business',contactName:'Synthetic test',phone:b.phone,email:b.email,website:'',town:'Media',state:'PA',coverage:'Media and nearby towns',registration:'',insurance:'yes',services:['carpentry'],interest:'standard',notes:'Synthetic local test only',consent:true,consentVersion:APPLICATION_CONSENT_VERSION};
   const path=kind==='brief'?'/api/project-briefs':'/api/contractor-applications';
   const call=()=>{const req=request(data,path);return mf.dispatchFetch(req.url,req);};
   const response=await call();
   const receipt=await response.json();assert.equal(response.status,201);assert.equal(receipt.reference,data.id);assert.equal(receipt[kind==='brief'?'providerDelivery':'officeDelivery'],'pending');
   const name=(kind==='brief'?'middletown:':'applications:')+new Date().toISOString().slice(0,7);
   const sql=await mf.unsafeGetDurableObjectStorage(undefined,'ProjectInbox',{name});
   assert.equal((await sql.exec('SELECT count(*) AS n FROM '+(kind==='brief'?'project_briefs':'contractor_applications')))[0].n,1);
   assert.deepEqual((await sql.exec('SELECT state,attempts FROM email_outbox'))[0],{state:'pending',attempts:0});
   assert.equal(calls,kind==='brief'?1:2);assert.equal(typeof release,'function');release();release=undefined;
   const duplicate=await call();assert.equal(duplicate.status,200);assert.equal((await duplicate.json())[kind==='brief'?'providerDelivery':'officeDelivery'],'automation_accepted');
   assert.deepEqual((await sql.exec('SELECT state,attempts FROM email_outbox'))[0],{state:'automation_accepted',attempts:1});
   assert.equal((await sql.exec('SELECT count FROM contact_counts'))[0].count,1);
   assert.equal(calls,kind==='brief'?1:2,'neither the alarm nor identical retry may send an accepted alert twice');
  }
 }finally{release?.();await mf.dispose();}
});
