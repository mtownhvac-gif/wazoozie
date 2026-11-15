import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {pageContext,contactActivityForURL,validateActivity} from '../activity-config.mjs';

test('request-page direct calls are counted separately without transmitting form values, query strings or URLs',()=>{
  const dom=new JSDOM(readFileSync('dist/request/index.html','utf8'),{
    url:'https://wazoozie.com/request/?intent=comfort&entry=home&private=DO-NOT-SEND',runScripts:'outside-only'
  });
  try{
    const w=dom.window,d=w.document,calls=[];
    assert.ok(d.querySelector('script[src="/assets/contact-activity.js"]'),'the published request page must load contact measurement');
    Object.assign(w,{pageContext,contactActivityForURL});
    w.fetch=(url,options)=>{calls.push({url,options});return Promise.resolve({ok:true});};
    d.querySelector('#request-name').value='PRIVATE HOMEOWNER';
    d.querySelector('#request-details').value='PRIVATE PROJECT';
    const source=readFileSync('dist/assets/contact-activity.js','utf8').replace(/^import[^\n]+\n/,'');
    w.eval(source);
    // These contacts are added by the form after its service selection changes.
    const link=d.createElement('a');link.href='tel:+16105006416';link.innerHTML='<span>Call</span>';d.body.append(link);
    d.addEventListener('click',event=>event.preventDefault());
    assert.equal(calls.length,0,'viewing or filling the form must not count a contact');
    link.querySelector('span').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,button:0}));
    assert.equal(calls.length,1);
    assert.equal(calls[0].url,'/api/contact-activity');
    assert.equal(calls[0].options.referrerPolicy,'no-referrer');
    const expected={action:'call_click',provider:'middletown',context:'request'};
    assert.deepEqual(JSON.parse(calls[0].options.body),expected);
    assert.deepEqual(validateActivity(JSON.parse(calls[0].options.body)),expected);
    assert.doesNotMatch(calls[0].options.body,/PRIVATE|DO-NOT-SEND|tel:|intent=|entry=/);
    // A different selected business retains its own identity in the same context.
    link.href='tel:+14452589962';link.click();
    assert.deepEqual(JSON.parse(calls[1].options.body),{...expected,provider:'ryan'});
  }finally{dom.window.close();}
});
