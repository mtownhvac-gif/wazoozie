import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {initSearchSuggestions,matchingSuggestions,SERVICE_SUGGESTIONS} from '../assets/search-suggestions.js';
test('suggestions keep car separate from carpentry and support partial words, problems and real business names',()=>{
 assert.deepEqual(matchingSuggestions('car').map(x=>x.label),['Car repair']);assert.equal(matchingSuggestions('carp')[0].label,'Carpentry & home repairs');assert.ok(matchingSuggestions('pl').some(x=>x.query==='plumbing'));assert.ok(matchingSuggestions('no heat').some(x=>x.query==='no heat'));assert.deepEqual(matchingSuggestions('c'),[]);
 const names=JSON.parse(readFileSync('dist/assets/search-suggestions.json','utf8'));assert.equal(names.length,13);assert.ok(matchingSuggestions('Cooke',[...SERVICE_SUGGESTIONS,...names]).some(x=>/Cooke/.test(x.label)));
});
test('keyboard and pointer choices fill the real query without submitting; Escape and blur close the list',()=>{
 const dom=new JSDOM('<form action="/book/"><input id="home-service-query" name="q"><button>Find</button></form>',{url:'https://wazoozie.com/'}),d=dom.window.document;let submitted=0,category='';d.querySelector('form').addEventListener('submit',e=>{submitted++;e.preventDefault();});const input=d.querySelector('input');input.addEventListener('wz-search-choice',e=>category=e.detail.category);initSearchSuggestions(d);initSearchSuggestions(d);assert.equal(d.querySelectorAll('[role="listbox"]').length,1);
 const type=q=>{input.value=q;input.dispatchEvent(new dom.window.Event('input'));};type('car');assert.equal(input.getAttribute('aria-expanded'),'true');input.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowDown',cancelable:true}));assert.ok(input.getAttribute('aria-activedescendant'));input.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',cancelable:true}));assert.equal(input.value,'car');assert.equal(category,'auto');assert.equal(submitted,0);assert.equal(input.getAttribute('aria-expanded'),'false');type('paint');d.querySelector('[role="option"]').click();assert.equal(input.value,'painting');assert.equal(submitted,0);type('heat');input.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(input.getAttribute('aria-expanded'),'false');type('heat');input.dispatchEvent(new dom.window.Event('blur'));assert.equal(input.getAttribute('aria-expanded'),'false');type('<img src=x>');assert.equal(d.querySelector('[role="listbox"] img'),null);dom.window.close();
});
