import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {PROBLEMS} from '../assets/problem-config.mjs';
import {INTENTS} from '../project-config.mjs';

async function page(path) {
  const markup = await readFile(new URL(`../dist/${path}/index.html`, import.meta.url), 'utf8');
  const dom = new JSDOM(markup, {url: `https://wazoozie.com/${path}/`});
  const previous = new Map();
  for (const name of ['document','location','history','navigator','FormData']) {
    previous.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
    Object.defineProperty(globalThis,name,{value:dom.window[name],configurable:true});
  }
  const originalFetch=globalThis.fetch;
  const requests=[];
  globalThis.fetch=async (url,options)=>{
    requests.push({url,options});
    return Response.json(url.includes('capabilities')?{captureReady:true}:{status:'saved',providerDelivery:'not_sent'});
  };
  return {document:dom.window.document,requests,close(){
    dom.window.close();globalThis.fetch=originalFetch;
    for(const [name,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}
  }};
}

test('plain-language problems choose the intended business without collecting contact information',async()=>{
  const env=await page('help');
  try {
    await import(`../dist/assets/problem-guide.js?test=${Date.now()}`);
    assert.equal(env.document.querySelectorAll('input').length,0);
    assert.equal(env.document.querySelectorAll('[data-problem]').length,PROBLEMS.length);
    for(const problem of PROBLEMS){
      assert.ok(INTENTS[problem.intent]);
      env.document.querySelector(`[data-problem="${problem.key}"]`).click();
      const result=env.document.querySelector('#problemResult');
      assert.equal(result.querySelectorAll('li').length,3);
      assert.ok(result.querySelector(`a[href="/start/?intent=${problem.intent}"]`));
      assert.equal(env.document.querySelectorAll('[aria-pressed="true"]').length,1);
    }
    assert.equal(env.requests.length,0);
  }finally{env.close();}
});

test('direct contact is offered before form entry and an unsaved brief can be emailed explicitly',async()=>{
  const env=await page('start');
  try {
    await import(`../dist/assets/project.js?test=${Date.now()}`);
    await new Promise(resolve=>setImmediate(resolve));
    const quick=env.document.querySelector('#projectQuickConnect');
    assert.ok(quick.querySelector('a[href="tel:+16105006416"]'));
    assert.ok(quick.querySelector('a[href^="https://book.housecallpro.com/"]'));
    env.document.querySelector('#projectNext1').click();
    const values={name:'Synthetic DOM Test',phone:'202-555-0100',town:'Media',zip:'19063',details:'Synthetic test: room is not comfortable.'};
    for(const [name,value] of Object.entries(values))env.document.querySelector(`[name="${name}"]`).value=value;
    env.document.querySelector('#projectNext2').click();
    assert.equal(env.document.querySelector('#projectStep3').hidden,false);
    const email=env.document.querySelector('#reviewConnections a[href^="mailto:"]');
    assert.ok(email.href.startsWith('mailto:service@mtownhvac.com?'));
    const body=new URLSearchParams(email.href.split('?')[1]).get('body');
    assert.ok(body.includes(values.details));
    assert.ok(body.includes('Prepared in the homeowner’s browser'));
    assert.ok(!body.includes('Saved with Wazoozie'));
    assert.equal(env.document.querySelector('[name="consent"]').checked,false);
    assert.equal(env.document.querySelectorAll('#projectPrompts li').length,3);
    const copy=[...env.document.querySelectorAll('#reviewConnections button')].find(button=>button.textContent==='Copy my brief');
    copy.click();await new Promise(resolve=>setImmediate(resolve));
    const fallback=env.document.querySelector('.project-copy-fallback');
    assert.ok(fallback.readOnly);assert.ok(fallback.value.includes(values.details));
    assert.equal(env.requests.filter(r=>r.options?.method==='POST').length,0);
    env.document.querySelector('[name="consent"]').checked=true;
    env.document.querySelector('#projectForm').dispatchEvent(new env.document.defaultView.Event('submit',{bubbles:true,cancelable:true}));
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(env.document.querySelector('#projectReceipt').hidden,false);
    assert.ok(env.document.querySelector('#receiptShare a[href^="mailto:"]'));
    assert.equal(env.requests.filter(r=>r.options?.method==='POST').length,1);
  }finally{env.close();}
});

test('business evidence is explicit and does not claim a recorded credential inspection',async()=>{
  for(const slug of ['middletown-hvac','ryan-dugan-electric','liberator-service-company','cooke-carpentry-construction']){
    const content=await readFile(new URL(`../dist/businesses/${slug}/index.html`,import.meta.url),'utf8');
    assert.ok(content.includes('Documents to request'));
    assert.ok(content.includes('documents are not recorded'));
    assert.ok(content.includes('not a credential inspection'));
    assert.ok(!content.includes('Vetted by Wazoozie'));
  }
});

test('saving outage preserves direct contact and offers an availability retry',async()=>{
  const env=await page('start');
  try{
    globalThis.fetch=async()=>{throw new Error('synthetic outage');};
    await import(`../dist/assets/project.js?outage=${Date.now()}`);
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(env.document.querySelector('#projectSave').disabled,true);
    assert.equal(env.document.querySelector('#retryCapture').hidden,false);
    assert.ok(env.document.querySelector('#captureStatus').textContent.includes('have not been sent'));
    assert.ok(env.document.querySelector('#projectQuickConnect a[href="tel:+16105006416"]'));
    assert.equal(env.document.querySelector('#projectReceipt').hidden,true);
  }finally{env.close();}
});
