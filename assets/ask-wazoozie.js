import {CATALOG} from './ask-catalog.mjs';
import {ASK_HANDOFF_KEY} from './ask-handoff.mjs';
import {quickPlan,projectExample,planText as formatPlan,requestNotes,validPlanExtras,localSafety} from './ask-plan-tools.mjs';
import {planningResources,describeProject} from './planning-resources.mjs';
const $=id=>document.getElementById(id);
const {INTENTS,BUSINESSES}=CATALOG;
const STORE='wazoozie.planning-notes.v1';
const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const link=(label,href,cls)=>{const a=make('a',label,cls);a.href=href;return a;};
let mode='plan',answer=null,question='',intent='',saved=[],responses=[],prepared=[],activeSavedId=null,available=false,busy=false,saveButton=null;
const snapshot=()=>({mode,intent,question,answer,responses:[...responses],prepared:[...prepared]});
const status=text=>{$('ask-status').textContent=text;};
for(const [id,trade] of Object.entries(INTENTS).sort((a,b)=>a[1].label.localeCompare(b[1].label)))$('ask-intent').append(new Option(trade.label,id));
function setMode(next){
 if(!['plan','prepare','estimate'].includes(next))return;
 mode=next;document.querySelectorAll('[data-ask-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.askMode===mode)));
 $('ask-question-label').textContent=mode==='estimate'?'What would you like to clarify about the quote?':mode==='prepare'?'What are you planning to discuss?':'What would you like sorted out?';
 $('ask-submit').textContent=mode==='estimate'?'Help me review the details →':mode==='prepare'?'Get my questions ready →':'Help me plan this →';
}
const params=new URL(location.href).searchParams;
setMode(params.get('mode')||'plan');
if(Object.hasOwn(INTENTS,params.get('intent')))$('ask-intent').value=params.get('intent');
function count(){$('ask-count').textContent=`${$('ask-question').value.length.toLocaleString()} / 1,800`;}
function clearAnswer(){answer=null;responses=[];prepared=[];activeSavedId=null;saveButton=null;$('ask-result').hidden=true;$('ask-result').replaceChildren();$('ask-empty').hidden=false;}
function invalidate(){clearAnswer();$('ask-consent').checked=false;status('Review your question, then choose planning help or a quick checklist.');}
$('ask-question').oninput=()=>{count();invalidate();};
$('ask-intent').onchange=()=>{invalidate();renderDescription();};
document.querySelectorAll('[data-ask-mode]').forEach(b=>b.onclick=()=>{if(!busy){setMode(b.dataset.askMode);invalidate();}});
$('ask-example').onclick=()=>{
 if(busy)return;
 const text=projectExample($('ask-intent').value,mode,CATALOG);
 if(!text){status('Choose the kind of work first so the example fits your project.');$('ask-intent').focus();return;}
 $('ask-question').value=text;count();invalidate();
};
const description=make('details',undefined,'ask-description');description.append(make('summary','Help me describe the project'));
const descriptionFields=make('div');description.append(descriptionFields);$('ask-question-label').before(description);
function renderDescription(){
 descriptionFields.replaceChildren();const selected=$('ask-intent').value;
 if(!Object.hasOwn(INTENTS,selected)){descriptionFields.append(make('p','Choose the kind of work first. These prompts stay in your browser.','ask-small'));return;}
 descriptionFields.append(make('p','Add only what you can safely observe. Skip anything you do not know. No names, street addresses, contact details or private records.','ask-small'));
 const questions=CATALOG.PROJECT_QUESTIONS[selected]||[],inputs=[];
 questions.slice(0,3).forEach(q=>{const label=make('label',q),input=make('input');input.type='text';input.maxLength=160;input.setAttribute('aria-label',q);label.append(input);descriptionFields.append(label);inputs.push(input);});
 const timingLabel=make('label','When would you like help?'),timing=make('select');timing.setAttribute('aria-label','Preferred timing');for(const value of ['', 'As soon as possible','This week','Planning ahead']){const option=make('option',value||'No preference yet');option.value=value;timing.append(option);}timingLabel.append(timing);descriptionFields.append(timingLabel);
 const apply=make('button','Add these details to my question','btn outline');apply.type='button';apply.onclick=()=>{if(busy)return;const result=describeProject($('ask-question').value,questions,inputs.map(i=>i.value),timing.value);if(result.error){status(result.error);return;}$('ask-question').value=result.text;count();invalidate();inputs.forEach(i=>i.value='');timing.value='';description.open=false;$('ask-question').focus();status('Details added for you to review. Nothing was sent; choose a checklist or planning help when ready.');};descriptionFields.append(apply);
}
renderDescription();
function edited(){
 const complete=responses.filter(x=>x?.trim()).length;
 const ready=prepared.filter(Boolean).length;
 const progress=$('ask-progress');
 if(progress)progress.textContent=`${complete} of ${answer.questions.length} questions with notes · ${ready} of ${answer.prepare.length} preparation steps ready`;
 const warning=$('ask-local-safety'),contact=$('ask-next-contact');const caution=localSafety(snapshot());if(warning){warning.hidden=!caution;warning.textContent=caution||'';}if(contact)contact.hidden=Boolean(caution);
 if(saveButton){saveButton.disabled=false;saveButton.textContent=activeSavedId?'Update saved plan':'Save on this browser';}
}
function savePlan(){
 const id=activeSavedId||crypto.randomUUID();
 const record={id,at:new Date().toISOString(),...snapshot(),answer:{summary:answer.summary,questions:answer.questions,prepare:answer.prepare,emergency:false,...(answer.kind==='checklist'?{kind:'checklist'}:{})}};
 try{
  const next=[record,...saved.filter(r=>r.id!==id)].slice(0,3);
  localStorage.setItem(STORE,JSON.stringify(next));saved=next;activeSavedId=id;renderSaved();
  status('Plan and your answers saved on this browser. Nothing has been sent to a business.');
  saveButton.disabled=true;saveButton.textContent='Saved on this browser ✓';
 }catch{status('This browser could not save the plan. Copy or download it to keep your notes.');}
}
function downloadPlan(){
 const blob=new Blob([formatPlan(snapshot(),CATALOG)],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=link('',url);
 a.download=`wazoozie-${intent}-plan.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 status('Plan downloaded with your notes and checklist. Nothing has been sent to a business.');
}
function show(result,isSaved=false){
 const root=$('ask-result');root.replaceChildren();$('ask-empty').hidden=true;root.hidden=false;
 const source=isSaved?'SAVED ON THIS BROWSER':result.emergency?'SAFETY FIRST':result.kind==='checklist'?'YOUR QUICK CHECKLIST':'YOUR STARTING POINT';
 root.append(make('div',source,'eyebrow'),make('h2',result.emergency?'Please get to a safe place.':'Your project, taking shape.'),make('p',result.summary,'ask-summary'));
 if(result.emergency){root.append(link('Emergency calling information','tel:911','btn primary'),make('p','Do not use this project helper to manage an emergency.','ask-small'));}
 else{
  const notes=make('section',undefined,'ask-question-notes');notes.append(make('h3','Make these questions useful.'),make('p','Add what you know. These notes stay in this page until you save, download or choose to carry them into a request.','ask-small'));
  result.questions.forEach((q,i)=>{
   const label=make('label',q);const input=make('textarea');input.rows=2;input.maxLength=400;input.placeholder='What you know—or leave this to confirm';input.value=responses[i]||'';input.setAttribute('aria-label',`My note: ${q}`);
   input.oninput=()=>{responses[i]=input.value;edited();};label.append(input);notes.append(label);
  });root.append(notes);
  const prep=make('fieldset',undefined,'ask-prep-list');prep.append(make('legend','A few things to have ready'));
  result.prepare.forEach((text,i)=>{const label=make('label');const checkbox=make('input');checkbox.type='checkbox';checkbox.checked=prepared[i]===true;checkbox.onchange=()=>{prepared[i]=checkbox.checked;edited();};label.append(checkbox,make('span',text));prep.append(label);});
  const progress=make('p','','ask-small');progress.id='ask-progress';progress.setAttribute('role','status');root.append(prep,progress);
  const caution=make('p','','ask-local-safety');caution.id='ask-local-safety';caution.hidden=true;caution.setAttribute('role','alert');root.append(caution);
  const trade=INTENTS[intent],business=BUSINESSES[trade.provider];
  const resources=make('section',undefined,'ask-references');resources.append(make('h3','Useful guides for this project'),make('p','Selected from Wazoozie’s planning guides. These links are separate from the suggested notes.','ask-small'));
  for(const resource of planningResources(intent,mode))resources.append(link(resource.title+' →',resource.href));root.append(resources);
  const contact=make('section',undefined,'ask-next');contact.id='ask-next-contact';
  const requestLink=link('Take my notes to a request →','/start/?intent='+intent,'btn primary');
  requestLink.onclick=event=>{try{sessionStorage.setItem(ASK_HANDOFF_KEY,JSON.stringify({intent,details:requestNotes(snapshot()),at:Date.now()}));}catch{event.preventDefault();status('This browser could not carry the notes. Copy or download the plan, then use the business contact.');}};
  contact.append(make('span','WHEN YOU’RE READY','eyebrow'),make('h3',business.name),make('p','A directory contact for your selected project. Confirm scope, address coverage, charges and availability directly.'),link('Meet the business →','/businesses/'+business.slug+'/','btn outline'),link('Call '+business.phone,'tel:'+business.tel,'ask-direct-call'),requestLink);root.append(contact);
  if(/\b(?:urgent|as soon as possible|no heat|no cooling|no hot water)\b/i.test(question))contact.prepend(make('p','Need prompt help? Call the business to check availability. Planning notes and online requests do not confirm service today.','ask-call-first'));
  const actions=make('div',undefined,'ask-result-actions');
  const copy=make('button','Copy my plan','btn outline');copy.type='button';copy.onclick=async()=>{try{await navigator.clipboard.writeText(formatPlan(snapshot(),CATALOG));status('Plan copied with your notes. You decide where to share it.');}catch{const fallback=make('textarea',undefined,'ask-copy-fallback');fallback.value=formatPlan(snapshot(),CATALOG);fallback.readOnly=true;fallback.setAttribute('aria-label','Project notes to copy');root.append(fallback);fallback.focus();fallback.select();status('Copy wasn’t available. Select and copy the notes shown below.');}};
  const download=make('button','Download my plan','btn outline');download.type='button';download.onclick=downloadPlan;
  saveButton=make('button',activeSavedId?'Update saved plan':'Save on this browser','btn outline');saveButton.type='button';saveButton.onclick=savePlan;
  actions.append(copy,download,saveButton);root.append(actions,make('p','Suggested planning notes—not a diagnosis, quote or appointment. Nothing has been sent to a business.','ask-small'));edited();
 }
 root.tabIndex=-1;root.focus({preventScroll:true});
 if(matchMedia('(max-width: 760px)').matches)root.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function validSaved(r){return r&&typeof r.id==='string'&&typeof r.at==='string'&&['plan','prepare','estimate'].includes(r.mode)&&Object.hasOwn(INTENTS,r.intent)&&typeof r.question==='string'&&r.question.length<=1800&&r.answer&&r.answer.emergency===false&&typeof r.answer.summary==='string'&&r.answer.summary.length<=700&&['questions','prepare'].every(k=>Array.isArray(r.answer[k])&&r.answer[k].length>=1&&r.answer[k].length<=3&&r.answer[k].every(x=>typeof x==='string'&&x.length<=250))&&validPlanExtras(r);}
function renderSaved(){
 const root=$('ask-saved-list');root.replaceChildren();$('ask-delete-all').hidden=!saved.length;
 if(!saved.length){root.append(make('p','No plans saved on this browser.'));return;}
 saved.forEach(r=>{
  const row=make('article');row.append(make('span',INTENTS[r.intent].label,'eyebrow'),make('h3',r.answer.summary.slice(0,95)+(r.answer.summary.length>95?'…':'')));
  const open=make('button','Open saved plan →');open.type='button';open.onclick=()=>{if(busy)return;setMode(r.mode);$('ask-intent').value=r.intent;$('ask-question').value=r.question;renderDescription();count();$('ask-consent').checked=false;intent=r.intent;question=r.question;answer=r.answer;responses=[...(r.responses||[])];prepared=[...(r.prepared||[])];activeSavedId=r.id;show(answer,true);status('Saved notes reopened. No new model request or business request was made.');};
  const remove=make('button','Remove');remove.type='button';remove.onclick=()=>{try{const next=saved.filter(x=>x.id!==r.id);if(next.length)localStorage.setItem(STORE,JSON.stringify(next));else localStorage.removeItem(STORE);saved=next;if(activeSavedId===r.id){activeSavedId=null;edited();}renderSaved();$('ask-storage-status').textContent='Saved plan removed.';}catch{$('ask-storage-status').textContent='This browser could not remove the saved plan.';}};
  row.append(open,remove);root.append(row);
 });
}
try{const value=JSON.parse(localStorage.getItem(STORE)||'[]');saved=Array.isArray(value)?value.filter(validSaved).slice(0,3):[];}catch{$('ask-storage-status').textContent='Browser storage is unavailable. You can still use a checklist, copy or download notes.';}
renderSaved();
$('ask-delete-all').onclick=()=>{try{localStorage.removeItem(STORE);saved=[];activeSavedId=null;if(answer&&!answer.emergency)edited();renderSaved();$('ask-storage-status').textContent='Saved plans removed from this browser.';}catch{$('ask-storage-status').textContent='This browser could not remove the saved plans.';}};
function lock(value){busy=value;document.querySelector('.ask-workspace').setAttribute('aria-busy',String(value));for(const id of ['ask-intent','ask-question','ask-consent','ask-example','ask-quick'])$(id).disabled=value;document.querySelectorAll('[data-ask-mode]').forEach(b=>b.disabled=value);$('ask-submit').disabled=value||!available;}
$('ask-quick').onclick=()=>{
 if(busy)return;
 const selected=$('ask-intent').value;
 if(!Object.hasOwn(INTENTS,selected)){status('Choose the kind of work to get a quick checklist.');$('ask-intent').focus();return;}
 clearAnswer();intent=selected;question=$('ask-question').value.trim()||`Preparing for ${INTENTS[intent].label.toLowerCase()}.`;
 answer=quickPlan(intent,question,CATALOG);responses=[];prepared=[];show(answer);
 status(answer.emergency?'Please follow the safety guidance.':'Quick checklist ready. Your question was not sent and no daily allowance was used.');
};
$('ask-form').onsubmit=async event=>{
 event.preventDefault();if(busy||!available||!$('ask-form').reportValidity())return;
 clearAnswer();question=$('ask-question').value.trim();intent=$('ask-intent').value;lock(true);status('Putting your project notes together…');
 try{
  const response=await fetch('/api/ask-wazoozie',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',body:JSON.stringify({question,intent,mode,consent:true}),signal:AbortSignal.timeout(55000)});
  const result=await response.json();if(!response.ok)throw Error(result.error||'The helper is temporarily unavailable.');
  if(typeof result.summary!=='string'||!Array.isArray(result.questions)||!Array.isArray(result.prepare))throw Error('The helper could not produce a clear response.');
  answer=result;show(answer);status(result.emergency?'Please follow the safety guidance.':'Your starting point is ready. Add your answers, check off preparation and choose the next step.');
 }catch(error){status((error.name==='TimeoutError'?'The helper took too long.':error.message)+' You can use Get a quick checklist without another request.');$('ask-empty').hidden=false;}
 finally{lock(false);}
};
$('ask-submit').disabled=true;
fetch('/api/ask-wazoozie',{credentials:'omit',referrerPolicy:'no-referrer'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{available=data.available===true;$('ask-submit').disabled=!available;if(!available)status('Use Get a quick checklist now. Tailored planning help is temporarily unavailable.');}).catch(()=>{status('Use Get a quick checklist now. Tailored planning help is temporarily unavailable.');});
$('ask-share').onclick=async()=>{
 const url=new URL('/ask/',location.origin);const selected=$('ask-intent').value;if(Object.hasOwn(INTENTS,selected))url.searchParams.set('intent',selected);url.searchParams.set('mode',mode);
 try{if(navigator.share){await navigator.share({title:'Ask Wazoozie',text:'A useful starting point for your next home project.',url:url.href});$('ask-storage-status').textContent='Helper shared. Private notes were not included.';}else{await navigator.clipboard.writeText(url.href);$('ask-storage-status').textContent='Helper link copied. Private notes were not included.';}}
 catch(error){$('ask-storage-status').textContent=error.name==='AbortError'?'Sharing cancelled.':`You can share this page: ${url.href}`;}
};
