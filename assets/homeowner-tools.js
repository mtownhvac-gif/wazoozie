import {INTENTS, BUSINESSES, PROJECT_QUESTIONS} from './project-config.mjs';

export function parsePrice(value) {
  const text=String(value).trim().replace(/^\$\s*/, '');
  if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text))return null;
  const number=Number(text.replace(/,/g,''));
  return Number.isFinite(number)&&number>0&&number<=1e9?Math.round(number*100):null;
}
export function priceDifference(a,b) {
  const left=parsePrice(a),right=parsePrice(b);
  if(left===null||right===null)return null;
  return {cents:Math.abs(left-right),percent:Math.abs(left-right)/Math.min(left,right)*100};
}
const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(cents/100);
const COMMON_ROWS=[
  ['total','Full installed price','Include tax, fees and any required work.','price'],
  ['scope','Included work','Write the actual scope, not only “replacement” or “repair.”'],
  ['materials','Equipment & materials','Models, quantities, sizes or finish specifications.'],
  ['exclusions','Exclusions & allowances','What is left out? Which amounts are allowances rather than fixed prices?'],
  ['permits','Permits & other trades','Who arranges permits, electrical work or other trades?'],
  ['cleanup','Protection & cleanup','Removal, disposal and protection of the home.'],
  ['schedule','Schedule','Expected start, duration and dependencies.'],
  ['payment','Payment milestones','Deposit, progress payments and final payment terms.'],
  ['warranty','Warranty & callbacks','Parts/materials, labor, duration and who to call.']
];
const TRADE_PROMPTS={
  general:['Scope details to confirm','Access, measurements, product selection and any hidden conditions.'],
  hvac:['Installation details to confirm','Sizing assessment, exact equipment, controls, electrical, venting, drainage and startup as applicable.'],
  painting:['Preparation & finish details','Patching, surface prep, primer, number of coats, product/finish and surfaces included.'],
  remodeling:['Design & construction details','Drawings, measurements, structural work, product selections and change-order process.']
};
export function initHomeownerTools(doc) {
  const win=doc.defaultView;
  const make=(tag,text,className)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
  const anchor=(text,href)=>{const n=make('a',text);n.href=href;return n;};
  const resize=node=>{node.style.height='auto';node.style.height=Math.max(68,node.scrollHeight)+'px';};
  const kit=doc.querySelector('#project-kit');
  if(kit){
    kit.hidden=false;
    const select=doc.querySelector('#kit-intent');
    const order=['comfort','water','electrical','plumbing','painting','carpentry','doors','windows','decks','additions','boiler','maintenance','replacement','secondopinion'];
    for(const key of order){const option=make('option',INTENTS[key].label);option.value=key;select.append(option);}
    const requested=new URL(win.location.href).searchParams.get('intent');if(requested&&Object.hasOwn(INTENTS,requested))select.value=requested;
    let sheet='';
    function update(){
      const key=select.value,intent=INTENTS[key],business=BUSINESSES[intent.provider];
      const goal=doc.querySelector('#kit-goal').value.trim(),notes=doc.querySelector('#kit-notes').value.trim(),stage=doc.querySelector('#kit-stage').value,timing=doc.querySelector('#kit-timing').value;
      doc.querySelector('#kit-title').textContent=intent.label;
      doc.querySelector('#kit-context').textContent=stage+' · '+timing;
      const questions=PROJECT_QUESTIONS[key]||PROJECT_QUESTIONS.comfort;
      doc.querySelector('#kit-questions').replaceChildren(...questions.map(q=>make('li',q)));
      const preview=doc.querySelector('#kit-preview');preview.replaceChildren();
      if(goal)preview.append(make('h3','What I want to change'),make('p',goal));
      if(notes)preview.append(make('h3','Details & questions'),make('p',notes));
      const contact=doc.querySelector('#kit-business');contact.replaceChildren(make('span','A LOCAL BUSINESS TO TALK WITH','eyebrow'),make('strong',business.name),anchor('Meet the business ↗','/businesses/'+business.slug+'/'),anchor('Call '+business.phone,'tel:'+business.tel));
      const route=anchor('Prepare an inquiry to this business →','/start/?intent='+key);contact.append(route);
      sheet=['MY HOME PROJECT — '+intent.label,stage,'Preferred timing: '+timing,goal?'What I want to change: '+goal:'',notes?'Details & questions: '+notes:'','BRING TO THE CONVERSATION',...questions.map(q=>'• '+q),'','BEFORE AGREEING TO THE WORK','• Confirm address coverage and any visit or estimate charge.','• Get scope, exclusions, cleanup and permits in writing.','• Confirm timing, payment milestones and warranty terms.','',business.name+' · '+business.phone,'https://wazoozie.com/businesses/'+business.slug+'/','This sheet does not send an inquiry or book an appointment.'].filter(Boolean).join('\n');
      doc.querySelector('#kit-status').textContent='';doc.querySelector('#kit-copy-fallback').hidden=true;
    }
    kit.addEventListener('input',update);kit.addEventListener('change',update);
    doc.querySelector('#kit-copy').addEventListener('click',async()=>{
      try{if(!win.navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await win.navigator.clipboard.writeText(sheet);doc.querySelector('#kit-status').textContent='Project sheet copied. Paste it into your notes or a message when you are ready.';}
      catch{const fallback=doc.querySelector('#kit-copy-fallback');fallback.value=sheet;fallback.hidden=false;fallback.focus();fallback.select();doc.querySelector('#kit-status').textContent='Automatic copying is unavailable. Your sheet is selected below; use your device’s Copy command.';}
    });
    update();
  }
  const comparison=doc.querySelector('#estimate-comparison');
  if(comparison){
    comparison.hidden=false;
    const rows=doc.querySelector('#compare-rows');
    for(const [key,title,hint,type] of [...COMMON_ROWS,['trade',...TRADE_PROMPTS.general]]){
      const row=make('tr');row.dataset.compareRow=key;
      const heading=make('th');heading.scope='row';heading.append(make('strong',title),make('small',hint));row.append(heading);
      for(const side of ['a','b']){
        const cell=make('td'),input=make(type==='price'?'input':'textarea');input.id='compare-'+key+'-'+side;input.setAttribute('aria-label',title+' for estimate '+side.toUpperCase());input.dataset.side=side;input.dataset.field=key;
        if(type==='price'){input.type='text';input.inputMode='decimal';input.maxLength=24;input.placeholder='$ Total price';}
        else{input.rows=3;input.maxLength=2000;input.placeholder='Not specified yet';input.addEventListener('input',()=>resize(input));}
        cell.append(input);row.append(cell);
      }
      rows.append(row);
    }
    const total=side=>doc.querySelector('#compare-total-'+side);
    function update(){
      const a=total('a'),b=total('b');const difference=priceDifference(a.value,b.value);
      for(const input of [a,b])input.setAttribute('aria-invalid',String(Boolean(input.value.trim())&&parsePrice(input.value)===null));
      const summary=doc.querySelector('#compare-summary');
      summary.textContent=difference?(difference.cents===0?'Both totals are the same. Check that the included work and terms match.':'The totals differ by '+money(difference.cents)+' ('+difference.percent.toFixed(1)+'% of the lower total). Check the scope and exclusions before deciding.'):[a,b].some(input=>input.getAttribute('aria-invalid')==='true')?'Use a positive total price with up to two decimal places, such as $8,500.00.':'Enter both total prices to see the difference. Compare scope before deciding.';
      let missingA=0,missingB=0;
      rows.querySelectorAll('textarea').forEach(input=>{if(!input.value.trim()){if(input.dataset.side==='a')missingA++;else missingB++;}});
      doc.querySelector('#compare-gaps').textContent=missingA+missingB?`Still to clarify: ${missingA} scope or term ${missingA===1?'field':'fields'} in A and ${missingB} in B. Use these blanks as questions for the business.`:'You have notes for each scope and term. Check them against the actual written proposals and resolve any differences.';
    }
    comparison.addEventListener('input',update);
    doc.querySelector('#compare-kind').addEventListener('change',event=>{
      const [title,hint]=TRADE_PROMPTS[event.target.value];const row=rows.querySelector('[data-compare-row="trade"]');row.querySelector('strong').textContent=title;row.querySelector('small').textContent=hint;
      row.querySelectorAll('textarea').forEach(input=>input.setAttribute('aria-label',title+' for estimate '+input.dataset.side.toUpperCase()));
    });
    doc.querySelector('#compare-clear').addEventListener('click',()=>{comparison.querySelectorAll('input,textarea').forEach(input=>{input.value='';if(input.tagName==='TEXTAREA')resize(input);});update();doc.querySelector('#compare-name-a').focus();});
    update();
  }
  doc.querySelectorAll('[data-tool-print]').forEach(button=>button.addEventListener('click',()=>{doc.querySelectorAll('.workbench-page textarea').forEach(resize);win.print();}));
}
if(typeof document!=='undefined')initHomeownerTools(document);
