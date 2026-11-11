import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {PROJECTS,STAGES,normalizeState,encodeChecklist,decodeChecklist,requestText,notebookHTML,safePhoto,mountLastLook,STORAGE_KEY} from '../assets/before-disappears.mjs';
const fixture=fs.readFileSync('dist/before-it-disappears/index.html','utf8');
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
function app(url='https://wazoozie.com/before-it-disappears/',setup=()=>{}){const dom=new JSDOM(fixture,{url,runScripts:'outside-only'});dom.window.fetch=()=>{throw new Error('No external requests allowed');};setup(dom.window);const app=mountLastLook(dom.window);return {dom,w:dom.window,d:dom.window.document,app};}

test('every project has four distinct useful records and a real local destination',()=>{
 assert.equal(Object.keys(PROJECTS).length,6);
 for(const [id,p]of Object.entries(PROJECTS)){assert.equal(p.checkpoints.length,4);assert.equal(new Set(p.checkpoints.map(c=>c.id)).size,4);assert.ok(fs.existsSync('dist'+p.trade+'index.html'),id+' destination');for(const c of p.checkpoints)for(const k of ['why','question','photo','record'])assert.ok(c[k].length>25,id+' '+k);}
});
test('share links exclude notes, photos and discussion marks; malformed choices cannot become keys',()=>{
 const state={project:'shower',stage:'open',notes:{'shower:system':'private address'},discussed:['shower:system'],photos:{'shower:system':image}};
 const text=encodeChecklist(state);assert.equal(text,'v=1&project=shower&stage=open');assert.deepEqual(decodeChecklist(text),{project:'shower',stage:'open',notes:{},discussed:[]});
 assert.equal(decodeChecklist('v=2&project=shower&stage=open'),null);assert.equal(decodeChecklist('v=1&project=__proto__&stage=open'),null);assert.equal(decodeChecklist('x'.repeat(181)),null);
 assert.deepEqual(normalizeState({project:'constructor',stage:'toString',notes:{'flooring:base':'valid','__proto__:bad':'bad'},discussed:['flooring:base','bad','flooring:base']}),{project:'flooring',stage:'planned',notes:{'flooring:base':'valid'},discussed:['flooring:base']});
 assert.equal(normalizeState(null).project,'flooring');
});
test('finished-work requests ask for existing records, not reopening; request excludes private material',()=>{
 for(const project of Object.keys(PROJECTS)){const t=requestText({project,stage:'finished',notes:{'flooring:base':'SECRET'},discussed:['flooring:base']});assert.match(t,/existing records/);assert.match(t,/do not open finished work/);assert.ok(!t.includes('SECRET'));assert.ok(!t.includes('Marked as discussed'));}
});
test('portable notebook includes only current project data, escapes notes, embeds safe photos and contains no active code',()=>{
 const html=notebookHTML({project:'flooring',notes:{'flooring:base':'<script>alert("x")</script>','shower:system':'OTHER PROJECT'},discussed:['flooring:base']},{'flooring:base':image,'shower:system':image});
 assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script'));assert.ok(!html.includes('OTHER PROJECT'));assert.equal((html.match(/<img /g)||[]).length,1);assert.match(html,/not verify workmanship/);assert.match(html,/default-src &#39;none&#39;|default-src 'none'/);assert.match(html,/Marked as discussed by the notebook user/);
 assert.equal(safePhoto('data:image/svg+xml;base64,PHN2Zz4='),null);assert.equal(safePhoto('https://example.com/private-photo.jpg'),null);assert.equal(safePhoto('data:image/png;base64,a" onerror="bad'),null);assert.equal(safePhoto(image),image);
});
test('project changes preserve scoped notes and marks; stage and cutaway controls update; copying stays private',async()=>{
 let copied='';const {dom,w,d,app:mounted}=app(undefined,w=>Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async v=>{copied=v;}}}));await mounted.ready;
 const note=d.querySelector('[data-note="flooring:base"]');note.value='oak product ABC';note.dispatchEvent(new w.Event('input',{bubbles:true}));const check=d.querySelector('[data-discussed="flooring:base"]');check.click();assert.equal(d.getElementById('ll-progress').textContent,'1 / 4 discussed');
 d.querySelector('[data-project="shower"]').click();assert.equal(d.getElementById('ll-progress').textContent,'0 / 4 discussed');d.querySelector('[data-project="flooring"]').click();assert.equal(d.querySelector('[data-note="flooring:base"]').value,'oak product ABC');assert.equal(d.getElementById('ll-progress').textContent,'1 / 4 discussed');
 d.getElementById('ll-stage').value='finished';d.getElementById('ll-stage').dispatchEvent(new w.Event('change'));assert.match(d.getElementById('ll-window-copy').textContent,/Don’t open/);
 d.getElementById('ll-reveal').value='100';d.getElementById('ll-reveal').dispatchEvent(new w.Event('input'));assert.equal(d.getElementById('ll-peel-rect').getAttribute('width'),'720');
 d.getElementById('ll-share').click();await tick();assert.match(copied,/#v=1&project=flooring&stage=finished$/);assert.ok(!copied.includes('ABC'));
 d.getElementById('ll-copy').click();await tick();assert.match(copied,/existing records/);assert.ok(!copied.includes('ABC'));assert.match(w.localStorage.getItem(STORAGE_KEY),/ABC/);dom.window.close();
});
test('photos remain available in a tab when persistence is blocked, with an honest status and export',async()=>{
 let savedBlob;const {dom,w,d,app:mounted}=app(undefined,w=>{Object.defineProperty(w.URL,'createObjectURL',{value:blob=>{savedBlob=blob;return 'blob:test';}});Object.defineProperty(w.URL,'revokeObjectURL',{value:()=>{}});w.HTMLAnchorElement.prototype.click=()=>{};});await mounted.ready;
 const input=d.querySelector('[data-photo="flooring:base"]');Object.defineProperty(input,'files',{value:[new w.File([new Uint8Array([1,2,3])],'proof.png',{type:'image/png'})]});input.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();await tick();assert.equal(d.querySelectorAll('.ll-photo').length,1);assert.match(d.getElementById('ll-status').textContent,/open tab only/);
 d.getElementById('ll-download').click();assert.ok(savedBlob.size>2000);assert.match(d.getElementById('ll-status').textContent,/includes this project’s notes and photos/);
 d.querySelector('[data-remove="flooring:base"]').click();await tick();assert.equal(d.querySelectorAll('.ll-photo').length,0);dom.window.close();
});
test('storage denial, clipboard fallback and cancelled clear do not lose current work',async()=>{
 const {dom,w,d,app:mounted}=app(undefined,w=>{Object.defineProperty(w,'localStorage',{get(){throw new Error('blocked');}});w.confirm=()=>false;});await mounted.ready;
 const note=d.querySelector('[data-note="flooring:base"]');note.value='keep this';note.dispatchEvent(new w.Event('input',{bubbles:true}));assert.match(d.getElementById('ll-storage').textContent,/not been saved/);d.getElementById('ll-share').click();await tick();assert.equal(d.getElementById('ll-copy-fallback').hidden,false);
 d.getElementById('ll-forget').click();await tick();assert.equal(mounted.getState().notes['flooring:base'],'keep this');dom.window.close();
});
test('clearing removes every project note and mark and strips the shared template URL',async()=>{
 const {dom,w,d,app:mounted}=app('https://wazoozie.com/before-it-disappears/#v=1&project=shower&stage=open',w=>{w.confirm=()=>true;w.localStorage.setItem(STORAGE_KEY,JSON.stringify({project:'flooring',notes:{'flooring:base':'private'},discussed:['flooring:base']}));});await mounted.ready;
 assert.equal(mounted.getState().project,'shower');d.getElementById('ll-forget').click();await tick();assert.equal(w.localStorage.getItem(STORAGE_KEY),null);assert.deepEqual(mounted.getState().notes,{});assert.equal(w.location.hash,'');assert.match(d.getElementById('ll-status').textContent,/cleared from this browser/);dom.window.close();
});
test('print preparation opens all current record details and restores their prior state',async()=>{
 const {dom,w,d,app:mounted}=app();await mounted.ready;assert.equal(d.querySelectorAll('#ll-cards details[open]').length,1);w.dispatchEvent(new w.Event('beforeprint'));assert.equal(d.querySelectorAll('#ll-cards details[open]').length,4);w.dispatchEvent(new w.Event('afterprint'));assert.equal(d.querySelectorAll('#ll-cards details[open]').length,1);dom.window.close();
});


test('the tool is discoverable from home and existing planning tools',()=>{
 for(const path of ['index.html','explore/index.html','project-kit/index.html','second-invoice/index.html']){const html=fs.readFileSync('dist/'+path,'utf8');assert.ok(html.includes('href="/before-it-disappears/"'),path);}
 assert.ok(fs.readFileSync('dist/sitemap.xml','utf8').includes('https://wazoozie.com/before-it-disappears/'));
});
