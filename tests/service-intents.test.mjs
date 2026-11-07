import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const paths=['/services/furnace-repair/','/services/electrical-panel-upgrades/','/auto-mechanics/transmission-repair/','/real-estate-agents/first-time-home-buyers/'];
const read=path=>readFileSync(new URL('../dist'+path+'index.html',import.meta.url),'utf8');
const doc=path=>new JSDOM(read(path),{url:'https://wazoozie.com'+path});
const schema=d=>[...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{const x=JSON.parse(s.textContent);return x['@graph']||[x];});

test('four distinct intent pages are crawlable, useful, navigable and retain matching identity',()=>{
 const sitemap=readFileSync(new URL('../dist/sitemap.xml',import.meta.url),'utf8'), titles=[];
 for(const path of paths){
  const dom=doc(path),d=dom.window.document,main=d.querySelector('main');titles.push(d.title);
  assert.equal(d.querySelectorAll('h1').length,1,path);
  assert.ok(main.textContent.trim().split(/\s+/).length>400,path);
  assert.match(d.querySelector('meta[name="robots"]').content,/index,follow/);
  assert.equal(d.querySelector('link[rel="canonical"]').href,'https://wazoozie.com'+path);
  assert.ok(sitemap.includes('<loc>https://wazoozie.com'+path+'</loc>'));
  assert.equal(main.querySelectorAll('form').length,0);
  for(const a of main.querySelectorAll('.intent-jumps a'))assert.ok(d.querySelector(a.getAttribute('href')));
  for(const tag of ['description','twitter:description'])assert.ok(d.querySelector('meta[name="'+tag+'"]').content.length>60);
  const crumb=schema(d).find(x=>x['@type']==='BreadcrumbList');
  assert.equal(crumb.itemListElement.length,3);assert.equal(crumb.itemListElement[2].item,'https://wazoozie.com'+path);
  assert.match(d.querySelector('footer').textContent,/operated by Bryan Cordy, owner of Middletown HVAC/);
  assert.doesNotMatch(main.textContent,/\b(?:since 19\d\d|since 20\d\d|number one|guaranteed results|instant booking|24\/7 service)\b/i);
  const md=readFileSync(new URL('../dist/agent-content'+path+'index.md',import.meta.url),'utf8');
  assert.match(md,/About the business relationship/);assert.ok(md.includes(d.querySelector('h1').textContent.replace(/\s+/g,' ').trim()) || md.includes('Start with') || md.includes('good questions'));
  dom.window.close();
 }
 assert.equal(new Set(titles).size,4);
});

test('each new page keeps direct contacts and booking with the right business',()=>{
 const expected=[['+16105006416'],['+14452589962'],['+16105216672'],['+16103689912','+16103684189','+12153162843']];
 for(const [i,path] of paths.entries()){
  const dom=doc(path),d=dom.window.document,main=d.querySelector('main');
  const phones=[...new Set([...main.querySelectorAll('a[href^="tel:"]')].map(a=>a.getAttribute('href').slice(4)))];
  assert.deepEqual(phones,expected[i]);
  const book=main.querySelector('a[href^="https://book.housecallpro.com/"]');
  if(i===0){assert.ok(book);const url=new URL(book.href);assert.equal(url.searchParams.get('utm_content'),'services-furnace-repair');assert.ok(main.querySelector('a[href="/start/?intent=comfort"]'));assert.match(main.textContent,/This page promotes his HVAC business/);}
  else{assert.equal(book,null);assert.equal(main.querySelector('a[href^="/start/"]'),null);}
  if(i===2){assert.match(main.textContent,/current official website has not been confirmed/i);assert.match(main.textContent,/not an independent credential inspection/);}
  dom.window.close();
 }
});

test('electrical checks have four safe steps with switch and breaker guidance before any technical work',()=>{
 const dom=doc('/services/electrical/'),d=dom.window.document,section=d.querySelector('#simple-electrical-checks');
 const checks=[...section.querySelectorAll('.intent-checks>li')];assert.equal(checks.length,4);
 assert.match(checks[0].textContent,/normal wall switch and the lamp’s own switch/);
 assert.match(checks[3].textContent,/never remove the protective cover/);
 assert.match(checks[3].textContent,/reset it only once if you know the cause, have removed the overload/);
 assert.match(checks[3].textContent,/cause is unclear.*leave it off and call an electrician/);
 assert.match(section.textContent,/Do not open outlets, switches or light fittings, test live wiring, bypass protection/);
 assert.ok(section.querySelector('.intent-warning').compareDocumentPosition(section.querySelector('.intent-checks')) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
 assert.match(section.querySelector('.intent-warning').textContent,/smoke, sparks, a burning smell, buzzing, heat, exposed wires or water/);
 assert.ok(section.querySelector('a[href="tel:+14452589962"]'));dom.window.close();
 const furnace=doc(paths[0]),body=furnace.window.document.querySelector('#simple-checks');
 assert.equal(body.querySelectorAll('.intent-checks>li').length,4);
 assert.match(body.textContent,/leave immediately without operating switches/);
 assert.match(body.textContent,/Do not relight burners, open fuel lines, remove equipment panels, bypass safety controls or repeatedly reset/);
 furnace.window.close();
});

test('intent pages are internally linked from their existing hubs and provider profiles',()=>{
 const pairs=[['/services/heating-cooling/',paths[0]],['/services/electrical/',paths[1]],['/auto-mechanics/',paths[2]],['/real-estate-agents/',paths[3]],['/businesses/middletown-hvac/',paths[0]],['/businesses/ryan-dugan-electric/',paths[1]],['/businesses/trans-man-transmissions-eddystone/',paths[2]],['/businesses/caitlin-kerezsi/',paths[3]],['/businesses/megan-kerezsi/',paths[3]],['/businesses/libbi-skivo/',paths[3]]];
 for(const [hub,target] of pairs){const dom=doc(hub);assert.ok(dom.window.document.querySelector('main a[href="'+target+'"]'),hub);dom.window.close();}
 for(const path of ['/auto-mechanics/','/real-estate-agents/']){const dom=doc(path);assert.equal(dom.window.document.querySelectorAll('.local-pro-card a[href^="tel:"]').length,3);dom.window.close();}
});

test('native questions can be opened and closed repeatedly without collecting data or leaving the page',()=>{
 for(const path of paths){const dom=doc(path),d=dom.window.document,details=d.querySelector('#questions details');
  assert.ok(details);assert.ok(details.querySelector('summary'));assert.ok(details.querySelector('p').textContent.length>50);
  for(let i=0;i<3;i++){details.querySelector('summary').click();assert.ok(details.open);details.querySelector('summary').click();assert.equal(details.open,false);}
  assert.equal(dom.window.location.pathname,path);assert.equal(d.querySelector('main input, main textarea, main select'),null);dom.window.close();
 }
});

test('editorial navigation has explicit responsive visibility independent of the site header',()=>{
 const css=readFileSync(new URL('../assets/service-intents.css',import.meta.url),'utf8');
 assert.match(css,/\.intent-page \.breadcrumb a\{display:inline-flex/);
 assert.match(css,/\.intent-page \.intent-jumps a\{display:inline-flex/);
 for(const path of paths){const dom=doc(path),d=dom.window.document;assert.equal(d.querySelectorAll('.intent-page .breadcrumb a').length,2);assert.equal(d.querySelectorAll('.intent-jumps a').length,3);dom.window.close();}
});
