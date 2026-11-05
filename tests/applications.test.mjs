import test from 'node:test';
import assert from 'node:assert/strict';
import {validateApplication} from '../server/application-validation.mjs';
import {handleIntake} from '../server/intake.mjs';
import {APPLICATION_CONSENT_VERSION} from '../contractor-config.mjs';
const valid=()=>({id:crypto.randomUUID(),startedAt:Date.now()-5000,businessName:'Synthetic Contractor',contactName:'Synthetic Test',phone:'202-555-0100',email:'test@example.invalid',website:'https://example.invalid/',town:'Media',state:'PA',coverage:'Media and nearby Delaware County towns',registration:'',insurance:'yes',services:['carpentry','painting'],interest:'sponsored',notes:'Synthetic test only',consent:true,consentVersion:APPLICATION_CONSENT_VERSION});
const request=data=>new Request('https://wazoozie.com/api/contractor-applications',{method:'POST',headers:{origin:'https://wazoozie.com','content-type':'application/json'},body:JSON.stringify(data)});
test('contractor applications require useful business information and explicit consent',()=>{
  assert.ok(validateApplication(valid()).application);
  for(const patch of [{consent:false},{consentVersion:'old'},{fax:'spam'},{id:'bad'},{startedAt:Date.now()+1000},{email:'a@b@c.invalid'},{phone:'short'},{services:[]},{services:['unknown']},{services:['hvac','hvac']},{website:'javascript:alert(1)'},{website:'https://name:password@example.invalid'},{state:'NY'},{coverage:'short'},{insurance:'verified'},{interest:'free-leads'},{notes:'x'.repeat(1201)}])assert.ok(validateApplication({...valid(),...patch}).error,JSON.stringify(patch));
  assert.ok(validateApplication({...valid(),website:''}).application);
});
test('application receipts contain no private details and never claim publication or payment',async()=>{
  for(const status of [201,200,409,429]){
    let saved;
    const env={PROJECT_INBOX:{getByName(name){assert.match(name,/^applications:\d{4}-\d{2}$/);return {async saveApplication(...args){saved=args;return {status};}};}}};
    const result=await handleIntake(request(valid()),env);assert.equal(result.status,status);
    const body=await result.json();assert.equal(body.email,undefined);assert.equal(body.businessName,undefined);
    if(status<300){assert.equal(body.status,'awaiting_review');assert.equal(body.published,false);assert.equal(body.charged,false);assert.equal(saved[2].length,64);}
  }
  assert.equal((await handleIntake(new Request('https://wazoozie.com/api/contractor-applications'),{})).status,405);
  assert.equal((await handleIntake(request(valid()),{})).status,503);
});
