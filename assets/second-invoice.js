import {PROJECTS,ASSUMPTIONS,DEFAULT_STATE,normalizeState,buildPlan,encodePlan,decodePlan,planText} from './second-invoice-model.mjs';
const $=id=>document.getElementById('ripple-'+id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='wazoozie-second-invoice-v1';
let state=normalizeState(DEFAULT_STATE),mode='example',original=null,showingFixed=false,storageOkay=true;
try{
  const shared=decodePlan(location.hash),saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(shared){state=shared;mode='shared';}
  else if(saved&&Array.isArray(saved.order)){state=normalizeState(saved);mode='saved';}
}catch{storageOkay=false;}
function announce(text){$('status').textContent=text;}
function remember(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOkay=false;}}
function update({persist=true,resetComparison=true}={}){
  if(resetComparison){original=null;showingFixed=false;}
  state=normalizeState(state);if(persist){mode='your';remember();}
  render();
}
function question(item){
  const checked=state.confirmed.includes(item.id);
  return `<details class="ripple-question"><summary>The question to ask</summary><p>${esc(item.question)}</p><label><input type="checkbox" data-confirm="${item.id}" ${checked?'checked':''}> I’ve discussed this with the relevant trade.</label>${item.source?`<a href="${esc(item.source)}" target="_blank" rel="noopener">Planning source ↗</a>`:''}</details>`;
}
function relevantAssumption(id){
  const has=x=>state.order.includes(x);
  return id==='same-area'?state.order.length>1:id==='wall-access'?(has('heatpump')||has('electrical')):id==='window-trim'?has('windows'):id==='house-change'?has('heatpump')&&(has('windows')||has('basement')||has('kitchen')):id==='moisture'?has('basement'):id==='tankless'?has('waterheater'):false;
}
function render(){
  const p=buildPlan(state);state=p.state;
  $('mode').textContent=mode==='example'?'An example: paint, windows, then heating & cooling. Try changing the order.':mode==='shared'?'A shared plan. You can change these choices on this browser.':mode==='saved'?'Your plan from this browser. Pick up where you left off.':'Your planning scenario. Change a choice and watch the possible do-overs change.';
  $('projects').innerHTML=Object.entries(PROJECTS).map(([id,x])=>`<button type="button" class="ripple-project ${state.order.includes(id)?'is-selected':''}" data-project="${id}" aria-pressed="${state.order.includes(id)}"><span aria-hidden="true">${x.icon}</span><strong>${esc(x.name)}</strong><small>${state.order.includes(id)?'In your plan ✓':'Add to plan +'}</small></button>`).join('');
  $('order').innerHTML=state.order.map((id,i)=>{const x=PROJECTS[id],affected=p.risks.some(r=>r.after===id);return `<li class="${affected?'ripple-order-affected':''}"><span class="ripple-order-number">${String(i+1).padStart(2,'0')}</span><div><strong>${esc(x.name)}</strong><p>${esc(x.intro)}</p>${affected?'<small class="ripple-order-watch">Check the work that follows this.</small>':''}</div><div class="ripple-move"><button type="button" data-move="${id}" data-delta="-1" aria-label="Move ${esc(x.name)} earlier" ${i===0?'disabled':''}>↑</button><button type="button" data-move="${id}" data-delta="1" aria-label="Move ${esc(x.name)} later" ${i===state.order.length-1?'disabled':''}>↓</button></div></li>`;}).join('');
  $('empty').hidden=!!state.order.length;
  $('assumptions').innerHTML=ASSUMPTIONS.filter(x=>relevantAssumption(x.id)).map(x=>`<label class="ripple-assumption"><input type="checkbox" data-flag="${x.id}" ${state.flags.includes(x.id)?'checked':''}><span><strong>${esc(x.label)}</strong><small>${esc(x.help)}</small></span></label>`).join('')||'<p>Add a project to reveal the relevant planning choices.</p>';
  $('count').textContent=state.order.length+' PROJECT'+(state.order.length===1?'':'S');
  $('risks').innerHTML=p.risks.length?p.risks.map((r,i)=>`<article class="ripple-risk"><div class="ripple-risk-label"><span>POSSIBLE DO-OVER / ${String(i+1).padStart(2,'0')}</span><span>↶</span></div><h3>${esc(r.title)}</h3><p>${esc(r.possible)}</p><div class="ripple-risk-path">${esc(PROJECTS[r.after].name)} <span>→</span> ${esc(PROJECTS[r.before].name)} <span>→</span> possible restoration</div>${question(r)}</article>`).join(''):`<div class="ripple-no-conflict"><span aria-hidden="true">${state.order.length?'✓':'…'}</span><h3>${state.order.length?'No conflicts found for these choices.':'Choose the jobs you’re planning.'}</h3><p>${state.order.length?'Your contractors still need to check the house, what each job includes and whether anything else changes the order.':'Choose projects to preview how their order could affect the work.'}</p></div>`;
  $('total').textContent=p.risks.length;
  $('fix').disabled=!p.risks.length;
  $('fix').textContent=p.risks.length?'Fix my order ↶':'Order checked in this model ✓';
  $('undo').hidden=!original;
  $('undo').textContent=showingFixed?'Compare with my original order':'Return to the proposed fix';
  const connections=[...p.gates.map(x=>({...x,kind:'SETTLE THIS FIRST'})),...p.overlaps.map(x=>({...x,kind:'COORDINATE THE WORK'}))];
  $('summary').textContent=p.openQuestions.length+' question'+(p.openQuestions.length===1?'':'s')+' still to discuss';
  $('connections').innerHTML=connections.length?connections.map(x=>`<article class="ripple-connection ${x.kind==='SETTLE THIS FIRST'?'ripple-gate':''}"><span class="ripple-kicker">${x.kind}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p>${question(x)}</article>`).join(''):`<article class="ripple-connection"><span class="ripple-kicker">AGREE ON WHO DOES WHAT</span><h3>Who leaves it ready for the next trade?</h3><p>Agree on who handles access, protection, patching, cleanup and touch-ups. Include those responsibilities in the written proposals.</p></article>`;
  $('trades').innerHTML=p.trades.map(x=>`<a href="${x.href}">${esc(x.name)} <span>Meet local contacts ↗</span></a>`).join('')||'<a href="/local-help/">Explore local help →</a>';
  $('copy').disabled=!state.order.length;$('download').disabled=!state.order.length;$('share').disabled=!state.order.length;
}
function choose(id){
  if(state.order.includes(id))state.order=state.order.filter(x=>x!==id);
  else if(state.order.length<4)state.order.push(id);
  else {announce('Your plan can include four projects. Remove one before adding another.');return;}
  update();announce('Plan updated. '+buildPlan(state).risks.length+' possible ordering conflicts to discuss.');
}
$('projects').addEventListener('click',e=>{const b=e.target.closest('[data-project]');if(b)choose(b.dataset.project);});
$('order').addEventListener('click',e=>{
  const b=e.target.closest('[data-move]');if(!b)return;
  const i=state.order.indexOf(b.dataset.move),j=i+Number(b.dataset.delta);if(i<0||j<0||j>=state.order.length)return;
  [state.order[i],state.order[j]]=[state.order[j],state.order[i]];update();
  const same=$('order').querySelector(`[data-move="${b.dataset.move}"][data-delta="${b.dataset.delta}"]`);if(same&&!same.disabled)same.focus();
  announce(PROJECTS[b.dataset.move].name+' moved. '+buildPlan(state).risks.length+' possible ordering conflicts to discuss.');
});
$('assumptions').addEventListener('change',e=>{const id=e.target.dataset.flag;if(!id)return;state.flags=e.target.checked?[...state.flags,id]:state.flags.filter(x=>x!==id);update();$('assumptions').querySelector(`[data-flag="${id}"]`)?.focus();announce('Assumption updated. The preview now reflects that choice.');});
document.querySelector('.ripple-lab').addEventListener('change',e=>{const id=e.target.dataset.confirm;if(!id)return;state.confirmed=e.target.checked?[...state.confirmed,id]:state.confirmed.filter(x=>x!==id);remember();$('summary').textContent=buildPlan(state).openQuestions.length+' questions still to discuss';announce('Discussion status saved on this browser. It is not a contractor approval.');});
$('fix').addEventListener('click',()=>{
  original=[...state.order];state.order=buildPlan(state).recommended;showingFixed=true;update({resetComparison:false});
  announce('Proposed order updated. Discuss the actual phasing with your trades; projects can overlap.');
});
$('undo').addEventListener('click',()=>{const next=original;original=[...state.order];state.order=next;showingFixed=!showingFixed;update({resetComparison:false});announce(showingFixed?'Showing the proposed fix.':'Showing your original order for comparison.');});
$('clear').addEventListener('click',()=>{state={order:[],flags:['same-area','wall-access','window-trim'],confirmed:[]};update();announce('Start with the projects you have in mind.');});
function sharedURL(){return (location.origin==='null'?'https://wazoozie.com':location.origin)+'/second-invoice/#'+encodePlan(state);}
async function copyText(text,isLink){
  try{await navigator.clipboard.writeText(text);$('fallback').hidden=true;announce(isLink?'Plan link copied. It shares project choices and assumptions only.':'Project sheet copied. Review it before sharing.');}
  catch{$('fallback').hidden=false;$('link').value=text;$('link').focus();$('link').select();announce('Select and copy the text below.');}
}
$('share').addEventListener('click',()=>copyText(sharedURL(),true));
$('copy').addEventListener('click',()=>copyText(planText(state)+'\n\n'+sharedURL(),false));
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([planText(state)+'\n\n'+sharedURL()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='wazoozie-project-conversation.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Your project sheet is ready to download.');});
$('print').addEventListener('click',()=>window.print());
$('forget').addEventListener('click',()=>{try{localStorage.removeItem(KEY);}catch{}state={order:[],flags:[],confirmed:[]};original=null;mode='your';history.replaceState(null,'',location.pathname);render();announce('This plan was cleared from this browser. Existing shared links still contain their selected project choices.');});
window.addEventListener('hashchange',()=>{const shared=decodePlan(location.hash);if(shared){state=shared;mode='shared';original=null;render();announce('Shared plan loaded.');}});
render();
if(!storageOkay)announce('The preview works here. Use a share link or download to keep your choices if browser storage is unavailable.');
