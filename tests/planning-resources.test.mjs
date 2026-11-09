import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {INTENTS} from '../project-config.mjs';
import {planningResources,describeProject} from '../assets/planning-resources.mjs';
test('all curated project references resolve locally, exclude model-generated links and carry no monetary claims',()=>{
 for(const intent of Object.keys(INTENTS))for(const mode of ['plan','prepare','estimate']){
  const refs=planningResources(intent,mode);assert.equal(refs.length,2);
  for(const r of refs){assert.ok(r.href.startsWith('/'));assert.ok(existsSync('dist'+r.href.split('?')[0]+'index.html'),r.href);assert.doesNotMatch(r.context,/\$\d|guarantee|same.day booking/i);}
 }
 assert.equal(planningResources('__proto__').length,0);
});
test('description helper preserves typed notes, takes only bounded answers and refuses overflow',()=>{
 const r=describeProject('Existing concern',['Equipment?','What changed?'],['Oil Boiler','Two rooms cold'],'This week');assert.match(r.text,/Existing concern\nEquipment\? Oil Boiler/);assert.match(r.text,/Availability still needs confirmation/);
 assert.ok(describeProject('',[],[],'').error);assert.ok(describeProject('x'.repeat(1800),['Question?'],['answer'],'').error);
 assert.ok(describeProject('',['What?'],['x'.repeat(300)],'').text.length<180);
});
