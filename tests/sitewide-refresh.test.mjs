import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {publicPageURL,mountPageSharing} from '../assets/page-share.mjs';
const html=path=>readFileSync('dist'+path+'index.html','utf8');
const page=path=>new JSDOM(html(path),{url:'https://wazoozie.com'+path});

test('every sitemap page gets the same navigation and a single cached stylesheet while preserving page identity',()=>{
 const paths=[...readFileSync('dist/sitemap.xml','utf8').matchAll(/<loc>https:\/\/wazoozie.com([^<]+)<\/loc>/g)].map(x=>x[1]);
 for(const path of paths){const dom=page(path),d=dom.window.document;try{assert.ok(d.body.classList.contains('wz-refresh'),path);assert.equal(d.body.dataset.page,path);assert.equal(d.querySelectorAll('h1').length,1,path);assert.equal(d.querySelectorAll('link[rel=stylesheet]').length,1,path);assert.ok(d.querySelector('nav[aria-label="Main navigation"] a[href="/local-help/"]'),path);assert.ok(d.querySelector('footer a[href="/our-standards/"]'),path);assert.ok(d.querySelector('link[rel=canonical]').href.endsWith(path));}finally{dom.window.close();}}
});
test('request disclosures agree on office review, selected recipients, retention and delivery limits',()=>{
 for(const path of ['/privacy/','/our-standards/','/start/','/businesses/middletown-hvac/','/how-it-works/']){const dom=page(path),text=dom.window.document.querySelector('main').textContent;assert.match(text,/Wazoozie Help/);assert.match(text,/forward/);assert.doesNotMatch(text,/Other providers are not automatically emailed|Wazoozie sends a brief only to Middletown HVAC|Your request goes only to the business shown above when direct submission/);if(path==='/privacy/'){assert.match(text,/about 90 days, with daily cleanup/);assert.match(text,/does not confirm inbox receipt or book an appointment/);assert.ok(dom.window.document.querySelector('a[href="mailto:wazooziehelp@gmail.com"]'));}dom.window.close();}
});
test('auto, wraps and real estate pages offer appropriate contacts rather than a home-service request',()=>{
 for(const [path,query] of [['/auto-mechanics/','mechanic'],['/vehicle-wraps/','wraps'],['/real-estate-agents/','realtor']]){const dom=page(path),d=dom.window.document,a=d.querySelector('.wz-site-header nav .btn.primary');assert.equal(new URL(a.href).pathname,'/book/');assert.equal(new URL(a.href).searchParams.get('q'),query);assert.equal(d.querySelector('.wz-next-step a[href^="/request/"]'),null);dom.window.close();}
});
test('sharing strips all query and fragment data, runs only after a click and has a usable clipboard fallback',async()=>{
 assert.equal(publicPageURL({href:'https://wazoozie.com/guides/compare-hvac-estimates/?name=private&town=private#notes-private'}),'https://wazoozie.com/guides/compare-hvac-estimates/');
 const dom=new JSDOM(html('/guides/compare-hvac-estimates/'),{url:'https://wazoozie.com/guides/compare-hvac-estimates/?note=private#secret'}),w=dom.window,d=w.document;const copied=[];w.fetch=()=>{throw Error('Sharing must not submit data');};Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async value=>copied.push(value)},configurable:true});mountPageSharing(w);assert.equal(copied.length,0);d.querySelector('[data-wz-copy-page]').click();await new Promise(r=>setImmediate(r));assert.deepEqual(copied,['https://wazoozie.com/guides/compare-hvac-estimates/']);assert.equal(w.localStorage.length,0);Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied');}},configurable:true});d.querySelector('[data-wz-copy-page]').click();await new Promise(r=>setImmediate(r));const fallback=d.querySelector('.wz-share-fallback');assert.equal(fallback.hidden,false);assert.equal(fallback.textContent,'https://wazoozie.com/guides/compare-hvac-estimates/');assert.equal(d.querySelector('.wz-page-share input,.wz-page-share textarea,.wz-page-share form'),null);dom.window.close();
});
test('optional homepage tools remain reachable and the hero preserves the whole illustration',()=>{
 const dom=page('/'),d=dom.window.document;const extra=d.querySelector('.wz-more-tools');assert.equal(extra.open,false);for(const path of ['/second-invoice/','/before-it-disappears/','/play/','/neighbors/'])assert.ok(extra.querySelector('a[href="'+path+'"]'));assert.ok(d.querySelector('.wz-hero-art .grand-hero-image'));assert.ok(d.querySelector('.wz-search-strip form[action="/book/"]'));assert.equal(d.querySelector('.local-proof').nextElementSibling,d.querySelector('.project-finder'));dom.window.close();
});
