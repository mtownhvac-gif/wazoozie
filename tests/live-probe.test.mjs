import test from 'node:test';
import assert from 'node:assert/strict';
import {liveIntakeFailures, validTestReceipt} from '../scripts/live_probe_validation.mjs';

const pages=()=>({
  '/':{status:200,body:'<a href="/request/?entry=home">Request</a>'},
  '/request/':{status:200,body:'<form id="quickRequest"></form><script src="/assets/quick-request.js"></script>'},
  '/assets/quick-request.js':{status:200,body:"fetch('/api/project-briefs')"},
  '/assets/project-config.mjs':{status:200,body:'export const BUSINESSES = {}'}
});
const capability={capabilityVersion:2,captureReady:true,emailProviders:['middletown','rolledright','ryan','liberator','cooke']};

test('live checks fail for missing public intake paths, fallback HTML and disabled alerts',()=>{
  assert.deepEqual(liveIntakeFailures(pages(),capability),[]);
  for(const path of Object.keys(pages())){
    for(const status of [0,301,404,500]){
      const broken=pages();broken[path].status=status;
      assert.ok(liveIntakeFailures(broken,capability).length,`${path}: ${status}`);
    }
    const broken=pages();broken[path].body='<html>Fallback</html>';
    assert.ok(liveIntakeFailures(broken,capability).length,path);
  }
  for(const cap of [undefined,{}, {...capability,capabilityVersion:1},{...capability,captureReady:false},{...capability,emailProviders:[]},{...capability,emailProviders:'middletown'}]){
    assert.ok(liveIntakeFailures(pages(),cap).length);
  }
  const staged=pages();staged['/'].body+='<p>Content from an earlier release</p>';
  assert.deepEqual(liveIntakeFailures(staged,capability),[],'a content hash difference alone is not a broken intake');
});

test('optional test submission requires the matching saved receipt and an active alert state',()=>{
  const reference='synthetic-reference';
  const receipt={reference,status:'saved',providerDelivery:'automation_accepted'};
  assert.equal(validTestReceipt(201,receipt,reference),true);
  assert.equal(validTestReceipt(200,{...receipt,providerDelivery:'pending'},reference),true);
  for(const state of ['failed','not_sent',undefined])assert.equal(validTestReceipt(201,{...receipt,providerDelivery:state},reference),false);
  for(const status of [400,429,503])assert.equal(validTestReceipt(status,receipt,reference),false);
  assert.equal(validTestReceipt(201,{...receipt,reference:'other'},reference),false);
  assert.equal(validTestReceipt(201,{...receipt,status:'unknown'},reference),false);
  assert.equal(validTestReceipt(201,null,reference),false);
});
