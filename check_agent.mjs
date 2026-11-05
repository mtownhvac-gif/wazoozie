import assert from 'node:assert/strict';
import worker, {prefersMarkdown} from './worker.mjs';
assert.equal(prefersMarkdown('text/html,application/xhtml+xml,*/*;q=0.8'), false);
assert.equal(prefersMarkdown('text/markdown'), true);
assert.equal(prefersMarkdown('text/markdown;q=0'), false);
assert.equal(prefersMarkdown('text/html,text/markdown;q=0.5'), false);
const env = {ASSETS:{fetch: async req => {
 const path=new URL(req.url).pathname;
 if(path==='/agent-content/about/index.md')return new Response('# About Wazoozie',{headers:{'content-type':'text/plain'}});
 if(path==='/missing/')return new Response('Missing',{status:404,headers:{'content-type':'text/html'}});
 return new Response('<h1>Wazoozie</h1>',{headers:{'content-type':'text/html'}});
}}};
for(const method of ['GET','HEAD']){
 const md=await worker.fetch(new Request('https://wazoozie.com/about/',{method,headers:{accept:'text/markdown'}}),env);
 assert.match(md.headers.get('content-type'),/^text\/markdown/);
 assert.equal(md.headers.get('vary'),'Accept');
 assert.match(md.headers.get('link'),/sitemap.xml/);
}
const html=await worker.fetch(new Request('https://wazoozie.com/about/',{headers:{accept:'text/html'}}),env);
assert.match(html.headers.get('content-type'),/text\/html/);
const missing=await worker.fetch(new Request('https://wazoozie.com/missing/',{headers:{accept:'text/markdown'}}),env);
assert.equal(missing.status,404);
console.log('Markdown negotiation, browser HTML, discovery headers and missing-page status passed.');
const redirect=await worker.fetch(new Request('https://www.wazoozie.com/about/index.html?ref=test'),env);
assert.equal(redirect.status,301);
assert.equal(redirect.headers.get('location'),'https://wazoozie.com/about/?ref=test');
