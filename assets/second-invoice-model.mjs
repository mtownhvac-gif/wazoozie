// A small, inspectable planning model. No prices, remote diagnosis or hidden ranking.
export const PROJECTS = {
  paint: {name:'Paint & finish', icon:'◒', trade:'painting', intro:'Walls, trim and the finish you want to keep.', questions:['Which surfaces and repairs are included?','Who handles touch-ups after the other trades finish?']},
  windows: {name:'Replace windows', icon:'▦', trade:'construction', intro:'The opening, the window and everything around it.', questions:['Does the scope include trim, flashing and surrounding repairs?','Who leaves the interior ready for its final finish?']},
  heatpump: {name:'Heating & cooling', icon:'≋', trade:'hvac', intro:'Comfort equipment, access and the house it serves.', questions:['How will planned changes to the house affect equipment selection?','What electrical work, access and finish repairs are included?']},
  basement: {name:'Finish a basement', icon:'▱', trade:'construction', intro:'A useful room, with the hidden work considered first.', questions:['What moisture, ventilation and utility-access issues need review?','Who coordinates design, local requirements and trade inspections?']},
  bathroom: {name:'Remodel a bathroom', icon:'◉', trade:'plumbing', intro:'Plumbing, access, waterproofing and the final surfaces.', questions:['Who coordinates plumbing, electrical and waterproofing?','Which checks happen before walls and surfaces are closed?']},
  kitchen: {name:'Remodel a kitchen', icon:'▤', trade:'construction', intro:'A layout that works before the finishes go in.', questions:['Are appliance details settled before cabinets and utility work?','Who coordinates access, shutdowns and finish repairs?']},
  waterheater: {name:'Replace a Water Heater', icon:'♨', trade:'hvac', intro:'Hot water, utility capacity and the installation route.', questions:['Does the written scope cover the full conversion or replacement?','Who confirms fuel or electrical needs, venting and drainage on site?']},
  electrical: {name:'Electrical project', icon:'ϟ', trade:'electrical', intro:'The proposed loads, circuits and route through the house.', questions:['Which current and planned equipment loads are being considered?','Who includes access, patching and final finish in the scope?']}
};
export const TRADES = {
  painting:{name:'Painting',href:'/services/painting/'},
  construction:{name:'Construction & remodeling',href:'/services/construction-remodeling/'},
  hvac:{name:'Heating, cooling & hot water',href:'/services/heating-cooling/'},
  plumbing:{name:'Plumbing',href:'/services/plumbing/'},
  electrical:{name:'Electrical',href:'/services/electrical/'}
};
export const ASSUMPTIONS = [
  {id:'same-area',label:'These projects affect the same rooms or surfaces.',help:'Turn this off when the jobs are in separate areas.'},
  {id:'wall-access',label:'Utility work may need access through finished walls.',help:'Ask the installer to confirm the actual route.'},
  {id:'window-trim',label:'Window work may disturb interior trim or paint.',help:'Replacement methods differ; confirm the proposed method.'},
  {id:'house-change',label:'The renovation changes the layout or building envelope.',help:'For example, room sizes, insulation or a larger window project.'},
  {id:'moisture',label:'The basement has an unresolved moisture concern.',help:'Have the cause evaluated before enclosing or finishing the space.'},
  {id:'tankless',label:'The Water Heater project is a Tankless conversion.',help:'Utility capacity, venting and drainage need a site review.'}
];
export const DEFAULT_STATE={order:['paint','windows','heatpump'],flags:['same-area','wall-access','window-trim'],confirmed:[]};
const allowedFlags=new Set(ASSUMPTIONS.map(x=>x.id));
export function normalizeState(input={}){
  const order=Array.isArray(input.order)?[...new Set(input.order.filter(x=>typeof x==='string'&&Object.hasOwn(PROJECTS,x)))].slice(0,4):[];
  const flags=Array.isArray(input.flags)?[...new Set(input.flags.filter(x=>allowedFlags.has(x)))]:[];
  const confirmed=Array.isArray(input.confirmed)?[...new Set(input.confirmed.filter(x=>typeof x==='string'&&/^[-a-z]{1,55}$/.test(x)))].slice(0,24):[];
  return {order,flags,confirmed};
}
const rule=(id,before,after,title,possible,question,flag)=>({id,before,after,title,possible,question,flag});
const RULES=[
  rule('windows-before-paint','windows','paint','The trim touch-up','Window work could disturb a finish you just paid to have completed.','Can the window scope and finish repairs be settled before the final painting?','window-trim'),
  rule('hvac-before-paint','heatpump','paint','The wall opened twice','Equipment or line routing could require patching and repainting a finished surface.','Can we confirm the installation route and who restores it before painting?','wall-access'),
  rule('electrical-before-paint','electrical','paint','The fresh-wall patch','Cable access could mean patching and repainting after your painter has left.','Can the wiring route and patching responsibilities be agreed before the final finish?','wall-access'),
  rule('kitchen-before-paint','kitchen','paint','The finish around the new layout','Cabinet, backsplash or utility work could affect newly finished surfaces.','Which surfaces should wait until the kitchen work is complete?'),
  rule('bathroom-before-paint','bathroom','paint','The finish after the fittings','Plumbing access and surrounding repairs could affect the final finish.','Who signs off the concealed work and restoration before painting?'),
  rule('basement-before-paint','basement','paint','The finish before the room is ready','Remaining construction and utility work could disturb the final paint.','Which construction and trade checks must happen before the finish coat?'),
  rule('electrical-before-kitchen','electrical','kitchen','The cabinet access problem','A separate electrical project could need access behind newly installed kitchen finishes.','Can the electrician and remodeler agree on the rough-in before cabinets and finishes?','wall-access'),
  rule('electrical-before-basement','electrical','basement','The closed-ceiling detour','A separate wiring project could require opening a newly finished basement.','Can the wiring needs and access route be coordinated before the ceiling closes?','wall-access')
];
export function recommendedOrder(order,edges){
  const result=[],remaining=new Set(order);
  while(remaining.size){
    const ready=order.filter(id=>remaining.has(id)&&edges.every(e=>e.after!==id||!remaining.has(e.before)));
    if(!ready.length)throw new Error('Conflicting planning rules');
    for(const id of ready){result.push(id);remaining.delete(id);}
  }
  return result;
}
export function buildPlan(input){
  const state=normalizeState(input),has=id=>state.order.includes(id),flag=id=>state.flags.includes(id);
  const edges=flag('same-area')?RULES.filter(r=>has(r.before)&&has(r.after)&&(!r.flag||flag(r.flag))):[];
  const risks=edges.filter(r=>state.order.indexOf(r.after)<state.order.indexOf(r.before));
  const overlaps=[];
  if(has('heatpump')&&(has('windows')||has('basement')||has('kitchen'))&&flag('house-change'))overlaps.push({id:'house-before-sizing',title:'Include your renovation plans in the heating and cooling assessment.',trade:'hvac',text:'Tell your HVAC contractor about planned layout, window and insulation changes before choosing equipment. Agree on the design first; the windows don’t all have to be installed before HVAC work starts.',question:'Which planned house changes should be included in the sizing and distribution assessment?',source:'https://www.energystar.gov/saveathome/heating-cooling/hvac-quality-installation'});
  if(has('heatpump')&&has('waterheater'))overlaps.push({id:'shared-utility-review',title:'Review both equipment plans together.',trade:'hvac',text:'Ask the contractor to look at both jobs together, including fuel or electrical supply, access and any shutdowns. Don’t assume combining them will save money or suit the house.',question:'Can the contractor review both equipment plans before either scope is approved?'});
  if(has('electrical')&&(has('heatpump')||has('waterheater')||has('kitchen')))overlaps.push({id:'shared-load-review',title:'Give the electrician the whole equipment list.',trade:'electrical',text:'Give the electrician the details of all planned equipment and appliances. These projects don’t automatically mean you need a panel upgrade.',question:'Have the current and proposed equipment loads all been considered?'});
  if(has('basement')&&has('bathroom'))overlaps.push({id:'shared-bathroom-layout',title:'Place the bathroom before closing the basement.',trade:'construction',text:'Let the remodeler and plumber review the bathroom location, drainage and utility access while the basement design is still open.',question:'Can the bathroom rough-in and basement layout be coordinated before walls and floors are finished?'});
  if(has('kitchen')&&has('bathroom'))overlaps.push({id:'shared-water-downtime',title:'Plan around water shutdowns.',trade:'plumbing',text:'Discuss water shutdowns and which fixtures stay usable during the two projects. The sequence depends on the actual house and scope.',question:'What stays usable, and who coordinates the shutdowns?'});
  const gates=[];
  if(has('basement')&&flag('moisture'))gates.push({id:'moisture-first',title:'Resolve the moisture question first.',trade:'construction',text:'Have the source and necessary correction evaluated before enclosing or finishing the affected area. Paint and new finishes do not resolve a moisture problem.',question:'What caused the moisture, what is the correction, and how will readiness for finishing be checked?',source:'https://www.epa.gov/mold/brief-guide-mold-moisture-and-your-home'});
  if(has('waterheater')&&flag('tankless'))gates.push({id:'tankless-site-review',title:'Price the conversion, including the supporting work.',trade:'hvac',text:'Ask for a site review of the equipment location, utility supply, venting, combustion air where applicable and condensate provisions before comparing totals.',question:'Which supporting changes are included, excluded or still awaiting a site finding?'});
  const tradeIds=[...new Set(state.order.map(id=>PROJECTS[id].trade).concat(overlaps.map(x=>x.trade),gates.map(x=>x.trade)))];
  const relevant=new Set([...risks,...overlaps,...gates].map(x=>x.id));
  state.confirmed=state.confirmed.filter(id=>relevant.has(id));
  return {state,edges,risks,overlaps,gates,trades:tradeIds.map(id=>({id,...TRADES[id]})),recommended:recommendedOrder(state.order,edges),openQuestions:[...gates,...risks,...overlaps].filter(x=>!state.confirmed.includes(x.id))};
}
export function encodePlan(input){const s=normalizeState(input);return new URLSearchParams({v:'1',jobs:s.order.join(','),assume:s.flags.join(',')}).toString();}
export function decodePlan(hash){
  if(typeof hash!=='string'||hash.length>800)return null;
  const q=new URLSearchParams(hash.replace(/^#/,''));
  if(q.get('v')!=='1'||!q.has('jobs'))return null;
  return normalizeState({order:q.get('jobs').split(','),flags:(q.get('assume')||'').split(',')});
}
export function planText(input){
  const p=buildPlan(input),lines=['WAZOOZIE / THE SECOND INVOICE','A project planning sheet, not an estimate or invoice.','','MY PROPOSED ORDER',...p.state.order.map((id,i)=>`${i+1}. ${PROJECTS[id].name}`),'','ASSUMPTIONS',...ASSUMPTIONS.filter(x=>p.state.flags.includes(x.id)).map(x=>'- '+x.label),'','POSSIBLE DO-OVERS',...(p.risks.length?p.risks.map(x=>'- '+x.title+': '+x.possible):['No conflicts found for these choices. Your contractors may find others when they assess the house.']),'','QUESTIONS BEFORE APPROVAL',...[...p.gates,...p.risks,...p.overlaps].map(x=>'- '+x.question),'','PROPOSED ORDER TO DISCUSS',...p.recommended.map((id,i)=>`${i+1}. ${PROJECTS[id].name}`),'','Each business confirms the scope, responsibilities, requirements, price and schedule.'];
  return lines.join('\n');
}
