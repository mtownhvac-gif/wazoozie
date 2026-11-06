import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {CLUB_KEY,QUESTIONS,easternDay,dailyQuestions,cleanProgress,clubStats,initClub,HVAC_IDS,legacyDailyQuestions,roundQuestions} from '../assets/good-call-club.js';
const html=()=>readFileSync(new URL('../dist/good-call-club/index.html',import.meta.url),'utf8');
const now=()=>new Date('2026-11-06T17:00:00Z');
test('new rounds vary the mix, cap HVAC at two and always include automotive',()=>{
 const counts=new Set();
 for(let i=1;i<=28;i++){
  const qs=dailyQuestions('2026-11-'+String(i).padStart(2,'0'));
  const count=qs.filter(q=>HVAC_IDS.has(q[0])).length;counts.add(count);
  assert.ok(count<=2);assert.ok(qs.some(q=>['approval','second','vehicle','addon'].includes(q[0])));
  assert.equal(new Set(qs.map(q=>q[0])).size,5);
 }
 assert.deepEqual([...counts].sort(),[0,1,2]);
});
test('existing first answers and Wins survive the balanced-round upgrade',()=>{
 const day='2026-11-06',qs=legacyDailyQuestions(day),answers=Object.fromEntries(qs.map(q=>[q[0],q[4]]));
 const upgraded=cleanProgress({version:1,days:{[day]:answers}},day);
 assert.deepEqual(roundQuestions(upgraded,day).map(q=>q[0]),qs.map(q=>q[0]));
 assert.equal(clubStats(upgraded,day).points,60);
 assert.deepEqual(cleanProgress(upgraded,day),upgraded);
});
function setup(storage){const dom=new JSDOM(html(),{url:'https://wazoozie.com/good-call-club/'});initClub(dom.window.document,storage??dom.window.localStorage,now);return dom;}
test('daily challenge follows Eastern calendar dates across DST and has five distinct defensible questions',()=>{
 assert.equal(easternDay(new Date('2026-11-06T04:59:59Z')),'2026-11-05');
 assert.equal(easternDay(new Date('2026-11-06T05:00:00Z')),'2026-11-06');
 assert.equal(easternDay(new Date('2026-07-01T03:59:59Z')),'2026-06-30');
 assert.deepEqual(dailyQuestions('2026-11-06'),dailyQuestions('2026-11-06'));
 assert.equal(new Set(dailyQuestions('2026-11-06').map(q=>q[0])).size,5);
 assert.notDeepEqual(dailyQuestions('2026-11-06').map(q=>q[0]),dailyQuestions('2026-11-07').map(q=>q[0]));
 for(const q of QUESTIONS){assert.equal(q[3].length,4);assert.equal(new Set(q[3]).size,4);assert.ok(q[4]>=0&&q[4]<4);assert.ok(q[5].length>35);}
});
test('first answers persist, completion earns exactly one bonus, and reload cannot farm Wins',()=>{
 const dom=setup(),d=dom.window.document;
 for(const q of dailyQuestions('2026-11-06'))d.querySelector(`[data-question="${q[0]}"][data-answer="${q[4]}"]`).click();
 assert.equal(d.querySelector('#club-points').textContent,'60');assert.equal(d.querySelectorAll('.club-options button:enabled').length,0);
 const stored=dom.window.localStorage.getItem(CLUB_KEY);initClub(d,dom.window.localStorage,now);
 assert.equal(d.querySelector('#club-points').textContent,'60');assert.equal(dom.window.localStorage.getItem(CLUB_KEY),stored);
 assert.match(d.querySelector('#club-badge-status').textContent,/First Good Call/);
 d.querySelector('#club-clear').click();assert.equal(dom.window.localStorage.getItem(CLUB_KEY),null);assert.equal(d.querySelector('#club-points').textContent,'0');dom.window.close();
});
test('corrupt, future, foreign and oversized stored fields cannot award points or inject content',()=>{
 const q=dailyQuestions('2026-11-06')[0];
 const state=cleanProgress({version:2,decks:{'2026-11-06':dailyQuestions('2026-11-06').map(q=>q[0])},points:999999,days:{'2026-11-06':{[q[0]]:q[4],foreign:3,script:'<img onerror=x>'},'2026-11-07':{[q[0]]:q[4]},'2026-02-30':{[q[0]]:q[4]},'2020-01-01':{[q[0]]:q[4]}}},'2026-11-06');
 assert.deepEqual(Object.keys(state.days),['2026-11-06']);assert.deepEqual(Object.keys(state.days['2026-11-06']),[q[0]]);assert.equal(clubStats(state,'2026-11-06').points,10);
 assert.deepEqual(cleanProgress({version:1,days:[]},'2026-11-06').days,{});
});
test('unavailable storage keeps the game usable and explicitly marks unsaved progress',()=>{
 const storage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
 const dom=setup(storage),d=dom.window.document,q=dailyQuestions('2026-11-06')[0];d.querySelector(`[data-question="${q[0]}"][data-answer="${q[4]}"]`).click();
 assert.equal(d.querySelector('#club-points').textContent,'10');assert.match(d.querySelector('#club-storage').textContent,/cannot save progress/);dom.window.close();
});
test('streaks count consecutive played days and reset after a gap',()=>{
 const state={days:{'2026-11-04':{},'2026-11-05':{},'2026-11-06':{}}};
 assert.equal(clubStats(state,'2026-11-06').streak,3);assert.equal(clubStats(state,'2026-11-07').streak,3);assert.equal(clubStats(state,'2026-11-08').streak,0);
});
test('short homepage opens dedicated destinations and preserves pricing and daily play',()=>{
 const dom=new JSDOM(readFileSync(new URL('../dist/index.html',import.meta.url),'utf8')),d=dom.window.document,main=d.querySelector('main');
 assert.match(d.querySelector('h1').textContent,/What shouldyour project cost/);
 assert.equal(main.children.length,4);assert.equal(main.children[1].id,'explore');
 for(const path of ['/pricing-guide/','/good-call-club/','/home-tips/','/explore/','/home-services/','/auto-mechanics/','/real-estate-agents/','/vehicle-wraps/'])assert.ok(main.querySelector('a[href="'+path+'"]'));
 assert.equal(main.querySelector('.directory'),null);assert.equal(main.querySelector('form').getAttribute('action'),'/book/');assert.ok(main.querySelector('form input[name="q"]'));assert.equal(main.querySelector('form input[type="email"]'),null);assert.equal(main.querySelector('.situation-new'),null);
 const catalog=new JSDOM(readFileSync(new URL('../dist/home-services/index.html',import.meta.url),'utf8')).window.document;
 assert.ok(catalog.querySelector('#concierge-choices a[href="/start/?intent=comfort"]'));assert.ok(catalog.querySelector('.directory a[href="/businesses/middletown-hvac/"]'));
 const explore=new JSDOM(readFileSync(new URL('../dist/explore/index.html',import.meta.url),'utf8')).window.document;
 for(const path of ['/compare/','/project-budget/','/project-kit/','/before-you-say-yes/'])assert.ok(explore.querySelector('main a[href="'+path+'"]'));
 dom.window.close();
});
