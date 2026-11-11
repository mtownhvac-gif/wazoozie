import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {PROJECTS,ASSUMPTIONS,DEFAULT_STATE,normalizeState,buildPlan,encodePlan,decodePlan,planText} from '../assets/second-invoice-model.mjs';

test('the example reveals two do-overs and the proposed fix removes both',()=>{
 const p=buildPlan(DEFAULT_STATE);
 assert.deepEqual(p.risks.map(x=>x.id),['windows-before-paint','hvac-before-paint']);
 assert.deepEqual(p.recommended,['windows','heatpump','paint']);
 assert.equal(buildPlan({...DEFAULT_STATE,order:p.recommended}).risks.length,0);
});
test('separate rooms and confirmed access assumptions change the result',()=>{
 assert.equal(buildPlan({...DEFAULT_STATE,flags:[]}).risks.length,0);
 assert.deepEqual(buildPlan({...DEFAULT_STATE,flags:['same-area','window-trim']}).risks.map(x=>x.id),['windows-before-paint']);
});
test('every combination and order of up to four projects has an acyclic proposed fix',()=>{
 const flags=ASSUMPTIONS.map(x=>x.id),ids=Object.keys(PROJECTS);
 function visit(order){
  const p=buildPlan({order,flags});
  assert.equal(buildPlan({order:p.recommended,flags}).risks.length,0);
  assert.deepEqual(new Set(p.recommended),new Set(order));
  if(order.length<4)for(const id of ids)if(!order.includes(id))visit([...order,id]);
 }
 visit([]);
});
test('moisture gates and connected equipment questions remain after changing order',()=>{
 const p=buildPlan({order:['heatpump','basement','waterheater'],flags:['house-change','moisture','tankless']});
 assert.deepEqual(p.gates.map(x=>x.id),['moisture-first','tankless-site-review']);
 assert.equal(p.overlaps.length,2);
 assert.equal(p.openQuestions.length,4);
});
test('a share link allowlists choices and excludes discussion status and personal fields',()=>{
 const input={...DEFAULT_STATE,confirmed:['windows-before-paint'],name:'Private',address:'Private address'};
 const encoded=encodePlan(input),decoded=decodePlan(encoded);
 assert.deepEqual(decoded,{order:DEFAULT_STATE.order,flags:DEFAULT_STATE.flags,confirmed:[]});
 assert.ok(!encoded.includes('Private'));assert.ok(!encoded.includes('confirmed'));
 assert.equal(decodePlan('v=2&jobs=paint'),null);
 assert.equal(decodePlan('x'.repeat(801)),null);
 assert.deepEqual(normalizeState({order:['paint','constructor','paint','bad'],flags:['same-area','bad']}),{order:['paint'],flags:['same-area'],confirmed:[]});
});
test('conversation sheet carries assumptions and questions without claiming a quote',()=>{
 const text=planText(DEFAULT_STATE);
 assert.match(text,/not an estimate or invoice/);assert.match(text,/The trim touch-up/);
 assert.match(text,/ASSUMPTIONS/);assert.match(text,/PROPOSED ORDER TO DISCUSS/);
 assert.ok(!text.includes('$'));
});
test('built UI supports reorder, comparison, assumptions, share and clear without network requests',async()=>{
 const dom=new JSDOM(fs.readFileSync('dist/second-invoice/index.html','utf8'),{url:'https://wazoozie.com/second-invoice/',runScripts:'outside-only'});
 const w=dom.window;let copied='';
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copied=text;}}});
 w.fetch=()=>{throw new Error('This tool must work without external calls');};
 Object.assign(w,{PROJECTS,ASSUMPTIONS,DEFAULT_STATE,normalizeState,buildPlan,encodePlan,decodePlan,planText});
 w.eval(fs.readFileSync('assets/second-invoice.js','utf8').replace(/^import[^\n]+\n/,''));
 const d=w.document;
 assert.equal(d.querySelectorAll('.ripple-risk').length,2);
 d.getElementById('ripple-fix').click();
 assert.equal(d.querySelectorAll('.ripple-risk').length,0);
 assert.equal(d.getElementById('ripple-undo').hidden,false);
 d.getElementById('ripple-undo').click();assert.equal(d.querySelectorAll('.ripple-risk').length,2);
 const area=d.querySelector('[data-flag="same-area"]');area.checked=false;area.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(d.querySelectorAll('.ripple-risk').length,0);
 d.getElementById('ripple-share').click();await new Promise(resolve=>setTimeout(resolve,0));
 assert.match(copied,/https:\/\/wazoozie.com\/second-invoice\/#v=1&jobs=/);
 assert.ok(d.querySelectorAll('#ripple-trades a').length>=2);
 d.getElementById('ripple-forget').click();assert.equal(d.querySelectorAll('#ripple-order li').length,0);
 assert.equal(w.localStorage.getItem('wazoozie-second-invoice-v1'),null);
 assert.equal(d.getElementById('ripple-share').disabled,true);
 dom.window.close();
});
