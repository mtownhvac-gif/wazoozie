import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const page=path=>new JSDOM(readFileSync(new URL('../dist'+path+'index.html',import.meta.url),'utf8'));
test('published price references keep source and scope beside each number',()=>{
 const dom=page('/pricing-guide/'),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('.price-card').length,7);
 for(const card of doc.querySelectorAll('.price-card')){
  assert.ok(card.querySelector('a[href^="https://"]'));
  assert.match(card.textContent,/checked November 6, 2026/);
 }
 assert.match(doc.querySelector('#hvac').textContent,/\$129.*Not the oil tune-up price/s);
 assert.match(doc.querySelector('#hvac').textContent,/From \$6,300.*not a binding quote/s);
 assert.match(doc.querySelector('#vehicle-wraps').textContent,/\$3,500.*excluding door jambs/s);
 assert.match(doc.querySelector('#method').textContent,/connected with Middletown HVAC/);
 assert.equal(doc.querySelectorAll('.quote-grid article').length,9);
 dom.window.close();
});
test('buyer questions span every directory industry with linked context and neutral ownership guidance',()=>{
 const dom=page('/before-you-say-yes/'),doc=dom.window.document;
 const ids=['hvac','water-heaters','plumbing','electrical','painting','carpentry','remodeling','windows','auto-repair','vehicle-wraps','real-estate'];
 assert.equal(doc.querySelectorAll('.buyer-card').length,ids.length);
 assert.equal(doc.querySelectorAll('.theater-act summary').length,6);
 assert.match(doc.querySelector('#fine-print-theater').textContent,/\$49.*illustrative|illustrative.*\$49/s);
 assert.match(doc.querySelector('#fine-print-theater').textContent,/what you owe if you decline repairs/);
 for(const id of ids){const card=doc.getElementById(id);assert.ok(card.querySelector('.ask-box'));assert.ok(card.querySelector('a[href^="https://"]'));}
 assert.match(doc.querySelector('main').textContent,/Ownership alone does not establish service quality/);
 assert.doesNotMatch(doc.querySelector('main').textContent,/Horizon|Wesley Wood|Mattioni|Done Right Today/);
 dom.window.close();
});
test('Sound Wraps stays a direct website referral and appears in public discovery',()=>{
 const dom=page('/businesses/sound-wraps-west-chester/'),main=dom.window.document.querySelector('main');
 assert.ok(main.querySelector('a[href="https://www.soundwraps.com/"]'));
 assert.equal(main.querySelectorAll('a[href^="tel:"],form,a[href*="/start/"]').length,0);
 assert.match(main.textContent,/West Chester/);dom.window.close();
 const catalog=JSON.parse(readFileSync(new URL('../dist/assets/public-discovery.json',import.meta.url),'utf8'));
 assert.ok(catalog.businesses.find(p=>p.name==='Sound Wraps'&&p.category==='auto'));
 assert.equal(catalog.planning.pricingGuide,'https://wazoozie.com/pricing-guide/');
 const home=page('/');assert.ok(home.window.document.querySelector('.buying-home a[href="/pricing-guide/"]'));home.window.close();
});
