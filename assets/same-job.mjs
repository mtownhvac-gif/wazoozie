import {TRADES,DEMO,LIMITS,pastedPages,compareEstimates,questionNotes,questionDocument} from './same-job-core.mjs';
import {extractEstimatePDF} from './same-job-pdf.mjs';
import {saveEstimateHandoff} from './estimate-handoff.mjs';
const $=id=>document.getElementById(id), trade=$('sj-trade');
const slots={a:{pages:null,version:0},b:{pages:null,version:0}};
let queue=Promise.resolve(),result=null,demo=false,notesDirty=false;
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function invalidate(){result=null;notesDirty=false;$('sj-rows').replaceChildren();$('sj-results').hidden=true;$('sj-review').hidden=true;$('sj-notes').value='';$('sj-message').textContent='';}
function updateReady(){$('sj-compare').disabled=!Object.hasOwn(TRADES,trade.value)||!slots.a.pages||!slots.b.pages||slots.a.busy||slots.b.busy;}
function resetSlot(key){const slot=slots[key];slot.version++;slot.controller?.abort();slot.pages=null;slot.busy=false;$( 'sj-file-'+key).value='';$('sj-text-'+key).value='';$('sj-status-'+key).textContent='';$('sj-warning-'+key).textContent='';invalidate();updateReady();}
function textChanged(key){const slot=slots[key];slot.version++;slot.controller?.abort();slot.busy=false;slot.pages=null;$('sj-file-'+key).value='';$('sj-warning-'+key).textContent='';demo=false;invalidate();try{const pages=pastedPages($('sj-text-'+key).value);if(pages[0].text.length>=LIMITS.minimum)slot.pages=pages;$('sj-status-'+key).textContent=slot.pages?'Text ready.': 'Add a few lines of estimate wording.';}catch(error){$('sj-status-'+key).textContent=error.message;}updateReady();}
for(const key of ['a','b']){
 $('sj-text-'+key).addEventListener('input',()=>textChanged(key));
 $('sj-file-'+key).addEventListener('change',()=>{
  const file=$('sj-file-'+key).files?.[0];resetSlot(key);demo=false;if(!file)return;
  const slot=slots[key],version=slot.version,controller=new AbortController();slot.controller=controller;slot.busy=true;updateReady();
  $('sj-status-'+key).textContent='Waiting to read on this device…';
  queue=queue.catch(()=>{}).then(async()=>{
   if(version!==slot.version)return;$('sj-status-'+key).textContent='Reading on this device…';
   try{const data=await extractEstimatePDF(file,{signal:controller.signal,onProgress:(n,total)=>{if(version===slot.version)$('sj-status-'+key).textContent=`Reading page ${n} of ${total}…`;}});
    if(version!==slot.version)return;slot.pages=data.pages;
    $('sj-status-'+key).textContent=`${data.pages.length} ${data.pages.length===1?'page':'pages'} read. Ready.`;
    $('sj-warning-'+key).textContent=data.unreadable.length?`Little or no text was readable on ${data.unreadable.length===1?'page':'pages'} ${data.unreadable.join(', ')}. Check those pages yourself; images and handwriting are not read.`:'';
   }catch(error){if(version===slot.version){slot.pages=null;$('sj-status-'+key).textContent=error.name==='AbortError'?'Reading cancelled.':error.message||'This PDF could not be read. Paste the wording instead.';}}
   finally{if(version===slot.version){slot.busy=false;slot.controller=null;updateReady();}}
  });
 });
 $('sj-remove-'+key).addEventListener('click',()=>{resetSlot(key);demo=false;$('sj-file-'+key).focus();});
}
for(const [value,meta] of Object.entries(TRADES)){const option=el('option',meta.label);option.value=value;trade.append(option);}
trade.addEventListener('change',()=>{invalidate();updateReady();});
$('sj-notes').addEventListener('input',()=>{notesDirty=true;});
window.addEventListener('pagehide',()=>{for(const key of ['a','b'])resetSlot(key);demo=false;});
function evidence(list,label){const box=el('div',undefined,'sj-evidence');box.append(el('span','ESTIMATE '+label,'sj-column-label'));if(!list.length){box.append(el('p','Not found in extracted text. Check the original estimate.','sj-not-found'));return box;}
 for(const item of list){const quote=el('blockquote');quote.append(document.createTextNode((item.leading?'…':'')+item.excerpt.slice(0,item.hitStart)));quote.append(el('mark',item.hit));quote.append(document.createTextNode(item.excerpt.slice(item.hitStart+item.hit.length)+(item.trailing?'…':'')));box.append(quote,el('small',item.source==='paste'?'Pasted wording':`PDF · page ${item.page}`));if(item.qualified)box.append(el('span','Check this wording','sj-caution'));}
 return box;
}
function refreshNotes(event){if(notesDirty&&event?.target?.type==='checkbox'&&!window.confirm('Replace your edited question sheet with the newly selected questions?')){event.target.checked=!event.target.checked;return;}notesDirty=false;const selected=[...$('sj-rows').querySelectorAll('input:checked')].map(n=>n.value);$('sj-notes').value=questionNotes(result.trade,selected);$('sj-review').hidden=!selected.length;$('sj-review-link').hidden=!selected.length;$('sj-selected').textContent=`${selected.length} ${selected.length===1?'question':'questions'} selected`;$('sj-message').textContent='';}
$('sj-compare').addEventListener('click',()=>{
 try{result=compareEstimates(slots.a.pages,slots.b.pages,trade.value);}catch(error){$('sj-message').textContent=error.message;return;}
 $('sj-demo-notice').hidden=!demo;const rows=$('sj-rows');rows.replaceChildren();
 const labels={both:'Mentioned in both',a:'Found only in A',b:'Found only in B',neither:'Not found in extracted text'};
 for(const row of result.rows){const section=el('section',undefined,'sj-row');section.dataset.kind=row.kind;const heading=el('header');heading.append(el('h3',row.label),el('span',labels[row.kind],'sj-tag'));section.append(heading);const pair=el('div',undefined,'sj-evidence-pair');pair.append(evidence(row.a,'A'),evidence(row.b,'B'));section.append(pair);
  const question=el('label',undefined,'sj-question');const input=el('input');input.type='checkbox';input.value=row.id;input.checked=true;input.addEventListener('change',refreshNotes);question.append(input,el('span',row.question));section.append(question);rows.append(section);
 }
 notesDirty=false;$('sj-results').hidden=false;refreshNotes();$('sj-results-title').focus();$('sj-results').scrollIntoView({behavior:'smooth',block:'start'});
});
$('sj-demo').addEventListener('click',()=>{
 if((slots.a.pages||slots.b.pages||slots.a.busy||slots.b.busy||$('sj-text-a').value||$('sj-text-b').value)&&!window.confirm('Replace the estimates on this page with the fictional example?'))return;
 for(const key of ['a','b']){resetSlot(key);$('sj-text-'+key).value=DEMO[key];textChanged(key);$('sj-paste-'+key).open=true;}
 demo=true;trade.value='hvac';updateReady();$('sj-compare').click();
});
$('sj-clear').addEventListener('click',()=>{for(const key of ['a','b'])resetSlot(key);demo=false;$('sj-file-a').focus();});
$('sj-copy').addEventListener('click',async()=>{const notes=$('sj-notes').value.trim();if(!notes){$('sj-message').textContent='Select a question or write your notes first.';return;}try{await navigator.clipboard.writeText(notes);$('sj-message').textContent='Questions copied.';}catch{$('sj-notes').focus();$('sj-notes').select();$('sj-message').textContent='Select and copy the questions from the box above.';}});
$('sj-download').addEventListener('click',()=>{const notes=$('sj-notes').value.trim();if(!notes){$('sj-message').textContent='Select a question or write your notes first.';return;}const url=URL.createObjectURL(new Blob([questionDocument(notes)],{type:'text/html;charset=utf-8'}));const a=el('a');a.href=url;a.download='my-estimate-questions.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);$('sj-message').textContent='Question sheet downloaded. Your source estimates are not attached.';});
$('sj-help').addEventListener('click',()=>{const intent=TRADES[result?.trade]?.intent,notes=$('sj-notes').value.trim();let saved=false;try{saved=saveEstimateHandoff(sessionStorage,intent,notes);}catch{}if(saved)location.assign('/request/?intent='+encodeURIComponent(intent)+'&entry=estimate-check');else $('sj-message').textContent='We could not carry the questions to the next page. Copy them first, then use “Request help” in the menu.';});
$('sj-share').addEventListener('click',async()=>{const url='https://wazoozie.com/same-job/';try{if(navigator.share)await navigator.share({title:'Compare two estimates · Wazoozie',url});else{await navigator.clipboard.writeText(url);$('sj-share-status').textContent='Tool link copied. No estimate details are in the link.';}}catch(error){if(error.name!=='AbortError')$('sj-share-status').textContent='Share this link: '+url;}});
updateReady();$('sj-working').hidden=true;$('sj-app').hidden=false;
