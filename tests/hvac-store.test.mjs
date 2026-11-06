import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare, convertV4MiniflareOptions} from 'miniflare';
import {readFile} from 'node:fs/promises';
import {handleIntake} from '../server/intake.mjs';
import {HVAC_CONSENT_VERSION} from '../hvac-config.mjs';

// Run the real route against the real SQLite store, with Cloudflare metadata fetch disabled.
test('HVAC route persists private short requests, retries safely and counts only real saves',async()=>{
  const source=await readFile(new URL('../server/project-store.mjs',import.meta.url),'utf8');
  const mf=new Miniflare(convertV4MiniflareOptions({cf:false,unsafeInspectDurableObjects:true,modules:true,script:source+'\nexport class TestInbox extends ProjectInbox { async runExpiry(){return this.alarm();} }\nexport default {fetch(){return new Response("local test");}};',compatibilityDate:'2026-11-04',durableObjects:{PROJECT_INBOX:{className:'TestInbox',useSQLite:true}}}));
  try{
    const ns=await mf.getDurableObjectNamespace('PROJECT_INBOX');
    const store=ns.get(ns.idFromName('hvac-local-test'));
    const env={PROJECT_INBOX:{getByName(name){assert.match(name,/^middletown:\d{4}-\d{2}$/);return store;}}};
    const input={id:crypto.randomUUID(),startedAt:Date.now()-5000,intent:'comfort',name:'Synthetic HVAC test',contact:'synthetic@example.invalid',zip:'19063',details:'Synthetic local request for uneven cooling.',timing:'Planning ahead',consent:true,consentVersion:HVAC_CONSENT_VERSION};
    const send=(data)=>handleIntake(new Request('https://wazoozie.com/api/hvac-requests',{method:'POST',headers:{origin:'https://wazoozie.com','content-type':'application/json','cf-connecting-ip':'192.0.2.10'},body:JSON.stringify(data)}),env);
    const first=await send(input);assert.equal(first.status,201);assert.equal((await first.json()).providerDelivery,'not_sent');
    assert.equal((await send({...input,startedAt:input.startedAt-1000})).status,200);
    assert.equal((await send({...input,details:'Changed synthetic request description.'})).status,409);
    for(let i=0;i<4;i++)assert.equal((await send({...input,id:crypto.randomUUID()})).status,201);
    assert.equal((await send({...input,id:crypto.randomUUID()})).status,429);
    assert.equal((await send(input)).status,200,'retry remains available after reaching limit');
    const sql=await mf.unsafeGetDurableObjectStorage(undefined,'TestInbox',{name:'hvac-local-test'});
    const rows=await sql.exec('SELECT * FROM project_briefs');assert.equal(rows.length,5);
    for(const row of rows){
      assert.equal(row.provider,'middletown');assert.equal(row.source,'hvac-page');assert.equal(row.consent_version,HVAC_CONSENT_VERSION);
      assert.equal(row.name,input.name);assert.equal(row.email,input.contact);assert.equal(row.phone,'');assert.equal(row.zip,input.zip);
      for(const field of ['town','state','role','property','equipment'])assert.equal(row[field],'',field);
      assert.equal(row.neighbor_code,null);assert.match(row.fingerprint,/^[a-f0-9]{64}$/);
    }
    const counts=await sql.exec('SELECT action,provider,context,count FROM contact_counts');
    assert.deepEqual(counts,[{action:'brief_saved',provider:'middletown',context:'hvac',count:5}]);
    const limits=await sql.exec('SELECT client_hash,count FROM submission_limits');assert.equal(limits.length,1);assert.match(limits[0].client_hash,/^[a-f0-9]{64}$/);assert.equal(limits[0].count,5);
    await sql.exec('UPDATE project_briefs SET created_at=?',Date.now()-91*86400000);
    await store.runExpiry();assert.equal((await sql.exec('SELECT count(*) AS n FROM project_briefs'))[0].n,0);
  }finally{await mf.dispose();}
});
