import test from 'node:test';
import assert from 'node:assert/strict';
import {validateHvacRequest} from '../server/hvac-validation.mjs';
import {handleIntake} from '../server/intake.mjs';
import {HVAC_CONSENT_VERSION, HVAC_INTENTS} from '../hvac-config.mjs';
import {pageContext, validateActivity} from '../activity-config.mjs';

const valid = () => ({id:crypto.randomUUID(),startedAt:Date.now()-5000,name:'Synthetic Homeowner',contact:'synthetic@example.invalid',zip:'19063',details:'Synthetic test: upstairs room is too hot.',timing:'Planning ahead',intent:'comfort',consent:true,consentVersion:HVAC_CONSENT_VERSION});
const request = (data,headers={}) => new Request('https://wazoozie.com/api/hvac-requests',{method:'POST',headers:{origin:'https://wazoozie.com','content-type':'application/json',...headers},body:typeof data==='string'?data:JSON.stringify(data)});
const unreachable = {PROJECT_INBOX:{getByName(){throw Error('Storage must not be reached');}}};

test('HVAC intents are fixed to Middletown and unasked fields are not inferred or accepted',()=>{
  for(const intent of HVAC_INTENTS){
    const {brief,error}=validateHvacRequest({...valid(),intent,source:'private arbitrary attribution',town:'Invented',state:'PA',role:'Homeowner',property:'House',equipment:'Boiler',neighborCode:'spoofed'});
    assert.equal(error,undefined);assert.equal(brief.provider,'middletown');assert.equal(brief.source,'hvac-page');
    for(const field of ['town','state','role','property','equipment'])assert.equal(brief[field],'',field);
    assert.equal(brief.neighborCode,undefined);assert.equal(brief.email,'synthetic@example.invalid');assert.equal(brief.phone,'');
  }
  const brief=validateHvacRequest({...valid(),contact:' (202) 555-0100 '}).brief;
  assert.equal(brief.phone,'(202) 555-0100');assert.equal(brief.email,'');
});

test('HVAC validation rejects consent, honeypot, age, bounds and routing attacks',()=>{
  const now=Date.now();
  const patches=[{consent:false},{consent:'true'},{consentVersion:'old'},{company:'spam'},{startedAt:now+1},{startedAt:now-1999},{startedAt:now-7200001},{startedAt:'123'},{id:'bad'},{provider:'hart'},{intent:'doors'},{name:'A'},{name:'x'.repeat(101)},{name:'New\nName'},{contact:'bad'},{contact:'202555010'},{contact:'a@example.invalid\nb@example.invalid'},{contact:'a'.repeat(181)},{zip:'00000'},{zip:'1906'},{zip:'190631'},{details:'short'},{details:'x'.repeat(1501)},{details:'Hidden\u0000text test here'},{timing:'Whenever'},{intent:'x'.repeat(31)}];
  for(const patch of patches)assert.ok(validateHvacRequest({...valid(),...patch},now).error,JSON.stringify(patch));
  for(const data of [null,[],true,'text'])assert.ok(validateHvacRequest(data,now).error);
  for(const age of [2000,7200000])assert.ok(validateHvacRequest({...valid(),startedAt:now-age},now).brief);
});

test('HVAC API has no public read/list path and requires same-origin bounded JSON',async()=>{
  for(const method of ['GET','HEAD','PUT','DELETE'])assert.equal((await handleIntake(new Request('https://wazoozie.com/api/hvac-requests',{method}),unreachable)).status,405);
  assert.equal((await handleIntake(new Request('https://wazoozie.com/api/hvac-requests/private-id'),unreachable)).status,404);
  for(const origin of ['','null','https://attacker.invalid'])assert.equal((await handleIntake(request(valid(),{origin}),unreachable)).status,403);
  assert.equal((await handleIntake(request(valid(),{'content-type':'text/plain'}),unreachable)).status,415);
  for(const [data,status] of [['{',400],['x'.repeat(17000),413],[{...valid(),consent:false},400],[{...valid(),intent:'doors'},400]])assert.equal((await handleIntake(request(data),unreachable)).status,status);
  assert.equal((await handleIntake(request(valid(),{'content-length':'17000'}),unreachable)).status,413);
  assert.equal((await handleIntake(request(valid()),{})).status,503);
});

test('HVAC receipts are honest, private and fail closed on unconfirmed saves',async()=>{
  for(const status of [201,200,409,429,500]){
    let saved;
    const env={PROJECT_INBOX:{getByName(name){assert.match(name,/^middletown:\d{4}-\d{2}$/);return {async saveBrief(...args){saved=args;return {status};}}}}};
    const input=valid(),response=await handleIntake(request(input,{'cf-connecting-ip':'192.0.2.1'}),env);
    assert.equal(response.status,status===500?503:status);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('x-robots-tag'),'noindex');
    const data=await response.json(),serialized=JSON.stringify(data);
    for(const secret of [input.name,input.contact,input.zip,input.details,'192.0.2.1'])assert.ok(!serialized.includes(secret));
    assert.match(saved[1],/^[a-f0-9]{64}$/);assert.match(saved[2],/^[a-f0-9]{64}$/);
    if(status<300){assert.equal(data.providerDelivery,'not_sent');assert.equal(data.status,'saved');assert.equal(data.reference,input.id);assert.equal(data.referralAttributed,false);}
    else assert.equal(data.status,undefined);
  }
  assert.equal((await handleIntake(request(valid()),unreachable)).status,503);
});

test('HVAC retry fingerprint ignores transport fields but changes with request content',async()=>{
  const fingerprints=[],clients=[];
  const env={PROJECT_INBOX:{getByName(){return {async saveBrief(_brief,fingerprint,client){fingerprints.push(fingerprint);clients.push(client);return {status:201};}}}}};
  const input=valid();
  await handleIntake(request(input),env);
  await handleIntake(request({...input,startedAt:input.startedAt-1000,source:'spoof',town:'spoof'}),env);
  await handleIntake(request({...input,details:'A different synthetic request description.'}),env);
  assert.equal(fingerprints[0],fingerprints[1]);assert.notEqual(fingerprints[0],fingerprints[2]);assert.equal(clients[0],clients[1]);
});

test('HVAC analytics use a low-data page context',()=>{
  assert.equal(pageContext('/hvac/'),'hvac');
  assert.deepEqual(validateActivity({action:'call_click',provider:'middletown',context:'hvac'}),{action:'call_click',provider:'middletown',context:'hvac'});
  assert.equal(validateActivity({action:'call_click',provider:'middletown',context:'hvac',contact:'private@example.invalid'}),null);
});
