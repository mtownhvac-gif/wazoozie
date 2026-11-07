import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const doc=path=>new JSDOM(readFileSync(new URL('../dist'+path+'index.html',import.meta.url),'utf8'),{url:'https://wazoozie.com'+path}).window.document;
const schema=d=>[...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{const x=JSON.parse(s.textContent);return x['@graph']||[x];});

test('homepage exposes direct service contact before tools and names the featured relationship',()=>{
 const d=doc('/'),main=d.querySelector('main'),direct=d.querySelector('.service-direct');
 assert.equal(main.children[1],direct);
 assert.equal(d.querySelector('.grand-primary').getAttribute('href'),'/home-services/');
 assert.ok(direct.querySelector('a[href="tel:+16105006416"]'));
 assert.ok(direct.querySelector('a[href="/start/?intent=comfort"]'));
 const booking=new URL(direct.querySelector('.service-direct-book').href);
 assert.equal(booking.host,'book.housecallpro.com');
 assert.equal(booking.searchParams.get('utm_source'),'wazoozie');
 assert.equal(booking.searchParams.get('utm_content'),'home');
 assert.match(direct.textContent,/share an owner/);
 assert.match(direct.textContent,/not a confirmed appointment/);
 assert.match(direct.textContent,/No Wazoozie account needed/);
 for(const slug of ['middletown-hvac','ryan-dugan-electric','liberator-service-company','rolled-right-painting','hart-builders','cooke-carpentry-construction'])assert.ok(direct.querySelector('a[href="/businesses/'+slug+'/"]'),slug);
 assert.ok(d.querySelector('script[src="/assets/contact-activity.js"]'));
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
 assert.match(md,/Heating, AC or hot-water trouble/);assert.match(md,/share an owner/);
});

test('standards distinguish consented Middletown delivery from saved briefs and email drafts',()=>{
 const d=doc('/our-standards/');
 assert.match(d.querySelector('main').textContent,/explicitly consent to sending it/);
 assert.match(d.querySelector('main').textContent,/a saved brief alone does not notify them/);
 assert.doesNotMatch(d.querySelector('main').textContent,/homepage shows all listed businesses/);
 const privacy=doc('/privacy/');assert.match(privacy.querySelector('main').textContent,/pricing-tool links/);
 d.defaultView.close();privacy.defaultView.close();
});
