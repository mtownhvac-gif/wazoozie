import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const doc=path=>new JSDOM(readFileSync(new URL('../dist'+path+'index.html',import.meta.url),'utf8'),{url:'https://wazoozie.com'+path}).window.document;
const schema=d=>[...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{const x=JSON.parse(s.textContent);return x['@graph']||[x];});

test('homepage offers equal service choices after the promoted game without an ownership banner',()=>{
 const d=doc('/'),main=d.querySelector('main'),direct=d.querySelector('.service-direct');
 assert.equal(main.children[1].id,'quick-challenge');
 assert.equal(main.children[2],direct);
 assert.equal(d.querySelector('.grand-primary').getAttribute('href'),'/home-services/');
 assert.equal(direct.querySelectorAll('.service-choice').length,6);
 assert.equal(direct.querySelector('a[href^="tel:"]'),null);
 assert.equal(direct.querySelector('a[href^="https://book.housecallpro.com/"]'),null);
 assert.ok(direct.querySelector('a[href="/book/"]'));
 assert.doesNotMatch(d.querySelector('footer').textContent,/Bryan Cordy|owner of Middletown HVAC|Business relationships/);
 assert.match(direct.textContent,/No Wazoozie account needed/);
 const routes=[['handyman','cooke-carpentry-construction'],['electrical','ryan-dugan-electric'],['heating-cooling','middletown-hvac'],['painting','rolled-right-painting'],['plumbing','liberator-service-company'],['construction-remodeling','hart-builders']];
 for(const [i,[service,slug]] of routes.entries()){
  const card=direct.querySelectorAll('.service-choice')[i];
  assert.ok(card.querySelector('a.service-tile[href="/services/'+service+'/"]'),service);
  assert.equal(card.querySelectorAll('a').length,1);
  assert.equal(card.querySelector('a[href^="/businesses/"]'),null);
  assert.ok(doc('/services/'+service+'/').querySelector('a[href="/businesses/'+slug+'/"]'),slug);
  assert.equal(card.className,'service-choice');
 }
 assert.equal(direct.querySelectorAll('.service-next-steps a').length,3);
 assert.ok(d.querySelector('script[src="/assets/contact-activity.js"]'));
 assert.equal(d.querySelector('.brand-comfort-callout'),null);
 d.defaultView.close();
});

test('repair content gives local context, supported service questions and safety boundaries',()=>{
 const d=doc('/services/heating-cooling/');
 assert.match(d.querySelector('h1').textContent,/Heating & AC repair.*Middletown HVAC, Glen Mills/);
 const content=d.querySelector('.service-decision').textContent;
 assert.match(content,/does not guarantee coverage, emergency availability or same-day/);
 assert.match(content,/Do not bypass a safety control or repeatedly reset/);
 assert.match(content,/leave the building and call emergency services or the utility/);
 assert.ok(d.querySelector('.service-content-source a[href="https://www.mtownhvac.com/services/"]'));
 assert.match(d.querySelector('.service-attribution').textContent,/Call clicks alone do not tell us/);
 const service=schema(d).find(x=>x['@type']==='Service');
 assert.equal(service.provider['@id'],'https://www.mtownhvac.com/#business');
 assert.equal(service.provider['@type'],'HVACBusiness');
 assert.equal(service.areaServed,undefined,'do not invent geographic coverage');
 d.defaultView.close();
});

test('final titles, descriptions and structured page identity stay synchronized for public sitemap pages',()=>{
 const xml=readFileSync(new URL('../dist/sitemap.xml',import.meta.url),'utf8');
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,urls.length);
 assert.ok(!urls.some(url=>url.includes('/account/')||url.includes('/api/')));
 for(const url of urls){
  const path=new URL(url).pathname,d=doc(path),description=d.querySelector('meta[name="description"]').content;
  assert.equal(d.querySelectorAll('h1').length,1,path);
  assert.equal(d.querySelector('link[rel="canonical"]').href,url,path);
  for(const node of schema(d)){
   if(['WebPage','ProfilePage','CollectionPage','ContactPage'].includes(node['@type'])){
    assert.equal(node.name,d.title,path);
    assert.equal(node.description,description,path);
    assert.equal(node.url,url,path);
   }
   if(node['@type']==='Organization' && node['@id']==='https://wazoozie.com/#organization')assert.ok(node.sameAs.includes('https://www.instagram.com/wazoozie.local/'),path);
  }
  d.defaultView.close();
 }
});

