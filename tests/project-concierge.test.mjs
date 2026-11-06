import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {HOME_LIST_KEY, initConcierge, matchingProjects, sanitizeList} from '../dist/assets/project-concierge.js';
import {INTENTS} from '../project-config.mjs';
async function page(path,storage){const dom=new JSDOM(await readFile('dist/'+path,'utf8'),{url:'https://wazoozie.com/'});const app=initConcierge(dom.window.document,storage);return {dom,doc:dom.window.document,app};}
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
test('finder routes common home projects to the correct named businesses without a request',async()=>{
 assert.deepEqual(matchingProjects('ac'),['comfort']);
 for(const [query,intent] of [['tankless','water'],['boiler','boiler'],['window','windows'],['drywall','painting'],['shelving','carpentry'],['electrician','electrical']])assert.ok(matchingProjects(query).includes(intent),query);
 const {dom,doc}=await page('index.html',memory());
 try{
  assert.equal(doc.querySelectorAll('[data-project-choice]:not([hidden])').length,6);
  const input=doc.querySelector('#concierge-search');input.value='window';input.dispatchEvent(new dom.window.Event('input'));
  const cards=[...doc.querySelectorAll('[data-project-choice]:not([hidden])')];assert.equal(cards.length,1);assert.ok(cards[0].querySelector('a').href.endsWith('/start/?intent=windows'));assert.ok(cards[0].textContent.includes('See your contact'));assert.ok(!cards[0].textContent.includes('Hart'));
  input.value='unmatched thing';input.dispatchEvent(new dom.window.Event('input'));assert.ok(doc.querySelector('#concierge-results a').href.endsWith('/help/'));
  input.value='';input.dispatchEvent(new dom.window.Event('input'));doc.querySelector('#concierge-show-all').click();assert.equal(doc.querySelectorAll('[data-project-choice]:not([hidden])').length,Object.keys(INTENTS).length);
 }finally{dom.window.close();}
});
test('home list persists only categories and stages, survives navigation, and supports undo and removal',async()=>{
 const storage=memory();let env=await page('index.html',storage);
 env.doc.querySelector('[data-home-save="comfort"]').click();env.doc.querySelector('[data-home-save="comfort"]').click();env.doc.querySelector('[data-home-save="water"]').click();
 assert.deepEqual(JSON.parse(storage.getItem(HOME_LIST_KEY)),{version:1,items:[{intent:'comfort',stage:'planning'},{intent:'water',stage:'planning'}]});env.dom.window.close();
 env=await page('my-home/index.html',storage);
 try{
  assert.equal(env.doc.querySelectorAll('.home-project').length,2);assert.equal(env.doc.querySelector('#home-list-empty').hidden,true);
  const select=env.doc.querySelector('[data-project="comfort"] select');select.value='calling';select.dispatchEvent(new env.dom.window.Event('change'));assert.equal(JSON.parse(storage.getItem(HOME_LIST_KEY)).items[0].stage,'calling');
  env.doc.querySelector('[data-project="comfort"] .home-project-remove').click();assert.equal(env.doc.querySelectorAll('.home-project').length,1);env.doc.querySelector('#home-list-undo-button').click();assert.equal(env.doc.querySelectorAll('.home-project').length,2);assert.equal(env.app.snapshot()[0].intent,'comfort');
  env.doc.querySelectorAll('.home-project-remove').forEach(button=>button.click());assert.equal(storage.getItem(HOME_LIST_KEY),null);assert.equal(env.doc.querySelector('#home-list-empty').hidden,false);
 }finally{env.dom.window.close();}
});
test('unavailable storage is truthful and retains a working in-page list',async()=>{
 const storage={getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}};
 const {dom,doc,app}=await page('my-home/index.html',storage);
 try{doc.querySelector('[data-home-save="painting"]').click();assert.equal(app.snapshot().length,1);assert.match(doc.querySelector('#home-storage-status').textContent,/open page only/);assert.match(doc.querySelector('#home-save-feedback').textContent,/unavailable/);assert.ok(doc.querySelector('[data-project="painting"] a[href="tel:+16102919552"]'));}finally{dom.window.close();}
});
test('stored data cannot inject markup, arbitrary routes or extra contact fields',async()=>{
 const hostile={version:1,items:[{intent:'__proto__',stage:'planning'},{intent:'<img src=x onerror=alert(1)>',stage:'calling'},{intent:'doors',stage:'planning',name:'private',phone:'private',details:'private'},{intent:'doors',stage:'done'},{intent:'water',stage:'invalid'}]};
 assert.deepEqual(sanitizeList(hostile),[{intent:'doors',stage:'planning'}]);
 const storage=memory();storage.setItem(HOME_LIST_KEY,JSON.stringify(hostile));const {dom,doc}=await page('my-home/index.html',storage);
 try{assert.equal(doc.querySelectorAll('.home-project').length,1);assert.ok(doc.querySelector('[data-project="doors"] a[href="/businesses/hart-builders/"]'));assert.equal(doc.querySelector('#home-list-board img'),null);assert.ok(!doc.querySelector('#home-list-board').textContent.includes('private'));}finally{dom.window.close();}
});
test('all profile checklists keep the existing business identity and project route',async()=>{
 const {BUSINESSES}=await import('../project-config.mjs');
 for(const business of Object.values(BUSINESSES)){const markup=await readFile('dist/businesses/'+business.slug+'/index.html','utf8');const doc=new JSDOM(markup).window.document;const prep=doc.querySelector('.profile-next-step');assert.equal(prep.querySelectorAll('li').length,3);assert.ok(prep.querySelector('a[href="tel:'+business.tel+'"]'));assert.ok(prep.querySelector('a[href="/start/?intent='+business.defaultIntent+'"]'));}
});
