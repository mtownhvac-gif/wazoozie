import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
test('feed filters existing stories and shares only the public page link',async()=>{
 const dom=new JSDOM(await readFile('dist/local-stories/index.html','utf8'),{url:'https://wazoozie.com/local-stories/'});
 const previous=new Map();let copied;
 for(const [key,value] of Object.entries({document:dom.window.document,location:dom.window.location,navigator:{clipboard:{writeText:async url=>{copied=url;}}}})){
  previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true});
 }
 try{
  await import('../assets/neighborhood-feed.js');
  const d=dom.window.document;
  assert.equal(d.querySelectorAll('[data-feed-topic]').length,7);
  d.querySelector('[data-feed-filter="electrical"]').click();
  assert.deepEqual([...d.querySelectorAll('[data-feed-topic]')].filter(x=>!x.hidden).map(x=>x.dataset.feedTopic),['electrical']);
  d.querySelector('[data-feed-filter="all"]').click();
  assert.equal(d.querySelectorAll('[data-feed-topic][hidden]').length,0);
  d.querySelector('[data-share-page]').click();await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(copied,'https://wazoozie.com/businesses/cooke-carpentry-construction/');
 }finally{dom.window.close();for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
