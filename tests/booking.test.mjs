import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {initBooking} from '../assets/booking.js';
import {initActionIcons} from '../assets/action-icons.js';
test('every listed business has a scheduling route and category filtering preserves direct contacts',()=>{
 const dom=new JSDOM(readFileSync('dist/book/index.html','utf8'),{url:'https://wazoozie.com/book/'}),d=dom.window.document;initBooking(d);
 const cards=[...d.querySelectorAll('.booking-card')];assert.equal(cards.length,13);assert.ok(cards.every(c=>c.querySelector('.booking-actions a[href]')));
 assert.ok(d.querySelector('[data-business="middletown-hvac"] a[href^="https://book.housecallpro.com/"]'));
 assert.match(d.querySelector('[data-business="ryan-dugan-electric"]').textContent,/Call to schedule/);
 assert.ok(d.querySelector('[data-business="c-and-j-automotive-upper-chichester"] a[href="https://candjautorepair.com/upper-chi/"]'));
 for(const [category,count] of [['home',6],['auto',4],['realestate',3],['all',13]]){d.querySelector('[data-book-filter="'+category+'"]').click();assert.equal(cards.filter(c=>!c.hidden).length,count);}
 dom.window.close();
});
test('SVG arrows preserve links, button handlers and user-entered text, including dynamic actions',async()=>{
 const dom=new JSDOM('<a href="/services/?ref=keep">Find help →</a><button id="next">Next ↗</button><textarea>Keep → this note</textarea><p>Plain → text</p>',{url:'https://wazoozie.com/'}),d=dom.window.document;
 let clicks=0;d.querySelector('button').addEventListener('click',()=>clicks++);const observer=initActionIcons(d);
 assert.equal(d.querySelectorAll('.action-arrow').length,2);assert.equal(d.querySelector('a').getAttribute('href'),'/services/?ref=keep');assert.equal(d.querySelector('textarea').value,'Keep → this note');assert.equal(d.querySelector('p').textContent,'Plain → text');d.querySelector('button').click();assert.equal(clicks,1);
 const a=d.createElement('a');a.href='/book/';a.textContent='Book →';d.body.append(a);await new Promise(resolve=>setTimeout(resolve,0));assert.ok(a.querySelector('svg'));assert.equal(a.href,'https://wazoozie.com/book/');
 observer.disconnect();dom.window.close();
});
test('ordinary problem descriptions find the relevant contact without silently broadening unrelated searches',()=>{
 const dom=new JSDOM(readFileSync('dist/book/index.html','utf8'),{url:'https://wazoozie.com/book/?q=my%20furnace%20is%20not%20working'}),d=dom.window.document;
 initBooking(d);
 const input=d.querySelector('#booking-query'),cards=[...d.querySelectorAll('.booking-card')];
 const visible=()=>cards.filter(c=>!c.hidden).map(c=>c.dataset.business);
 assert.deepEqual(visible(),['middletown-hvac']);
 for(const [query,expected] of [['no heat','middletown-hvac'],['my ac is not cooling','middletown-hvac'],['no hot water','middletown-hvac'],['lights are not working','ryan-dugan-electric'],['breaker keeps tripping','ryan-dugan-electric'],['a clogged drain','liberator-service-company'],['my leaking sink','liberator-service-company']]){
  input.value=query;input.dispatchEvent(new dom.window.Event('input'));assert.deepEqual(visible(),[expected],query);
 }
 input.value='unlisted specialty service';input.dispatchEvent(new dom.window.Event('input'));assert.deepEqual(visible(),[]);assert.equal(d.querySelector('#booking-empty').hidden,false);
 d.querySelector('#booking-reset').click();assert.equal(visible().length,13);assert.equal(input.value,'');
 dom.window.close();
});
