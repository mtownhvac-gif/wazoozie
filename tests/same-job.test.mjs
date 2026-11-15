import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {LIMITS,TRADES,DEMO,pastedPages,compareEstimates,questionNotes,questionDocument} from '../assets/same-job-core.mjs';
import {extractEstimatePDF} from '../assets/same-job-pdf.mjs';
import worker from '../worker.mjs';
import {saveEstimateHandoff,takeEstimateHandoff} from '../assets/estimate-handoff.mjs';
const html=readFileSync(new URL('../dist/same-job/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../assets/same-job.mjs',import.meta.url),'utf8');
const wait=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(extract=()=>{throw Error('PDF parser should not load for pasted text');}){
 const dom=new JSDOM(html,{url:'https://wazoozie.com/same-job/',runScripts:'outside-only'}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;
 Object.assign(w,{TRADES,DEMO,LIMITS,pastedPages,compareEstimates,questionNotes,questionDocument,saveEstimateHandoff,extractEstimatePDF:extract});
 w.fetch=()=>{throw Error('Quote comparison must not fetch or submit document data');};
 Object.defineProperty(w.Storage.prototype,'setItem',{value:()=>{throw Error('Document data must not be persisted');},configurable:true});
 w.eval(source.replace(/^import[^\n]+\n/gm,''));
 return {dom,w,d:w.document};
}
function mockFile(size=100,text='%PDF-1.7\nSynthetic file'){return {size,arrayBuffer:async()=>new TextEncoder().encode(text).buffer};}
function mockPDF(pageTexts,{pages=pageTexts.length,delay=false}={}){
 const calls={terminated:0,destroyed:0,options:null};
 const doc={numPages:pages,async getPage(n){return {streamTextContent(){return new ReadableStream({start(controller){controller.enqueue({items:[{str:pageTexts[n-1]||'',hasEOL:true}]});controller.close();}});},cleanup(){}};}};
 const library={PDFWorker:{create:({port})=>({port,destroy(){calls.destroyed++;}})},getDocument(options){calls.options=options;return {promise:delay?new Promise(()=>{}):Promise.resolve(doc),destroy:async()=>{calls.destroyed++;}};}};
 return {calls,options:{loadLibrary:async()=>library,workerFactory:()=>({terminate(){calls.terminated++;}})}};
}
test('comparison uses evidence with page references and never equates a mention with inclusion',()=>{
 const result=compareEstimates([{number:2,text:DEMO.a,source:'pdf'}],pastedPages(DEMO.b),'hvac');
 assert.equal(result.rows.length,10);const permits=result.rows.find(x=>x.id==='permits');
 assert.equal(permits.kind,'both');assert.equal(permits.a[0].page,2);assert.match(permits.a[0].excerpt,/not included/);assert.equal(permits.a[0].qualified,true);
 assert.equal(result.rows.find(x=>x.id==='startup').kind,'b');assert.equal(result.rows.find(x=>x.id==='routes').kind,'neither');
 assert.ok(result.rows.every(x=>!Object.hasOwn(x,'score')&&!Object.hasOwn(x,'included')));
});
test('every project kind yields its own valid questions and a supported request intent',()=>{
 for(const [key,meta] of Object.entries(TRADES)){const r=compareEstimates(pastedPages(DEMO.a),pastedPages(DEMO.b),key);assert.equal(r.rows.length,10);assert.ok(meta.intent);const notes=questionNotes(key,r.rows.map(x=>x.id));assert.ok(notes.length<=2400);assert.doesNotMatch(notes,/$7,800|F-060|FICTIONAL/);}
 assert.equal(questionNotes('hvac',['injected-private-text']), '');
});
test('unreadable, oversized and unknown-trade inputs do not produce confident results',()=>{
 assert.throws(()=>compareEstimates(pastedPages(''),pastedPages(DEMO.a),'hvac'));
 assert.throws(()=>pastedPages('x'.repeat(150001)),/150,000/);
 assert.throws(()=>compareEstimates(pastedPages(DEMO.a),pastedPages(DEMO.b),'__proto__'),/Choose/);
});
test('download escapes hostile notes and contains no scripts, frames or automatic requests',()=>{
 const dom=new JSDOM(questionDocument('<script>alert(1)</script><img src=https://example.org>'));
 assert.equal(dom.window.document.querySelectorAll('script,img,iframe,form').length,0);
 assert.match(dom.window.document.querySelector('pre').textContent,/<script>/);
 assert.match(dom.window.document.querySelector('meta[http-equiv]').content,/default-src 'none'/);dom.window.close();
});
test('handoff is explicit, intent-bound, short-lived and consumed once',()=>{
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k),removeItem:k=>data.delete(k)};
 assert.equal(saveEstimateHandoff(storage,'secondopinion','Selected question',1000),true);
 assert.equal(takeEstimateHandoff(storage,'water',1001),null);assert.equal(data.size,0);
 saveEstimateHandoff(storage,'water','Selected question',1000);assert.equal(takeEstimateHandoff(storage,'water',601001),null);
 saveEstimateHandoff(storage,'water','Selected question',1000);assert.equal(takeEstimateHandoff(storage,'water',999),null);
 saveEstimateHandoff(storage,'water','Selected question',1000);assert.equal(takeEstimateHandoff(storage,'water',1100),'Selected question');assert.equal(takeEstimateHandoff(storage,'water',1101),null);
 assert.equal(saveEstimateHandoff(storage,'bogus','Text',1000),false);assert.equal(saveEstimateHandoff(storage,'water','x'.repeat(2401),1000),false);
 assert.equal(saveEstimateHandoff({setItem(){throw Error('Blocked');}},'water','Text'),false);
});
test('pasted estimates work without PDF loading, storage or network access and clear fully',()=>{
 const {dom,d,w}=setup();d.getElementById('sj-demo').click();assert.equal(d.querySelectorAll('.sj-row').length,10);
 assert.equal(d.querySelector('#sj-demo-notice').hidden,false);assert.equal(d.querySelector('#sj-results').hidden,false);
 assert.equal(w.sessionStorage.length,0);assert.equal(w.localStorage.length,0);
 d.querySelector('#sj-clear').click();assert.equal(d.querySelector('#sj-results').hidden,true);assert.equal(d.querySelector('#sj-notes').value,'');assert.equal(d.querySelector('#sj-text-a').value,'');assert.equal(d.querySelector('#sj-rows').childElementCount,0);assert.equal(d.querySelector('#sj-compare').disabled,true);dom.window.close();
});
test('source text is rendered as text and never interpreted as markup',()=>{
 const {dom,d,w}=setup();d.querySelector('#sj-trade').value='hvac';for(const key of ['a','b']){const input=d.getElementById('sj-text-'+key);input.value='Permit included. Warranty <img src=x onerror=alert(1)> <script>boom</script>. Total price discussed separately.';input.dispatchEvent(new w.Event('input'));}
 d.querySelector('#sj-compare').click();assert.equal(d.querySelector('#sj-rows').querySelectorAll('img,script').length,0);assert.match(d.querySelector('#sj-rows').textContent,/<img src=x/);dom.window.close();
});
test('late PDF completion cannot overwrite newer pasted wording',async()=>{
 let resolve;const {dom,d,w}=setup(()=>new Promise(r=>{resolve=r;}));d.querySelector('#sj-trade').value='hvac';const input=d.querySelector('#sj-file-a');Object.defineProperty(input,'files',{value:[mockFile()]});input.dispatchEvent(new w.Event('change'));await wait();
 const text=d.querySelector('#sj-text-a');text.value=DEMO.a;text.dispatchEvent(new w.Event('input'));resolve({pages:pastedPages('STALE permit included. '.repeat(5)),unreadable:[]});await wait();
 d.querySelector('#sj-text-b').value=DEMO.b;d.querySelector('#sj-text-b').dispatchEvent(new w.Event('input'));d.querySelector('#sj-compare').click();assert.doesNotMatch(d.querySelector('#sj-rows').textContent,/STALE/);assert.match(d.querySelector('#sj-rows').textContent,/F-060/);dom.window.close();
});
test('failed replacement PDF clears the previous usable estimate',async()=>{
 const {dom,d,w}=setup(async()=>{throw Error('Unreadable PDF');});d.querySelector('#sj-demo').click();const input=d.querySelector('#sj-file-a');Object.defineProperty(input,'files',{value:[mockFile()]});input.dispatchEvent(new w.Event('change'));await wait();assert.equal(d.querySelector('#sj-compare').disabled,true);assert.equal(d.querySelector('#sj-results').hidden,true);assert.match(d.querySelector('#sj-status-a').textContent,/Unreadable/);dom.window.close();
});
test('PDF reader consumes streams, reports unreadable pages, and destroys its worker',async()=>{
 const mock=mockPDF([DEMO.a,'']);const result=await extractEstimatePDF(mockFile(),mock.options);assert.equal(result.pages[0].number,1);assert.equal(result.pages[0].source,'pdf');assert.deepEqual(result.unreadable,[2]);assert.equal(mock.calls.terminated,1);assert.equal(mock.calls.options.enableXfa,false);assert.equal(mock.calls.options.useWasm,false);assert.ok(mock.calls.options.worker.port);assert.equal(typeof mock.calls.options.data,'object');assert.equal(mock.calls.options.url,undefined);
});
test('invalid type and excessive file/page limits reject without successful parsing',async()=>{
 let loaded=false;await assert.rejects(extractEstimatePDF(mockFile(LIMITS.bytes+1),{loadLibrary:async()=>{loaded=true;}}),/10 MB/);assert.equal(loaded,false);
 await assert.rejects(extractEstimatePDF(mockFile(100,'not a PDF'),{loadLibrary:async()=>{loaded=true;}}),/could not be read/);assert.equal(loaded,false);
 const mock=mockPDF([DEMO.a],{pages:26});await assert.rejects(extractEstimatePDF(mockFile(),mock.options),/25 pages/);assert.equal(mock.calls.terminated,1);
});
test('scanned PDFs and huge extracted text reject instead of returning empty comparisons',async()=>{
 await assert.rejects(extractEstimatePDF(mockFile(),mockPDF(['']).options),/scan/);
 await assert.rejects(extractEstimatePDF(mockFile(),mockPDF(['x'.repeat(150001)]).options),/too much text/);
});
test('cancelled extraction terminates its native worker and rejects',async()=>{
 const mock=mockPDF([DEMO.a],{delay:true}),controller=new AbortController();const reading=extractEstimatePDF(mockFile(),{...mock.options,signal:controller.signal});await wait();controller.abort();await assert.rejects(reading,{name:'AbortError'});assert.ok(mock.calls.terminated>=1);
});
test('PDF password failure gives a usable fallback and releases its worker',async()=>{
 const mock=mockPDF([DEMO.a]);mock.options.loadLibrary=async()=>({PDFWorker:{create:()=>({destroy(){}})},getDocument:()=>({promise:Promise.reject(Object.assign(Error('secret'),{name:'PasswordException'})),destroy:async()=>{}})});
 await assert.rejects(extractEstimatePDF(mockFile(),mock.options),/password-protected/);assert.equal(mock.calls.terminated,1);
});
test('public discoverability preserves the project finder and adds accurate privacy copy',()=>{
 const home=new JSDOM(readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'));const d=home.window.document;assert.equal(d.querySelector('.project-finder').previousElementSibling.classList.contains('local-proof'),true);assert.equal(d.querySelector('.same-job-home').closest('.wz-more-tools'),null);assert.ok(d.querySelector('.same-job-home a[href="/same-job/"]'));home.window.close();
 assert.match(readFileSync(new URL('../dist/sitemap.xml',import.meta.url),'utf8'),/https:\/\/wazoozie.com\/same-job\//);
 const privacy=new JSDOM(readFileSync(new URL('../dist/privacy/index.html',import.meta.url),'utf8'));assert.match(privacy.window.document.querySelector('main').textContent,/not uploaded to Wazoozie/);privacy.window.close();
});

test('trade selection is explicit and edited notes survive a declined regeneration',()=>{
 const {dom,d,w}=setup();assert.equal(d.querySelector('#sj-trade').value,'');d.querySelector('#sj-demo').click();const notes=d.querySelector('#sj-notes');notes.value='My own carefully edited question';notes.dispatchEvent(new w.Event('input'));w.confirm=()=>false;const box=d.querySelector('#sj-rows input');const before=box.checked;box.click();assert.equal(box.checked,before);assert.equal(notes.value,'My own carefully edited question');w.dispatchEvent(new w.Event('pagehide'));assert.equal(d.querySelector('#sj-rows').childElementCount,0);assert.equal(notes.value,'');assert.equal(d.querySelector('#sj-text-a').value,'');dom.window.close();
});
test('a native worker loading error fails promptly with a paste fallback',async()=>{
 let listener;const mock=mockPDF([DEMO.a],{delay:true});mock.options.workerFactory=()=>({terminate(){mock.calls.terminated++;},addEventListener(type,fn){if(type==='error')listener=fn;}});const reading=extractEstimatePDF(mockFile(),mock.options);await wait();listener({preventDefault(){}});await assert.rejects(reading,/could not start/);assert.ok(mock.calls.terminated);
});

test('comparison page CSP confines modules, workers and document-related requests to this origin',async()=>{
 const response=await worker.fetch(new Request('https://wazoozie.com/same-job/'),{ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html'}})}});const csp=response.headers.get('Content-Security-Policy');assert.match(csp,/script-src 'self'; worker-src 'self'/);assert.match(csp,/connect-src 'self'/);assert.match(csp,/object-src 'none'/);assert.doesNotMatch(csp,/unsafe-eval|unsafe-inline|blob:/);assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');assert.equal(response.headers.get('X-Robots-Tag'),null);assert.doesNotMatch(html,/<[^>]+\sstyle=/,'strict-CSP page keeps styling in its external stylesheet');
});
test('an unresponsive parser is terminated at its deadline',async()=>{
 const previous=LIMITS.deadline;LIMITS.deadline=10;const mock=mockPDF([DEMO.a],{delay:true});try{await assert.rejects(extractEstimatePDF(mockFile(),mock.options),/took too long/);assert.ok(mock.calls.terminated);}finally{LIMITS.deadline=previous;}
});
