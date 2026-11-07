import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const source=readFileSync(new URL('../assets/public-discovery.js',import.meta.url),'utf8');
const catalog=JSON.parse(readFileSync(new URL('../dist/assets/public-discovery.json',import.meta.url),'utf8'));
test('unsupported browsers do not fetch or register agent tools',()=>{
 const dom=new JSDOM('<p>Public page</p>',{url:'https://wazoozie.com/',runScripts:'outside-only'});
 dom.window.fetch=()=>assert.fail('Unexpected fetch');dom.window.eval(source);dom.window.close();
});
test('browser tools return public matches, validate input and clean up their registrations',async()=>{
 const dom=new JSDOM('<input value="private user note">',{url:'https://wazoozie.com/',runScripts:'outside-only'});const w=dom.window;const tools=[];let signal;
 w.fetch=async(url,options)=>{assert.equal(url,'/assets/public-discovery.json');assert.equal(options.credentials,'omit');return {ok:true,json:async()=>catalog};};
 Object.defineProperty(w.document,'modelContext',{value:{async registerTool(tool,options){tools.push(tool);signal=options.signal;}}});
 w.eval(source);await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(tools.length,2);assert.ok(tools.every(t=>t.annotations.readOnlyHint));
 const search=tools.find(t=>t.name==='search_local_businesses');
 const auto=await search.execute({query:'C&J',category:'auto'});assert.equal(auto.matches.length,1);assert.equal(auto.matches[0].phone,'610-485-3103');
 const agent=await search.execute({query:'Caitlin',category:'realestate'});assert.equal(agent.matches[0].name,'Caitlin Kerezsi');
 await assert.rejects(search.execute({query:'x'.repeat(101)}));await assert.rejects(search.execute({category:'private'}));await assert.rejects(search.execute({accountId:'hidden'}));
 const resources=await tools[1].execute({});assert.match(resources.resources.ductless,/ductless-mini-splits/);assert.doesNotMatch(JSON.stringify(auto),/private user note/);
 w.dispatchEvent(new w.Event('pagehide'));assert.equal(signal.aborted,true);w.close();
});
test('render optimization combines local CSS without importing fonts after style rules',()=>{
 for(const path of ['index.html','account/index.html','services/ductless-mini-splits/index.html']){
  const html=readFileSync(new URL('../dist/'+path,import.meta.url),'utf8');const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)];assert.equal(styles.length,1);
  const css=readFileSync(new URL('../dist'+styles[0][1],import.meta.url),'utf8');assert.match(css,/^@import/);assert.equal(css.match(/@import/g).length,1);
 }
 const home=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(home,/clay-family-painting.webp/);assert.doesNotMatch(home,/AI-created|AI-generated/);
 const account=readFileSync(new URL('../dist/account/index.html',import.meta.url),'utf8');assert.doesNotMatch(account,/public-discovery.js/);
});
