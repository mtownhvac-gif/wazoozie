import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {initHomeMatch,PROJECTS} from '../assets/home-match.js';
import {initBooking} from '../assets/booking.js';
const documentFor=path=>new JSDOM(readFileSync('dist/'+path+'/index.html','utf8'),{url:'https://wazoozie.com/'+path+'/'});
test('game accepts retries, scores once per project, finishes six rounds and shares only on request',async()=>{
 const dom=documentFor('who-would-you-call'),d=dom.window.document;let shared=[];initHomeMatch(d,{random:()=>0.5,clipboard:{writeText:async text=>shared.push(text)}});d.getElementById('match-play').click();
 let expected=0;
 for(let n=0;n<6;n++){
  const project=PROJECTS.find(p=>p.question===d.getElementById('match-question').textContent);assert.ok(project);
  const choices=[...d.querySelectorAll('#match-choices button')],correct=choices.find(b=>b.textContent===project.answer);
  if(n===0){choices.find(b=>b!==correct).click();assert.match(d.getElementById('match-feedback').textContent,/Have another look/);}
  correct.click();correct.click();expected+=n===0?70:100;assert.equal(d.getElementById('match-score').textContent,expected+' points');assert.equal(d.getElementById('match-help').getAttribute('href'),project.href);d.getElementById('match-next').click();
 }
 assert.equal(d.getElementById('match-finish').hidden,false);assert.match(d.getElementById('match-summary').textContent,/570 of 600/);assert.equal(shared.length,0);d.getElementById('match-share').click();await Promise.resolve();assert.match(shared[0],/570\/600/);d.getElementById('match-again').click();assert.equal(d.getElementById('match-score').textContent,'0 points');assert.equal(d.getElementById('match-finish').hidden,true);dom.window.close();
});
test('service search combines URL query, categories and reset without rendering input markup',()=>{
 const dom=new JSDOM(readFileSync('dist/book/index.html','utf8'),{url:'https://wazoozie.com/book/?q=mini-split'}),d=dom.window.document;initBooking(d);const visible=()=>[...d.querySelectorAll('.booking-card')].filter(c=>!c.hidden),input=d.getElementById('booking-query');assert.equal(visible().length,1);assert.equal(visible()[0].dataset.business,'middletown-hvac');
 d.querySelector('[data-book-filter="auto"]').click();assert.equal(visible().length,0);assert.equal(d.getElementById('booking-empty').hidden,false);d.getElementById('booking-reset').click();assert.equal(visible().length,13);input.value='wraps';input.dispatchEvent(new dom.window.Event('input'));assert.equal(visible().length,1);assert.equal(visible()[0].dataset.business,'sound-wraps-west-chester');input.value='<img onerror=alert(1)>';input.dispatchEvent(new dom.window.Event('input'));assert.equal(visible().length,0);assert.equal(d.querySelector('#booking-count img'),null);dom.window.close();
});
test('search markup describes visible directory content and the new game is discoverable',()=>{
 const home=documentFor(''),catalog=documentFor('home-services'),game=documentFor('who-would-you-call');
 const schemas=d=>[...d.window.document.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{const value=JSON.parse(s.textContent);return value['@graph']||[value];});
 assert.equal(schemas(home).some(x=>x['@type']==='ItemList'),false);assert.ok(schemas(catalog).some(x=>x['@type']==='ItemList'));assert.ok(schemas(home).some(x=>x['@type']==='Organization'&&x.sameAs?.includes('https://www.facebook.com/profile.php?id=61596314640388')));assert.ok(home.window.document.querySelector('a[href="/who-would-you-call/"]'));assert.equal(game.window.document.querySelector('link[rel="canonical"]').href,'https://wazoozie.com/who-would-you-call/');assert.match(readFileSync('dist/sitemap.xml','utf8'),/https:\/\/wazoozie.com\/who-would-you-call\//);for(const d of [home,catalog,game])d.window.close();
});
test('conversational searches find relevant contacts and the homepage groups play with tools',()=>{
 const dom=documentFor('book'),d=dom.window.document;initBooking(d);const input=d.getElementById('booking-query');
 for(const [query,slugs] of [['I need a plumber',['liberator-service-company']],['air conditioning',['middletown-hvac']],['electrician',['ryan-dugan-electric']],['a mechanic',['c-and-j-automotive-upper-chichester','authority-auto-repair-glenolden','trans-man-transmissions-eddystone']],['realtor',['caitlin-kerezsi','megan-kerezsi','libbi-skivo']]]){
 input.value=query;input.dispatchEvent(new dom.window.Event('input'));const visible=[...d.querySelectorAll('.booking-card')].filter(c=>!c.hidden).map(c=>c.dataset.business);assert.deepEqual(visible.sort(),slugs.sort(),query);}
 const home=documentFor('').window.document;assert.ok(home.querySelector('#explore a[href="/who-would-you-call/"]'));assert.equal(home.querySelector('#find .match-teaser'),null);assert.equal(home.querySelector('.grand-hero a.grand-primary').getAttribute('href'),'/pricing-guide/');assert.ok([...d.querySelectorAll('.booking-card')].every(c=>c.querySelector('h2 a[href^="/businesses/"]')));dom.window.close();home.defaultView.close();
});
