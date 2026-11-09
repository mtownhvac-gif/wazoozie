import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {handleModelLab,LAB_MODELS,LAB_SYSTEM} from '../server/model-lab.mjs';
import worker from '../worker.mjs';
const token='test-only-scoped-token-1234567890';
const model=Object.keys(LAB_MODELS)[0];
const request=(body={},headers={})=>new Request('https://wazoozie.com/api/model-lab',{method:'POST',headers:{Origin:'https://wazoozie.com','Content-Type':'application/json',Authorization:`Bearer ${token}`,...headers},body:JSON.stringify({model,prompt:'A fictional upstairs comfort problem.',consent:true,...body})});
test('model lab rejects cross-origin calls, missing credentials, unsupported models and large bodies before provider spending',async()=>{
 let calls=0;const never=()=>{calls++;throw new Error('must not call');};
 for(const [req,status] of [[request({}, {Origin:'https://evil.invalid'}),403],[request({}, {Authorization:''}),401],[request({model:'evil/model'}),400],[request({consent:false}),400],[request({prompt:'x'.repeat(3001)}),400],[request({prompt:'x'.repeat(13000)}),413],[request({}, {'Content-Type':'text/plain'}),415]]){
  const result=await handleModelLab(req,{},never);assert.equal(result.status,status);assert.equal(result.headers.get('Cache-Control'),'no-store');
 }
 assert.equal(calls,0);
});
test('lab sends the same bounded directory context only to Cloudflare, reports real metrics and does not echo credentials',async()=>{
 let captured;const result=await handleModelLab(request(),{},async(url,options)=>{captured={url,options};return Response.json({choices:[{message:{content:`Safe next steps. ${token}`},finish_reason:'length'}],usage:{prompt_tokens:120,completion_tokens:100},model:'reported-model'});});
 const data=await result.json();assert.equal(result.status,200);assert.match(captured.url,/^https:\/\/api.cloudflare.com\/client\/v4\/accounts\/3ad8f68ca56ff4def783a772157a9012\/ai\/v1\/chat\/completions$/);
 const sent=JSON.parse(captured.options.body);assert.equal(sent.messages[0].content,LAB_SYSTEM);assert.equal(sent.max_completion_tokens,1024);assert.equal(sent.stream,false);assert.equal(sent.model,model);assert.equal(captured.options.headers['cf-aig-collect-log'],'false');assert.equal(captured.options.headers['cf-aig-skip-cache'],'true');assert.equal(captured.options.headers['cf-aig-max-attempts'],'1');assert.equal(captured.options.redirect,'error');assert.ok(!captured.options.body.includes(token));assert.ok(!JSON.stringify(data).includes(token));assert.equal(data.returnedModel,'reported-model');assert.equal(data.finishReason,'length');assert.equal(data.usage.input,120);assert.equal(data.cost,null);assert.ok(data.elapsedMs>=0);
});
test('upstream failures and empty answers stay errors, with no invented results or leaked provider body',async()=>{
 for(const status of [400,401,402,403,404,429,500]){const result=await handleModelLab(request(),{},async()=>new Response(`private credential ${token}`,{status}));const data=await result.json();assert.equal(result.status,502);assert.equal(data.upstreamStatus,status);assert.ok(!JSON.stringify(data).includes(token));assert.equal(data.text,undefined);}
 const empty=await handleModelLab(request(),{},async()=>Response.json({choices:[]}));assert.equal(empty.status,502);
 const outage=await handleModelLab(request(),{},async()=>{throw new Error(token);});assert.equal(outage.status,504);assert.ok(!(await outage.text()).includes(token));
});
test('workbench page is unlisted, noindex, uncached and isolated from public scripts',async()=>{
 const html=await readFile(new URL('../dist/model-lab/index.html',import.meta.url),'utf8');assert.match(html,/noindex,nofollow/);assert.ok(!html.includes('request-context.js'));assert.ok(!html.includes('analytics'));
 const sitemap=await readFile(new URL('../dist/sitemap.xml',import.meta.url),'utf8');assert.ok(!sitemap.includes('/model-lab/'));
 const response=await worker.fetch(new Request('https://wazoozie.com/model-lab/'),{ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})}});
 assert.equal(response.headers.get('Cache-Control'),'no-store');assert.match(response.headers.get('X-Robots-Tag'),/noindex/);assert.match(response.headers.get('Content-Security-Policy'),/connect-src 'self'/);assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
});
async function lab(){const html=await readFile(new URL('../dist/model-lab/index.html',import.meta.url),'utf8');const js=await readFile(new URL('../assets/model-lab.js',import.meta.url),'utf8');const dom=new JSDOM(html,{url:'https://wazoozie.com/model-lab/',runScripts:'outside-only'});dom.window.labFixture={LAB_MODELS,LAB_SYSTEM};let calls=0;let exported;dom.window.fetch=async()=>{calls++;return {ok:true,json:async()=>({text:'<img src=x onerror=alert(1)> A literal answer.',elapsedMs:1234,usage:{input:20,output:30},returnedModel:model,finishReason:'stop'})};};dom.window.URL.createObjectURL=blob=>{exported=blob;return 'blob:example';};dom.window.URL.revokeObjectURL=()=>{};dom.window.HTMLAnchorElement.prototype.click=()=>{};dom.window.Blob=class {constructor(parts){this.text=parts.join('');}};dom.window.eval(js.replace(/^import .*?;\n/,'const {LAB_MODELS,LAB_SYSTEM}=window.labFixture;\n'));return {dom,$:id=>dom.window.document.getElementById(id),calls:()=>calls,exported:()=>exported};}
test('manual comparisons never call a provider; ratings, blind names, export and clearing work without exporting the token',async()=>{
 const e=await lab();try{e.$('lab-mode').value='manual';e.$('lab-token').value=token;await e.$('run-models').onclick();assert.equal(e.calls(),0);const inputs=e.dom.window.document.querySelectorAll('.manual-answer');assert.equal(inputs.length,3);inputs[0].value='Manual answer';inputs[0].dispatchEvent(new e.dom.window.Event('input'));e.$('blind-toggle').click();assert.equal(e.dom.window.document.querySelector('.result-top h3').textContent,'Answer A');for(const select of e.dom.window.document.querySelector('.scorecard').querySelectorAll('select')){select.value='4';select.dispatchEvent(new e.dom.window.Event('change'));}assert.match(e.dom.window.document.querySelector('.score-total').textContent,/16 \/ 20/);e.$('export-results').click();const output=JSON.parse(e.exported().text);assert.equal(output.mode,'manual');assert.equal(output.results[0].text,'Manual answer');assert.equal(output.results[0].elapsedMs,null);assert.ok(!e.exported().text.includes(token));e.$('forget-token').click();assert.equal(e.$('lab-token').value,'');e.$('clear-results').click();assert.equal(e.$('export-results').disabled,true);assert.equal(e.dom.window.document.querySelectorAll('.result-card').length,0);}finally{e.dom.window.close();}
});
test('live UI requires consent and token; returned markup stays text and reports measured speed',async()=>{
 const e=await lab();try{await e.$('run-models').onclick();assert.equal(e.calls(),0);e.$('lab-token').value=token;await e.$('run-models').onclick();assert.equal(e.calls(),0);e.$('lab-consent').checked=true;await e.$('run-models').onclick();assert.equal(e.calls(),3);assert.equal(e.dom.window.document.querySelectorAll('.answer img').length,0);assert.match(e.dom.window.document.querySelector('.answer').textContent,/<img/);assert.match(e.dom.window.document.querySelector('.metrics').textContent,/1.23s/);assert.equal(e.$('run-models').disabled,false);}finally{e.dom.window.close();}
});
test('free-allowance baseline uses the direct hosted model endpoint and parses its real response',async()=>{
 const model='@cf/meta/llama-3.3-70b-instruct-fp8-fast';let target,body;
 const result=await handleModelLab(request({model}),{},async(url,options)=>{target=url;body=JSON.parse(options.body);assert.equal(options.headers['cf-aig-gateway-id'],undefined);return Response.json({success:true,result:{response:'A direct hosted-model answer.',usage:{prompt_tokens:30,completion_tokens:12}}});});
 assert.match(target,/\/ai\/run\/@cf\/meta\/llama-3.3-70b-instruct-fp8-fast$/);assert.equal(body.max_tokens,1024);assert.equal(body.model,undefined);const data=await result.json();assert.equal(data.text,'A direct hosted-model answer.');assert.equal(data.usage.output,12);assert.equal(data.cost,null);
});
