import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {entryContext,requestPageContext} from '../lead-context.mjs';
import {validateBrief} from '../server/brief-validation.mjs';
import {CONSENT_VERSION} from '../project-config.mjs';
import {emailPayload} from '../server/provider-email.mjs';
const valid=()=>({id:crypto.randomUUID(),startedAt:Date.now()-5000,provider:'middletown',intent:'comfort',name:'Synthetic Test',phone:'202-555-0100',email:'test@example.invalid',town:'Media',zip:'19063',state:'PA',details:'Synthetic local request for context testing only.',timing:'Planning ahead',role:'Homeowner',property:'House',source:'start-page',consent:true,consentVersion:CONSENT_VERSION});
test('request attribution is a bounded last-link category, never a URL or search',()=>{
 assert.equal(entryContext('situation-guide'),'situation-guide');
 for(const value of ['https://example.invalid/private?name=Person','<script>',null,{},'unknown'])assert.equal(entryContext(value),'direct');
 assert.equal(requestPageContext('/guides/surprise-repair-quote/'),'situation-guide');assert.equal(requestPageContext('/pricing-guide/'),'pricing');
 const old=validateBrief(valid()).brief;assert.equal(Object.hasOwn(old,'entryContext'),false,'old-client canonical payload stays unchanged');
 assert.equal(validateBrief({...valid(),entryContext:'pricing'}).brief.entryContext,'pricing');
 assert.equal(Object.hasOwn(validateBrief({...valid(),entryContext:'private-name'}).brief,'entryContext'),false);
 assert.ok(validateBrief({...valid(),entryContext:{name:'private'}}).error);
});
test('request links preserve intent and referral code without storage or background transmission',()=>{
 const dom=new JSDOM('<a id="request" href="/start/?intent=comfort&ref=partner-ryan">Request</a><a id="external" href="https://example.invalid/start/">Other site</a>',{url:'https://wazoozie.com/guides/one-room-too-hot-too-cold/?private=value',runScripts:'outside-only'}),w=dom.window;
 w.fetch=()=>assert.fail('No transmission before the request');
 w.requestPageContext=requestPageContext;w.eval(readFileSync(new URL('../assets/request-context.js',import.meta.url),'utf8').replace(/^import .*;\n/,''));
 const a=w.document.querySelector('#request');a.dispatchEvent(new w.MouseEvent('click',{bubbles:true,button:0}));
 const u=new URL(a.href);assert.equal(u.searchParams.get('intent'),'comfort');assert.equal(u.searchParams.get('ref'),'partner-ryan');assert.equal(u.searchParams.get('entry'),'situation-guide');assert.equal(u.searchParams.has('private'),false);assert.equal(w.localStorage.length,0);assert.equal(w.sessionStorage.length,0);w.close();
});
test('email alerts carry a reference, bounded source and follow-up steps without implying a booking',()=>{
 const b=validateBrief({...valid(),entryContext:'pricing',source:'partner-ryan'}).brief,p=emailPayload(b,Date.UTC(2026,10,6,18));
 assert.match(p.message,/Request-link context: pricing/);assert.match(p.message,/Referral source: partner-ryan/);assert.match(p.message,/2026-11-06T18:00:00.000Z/);assert.match(p.message,/No appointment has been booked/);assert.match(p.message,/Mark contacted only after reaching the customer/);
 assert.doesNotMatch(p.message,/private=value/);
});

test('both request paths retain bounded last-page attribution without copying source queries, form values or changing recipients',()=>{
 const source=readFileSync(new URL('../assets/request-context.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
 for(const [path,expected] of [['/pricing-guide/','pricing'],['/services/heating-cooling/','service'],['/businesses/ryan-dugan-electric/','profile'],['/guides/surprise-repair-quote/','situation-guide']]){
  for(const destination of ['/start/','/request/']){
   const dom=new JSDOM(`<input value="PRIVATE-PROJECT"><a id="request" href="${destination}?intent=electrical&provider=ryan&neighbor=synthetic-ref#details">Request</a><a id="external" href="https://example.invalid${destination}?entry=home">External</a><a id="other" href="/book/">Contacts</a>`,{url:'https://wazoozie.com'+path+'?name=PRIVATE-NAME',runScripts:'outside-only'}),w=dom.window,d=w.document;
   try{
    w.fetch=()=>assert.fail('Attribution must not transmit anything');w.requestPageContext=requestPageContext;w.eval(source);
    // Stop JSDOM navigation after the attribution listener has processed the click.
    d.addEventListener('click',event=>event.preventDefault());
    d.getElementById('request').click();const url=new URL(d.getElementById('request').href);
    assert.equal(url.pathname,destination);assert.equal(url.searchParams.get('entry'),expected);
    assert.equal(url.searchParams.get('intent'),'electrical');assert.equal(url.searchParams.get('provider'),'ryan');
    assert.equal(url.searchParams.get('neighbor'),'synthetic-ref');assert.equal(url.hash,'#details');
    assert.doesNotMatch(url.href,/PRIVATE|name=/);
    for(const id of ['external','other']){const link=d.getElementById(id),before=link.href;link.click();assert.equal(link.href,before);}
    assert.equal(w.localStorage.length,0);assert.equal(w.sessionStorage.length,0);
   }finally{w.close();}
  }
 }
});

test('moving between request screens keeps the existing attribution and the deployed short-form links load the decorator',()=>{
 const source=readFileSync(new URL('../assets/request-context.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
 for(const path of ['/start/','/request/']){
  const dom=new JSDOM('<a href="/request/?intent=comfort&entry=pricing">Request</a><a href="/start/?intent=comfort&entry=pricing">Planner</a>',{url:'https://wazoozie.com'+path,runScripts:'outside-only'}),w=dom.window;
  try{w.requestPageContext=requestPageContext;w.eval(source);w.document.addEventListener('click',event=>event.preventDefault());for(const link of w.document.querySelectorAll('a')){link.click();assert.equal(new URL(link.href).searchParams.get('entry'),'pricing');}}finally{w.close();}
 }
 for(const page of ['pricing-guide','services/heating-cooling','businesses/middletown-hvac']){
  const dom=new JSDOM(readFileSync(new URL('../dist/'+page+'/index.html',import.meta.url),'utf8'));
  try{assert.ok(dom.window.document.querySelector('a[href="/request/"]'),page);assert.ok(dom.window.document.querySelector('script[src="/assets/request-context.js"]'),page);}finally{dom.window.close();}
 }
});
