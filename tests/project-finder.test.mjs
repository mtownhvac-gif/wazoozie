import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {BUSINESSES,INTENTS,PROJECT_QUESTIONS} from '../project-config.mjs';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../assets/project-finder.js',import.meta.url),'utf8');
function setup(){
  const dom=new JSDOM(html,{url:'https://wazoozie.com/',runScripts:'outside-only'});
  Object.assign(dom.window,{BUSINESSES,INTENTS,PROJECT_QUESTIONS});
  dom.window.fetch=()=>{throw new Error('The finder must not send requests');};
  dom.window.Storage.prototype.setItem=()=>{throw new Error('The finder must not store answers');};
  dom.window.eval(source.replace(/^import[^\n]+\n/,''));
  const d=dom.window.document, result=d.querySelector('#project-finder-result');
  return {dom,d,result,choose:key=>d.querySelector(`[data-project-choice="${key}"]`).click()};
}

test('homepage finder has usable links before JavaScript and follows the project photos',()=>{
  const dom=new JSDOM(html),d=dom.window.document,finder=d.querySelector('.project-finder');
  const links=[...finder.querySelectorAll('[data-project-choice]')];
  assert.equal(links.length,8);
  for(const link of links){const url=new URL(link.getAttribute('href'),'https://wazoozie.com');assert.equal(url.pathname,'/request/');assert.ok(INTENTS[url.searchParams.get('intent')]);assert.equal(url.searchParams.get('entry'),'home');}
  assert.equal(d.querySelector('.local-proof').nextElementSibling,finder);
  assert.equal(finder.querySelector('input,textarea,form'),null);
  assert.ok(d.getElementById(d.querySelector('#project-finder-result').getAttribute('aria-labelledby')));
  dom.window.close();
});

test('every choice shows the configured business and preserves its direct contact and request routing',()=>{
  const {dom,d,result,choose}=setup();
  for(const [choice,intent] of Object.entries({comfort:'comfort',water:'water',plumbing:'plumbing',electrical:'electrical',painting:'painting',carpentry:'carpentry',windows:'doors',decks:'decks'})){
    choose(choice);const business=BUSINESSES[INTENTS[intent].provider];
    assert.equal(result.querySelector('.project-finder-provider a').textContent,business.name);
    assert.equal(result.querySelector('a[href^="tel:"]').getAttribute('href'),`tel:${business.tel}`);
    assert.equal(result.querySelector('a[href^="/request/"]').getAttribute('href'),`/request/?intent=${intent}&entry=home`);
    assert.equal(result.querySelectorAll('li').length,PROJECT_QUESTIONS[intent].length);
    assert.ok(d.getElementById(result.getAttribute('aria-labelledby')));
    assert.equal(d.querySelectorAll('[data-project-choice][aria-current="true"]').length,1);
    assert.match(d.querySelector('[role="status"]#project-finder-announcement').textContent,new RegExp(business.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.equal(dom.window.location.pathname,'/');dom.window.close();
});

test('goal and project controls update the destination, maintain keyboard focus and reset for the next choice',()=>{
  const {dom,d,result,choose}=setup();choose('comfort');
  result.querySelectorAll('button')[1].click();
  assert.equal(result.querySelector('a[href^="/request/"]').search,'?intent=replacement&entry=home');
  assert.equal(d.activeElement.textContent,'Plan an upgrade');assert.equal(d.activeElement.getAttribute('aria-pressed'),'true');
  assert.match(result.querySelector('ul').textContent,/conversion or ductless/);
  choose('windows');result.querySelectorAll('button')[1].click();
  assert.equal(result.querySelector('a[href^="/request/"]').search,'?intent=windows&entry=home');
  choose('decks');result.querySelectorAll('button')[1].click();
  assert.equal(result.querySelector('a[href^="/request/"]').search,'?intent=additions&entry=home');
  choose('comfort');assert.equal(result.querySelector('a[href^="/request/"]').search,'?intent=comfort&entry=home');
  assert.equal(result.querySelectorAll('[aria-pressed="true"]').length,1);dom.window.close();
});
