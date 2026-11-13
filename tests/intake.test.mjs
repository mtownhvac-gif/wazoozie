import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBrief} from '../server/brief-validation.mjs';
import {handleIntake} from '../server/intake.mjs';
import {CONSENT_VERSION, INTENTS} from '../project-config.mjs';

const valid = () => ({id:crypto.randomUUID(),startedAt:Date.now()-5000,provider:'middletown',intent:'comfort',name:'Preview Homeowner',phone:'202-555-0100',email:'preview@example.invalid',town:'Media',zip:'19063',state:'PA',details:'Synthetic test: a room is not comfortable.',timing:'Planning ahead',role:'Homeowner',property:'House',equipment:'Test equipment',source:'start-page',consent:true,consentVersion:CONSENT_VERSION});
const request = (data, options={}) => new Request('https://wazoozie.com/api/project-briefs',{method:'POST',headers:{origin:'https://wazoozie.com','content-type':'application/json',...options.headers},body:typeof data==='string'?data:JSON.stringify(data)});

test('capabilities identify the running version without exposing environment metadata',async()=>{
  const id=crypto.randomUUID();
  for(const version of [id,undefined,'not-a-version']){
    const response=await handleIntake(new Request('https://wazoozie.com/api/project-capabilities'),{
      CF_VERSION_METADATA:{id:version,tag:'private release note',timestamp:'private timestamp'},
      MIDDLETOWN_ZAPIER_WEBHOOK:'https://hooks.zapier.com/hooks/catch/123/test/',
      OTHER_SECRET:'synthetic-secret',
    });
    const data=await response.json();
    assert.equal(data.deploymentVersion,version===id?id:null);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal(response.headers.get('x-robots-tag'),'noindex');
    const serialized=JSON.stringify(data);
    for(const privateValue of ['private release note','private timestamp','hooks.zapier.com','synthetic-secret'])assert.ok(!serialized.includes(privateValue));
  }
});

test('every intent maps only to its named provider',()=>{
  for(const [intent,meta] of Object.entries(INTENTS)) {
    assert.ok(validateBrief({...valid(),intent,provider:meta.provider}).brief);
    assert.ok(validateBrief({...valid(),intent,provider:meta.provider==='middletown'?'ryan':'middletown'}).error);
  }
});
test('consent, request age, honeypot and field limits reject invalid input',()=>{
  for(const patch of [{consent:false},{consentVersion:'old'},{company:'spam'},{startedAt:Date.now()+1000},{startedAt:Date.now()-8000000},{id:'bad'},{zip:'190631'},{name:'x'.repeat(101)},{phone:'short'},{email:'bad'},{details:'short'},{state:'NY'},{role:'Unknown'},{timing:'Whenever'}]) assert.ok(validateBrief({...valid(),...patch}).error,JSON.stringify(patch));
  for(const data of [null,[],true,'text']) assert.ok(validateBrief(data).error);
});
test('attribution excludes arbitrary caller-supplied text',()=>{
  const brief=validateBrief({...valid(),source:'https://example.com/private?name=Person'}).brief;
  assert.equal(brief.source,'start-page');
});
test('private APIs have no public read path, require same-origin JSON, and fail closed',async()=>{
  assert.equal((await handleIntake(new Request('https://wazoozie.com/api/project-briefs'),{})).status,405);
  assert.equal((await handleIntake(new Request('https://wazoozie.com/api/anything'),{})).status,404);
  assert.equal((await handleIntake(request(valid(),{headers:{origin:'https://attacker.invalid'}}),{})).status,403);
  assert.equal((await handleIntake(request(valid(),{headers:{'content-type':'text/plain'}}),{})).status,415);
  const unavailable=await handleIntake(request(valid()),{});
  assert.equal(unavailable.status,503);assert.equal(unavailable.headers.get('cache-control'),'no-store');
});
test('malformed and oversized requests never reach storage',async()=>{
  const env={PROJECT_INBOX:{getByName(){throw Error('storage must not be reached');}}};
  assert.equal((await handleIntake(request('{'),env)).status,400);
  assert.equal((await handleIntake(request('x'.repeat(17000)),env)).status,413);
  assert.equal((await handleIntake(request({...valid(),consent:false}),env)).status,400);
});
test('saved, duplicate, conflict, rate-limit and storage failures have honest receipts',async()=>{
  for(const status of [201,200,409,429]) {
    let stored;
    const env={PROJECT_INBOX:{getByName(name){assert.match(name,/^middletown:\d{4}-\d{2}$/);return {async saveBrief(...args){stored=args;return {status};}}}}};
    const response=await handleIntake(request(valid()),env);assert.equal(response.status,status);
    const data=await response.json();assert.equal(data.name,undefined);assert.equal(data.phone,undefined);
    if(status<300){assert.equal(data.providerDelivery,'not_sent');assert.equal(stored[2].length,64);}
  }
  const env={PROJECT_INBOX:{getByName(){throw Error('outage');}}};
  assert.equal((await handleIntake(request(valid()),env)).status,503);
});
