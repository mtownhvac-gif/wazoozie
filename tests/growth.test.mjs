import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const code=readFileSync(new URL('../assets/growth.js',import.meta.url),'utf8').replace('export function projectBudget','function projectBudget');
function setup(path='/project-budget/') {
  const html=readFileSync(new URL(`../dist${path}index.html`,import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'https://wazoozie.com'+path,runScripts:'outside-only'});
  dom.window.eval(code+'\nwindow.calculate=projectBudget;');
  return dom.window;
}
test('budget uses entered costs, rounds cents and rejects invalid or missing amounts',()=>{
  const w=setup();
  assert.equal(w.calculate(['100.10','20.20','0','10']).total,132.33);
  assert.equal(w.calculate(['0','0','0','0']).total,0);
  for(const values of [['','','',''],['-1','0','0','0'],['1e3','0','0','0'],['1','0','0','101'],['10000001','0','0','0'],['NaN','0','0','0']])assert.equal(w.calculate(values),null);
  w.close();
});
test('changing or clearing budget never leaves a stale displayed total',()=>{
  const w=setup();const form=w.document.querySelector('form');
  for(const [key,value] of Object.entries({work:'1000',other:'200',fees:'50',allowance:'10'}))form.elements[key].value=value;
  form.dispatchEvent(new w.Event('submit',{cancelable:true}));
  const result=w.document.querySelector('#growth-budget-result');
  assert.match(result.textContent,/1,375.00/);
  form.elements.work.dispatchEvent(new w.Event('input',{bubbles:true}));assert.match(result.textContent,/Calculate again/);
  form.reset();assert.match(result.textContent,/Enter all four/);w.close();
});
test('sharing has a manual fallback and copies only fixed public links',async()=>{
  const w=setup('/share-wazoozie/');
  Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied')}}});
  w.document.querySelector('[data-copy-share="checklist"]').click();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(w.document.querySelector('#growth-share-status').textContent,/Select and copy/);
  assert.match(w.document.querySelector('#growth-share-text').value,/https:\/\/wazoozie.com\/seasonal-home-checklist\//);
  assert.equal(w.localStorage.length,0);w.close();
});
