import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const code=readFileSync(new URL('../assets/offer-decoder.js',import.meta.url),'utf8').replace('export function visitTotal','function visitTotal');
function setup(){
 const dom=new JSDOM(readFileSync(new URL('../dist/pricing-guide/index.html',import.meta.url),'utf8'),{url:'https://wazoozie.com/pricing-guide/',runScripts:'outside-only'});
 dom.window.eval(code+'\nwindow.total=visitTotal;');return dom.window;
}
test('offer decoder distinguishes unknown fees from confirmed zero and adds cents accurately',()=>{
 const w=setup();
 assert.equal(w.total(['49','150','0']),199);
 assert.equal(w.total(['0.10','0.20','0']),0.3);
 assert.equal(w.total(['0','0','0']),0);
 for(const v of [['49','','0'],['49','-1','0'],['1e3','0','0'],['1.001','0','0'],['1000001','0','0'],['$49','0','0'],['49','NaN','0']])assert.equal(w.total(v),null);
 w.close();
});
test('fictional example is clearly labeled and changed or reset inputs invalidate call notes',()=>{
 const w=setup(),d=w.document,form=d.querySelector('#offer-form');
 assert.equal(form.hidden,false);
 assert.ok(d.querySelector('#hvac').compareDocumentPosition(d.querySelector('#offer-decoder')) & w.Node.DOCUMENT_POSITION_FOLLOWING);
 d.querySelector('#offer-included-example').click();
 assert.equal(d.querySelector('#offer-total').textContent,'$49.00');
 assert.equal(d.querySelector('#offer-receipt-label').textContent,'FICTIONAL EXAMPLE');
 d.querySelector('#offer-example').click();
 assert.equal(d.querySelector('#offer-total').textContent,'$199.00');
 assert.match(d.querySelector('#offer-result').textContent,/Fictional example.*\$199.00/);
 assert.match(d.querySelector('#offer-notes').value,/approve no repairs/);
 assert.equal(d.querySelector('#offer-notes-panel').hidden,false);
 form.querySelector('input').dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.equal(d.querySelector('#offer-copy').disabled,true);
 assert.equal(d.querySelector('#offer-notes-panel').hidden,true);
 assert.equal(d.querySelector('#offer-receipt').hidden,true);
 assert.equal(d.querySelector('#offer-notes').value,'');
 d.querySelector('#offer-example').click();form.reset();
 assert.equal(d.querySelector('#offer-notes').value,'');
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));
 assert.match(d.querySelector('#offer-result').textContent,/still unknown/);
 assert.equal(w.localStorage.length,0);w.close();
});
test('copy has an honest fallback and notes contain only the displayed inputs and questions',async()=>{
 const w=setup(),d=w.document;
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('blocked')}}});
 d.querySelector('#offer-example').click();d.querySelector('#offer-copy').click();
 await new Promise(r=>setTimeout(r,0));
 assert.match(d.querySelector('#offer-copy-status').textContent,/Select and copy/);
 assert.equal(d.activeElement.id,'offer-notes');
 assert.match(d.querySelector('#offer-notes').value,/https:\/\/wazoozie.com\/pricing-guide\/#offer-decoder/);
 assert.equal(w.localStorage.length,0);w.close();
});
