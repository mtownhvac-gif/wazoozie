import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

test('financing stays external, optional and accurately qualified',()=>{
 const dom=new JSDOM(fs.readFileSync('dist/financing/index.html','utf8'));
 const d=dom.window.document;
 const main=d.querySelector('main');
 assert.match(main.textContent,/soft credit check/);
 assert.match(main.textContent,/hard credit inquiry/);
 assert.match(main.textContent,/not a guaranteed approval/);
 assert.match(main.textContent,/Wazoozie does not make loans/);
 assert.equal(main.querySelectorAll('input,textarea,iframe,form').length,0);
 const external=[...main.querySelectorAll('a[target="_blank"]')];
 assert.ok(external.some(a=>a.href==='https://www.acornfinance.com/borrowers/'));
 assert.ok(external.some(a=>a.href==='https://www.acornfinance.com/pre-qualify/?d=4970K&utm_medium=web_pre_qual_link_copy_welcome'));
 for(const a of external)assert.ok(a.rel.includes('noopener')&&a.rel.includes('noreferrer'));
 dom.window.close();
});
test('financing is discoverable from planner, pricing, profile and homepage',()=>{
 for(const path of ['index.html','second-invoice/index.html','pricing-guide/index.html','project-kit/index.html','businesses/middletown-hvac/index.html']){
   const dom=new JSDOM(fs.readFileSync('dist/'+path,'utf8'));
   assert.ok(dom.window.document.querySelector('main a[href="/financing/"]'),path);
   dom.window.close();
 }
 assert.match(fs.readFileSync('dist/sitemap.xml','utf8'),/https:\/\/wazoozie.com\/financing\//);
});
