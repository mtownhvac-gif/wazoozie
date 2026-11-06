import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const PROBLEMS = JSON.parse(await readFile(new URL('../assets/problem-config.json', import.meta.url), 'utf8'));
import {INTENTS,BUSINESSES} from '../project-config.mjs';

async function page(path, query = '', capability = {captureReady:true}) {
  const markup = await readFile(new URL(`../dist/${path}/index.html`, import.meta.url), 'utf8');
  const dom = new JSDOM(markup, {url: `https://wazoozie.com/${path}/${query}`});
  const previous = new Map();
  for (const name of ['document','location','history','navigator','FormData']) {
    previous.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
    Object.defineProperty(globalThis,name,{value:dom.window[name],configurable:true});
  }
  const originalFetch=globalThis.fetch;
  const requests=[];
  globalThis.fetch=async (url,options)=>{
    requests.push({url,options});
    return Response.json(url.includes('capabilities')?capability:{status:'saved',providerDelivery:'not_sent'});
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
  const env=await page('start','?intent=comfort');
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
  for(const slug of ['middletown-hvac','ryan-dugan-electric','liberator-service-company','cooke-carpentry-construction','hart-builders','rolled-right-painting']){
    const content=await readFile(new URL(`../dist/businesses/${slug}/index.html`,import.meta.url),'utf8');
    assert.ok(content.includes('Documents to request'));
    assert.ok(content.includes('documents are not recorded'));
    assert.ok(content.includes('not a credential inspection'));
    assert.ok(!content.includes('Vetted by Wazoozie'));
  }
});

