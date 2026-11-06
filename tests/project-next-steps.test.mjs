import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const doc=path=>new JSDOM(readFileSync('dist/'+path+'/index.html','utf8')).window.document;
test('selected project paths keep budget, preparation and contact links relevant',()=>{
 for(const [path,anchor,query] of [['services/plumbing','directory-prices','plumbing'],['services/painting','directory-prices','painting'],['services/ductless-mini-splits','hvac','mini+split'],['services/water-heaters','water-heaters','hot+water'],['vehicle-wraps','vehicle-wraps','wraps']]){
 const d=doc(path),section=d.querySelector('.project-next-steps');assert.ok(section,path);assert.ok(section.querySelector('a[href="/pricing-guide/#'+anchor+'"]'));assert.ok(section.querySelector('a[href="/book/?q='+query+'"]'));assert.equal(section.querySelectorAll('a').length,3);d.defaultView.close();}
 const real=doc('real-estate-agents');assert.match(real.querySelector('.project-next-steps').textContent,/Understand service fees/);assert.ok(real.querySelector('#real-estate-questions'));real.defaultView.close();
});
test('seasonal home care is discoverable and unfilled gutter referrals are not presented as bookable',()=>{
 const d=doc('services');assert.ok(d.querySelector('.brand-collection-grid a[href="/seasonal-home-checklist/"]'));assert.match(d.querySelector('a[href="/services/maintenance/"]').textContent,/HVAC maintenance/);d.defaultView.close();
 const seasonal=doc('seasonal-home-checklist'),section=seasonal.querySelector('.seasonal-scope');assert.match(section.textContent,/isn’t a gutter-cleaning provider to book here yet/);assert.ok(section.querySelector('a[href="/services/maintenance/"]'));assert.equal(section.querySelector('a[href*="/start/"]'),null);seasonal.defaultView.close();
});
