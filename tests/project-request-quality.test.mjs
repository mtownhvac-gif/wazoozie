import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
let sequence=0;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function page(fetcher=async url=>Response.json(url.includes('capabilities')?{captureReady:true,emailProviders:['middletown']}:{status:'saved',providerDelivery:'automation_accepted'})) {
  const dom=new JSDOM(readFileSync('dist/start/index.html','utf8'),{url:'https://wazoozie.com/start/?intent=comfort'}),d=dom.window.document;
  const previous=new Map(),requests=[],timers=new Map();
  for(const name of ['document','location','history','navigator','FormData','sessionStorage']){
    previous.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
    Object.defineProperty(globalThis,name,{value:dom.window[name],configurable:true});
  }
  const originalFetch=globalThis.fetch,originalTimer=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
  globalThis.fetch=async(url,options)=>{requests.push({url,options});return fetcher(url,options);};
  globalThis.setTimeout=(callback,delay)=>{if([12000,20000].includes(delay)){const token={};timers.set(token,{callback,delay});return token;}return originalTimer(callback,delay);};
  globalThis.clearTimeout=token=>{if(timers.has(token))timers.delete(token);else originalClear(token);};
  await import(`../dist/assets/project.js?quality=${++sequence}`);await tick();
  const form=d.querySelector('#projectForm');
  return {dom,d,form,requests,timers,$:id=>d.getElementById(id),posts:()=>requests.filter(r=>r.options?.method==='POST'),
    input(name,value){const field=form.elements[name];if(field.type==='checkbox')field.checked=value;else field.value=value;field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));},
    review(){d.querySelector('#projectNext1').click();form.elements.details.value='Synthetic test: one room is not comfortable.';d.querySelector('#projectNext2').click();},
    complete(){for(const [name,value] of Object.entries({name:'Synthetic Test',phone:'202-555-0100',town:'Media',zip:'19063'}))form.elements[name].value=value;form.elements.consent.checked=true;},
    submit(){form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));},
    expire(delay){const timer=[...timers.values()].find(t=>t.delay===delay);assert.ok(timer,'expected request deadline');timer.callback();},
    close(){dom.window.close();globalThis.fetch=originalFetch;globalThis.setTimeout=originalTimer;globalThis.clearTimeout=originalClear;for(const [name,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
  };
}

test('persistent project errors link to the field, announce the problem and clear after correction',async()=>{
  const e=await page();try{
    e.$('projectNext1').click();e.$('projectNext2').click();
    const field=e.form.elements.details;
    assert.equal(e.$('projectStep2').hidden,false);assert.equal(field.getAttribute('aria-invalid'),'true');
    assert.match(e.d.getElementById(field.getAttribute('aria-describedby')).textContent,/at least 15/);
    assert.equal(e.d.activeElement,e.$('projectError'));e.$('projectError').querySelector('a').click();assert.equal(e.d.activeElement,field);
    e.input('details','    ');assert.equal(field.getAttribute('aria-invalid'),'true');
    e.input('details','Synthetic test: the room feels too cold.');assert.equal(field.hasAttribute('aria-invalid'),false);assert.equal(e.$('projectError').textContent,'');
    e.$('projectNext2').click();assert.equal(e.$('projectStep3').hidden,false);assert.equal(e.posts().length,0);
  }finally{e.close();}
});

test('contact validation shows all useful errors without sending and preserves existing descriptions',async()=>{
  const e=await page();try{
    e.review();const phone=e.form.elements.phone;phone.setAttribute('aria-describedby','projectContactNote');
    e.input('name','  ');e.input('phone','123');e.input('email','person@example');e.input('town',' ');e.input('zip','12');e.submit();await tick();
    assert.equal(e.posts().length,0);assert.equal(e.$('projectError').querySelectorAll('li').length,6);
    assert.match(e.$('projectError').textContent,/permission box/);assert.match(phone.getAttribute('aria-describedby'),/projectContactNote/);
    for(const [name,value] of Object.entries({name:'Synthetic Test',phone:'202-555-0100',email:'',town:'Media',zip:'19063',consent:true}))e.input(name,value);
    assert.equal(e.$('projectError').textContent,'');assert.equal(phone.getAttribute('aria-describedby'),'projectContactNote');
    e.submit();await tick();assert.equal(e.posts().length,1);assert.equal(e.$('projectReceipt').hidden,false);
    assert.match(e.$('receiptDelivery').textContent,/Wazoozie Help/);
    const body=new URLSearchParams(e.$('receiptShare').querySelector('a[href^="mailto:"]').href.split('?')[1]).get('body');assert.match(body,/Wazoozie Help/);assert.doesNotMatch(body,/Zapier accepted the Middletown/);
    e.submit();await tick();assert.equal(e.posts().length,1,'a hidden completed form cannot submit twice');
  }finally{e.close();}
});

test('Enter on a planning step never submits hidden contact fields',async()=>{
  const e=await page();try{e.complete();e.submit();await tick();assert.equal(e.posts().length,0);e.$('projectNext1').click();e.form.elements.details.value='Synthetic planning notes about the room.';e.submit();await tick();assert.equal(e.posts().length,0);assert.equal(e.$('projectError').textContent,'');}finally{e.close();}
});

test('a late sending capability clears earlier consent, and failed retry cannot retain a stale delivery route',async()=>{
  let resolve,mode='pending';const e=await page(async()=>mode==='pending'?new Promise(r=>{resolve=r;}):mode==='failed'?Promise.reject(Error('offline')):Response.json({captureReady:true,emailProviders:[]}));
  try{
    e.review();e.form.elements.consent.checked=true;
    resolve(Response.json({captureReady:true,emailProviders:['middletown','invented']}));await tick();
    assert.equal(e.form.elements.consent.checked,false);assert.match(e.$('captureStatus').textContent,/permission text again/);
    mode='failed';e.$('retryCapture').click();await tick();assert.equal(e.$('projectSave').disabled,true);assert.equal(e.$('retryCapture').hidden,false);assert.match(e.$('submissionConsent').textContent,/for review and follow-up/);
    mode='save';e.$('retryCapture').click();e.$('retryCapture').click();await tick();assert.equal(e.$('projectSave').disabled,false);assert.match(e.$('projectSave').textContent,/Save my project brief/);assert.equal(e.requests.length,3);
  }finally{e.close();}
});

test('capability timeout keeps direct contact and an explicit retry without sending a lead',async()=>{
  const e=await page(async()=>new Promise(()=>{}));try{
    assert.equal(e.$('projectSave').disabled,true);e.expire(12000);await tick();
    assert.equal(e.$('retryCapture').hidden,false);assert.equal(e.$('retryCapture').disabled,false);assert.match(e.$('captureStatus').textContent,/have not been sent/);
    assert.ok(e.$('projectQuickConnect').querySelector('a[href="tel:+16105006416"]'));assert.equal(e.posts().length,0);assert.equal(e.requests[0].options.signal.aborted,true);
  }finally{e.close();}
});

test('malformed capabilities fail closed without throwing away the direct-contact route',async()=>{
  const e=await page(async()=>Response.json(null));try{assert.equal(e.$('projectSave').disabled,true);assert.equal(e.$('retryCapture').hidden,false);assert.ok(e.$('projectQuickConnect').querySelector('a[href^="tel:"]'));}finally{e.close();}
});

test('timed-out submissions preserve the exact payload for one user-triggered retry, with no automatic resend',async()=>{
  let posts=0,late;const e=await page(async url=>url.includes('capabilities')?Response.json({captureReady:true,emailProviders:['middletown']}):++posts===1?new Promise(resolve=>{late=resolve;}):Response.json({status:'saved',providerDelivery:'automation_accepted'}));
  try{
    e.review();e.complete();e.submit();e.submit();await tick();assert.equal(e.posts().length,1);assert.equal(e.form.getAttribute('aria-busy'),'true');assert.equal(e.form.elements.name.disabled,true);assert.equal(e.$('projectSave').disabled,true);
    assert.ok(e.$('reviewConnections').querySelector('a[href^="tel:"]'));assert.equal([...e.$('reviewConnections').querySelectorAll('button')].find(b=>b.textContent==='Copy my brief').disabled,false);
    e.expire(20000);await tick();assert.equal(e.form.hasAttribute('aria-busy'),false);assert.equal(e.$('projectSave').disabled,false);assert.equal(e.form.elements.name.disabled,true);assert.match(e.$('projectError').textContent,/could not confirm whether/);assert.match(e.$('projectSave').textContent,/Retry the same/);assert.equal(e.posts().length,1);
    late(Response.json({status:'saved',providerDelivery:'automation_accepted'}));await tick();assert.equal(e.$('projectReceipt').hidden,true,'late response cannot claim completion after timeout');
    e.submit();await tick();assert.equal(e.posts().length,2);assert.equal(e.posts()[0].options.body,e.posts()[1].options.body);assert.equal(e.$('projectReceipt').hidden,false);assert.equal(e.timers.size,0);
  }finally{e.close();}
});

test('a definite validation rejection unlocks fields while an uncertain save leaves the same request intact',async()=>{
  let mode='reject';const e=await page(async url=>url.includes('capabilities')?Response.json({captureReady:true}):mode==='reject'?Response.json({error:'Please check your town.'},{status:400}):Response.json({error:'Unknown save outcome.'},{status:503}));
  try{e.review();e.complete();e.submit();await tick();assert.equal(e.form.elements.town.disabled,false);assert.match(e.$('projectError').textContent,/check your town/);assert.match(e.$('projectSave').textContent,/Save my/);mode='uncertain';e.submit();await tick();assert.equal(e.form.elements.town.disabled,true);assert.match(e.$('projectSave').textContent,/Retry the same/);assert.equal(e.$('projectReceipt').hidden,true);}finally{e.close();}
});

test('the no-script fallback reaches the actual contact directory',()=>{
  const dom=new JSDOM(readFileSync('dist/start/index.html','utf8'));assert.ok(dom.window.document.querySelector('noscript a[href="/book/"]'));dom.window.close();
});

 test('coverage and urgent-contact notices remain visible where the visitor makes the sending decision',async()=>{
 const e=await page();try{e.review();e.$('projectStep3').querySelector('[data-back]').click();e.form.elements.timing.value='Urgent';e.form.elements.timing.dispatchEvent(new e.dom.window.Event('change'));e.$('projectNext2').click();assert.match(e.$('projectReview').textContent,/not emergency dispatch/);e.form.elements.state.value='NJ';e.form.elements.state.dispatchEvent(new e.dom.window.Event('change'));assert.ok(e.$('projectStep3').contains(e.$('coverageNotice')));assert.match(e.$('coverageNotice').textContent,/coverage is not confirmed/);assert.equal(e.$('projectStep3').hidden,false);assert.equal(e.posts().length,0);}finally{e.close();}
});

test('an uncertain request cannot be retried across the server monthly storage boundary',async()=>{
 const OriginalDate=globalThis.Date;let nextMonth=false;
 const e=await page(async url=>url.includes('capabilities')?Response.json({captureReady:true}):Response.json({error:'Uncertain save'},{status:503}));
 try{globalThis.Date=class extends OriginalDate { constructor(...args){super(...(args.length?args:[nextMonth?'2027-02-01T00:00:00Z':'2027-01-31T23:59:59Z']));} static now(){return new OriginalDate(nextMonth?'2027-02-01T00:00:00Z':'2027-01-31T23:59:59Z').getTime();}};
 e.review();e.complete();e.submit();await tick();assert.equal(e.posts().length,1);nextMonth=true;e.submit();await tick();assert.equal(e.posts().length,1);assert.match(e.$('projectError').textContent,/confirm receipt before starting another brief/);
 }finally{globalThis.Date=OriginalDate;e.close();}
});
