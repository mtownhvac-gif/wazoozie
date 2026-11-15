// Local text matching, not a judgment of price, workmanship or whether a job is complete.
export const LIMITS={bytes:10*1024*1024,pages:25,characters:150000,minimum:40,deadline:20000};
const topic=(id,label,terms,question)=>({id,label,terms,question});
const COMMON=[
 topic('price','Price, allowances & taxes',['total','total price','total cost','total amount','subtotal','tax','taxes','allowance','allowances','unit price'],'Is this the complete price for the listed work? Which allowances, taxes or required charges could change it?'),
 topic('extras','Exclusions & extra work',['excluded','excludes','not included','by others','additional work','extra charge','change order'],'What is excluded, and how will extra work be approved and priced?'),
 topic('permits','Permits & inspections',['permit','permits','inspection','inspections'],'Who handles any required permits and inspections, and are those charges included?'),
 topic('cleanup','Removal, cleanup & repairs afterward',['removal','remove existing','disposal','debris','cleanup','clean up','patching','restoration'],'Who removes the old materials or equipment and handles disposal, cleanup and repairs afterward?'),
 topic('warranty','Warranty & follow-up',['warranty','warranties','labor coverage','parts coverage','guarantee','callback'],'What parts and labor coverage applies, who provides it and who should I call about a problem?'),
 topic('timing','Timing & payment',['start date','schedule','lead time','duration','deposit','payment','balance','milestone'],'What are the expected timing and payment milestones? What happens if the schedule changes?'),
];
const WOOD=[
 topic('dimensions','Work & dimensions',['dimensions','drawing','drawings','measurements','opening','openings'],'Which work, dimensions and drawings are included in this price?'),
 topic('wood','Materials & hardware',['material','materials','wood','lumber','plywood','composite','hardware','product'],'Which materials, product specifications and hardware are included?'),
 topic('structure','Structure & design',['beam','footing','framing','structural','engineer','design'],'Who determines any structural or design requirements, and which responsibilities are included?'),
 topic('trades','Other trades & finishing',['electrical','plumbing','HVAC','painting','patching','finishing','subcontractor'],'Which other trades and finishing work are included, and who coordinates them?'),
];
export const TRADES={
 hvac:{label:'Heating & cooling',intent:'secondopinion',topics:[
  topic('equipment','Equipment & models',['model','models','capacity','BTU','tonnage','SEER','SEER2','AFUE','HSPF','furnace','heat pump','air handler','coil'],'Which exact equipment models and capacities are included, and how will suitability for my home be established?'),
  topic('routes','Ductwork, lines & drainage',['ductwork','plenum','return','supply','line set','refrigerant line','venting','condensate'],'Which ductwork, refrigerant lines, venting and drainage changes are included?'),
  topic('utilities','Utilities & controls',['electrical','disconnect','circuit','gas line','fuel supply','thermostat','controls'],'Which electrical, fuel-supply and control work is included? Is existing equipment reused or replaced?'),
  topic('startup','Sizing & startup',['load calculation','Manual J','commissioning','startup','start-up','airflow','static pressure','balancing'],'Who checks equipment sizing, starts up the system and records the required checks?'),
 ]},
 water:{label:'Water Heaters & hot water',intent:'water',topics:[
  topic('equipment','Equipment & capacity',['tankless','tank','model','gallon','GPM','capacity'],'Which exact Water Heater, capacity and fuel are included?'),
  topic('fuel','Fuel & venting',['gas supply','gas line','electrical','venting','combustion air'],'Which fuel, electrical, venting and combustion-air work is included?'),
  topic('connections','Connections, valves & drainage',['isolation valve','service valve','shutoff','expansion tank','condensate','drain pan','discharge','T&P'],'Which connections, valves and drainage work are included, and what will be checked on site?'),
  topic('care','Maintenance & water quality',['flush','flushing','descale','descaling','maintenance','water quality','hardness'],'What maintenance will the system need, and should water quality be assessed?'),
 ]},
 plumbing:{label:'Plumbing & drains',intent:'plumbing',topics:[
  topic('fixtures','Fixtures & pipe work',['fixture','toilet','faucet','sink','pipe','drain','sewer'],'Which fixtures, pipe sections and drain work are included?'),
  topic('materials','Materials & connections',['PEX','PVC','CPVC','copper','cast iron','diameter','supply line','shutoff'],'Which pipe materials, sizes and connections are included?'),
  topic('access','Access & excavation',['access','excavation','trench','wall opening','floor opening'],'What access or excavation is included, and who restores the affected areas?'),
  topic('testing','Assessment & testing',['camera inspection','pressure test','leak test','flow test','diagnosis'],'What assessment or testing is included, and what findings will be provided?'),
 ]},
 electrical:{label:'Electrical work',intent:'electrical',topics:[
  topic('devices','Devices & circuits',['receptacle','outlet','switch','fixture','circuit','location','quantity'],'Which devices, circuits, locations and quantities are included?'),
  topic('panel','Panel & service',['panel','service upgrade','amp','amps','amperage','meter','disconnect'],'What panel or service work is included, and what needs confirmation before work begins?'),
  topic('wiring','Wiring & protection',['wire','wiring','cable','conduit','GFCI','AFCI','grounding','bonding'],'Which wiring, protection, grounding and bonding work is included?'),
  topic('utility','Utility coordination & outages',['utility','PECO','outage','power off','coordination'],'Who coordinates any utility work or outage, and what timing or extra charges could apply?'),
 ]},
 painting:{label:'Painting & drywall',intent:'painting',topics:[
  topic('surfaces','Rooms & surfaces',['room','wall','ceiling','trim','door','cabinet','exterior','square feet'],'Which rooms, surfaces and quantities are included?'),
  topic('preparation','Preparation & repairs',['prep','preparation','sanding','scraping','patching','caulking','drywall','washing'],'Which preparation, protection and surface repairs are included?'),
  topic('finish','Products & finish',['primer','paint','brand','product','finish','sheen'],'Which products, primer and finish are included?'),
  topic('coats','Coats & color',['coat','coats','coverage','color','colour','color change'],'What coats and color changes does the price cover, and what would cost extra?'),
 ]},
 carpentry:{label:'Carpentry & small repairs',intent:'carpentry',topics:WOOD},
 remodeling:{label:'Remodeling, decks & additions',intent:'additions',topics:WOOD},
};
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const qualification=/\b(?:not included|not covered|not required|not applicable|no permit|without|excluded|excludes|except|unless|by others|owner supplied|customer supplied|additional|extra|allowances?|optional|if required|as needed|subject to|TBD|to be determined)\b/i;
export function normalizedPages(pages){
 if(!Array.isArray(pages)||!pages.length||pages.length>LIMITS.pages)throw Error('Add readable estimate text or a PDF within the page limit.');
 let total=0;
 return pages.map((p,i)=>{if(typeof p?.text!=='string')throw Error('The estimate text could not be read.');total+=p.text.length;if(total>LIMITS.characters)throw Error('This estimate has too much text. Use a shorter estimate or paste the relevant wording.');return {number:Number.isInteger(p.number)&&p.number>0?p.number:i+1,text:p.text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/\s+/g,' ').trim(),source:p.source==='paste'?'paste':'pdf'};});
}
export function pastedPages(value){if(typeof value!=='string'||value.length>LIMITS.characters)throw Error('Paste no more than 150,000 characters per estimate.');return normalizedPages([{number:1,text:value,source:'paste'}]);}
export function findEvidence(pages,meta){
 const pattern=new RegExp('(?:^|\\b)('+meta.terms.slice().sort((a,b)=>b.length-a.length).map(escape).join('|')+')(?:\\b|$)','gi');
 const found=[];
 for(const p of pages){pattern.lastIndex=0;let match;
  while((match=pattern.exec(p.text))){const before=p.text.slice(0,match.index),after=p.text.slice(match.index+match[0].length);const boundary=[...before.matchAll(/[.!?]\s+/g)].at(-1);const stop=after.search(/[.!?](?:\s|$)/);const sentenceStart=boundary?boundary.index+boundary[0].length:0;const sentenceEnd=stop<0?p.text.length:match.index+match[0].length+stop+1;const start=Math.max(sentenceStart,match.index-75),end=Math.min(sentenceEnd,match.index+match[0].length+135);if(found.some(x=>x.page===p.number&&x.start===start&&x.end===end))continue;const excerpt=p.text.slice(start,end);found.push({page:p.number,source:p.source,start,end,at:match.index,excerpt,hit:match[0],hitStart:match.index-start,qualified:qualification.test(excerpt),leading:start>0,trailing:end<p.text.length});if(found.length>=3)return found;}
 }
 return found;
}
export function compareEstimates(a,b,trade){
 if(!Object.hasOwn(TRADES,trade))throw Error('Choose the kind of work first.');
 const left=normalizedPages(a),right=normalizedPages(b);
 if(left.reduce((n,p)=>n+p.text.length,0)<LIMITS.minimum||right.reduce((n,p)=>n+p.text.length,0)<LIMITS.minimum)throw Error('Add at least a few lines of readable wording for both estimates.');
 const rows=[...COMMON,...TRADES[trade].topics].map(t=>{const a=findEvidence(left,t),b=findEvidence(right,t);return {...t,a,b,kind:a.length&&b.length?'both':a.length?'a':b.length?'b':'neither'};});
 const counts={both:0,a:0,b:0,neither:0};for(const row of rows)counts[row.kind]++;
 return {trade,rows,counts};
}
export function questionNotes(trade,ids){
 if(!Object.hasOwn(TRADES,trade))return '';
 const allowed=[...COMMON,...TRADES[trade].topics];const selected=new Set(Array.isArray(ids)?ids:[]);
 const questions=allowed.filter(t=>selected.has(t.id)).map(t=>'• '+t.question);
 return questions.length?('Questions about my '+TRADES[trade].label.toLowerCase()+' estimate:\n\n'+questions.join('\n\n')+'\n\nPlease confirm the answers and any price changes in writing.').slice(0,2400):'';
}
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function questionDocument(notes){
 const safe=htmlEscape(String(notes).slice(0,2400));
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>My estimate questions · Wazoozie</title><style>body{font:17px/1.7 system-ui,sans-serif;color:#292532;max-width:760px;padding:35px 24px;margin:auto}small{color:#65596a}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:32px}a{color:#51375f}@media print{body{padding:0}}</style><small>WAZOOZIE · THE SAME JOB TEST</small><h1>My estimate questions</h1><pre>'+safe+'</pre><hr><p>These are questions to clarify the work, not a judgment of an estimate, business or price. The original PDFs and source excerpts are not attached.</p><small>Prepared at https://wazoozie.com/same-job/</small></html>';
}
export const DEMO={
 a:'FICTIONAL EXAMPLE A\nReplace the existing gas Furnace. Equipment model: F-060 (made-up model). Reconnect the existing thermostat. Removal and disposal of the old Furnace included. Labor warranty: one year. Permit fees not included. Deposit and balance due dates to be agreed. Total price: $7,800.',
 b:'FICTIONAL EXAMPLE B\nReplace the gas Furnace and install a new thermostat. Equipment model: F-060 (made-up model). Removal and disposal included. Permit and inspection included. Startup and commissioning checklist provided. Parts warranty: ten years, subject to registration. Labor warranty: three years. Deposit and balance due dates to be agreed. Total price: $8,600.'
};