test('Middletown profile and contact page support requests without changing other provider routing',()=>{
 for(const path of ['/contact/','/businesses/middletown-hvac/']){
  const d=doc(path);assert.ok(d.querySelector('.emailactions a[href="/start/?intent=comfort"]'));d.defaultView.close();
 }
 for(const [slug,tel] of [['ryan-dugan-electric','+14452589962'],['liberator-service-company','+12673285235'],['rolled-right-painting','+16102919552'],['hart-builders','+12153505502'],['cooke-carpentry-construction','+14849483201']]){
  const d=doc('/businesses/'+slug+'/');assert.ok(d.querySelector('main a[href="tel:'+tel+'"]'),slug);assert.equal(d.querySelector('.service-attribution'),null);d.defaultView.close();
 }
 const md=readFileSync(new URL('../dist/agent-content/index.md',import.meta.url),'utf8');
 assert.match(md,/What needs a hand/);assert.doesNotMatch(md,/Wazoozie and Middletown HVAC are related businesses/);
});

test('standards distinguish consented Middletown delivery from saved briefs and email drafts',()=>{
 const d=doc('/our-standards/');
 assert.match(d.querySelector('main').textContent,/explicitly consent to sending it/);
 assert.match(d.querySelector('main').textContent,/a saved brief alone does not notify them/);
 assert.doesNotMatch(d.querySelector('main').textContent,/homepage shows all listed businesses/);
 const privacy=doc('/privacy/');assert.match(privacy.querySelector('main').textContent,/pricing-tool links/);
 d.defaultView.close();privacy.defaultView.close();
});


test('home-service directory keeps Middletown, Ryan and Rolled Right first through client filtering',()=>{
 const markup=readFileSync(new URL('../dist/home-services/index.html',import.meta.url),'utf8');
 const dom=new JSDOM(markup,{url:'https://wazoozie.com/home-services/',runScripts:'outside-only'}),d=dom.window.document;
 const names=()=>[...d.querySelectorAll('#providerResults .procard h3')].map(e=>e.textContent.trim());
 const expected=['Middletown HVAC','Ryan Dugan Electric LLC','Rolled Right Painting, LLC','Cooke Carpentry & Construction, LLC','Hart Builders, Inc.','Liberator Service Company'];
 assert.deepEqual(names(),expected);
 const catalog=schema(d).find(x=>x['@type']==='ItemList');
 assert.deepEqual(catalog.itemListElement.map(x=>x.name),expected);
 dom.window.eval(readFileSync(new URL('../dist/assets/home.js',import.meta.url),'utf8'));
 assert.deepEqual(names(),expected);
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const filter=service=>{d.querySelector('#serviceSearch').value=service;d.querySelector('#searchForm').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));};
 filter('plumbing');assert.deepEqual(names(),['Liberator Service Company']);
 filter('hvac');assert.deepEqual(names(),['Middletown HVAC']);
 assert.ok(d.querySelector('#providerResults a[href^="https://book.housecallpro.com/"]'));
 filter('all');assert.deepEqual(names(),expected);
 assert.match(d.querySelector('#resultCount').textContent,/editorial order, not a quality ranking/);
 dom.window.close();
});

test('booking and story browsing do not pin the owner business ahead of other businesses',()=>{
 const d=doc('/book/');
 const names=[...d.querySelectorAll('.booking-card h2')].map(e=>e.textContent.trim());
 assert.equal(names.length,13);assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)));
 assert.match(d.querySelector('.booking-search').textContent,/alphabetically/);
 const stories=doc('/local-stories/'),posts=[...stories.querySelectorAll('.neighbor-post header a')].map(e=>e.textContent.trim());
 assert.equal(posts.length,7);assert.equal(new Set(posts.slice(0,6)).size,6);
 assert.deepEqual(posts.slice(0,6),[...posts.slice(0,6)].sort((a,b)=>a.localeCompare(b)));
 assert.ok(stories.querySelector('.neighbor-side a[href="/home-services/"]'));
 d.defaultView.close();stories.defaultView.close();
});

test('home services remains the first category on the homepage and local hub',()=>{
 for(const [path,selector] of [['/','.front-door-categories a'],['/local-help/','.local-category-grid a']]){
  const d=doc(path);assert.equal(d.querySelector(selector).getAttribute('href'),'/home-services/');d.defaultView.close();
 }
});
