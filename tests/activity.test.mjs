import test from 'node:test';
import assert from 'node:assert/strict';
import {validateActivity,pageContext} from '../activity-config.mjs';
import {handleIntake} from '../server/intake.mjs';

test('contact measurement accepts only enumerated, non-personal fields',()=>{
  const valid={action:'call_click',provider:'middletown',context:'planner'};
  assert.deepEqual(validateActivity(valid),valid);
  for(const patch of [{name:'Personal name'},{url:'https://example.invalid/private'},{body:'private project'},{action:'brief_saved'},{provider:'unknown'},{context:'/private?name=Person'}]) assert.equal(validateActivity({...valid,...patch}),null);
  assert.equal(pageContext('/start/'),'planner');
  assert.equal(pageContext('/businesses/middletown-hvac/'),'profile');
  assert.equal(pageContext('/services/water-heaters/'),'service');
});

test('activity endpoint uses private monthly storage and exposes no results',async()=>{
  let recorded;
  const env={PROJECT_INBOX:{getByName(name){assert.match(name,/^activity:\d{4}-\d{2}$/);return {async recordActivity(...args){recorded=args;return {status:200};}};}}};
  const request=data=>new Request('https://wazoozie.com/api/contact-activity',{method:'POST',headers:{origin:'https://wazoozie.com','content-type':'application/json'},body:JSON.stringify(data)});
  const data={action:'booking_click',provider:'middletown',context:'help'};
  const response=await handleIntake(request(data),env);
  assert.equal(response.status,200);assert.deepEqual(recorded[0],data);assert.equal(recorded[1].length,64);
  assert.deepEqual(await response.json(),{counted:true});
  assert.equal((await handleIntake(request({...data,email:'private@example.invalid'}),env)).status,400);
  assert.equal((await handleIntake(new Request('https://wazoozie.com/api/contact-activity'),env)).status,405);
  assert.equal((await handleIntake(request({...data,extra:'x'.repeat(600)}),env)).status,413);
});

test('pricing and service handoffs are measured without URLs or user data',async()=>{
 const {contactActivityForURL}=await import('../activity-config.mjs');
 for(const path of ['/install-estimate/','/ductless-estimator/']){
  const result=contactActivityForURL(new URL('https://www.mtownhvac.com'+path+'?name=private&email=private@example.invalid'));
  assert.deepEqual(result,{action:'pricing_tool_click',provider:'middletown'});
  assert.ok(validateActivity({...result,context:'service'}));
 }
 for(const path of ['/','/conversion/','/services/','/services/ductless/'])assert.deepEqual(contactActivityForURL(new URL('https://www.mtownhvac.com'+path)),{action:'website_click',provider:'middletown'});
 for(const url of ['https://www.mtownhvac.com.evil.invalid/install-estimate/','https://www.mtownhvac.com/reviews/','http://www.mtownhvac.com/install-estimate/','https://example.invalid/'])assert.equal(contactActivityForURL(new URL(url)),null);
 assert.deepEqual(contactActivityForURL(new URL('tel:+14452589962')),{action:'call_click',provider:'ryan'});
 assert.deepEqual(contactActivityForURL(new URL('mailto:service@mtownhvac.com?body=private')),{action:'email_draft_click',provider:'middletown'});
});
