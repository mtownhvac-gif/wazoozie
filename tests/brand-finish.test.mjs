import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const doc=path=>new JSDOM(readFileSync(new URL('../dist'+path+'index.html',import.meta.url),'utf8')).window.document;
test('visual service collection preserves specialist routes and keeps the general index neutral',()=>{
 const d=doc('/services/');
 assert.equal(d.querySelectorAll('.brand-collection-grid>a').length,10);
 for(const slug of ['heating-cooling','ductless-mini-splits','water-heaters','plumbing','electrical','painting','handyman','construction-remodeling','maintenance','boilers','replacement-estimates','second-opinion','oil-to-gas-conversion'])assert.ok(d.querySelector('main a[href="/services/'+slug+'/"]'),slug);
 assert.equal(d.querySelector('main .contact-card'),null);
 assert.ok(d.querySelector('img[src="/assets/clay-hvac-family.webp"]'));
 assert.ok(d.querySelector('nav[aria-label="Main navigation"] a[href="/pricing-guide/"]'));
 assert.ok(d.querySelector('nav[aria-label="Mobile navigation"] a[href="/explore/"]'));
});
test('Middletown requests stay relevant and mixed imagery retains clear source labels',()=>{
 const intents={'heating-cooling':'comfort','ductless-mini-splits':'comfort','water-heaters':'water','boilers':'boiler','maintenance':'maintenance','replacement-estimates':'replacement','oil-to-gas-conversion':'replacement','second-opinion':'secondopinion'};
 for(const [slug,intent] of Object.entries(intents))assert.ok(doc('/services/'+slug+'/').querySelector('main a[href="/start/?intent='+intent+'"]'));
 for(const path of ['/auto-mechanics/','/real-estate-agents/','/vehicle-wraps/'])assert.equal(doc(path).querySelector('main a[href*="mtownhvac.com/ductless-estimator"]'),null);
 const home=doc('/');assert.equal(home.querySelector('main').children.length,4);assert.ok(home.querySelector('main img[src="/assets/valley-stone-home.webp"]'));assert.ok(home.querySelector('.brand-comfort-callout a[href*="mtownhvac.com/ductless-estimator"]'));
 const local=doc('/local-help/');assert.ok(local.querySelector('main img[src="/assets/clay-family-porch.webp"]'));assert.match(local.querySelector('main').textContent,/AI-created clay illustration/);
});
