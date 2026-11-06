import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const page=path=>new JSDOM(readFileSync(new URL('../dist'+path+'index.html',import.meta.url),'utf8'));
test('general cost ranges keep sources, scopes and estimator referrals distinct',()=>{
 const dom=page('/pricing-guide/'),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('.price-card').length,21);
 assert.doesNotMatch(doc.querySelector('.buying-intro').textContent,/Middletown|local bid survey|fair or unfair|guaranteed available offer/);
 assert.match(doc.querySelector('.buying-intro').textContent,/U.S. planning ranges/);
 assert.match(doc.querySelector('.buying-intro').textContent,/Delco, Chester County and the Main Line/);
 for(const card of doc.querySelectorAll('.price-card')){
  assert.ok(card.querySelector('a[href^="https://"]'));assert.match(card.textContent,/NATIONAL PLANNING REFERENCE/);assert.match(card.textContent,/Source checked November 6, 2026/);
 }
 assert.match(doc.querySelector('#hvac').textContent,/\$5,000–\$11,000/);
 assert.match(doc.querySelector('#hvac').textContent,/\$2,500–\$6,000/);
 assert.match(doc.querySelector('#vehicle-wraps').textContent,/\$2,000–\$10,000/);
 assert.doesNotMatch(doc.querySelector('main').textContent,/\$129|\$6,300|Starting at \$3,500/);
 assert.ok(doc.querySelector('.range-next-step a[href^="https://www.mtownhvac.com/install-estimate/"]'));
 assert.match(doc.querySelector('#method').textContent,/owner of Middletown HVAC/);
 assert.match(doc.querySelector('#real-estate').textContent,/negotiable/);dom.window.close();
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