test('saving outage preserves direct contact and offers an availability retry',async()=>{
  const env=await page('start','?intent=comfort');
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

test('problem routing and page-specific sharing metadata exist without JavaScript',async()=>{
  const env=await page('help');
  try {
    const links=[...env.document.querySelectorAll('#problemChoices a[data-problem]')];
    assert.equal(links.length,PROBLEMS.length);
    for(const problem of PROBLEMS) assert.ok(links.some(link=>link.dataset.problem===problem.key && link.getAttribute('href')===`/businesses/${BUSINESSES[INTENTS[problem.intent].provider].slug}/`));
    assert.equal(env.document.querySelector('meta[name="twitter:title"]').content,'Who do I call? Local help for home problems');
    const schema=[...env.document.querySelectorAll('script[type="application/ld+json"]')].map(node=>JSON.parse(node.textContent));
    assert.ok(JSON.stringify(schema).includes('BreadcrumbList'));
    assert.ok(!env.document.querySelector('meta[name="twitter:description"]').content.includes('Why Wazoozie'));
  }finally{env.close();}
});

test('contact counting cannot send project text or email draft bodies',async()=>{
  const env=await page('start','?intent=comfort');
  try{
    await import(`../dist/assets/contact-activity.js?test=${Date.now()}`);
    const link=env.document.createElement('a');link.href='mailto:service@mtownhvac.com?body=PRIVATE-PROJECT-TEXT';link.textContent='Email';
    // Avoid opening the test environment's navigation while allowing its click listener.
    env.document.body.append(link);
    link.dispatchEvent(new env.document.defaultView.MouseEvent('click',{bubbles:true,cancelable:true,button:0}));
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(env.requests.length,1);
    assert.equal(env.requests[0].url,'/api/contact-activity');
    const payload=JSON.parse(env.requests[0].options.body);
    assert.deepEqual(payload,{action:'email_draft_click',provider:'middletown',context:'planner'});
    assert.equal(env.requests[0].options.referrerPolicy,'no-referrer');
    assert.ok(!env.requests[0].options.body.includes('PRIVATE'));
  }finally{env.close();}
});

test('whole-home categories start neutral and route doors and painting with relevant scope prompts',async()=>{
  const env=await page('start');
  try{
    await import(`../dist/assets/project.js?balanced=${Date.now()}`);
    assert.equal(env.document.querySelectorAll('#projectChoices input').length,10);
    assert.equal(env.document.querySelectorAll('#projectChoices input:checked').length,0);
    assert.equal(env.document.querySelector('#projectNext1').disabled,true);
    assert.equal(env.document.querySelector('#projectQuickConnect').hidden,true);
    assert.ok(!env.document.querySelector('#projectBusiness').textContent.includes('Middletown'));
    for(const key of ['doors','windows','decks','additions','painting']){
      const radio=env.document.querySelector(`#projectChoices input[value="${key}"]`);
      radio.checked=true;radio.dispatchEvent(new env.document.defaultView.Event('change',{bubbles:true}));
      assert.equal(env.document.querySelector('#projectNext1').disabled,false);
      const expectedBusiness = key === 'painting' ? 'Rolled Right Painting' : 'Hart Builders';
      assert.ok(env.document.querySelector('#projectBusiness').textContent.includes(expectedBusiness));
      assert.ok(env.document.querySelector('#projectQuickConnect a[href="' + (key === 'painting' ? 'tel:+16102919552' : 'tel:+12153505502') + '"]'));
      assert.equal(env.document.querySelector('#projectServiceDetailLabel').hidden,true);
      assert.equal(env.document.querySelectorAll('#projectPrompts li').length,3);
      assert.ok(!env.document.querySelector('#projectPrompts').textContent.includes('Furnace'));
    }
    assert.ok(env.document.querySelector('#projectBusiness').textContent.includes('Rolled Right Painting'));
    assert.ok(env.document.querySelector('#projectQuickConnect a[href="tel:+16102919552"]'));
    const heating=env.document.querySelector('#projectChoices input[value="comfort"]');
    heating.checked=true;heating.dispatchEvent(new env.document.defaultView.Event('change',{bubbles:true}));
    assert.equal(env.document.querySelector('#projectServiceDetailLabel').hidden,false);
    env.document.querySelector('[name="consent"]').checked=true;
    const detail=env.document.querySelector('#projectServiceDetail');detail.value='boiler';detail.dispatchEvent(new env.document.defaultView.Event('change',{bubbles:true}));
    assert.equal(env.document.querySelector('[name="consent"]').checked,false);
    assert.ok(env.document.querySelector('#projectPrompts').textContent.includes('Gas or oil'));
    assert.ok(env.document.querySelector('#projectBusiness').textContent.includes('Middletown'));
  }finally{env.close();}
});

test('home-service page finder preserves direct routes for whole-home projects',async()=>{
  const markup=await readFile(new URL('../dist/home-services/index.html',import.meta.url),'utf8');
  const dom=new JSDOM(markup);
  try{
    const entries=[...dom.window.document.querySelectorAll('[data-project-choice] > a')];
    assert.equal(entries.length,14);
    for(const key of ['doors','windows','decks','additions','painting'])assert.ok(entries.some(link=>link.getAttribute('href')===`/start/?intent=${key}`));
  }finally{dom.window.close();}
});

test('home-service directory still initializes after category navigation is replaced',async()=>{
  const markup=await readFile(new URL('../dist/home-services/index.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../dist/assets/home.js',import.meta.url),'utf8');
  const dom=new JSDOM(markup,{url:'https://wazoozie.com/',runScripts:'outside-only'});
  try{
    dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
    dom.window.eval(script);
    assert.equal(dom.window.document.querySelectorAll('[data-project-choice] > a').length,14);
    assert.equal(dom.window.document.querySelectorAll('#providerResults .procard').length,6);
    assert.ok(dom.window.document.querySelector('#resultCount').textContent.includes('6'));
    for (const [service,name,tel] of [['painting','Rolled Right Painting','+16102919552'],['construction-remodeling','Hart Builders','+12153505502']]) {
      dom.window.document.querySelector('#serviceSearch').value=service;
      dom.window.document.querySelector('#searchForm').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
      const results=dom.window.document.querySelector('#providerResults');
      assert.equal(results.querySelectorAll('.procard').length,1);
      assert.ok(results.textContent.includes(name));
      assert.ok(results.querySelector(`a[href="tel:${tel}"]`));
      assert.ok(!results.innerHTML.includes('undefined'));
    }
  }finally{dom.window.close();}
});

test('contractor signup preserves homeowner choice and submits a reviewed-interest application without billing',async()=>{
  const env=await page('for-contractors');
  try{
    globalThis.fetch=async(url,options)=>{
      env.requests.push({url,options});
      if(url.includes('capabilities'))return Response.json({captureReady:true});
      const payload=JSON.parse(options.body);
      return Response.json({reference:payload.id,status:'awaiting_review',published:false,charged:false});
    };
    await import(`../dist/assets/contractors.js?test=${Date.now()}`);await new Promise(resolve=>setImmediate(resolve));
    const form=env.document.querySelector('#contractorForm');
    const fields={businessName:'Synthetic Contractor',contactName:'Synthetic Test',phone:'202-555-0100',email:'test@example.invalid',town:'Media',coverage:'Media and nearby Delaware County towns',insurance:'yes',interest:'sponsored'};
    for(const [name,value] of Object.entries(fields))form.elements[name].value=value;
    form.querySelector('input[value="carpentry"]').checked=true;
    const submit=()=>form.dispatchEvent(new env.document.defaultView.Event('submit',{bubbles:true,cancelable:true}));
    submit();assert.equal(env.requests.filter(r=>r.options?.method==='POST').length,0);
    form.elements.consent.checked=true;submit();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(env.requests.filter(r=>r.options?.method==='POST').length,1);
    assert.equal(env.document.querySelector('#applicationReceipt').hidden,false);
    assert.ok(env.document.querySelector('#applicationReceipt').textContent.includes('no payment has been taken'));
    assert.equal(env.document.querySelector('input[name="cardNumber"]'),null);
    const posted=JSON.parse(env.requests.find(r=>r.options?.method==='POST').options.body);assert.equal(posted.interest,'sponsored');assert.deepEqual(posted.services,['carpentry']);
  }finally{env.close();}
});


test('optional planner reaches review without personal details and only submits after valid contact and consent',async()=>{
 const env=await page('start','?intent=comfort',{captureReady:true,emailProviders:['middletown']});
 try{
  await import(`../dist/assets/project.js?optional=${Date.now()}`);await new Promise(resolve=>setImmediate(resolve));
  const d=env.document,form=d.querySelector('#projectForm');
  assert.ok(d.querySelector('#projectQuickConnect a[href^="https://book.housecallpro.com/"]'));
  assert.equal(d.querySelector('#projectStep2 [name="phone"]'),null);
  d.querySelector('#projectNext1').click();form.elements.details.value='Synthetic local notes about a room comfort concern.';d.querySelector('#projectNext2').click();
  assert.equal(d.querySelector('#projectStep3').hidden,false);assert.equal(form.elements.phone.value,'');
  assert.equal(env.requests.filter(r=>r.options?.method==='POST').length,0);
  form.elements.consent.checked=true;form.dispatchEvent(new d.defaultView.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setImmediate(resolve));
  assert.equal(env.requests.filter(r=>r.options?.method==='POST').length,0,'missing contact details never submit');
  for(const [key,value] of Object.entries({name:'Synthetic Test',phone:'202-555-0100',town:'Media',zip:'19063'}))form.elements[key].value=value;
  form.dispatchEvent(new d.defaultView.Event('input',{bubbles:true}));
  const booking=new URL(d.querySelector('#reviewConnections a[href^="https://book.housecallpro.com/"]').href);
  assert.equal(booking.searchParams.has('name'),false);assert.equal(booking.searchParams.has('phone'),false);assert.equal(booking.searchParams.has('email'),false);
  form.dispatchEvent(new d.defaultView.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setImmediate(resolve));
  const posts=env.requests.filter(r=>r.options?.method==='POST');assert.equal(posts.length,1);assert.equal(JSON.parse(posts[0].options.body).notifyProvider,true);
 }finally{env.close();}
});
