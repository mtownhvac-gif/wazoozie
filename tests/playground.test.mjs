import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {QUESTIONS, PERSONALITIES, PRIORITIES, personalityFor, initPlayground} from '../assets/playground.js';

test('every personality is reachable and ties follow first matching preference', () => {
  PERSONALITIES.forEach((profile, i) => assert.equal(personalityFor(Array(5).fill(i)), profile));
  assert.equal(personalityFor([2,1,1,2,0]), PERSONALITIES[2]);
  for (const invalid of [null, [], [0,0,0,0,4], [0,0,0,0,NaN], [0,0,0,0,'1']]) assert.equal(personalityFor(invalid), null);
  // Exercise every possible complete path, including ties.
  for (let n = 0; n < 4 ** QUESTIONS.length; n++) {
    const answers = Array.from({length:5}, (_, i) => Math.floor(n / 4 ** i) % 4);
    assert.ok(PERSONALITIES.includes(personalityFor(answers)));
  }
});

async function page() {
  const dom = new JSDOM(await readFile('dist/play/index.html','utf8'), {url:'https://wazoozie.com/play/'});
  let requests = 0;
  dom.window.fetch = () => {requests++; throw Error('No requests allowed');};
  Object.defineProperty(dom.window, 'localStorage', {get(){throw Error('Storage must not be used');}});
  initPlayground(dom.window.document);
  return {dom, doc:dom.window.document, requests:()=>requests};
}

test('quiz requires choice, retains back answers, focuses transitions and replays cleanly', async () => {
  const {dom, doc, requests} = await page();
  try {
    const advance = () => doc.querySelector('#personality-quiz .play-controls button:last-child').click();
    assert.equal(doc.querySelector('#personality-quiz .play-controls button').disabled, true);
    for (let i=0; i<5; i++) {
      doc.querySelectorAll('.play-choice')[1].click(); advance();
      if (i<4) assert.equal(doc.activeElement.tagName, 'LEGEND');
    }
    assert.match(doc.querySelector('#personality-quiz h3').textContent, /Plan Keeper/);
    assert.equal(doc.activeElement.tagName, 'H3');
    assert.equal(doc.querySelector('#personality-quiz progress').value, 5);
    doc.querySelector('#personality-quiz .play-controls button').click();
    assert.equal(doc.querySelectorAll('.play-choice')[1].getAttribute('aria-pressed'), 'true');
    doc.querySelectorAll('.play-choice')[3].click(); advance();
    doc.querySelector('#personality-quiz .play-controls button:last-child').click();
    assert.equal(doc.querySelector('#personality-quiz progress').value, 0);
    assert.equal(doc.querySelectorAll('.play-choice[aria-pressed=true]').length, 0);
    assert.equal(requests(),0);
  } finally {dom.window.close();}
});

test('project picks cap at three, preserve rank, allow removal/replacement and reset', async () => {
  const {dom, doc, requests} = await page();
  try {
    const choices = doc.querySelectorAll('.priority-choice');
    choices[2].click(); choices[0].click(); choices[4].click(); choices[5].click();
    assert.equal(doc.querySelectorAll('#priority-result li').length, 3);
    assert.match(choices[2].textContent, /^1\./);
    assert.equal(choices[5].getAttribute('aria-disabled'),'true');
    choices[0].click();
    assert.equal(doc.querySelectorAll('#priority-result li').length,0);
    assert.match(choices[4].textContent, /^2\./);
    choices[5].click();
    assert.equal(doc.querySelectorAll('#priority-result li').length,3);
    assert.match(doc.querySelector('#priority-result').textContent,/have not been sent/);
    doc.querySelector('#priority-reset').click();
    assert.equal(doc.querySelectorAll('.priority-choice[aria-pressed=true]').length,0);
    assert.equal(doc.activeElement, choices[0]);
    assert.equal(doc.querySelectorAll('.myth-grid details').length,6);
    assert.equal(requests(),0);
  } finally {dom.window.close();}
});

test('new activities are discoverable and result links resolve to built pages', async () => {
  const {dom, doc} = await page();
  try {
    for (const item of [...PERSONALITIES,...PRIORITIES]) await readFile('dist'+item.href+'index.html');
    for (const path of ['index.html','explore/index.html','good-call-club/index.html']) assert.match(await readFile('dist/'+path,'utf8'),/href="\/play\/"/);
    assert.match(await readFile('dist/sitemap.xml','utf8'), /https:\/\/wazoozie.com\/play\//);
    assert.ok(doc.querySelector('link[rel=canonical][href="https://wazoozie.com/play/"]'));
    assert.equal(doc.querySelectorAll('input[type=email]').length,0);
  } finally {dom.window.close();}
});
