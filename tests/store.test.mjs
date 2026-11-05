import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare, convertV4MiniflareOptions} from 'miniflare';
import {readFile} from 'node:fs/promises';

// Execute the actual SQLite-backed class inside the local Cloudflare runtime.
test('private store is durable, idempotent, rate limited and expires old records',async()=>{
  const source=await readFile(new URL('../server/project-store.mjs',import.meta.url),'utf8');
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
    assert.equal((await sql.exec("SELECT count FROM contact_counts WHERE action='brief_saved'"))[0].count,5);
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
