import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {initAccounts} from '../dist/assets/accounts.js';
const fixture=()=>({id:'synthetic',name:'<img src=x onerror=alert(1)>',version:0,projects:[],favorites:[],passkeys:1});
async function page(api,passkeys){const dom=new JSDOM(await readFile('dist/account/index.html','utf8'),{url:'https://wazoozie.com/account/'});const app=await initAccounts(dom.window.document,api,passkeys);return {dom,doc:dom.window.document,app};}
const settle=()=>new Promise(r=>setImmediate(r));
test('account dashboard safely displays identity, explicitly imports local projects and handles save failures',async()=>{
 let current=fixture(),fail=false;const calls=[];
 const api=async(path,body,method)=>{calls.push({path,body,method});if(path==='status')return {account:current};if(path==='data'){if(fail)throw Error('Your account changed in another tab. Reload before editing again.');current={...current,...body,version:current.version+1};return {account:current};}if(path==='logout')return {signedOut:true};throw Error('unexpected '+path);};
 const {dom,doc,app}=await page(api);
 try{
  assert.equal(doc.querySelector('#account-greeting img'),null);assert.match(doc.querySelector('#account-greeting').textContent,/<img/);
  dom.window.localStorage.setItem('wazoozie.home-list.v1',JSON.stringify({version:1,items:[{intent:'water',stage:'calling',private:'not imported'}]}));
  assert.equal(calls.filter(c=>c.path==='data').length,0,'no automatic import or write');
  doc.querySelector('#account-import').click();await settle();assert.deepEqual(app.snapshot().projects,[{intent:'water',stage:'calling'}]);
  assert.ok(doc.querySelector('#account-projects a[href="/project-kit/?intent=water"]'));
  assert.equal(dom.window.localStorage.length,1,'original local list stays intact');
  const favorite=doc.querySelector('[aria-label="Save Hart Builders, Inc."]');favorite.click();await settle();assert.ok(app.snapshot().favorites.includes('hart'));
  fail=true;doc.querySelector('[aria-label="Unsave Hart Builders, Inc."]').click();await settle();assert.ok(app.snapshot().favorites.includes('hart'));assert.match(doc.querySelector('#account-status').textContent,/another tab/);
  doc.querySelector('#account-logout').click();await settle();assert.equal(doc.querySelector('#account-dashboard').hidden,true);assert.equal(doc.querySelector('#account-auth').hidden,false);
 }finally{dom.window.close();}
});
test('signup uses a browser passkey before verification; cancellation is honest and service outages hide signup',async()=>{
 const calls=[];const api=async(path,body)=>{calls.push(path);if(path==='status')return {account:null};if(path==='register/options')return {options:{challenge:'synthetic'}};if(path==='register/verify')return {account:{...fixture(),name:'Synthetic'},recoveryCode:'synthetic recovery value'};throw Error('unexpected '+path);};
 let cancelled=true;const passkeys={browserSupportsWebAuthn:()=>true,startRegistration:async()=>{if(cancelled){const e=Error('cancelled');e.name='NotAllowedError';throw e;}return {id:'synthetic'};}};
 const {dom,doc}=await page(api,passkeys);
 try{
  doc.querySelector('#account-name').value='Synthetic';doc.querySelector('#account-create').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await settle();assert.ok(!calls.includes('register/verify'));assert.match(doc.querySelector('#account-status').textContent,/cancelled/);
  cancelled=false;doc.querySelector('#account-create').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await settle();assert.equal(doc.querySelector('#account-auth').hidden,true);assert.equal(doc.querySelector('#account-recovery').hidden,false);assert.equal(doc.querySelector('#account-recovery-code').textContent,'synthetic recovery value');
  doc.querySelector('#account-hide-recovery').click();assert.equal(doc.querySelector('#account-recovery-code').textContent,'');assert.equal(dom.window.localStorage.length,0,'recovery/session secrets never enter browser storage');
 }finally{dom.window.close();}
 const outage=await page(async()=>{throw Error('Accounts unavailable.');});try{assert.equal(outage.doc.querySelector('#account-auth').hidden,true);assert.match(outage.doc.querySelector('#account-status').textContent,/keep browsing/);}finally{outage.dom.window.close();}
});
