import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare, convertV4MiniflareOptions} from 'miniflare';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
async function storeSource(){
 const source=await readFile(new URL('../server/project-store.mjs',import.meta.url),'utf8');
 const result=await build({stdin:{contents:source,resolveDir:new URL('../server/',import.meta.url).pathname},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 return result.outputFiles[0].text;
}

// Execute the actual SQLite-backed class inside the local Cloudflare runtime.
test('private store is durable, idempotent, rate limited and expires old records',async()=>{
  const source=await storeSource();
  const mf=new Miniflare(convertV4MiniflareOptions({unsafeInspectDurableObjects:true,modules:true,script:source+'\nexport class TestInbox extends ProjectInbox { async runExpiry() { return this.alarm(); } }\nexport default {fetch(){return new Response("local test");}};',compatibilityDate:'2026-11-04',durableObjects:{PROJECT_INBOX:{className:'TestInbox',useSQLite:true}}}));
  try {
    const ns=await mf.getDurableObjectNamespace('PROJECT_INBOX');
    const store=ns.get(ns.idFromName('synthetic-test'));
    const brief={id:crypto.randomUUID(),provider:'middletown',intent:'comfort',name:'Synthetic test',phone:'202-555-0100',email:'',town:'Media',zip:'19063',state:'PA',details:'Synthetic local test only',timing:'Planning ahead',role:'Homeowner',property:'House',equipment:'',source:'test',consentVersion:'test'};
    const now=Date.now();
    assert.equal((await store.saveBrief(brief,'same','client',now)).status,201);
    assert.equal((await store.saveBrief(brief,'same','client',now)).status,200);
    assert.equal((await store.saveBrief(brief,'changed','client',now)).status,409);
    for(let i=0;i<4;i++) assert.equal((await store.saveBrief({...brief,id:crypto.randomUUID()},'new','client',now)).status,201);
    assert.equal((await store.saveBrief({...brief,id:crypto.randomUUID()},'new','client',now)).status,429);
    const sql=await mf.unsafeGetDurableObjectStorage(undefined,'TestInbox',{name:'synthetic-test'});
    assert.equal((await sql.exec('SELECT count(*) AS n FROM project_briefs'))[0].n,5);
    assert.equal((await sql.exec('SELECT entry_context FROM project_briefs WHERE id=?',brief.id))[0].entry_context,'direct');
    const attributed={...brief,id:crypto.randomUUID(),entryContext:'pricing'};
    assert.equal((await store.saveBrief(attributed,'attributed','other-client',now)).status,201);
    assert.equal((await sql.exec('SELECT entry_context FROM project_briefs WHERE id=?',attributed.id))[0].entry_context,'pricing');
    assert.equal((await sql.exec("SELECT count FROM contact_counts WHERE action='brief_saved'"))[0].count,6);
    const event={action:'call_click',provider:'middletown',context:'help'};
    for(let i=0;i<100;i++) assert.equal((await store.recordActivity(event,'metrics-client',now)).status,200);
    assert.equal((await store.recordActivity(event,'metrics-client',now)).status,429);
    assert.equal((await sql.exec("SELECT count FROM contact_counts WHERE action='call_click'"))[0].count,100);
    await sql.exec("UPDATE contact_counts SET day='2020-01-01'");
    await sql.exec('UPDATE project_briefs SET created_at=?',now-91*86400000);
    await store.runExpiry();
    assert.equal((await sql.exec('SELECT count(*) AS n FROM project_briefs'))[0].n,0);
    assert.equal((await sql.exec('SELECT count(*) AS n FROM contact_counts'))[0].n,0);
  } finally {await mf.dispose();}
});

test('contractor applications remain private, idempotent, rate limited and expire',async()=>{
  const source=await storeSource();
  const mf=new Miniflare(convertV4MiniflareOptions({unsafeInspectDurableObjects:true,modules:true,script:source+'\nexport class TestInbox extends ProjectInbox { async runExpiry(){return this.alarm();} async deliveryAlarm(){return this.ctx.storage.getAlarm();} }\nexport default {fetch(){return new Response("test");}};',compatibilityDate:'2026-11-04',durableObjects:{PROJECT_INBOX:{className:'TestInbox',useSQLite:true}}}));
  try{
    const ns=await mf.getDurableObjectNamespace('PROJECT_INBOX');const store=ns.get(ns.idFromName('application-test'));const now=Date.now()+60000;
    await store.recordActivity({action:'call_click',provider:'middletown',context:'help'},'alarm-test',now);
    assert.equal(await store.deliveryAlarm(),now+86400000);
    const data={id:crypto.randomUUID(),businessName:'Synthetic Contractor',contactName:'Synthetic Test',email:'test@example.invalid',phone:'202-555-0100',website:'',town:'Media',state:'PA',coverage:'Media and Delaware County',registration:'',insurance:'yes',services:['carpentry'],interest:'sponsored',notes:'Synthetic only',consentVersion:'test'};
    assert.equal((await store.saveApplication(data,'same','client',now)).status,201);
    assert.equal(await store.deliveryAlarm(),now+1000,'application outbox must replace daily cleanup with a prompt delivery alarm before intake can send');
    assert.equal((await store.saveApplication(data,'same','client',now)).status,200);
    assert.equal((await store.saveApplication(data,'different','client',now)).status,409);
    for(let i=0;i<2;i++)assert.equal((await store.saveApplication({...data,id:crypto.randomUUID()},'next','client',now)).status,201);
    assert.equal((await store.saveApplication({...data,id:crypto.randomUUID()},'next','client',now)).status,429);
    const sql=await mf.unsafeGetDurableObjectStorage(undefined,'TestInbox',{name:'application-test'});
    const rows=await sql.exec('SELECT status,interest FROM contractor_applications');assert.equal(rows.length,3);assert.ok(rows.every(row=>row.status==='awaiting_review'&&row.interest==='sponsored'));
    await sql.exec('UPDATE contractor_applications SET created_at=?',now-91*86400000);await store.runExpiry();
    assert.equal((await sql.exec('SELECT count(*) AS n FROM contractor_applications'))[0].n,0);
  }finally{await mf.dispose();}
});

test('neighbor attribution persists privately, retries safely, and expires after 90 days',async()=>{
 const source=await storeSource();
 const mf=new Miniflare(convertV4MiniflareOptions({unsafeInspectDurableObjects:true,modules:true,script:source+'\nexport class TestInbox extends ProjectInbox { async runExpiry(){return this.alarm();} }\nexport default {fetch(){return new Response("test");}};',compatibilityDate:'2026-11-04',durableObjects:{PROJECT_INBOX:{className:'TestInbox',useSQLite:true}}}));
 try{
  const ns=await mf.getDurableObjectNamespace('PROJECT_INBOX');const store=ns.get(ns.idFromName('neighbor-test'));const now=Date.now();
  const data={id:crypto.randomUUID(),name:'Synthetic Referrer',email:'referrer@example.invalid',phone:'',consentVersion:'test'};
  const first=await store.saveNeighbor(data,'same','client',now);assert.equal(first.status,201);assert.match(first.code,/^[0-9a-f]{32}$/);
  const repeated=await store.saveNeighbor(data,'same','client',now);assert.equal(repeated.status,200);assert.equal(repeated.code,first.code);
  assert.equal((await store.saveNeighbor(data,'changed','client',now)).status,409);
  assert.equal(await store.hasNeighbor(first.code,now),true);assert.equal(await store.hasNeighbor(first.code,now+91*86400000),false);
  for(let i=0;i<2;i++)assert.equal((await store.saveNeighbor({...data,id:crypto.randomUUID()},'new','client',now)).status,201);
  assert.equal((await store.saveNeighbor({...data,id:crypto.randomUUID()},'new','client',now)).status,429);
  const brief={id:crypto.randomUUID(),provider:'hart',intent:'doors',name:'Synthetic Homeowner',phone:'202-555-0100',email:'',town:'Media',zip:'19063',state:'PA',details:'Synthetic only: door project',timing:'Planning ahead',role:'Homeowner',property:'House',equipment:'',source:'neighbor',consentVersion:'test',neighborCode:first.code};
  assert.equal((await store.saveBrief(brief,'brief','lead-client',now)).status,201);
  const sql=await mf.unsafeGetDurableObjectStorage(undefined,'TestInbox',{name:'neighbor-test'});
  assert.equal((await sql.exec('SELECT neighbor_code FROM project_briefs'))[0].neighbor_code,first.code);
  assert.equal((await sql.exec('SELECT name FROM neighbor_referrals WHERE code=?',first.code))[0].name,data.name);
  await sql.exec('UPDATE neighbor_referrals SET created_at=?',now-91*86400000);await store.runExpiry();
  assert.equal((await sql.exec('SELECT count(*) AS n FROM neighbor_referrals'))[0].n,0);
 }finally{await mf.dispose();}
});
