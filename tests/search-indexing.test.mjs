import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const origin='https://wazoozie.com';
const page=path=>new JSDOM(fs.readFileSync('dist'+path+'index.html','utf8'),{url:origin+path});

test('every public sitemap page is indexable, unique, and reachable through HTML links',()=>{
 const xml=new JSDOM(fs.readFileSync('dist/sitemap.xml','utf8'),{contentType:'application/xml'});
 const urls=[...xml.window.document.querySelectorAll('url > loc')].map(e=>e.textContent);
 const known=new Set(urls),edges=new Map(),titles=new Set(),descriptions=new Set();
 assert.equal(known.size,urls.length);assert.ok(urls.length>70);
 for(const url of urls){
  const u=new URL(url);assert.equal(u.origin,origin);assert.equal(u.search,'');assert.equal(u.hash,'');
  assert.doesNotMatch(u.pathname,/^\/(?:api|account|model-lab|agent-content|404)\//);
  const dom=page(u.pathname),d=dom.window.document;
  assert.equal(d.querySelectorAll('link[rel="canonical"]').length,1,url);
  assert.equal(d.querySelector('link[rel="canonical"]').href,url);
  assert.doesNotMatch(d.querySelector('meta[name="robots"]').content,/noindex|none/);
  assert.ok(!titles.has(d.title),'duplicate title: '+url);titles.add(d.title);
  const description=d.querySelector('meta[name="description"]').content;
  assert.ok(!descriptions.has(description),'duplicate description: '+url);descriptions.add(description);
  edges.set(url,[...d.querySelectorAll('a[href]')].map(a=>{try{const target=new URL(a.href);return target.origin+target.pathname;}catch{return '';}}).filter(target=>known.has(target)));
  dom.window.close();
 }
 const seen=new Set(),queue=[origin+'/'];
 for(let url;url=queue.shift();){if(seen.has(url))continue;seen.add(url);queue.push(...edges.get(url));}
 assert.deepEqual(urls.filter(url=>!seen.has(url)),[],'orphan sitemap pages');
 xml.window.close();
});

test('existing HVAC pages expose crawlable symptom and decision routes',()=>{
 for(const path of ['/businesses/middletown-hvac/','/services/heating-cooling/','/services/furnace-repair/','/services/second-opinion/']){
  const dom=page(path),section=dom.window.document.querySelector('.hvac-related');assert.ok(section,path);
  for(const target of ['/services/heating-cooling/','/services/furnace-repair/','/services/second-opinion/','/services/water-heaters/']){
   assert.equal(Boolean(section.querySelector(`a[href="${target}"]`)),path!==target);
  }
  assert.match(section.textContent,/Confirm service coverage for your exact address/);dom.window.close();
 }
});

test('second-opinion guidance adds useful evidence questions without promising an outcome',()=>{
 const dom=page('/services/second-opinion/'),d=dom.window.document;
 const section=d.getElementById('second-opinion-evidence').parentElement;
 assert.equal(section.querySelectorAll('ol li').length,5);
 assert.match(section.textContent,/Equipment age alone is not a diagnosis/);
 assert.match(section.textContent,/Do not restart equipment that was shut down or tagged unsafe/);
 assert.match(section.textContent,/does not promise a cheaper repair/);
 assert.ok(section.querySelector('a[href="/compare/"]'));
 assert.ok(section.querySelector('a[href="https://www.mtownhvac.com/services/"]'));
 assert.equal(section.querySelectorAll('form,input,textarea').length,0);
 const markdown=fs.readFileSync('dist/agent-content/services/second-opinion/index.md','utf8');
 assert.match(markdown,/A diagnosis to understand/);dom.window.close();
});
