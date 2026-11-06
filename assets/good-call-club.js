const HOME='https://consumer.ftc.gov/articles/how-avoid-home-improvement-scam';
const AUTO='https://consumer.ftc.gov/articles/0211-auto-repair-basics';
const WRAP='https://www.soundwraps.com/services.html';
export const QUESTIONS = [
 ['visit','THE SERVICE CALL','A fictional offer has a $49 visit fee plus a separate $150 diagnostic charge. No other charges apply. What is due before repairs?',['$49','$101','$150','$199'],3,'The two separate charges add to $199. Confirm the total before booking; a visit fee and repairs are not the same thing.','/pricing-guide/#offer-decoder'],
 ['unknown','THE MISSING NUMBER','An estimate leaves the disposal fee blank. What should you do before comparing totals?',['Assume disposal is free','Ask whether disposal is included','Use the smallest number online','Compare the monthly payment instead'],1,'A blank is an unanswered question. Ask for the included scope and any additional disposal charge in writing.','/compare/'],
 ['paint','THE PAINT PROJECT','Which pair of painting proposals gives you the clearest basis for a price comparison?',['Same total, different surfaces','Same color, unknown preparation','Same surfaces, preparation and products','Same start date, unknown coats'],2,'Matching the surfaces, preparation and products makes the scope easier to compare. A matching total or color alone does not.','/guides/painting-estimate-checklist/'],
 ['approval','THE AUTO REPAIR','The shop finds additional work beyond your estimate. What arrangement gives you control over the added cost?',['Approval before additional work','One general approval for anything','Waiting for the final invoice','Choosing by the shop’s logo'],0,'The FTC recommends an estimate and asking the shop to contact you for approval before exceeding the agreed amount.',AUTO],
 ['wrap','THE NEW LOOK','Which detail is explicitly excluded from Sound Wraps’ published full-exterior starting price?',['All exterior panels','All vinyl material','All installation work','Door jambs'],3,'Sound Wraps’ services page states that the full-exterior starting price does not include door jambs. Confirm the coverage and current quote.',WRAP],
 ['loan','THE PAYMENT PITCH','Which set tells you more about financing cost than the monthly payment alone?',['Truck size and arrival window','Cash price, APR, term and total payments','Equipment color and brochure size','Monthly payment and salesperson’s name'],1,'The cash price and complete credit terms help you understand the purchase and financing separately. A small monthly number is incomplete.','https://consumer.ftc.gov/articles/financing-or-leasing-car'],
 ['deadline','THE COUNTDOWN','You are considering nonurgent work and feel rushed to sign. What is the best next step for reviewing the offer?',['Sign before the price changes','Skip the written exclusions','Request the written scope and offer terms','Pay in full to hold the conversation'],2,'The FTC warns about immediate-decision pressure. A written scope and offer terms give you something to review and compare.',HOME],
 ['identity','THE LOCAL NAME','What tells you who is actually responsible for the agreement?',['The legal business named in the contract','The largest roadside billboard','The loudest claim in the ad','The color of the uniform'],0,'The business named in the agreement is a concrete starting point. Ask who performs the work and handles follow-up.','/before-you-say-yes/'],
 ['changes','THE RENOVATION','How should extra work affecting price be handled?',['Discuss it only after payment','Document scope and price changes for approval','Leave every allowance blank','Treat all extras as included'],1,'A clear change process lets you review the added scope and cost before authorizing it. Ask for the process in the agreement.',HOME],
 ['second','THE BIG REPAIR','For an expensive or complicated auto repair, what does FTC guidance suggest considering?',['Choosing the longest parts list','Approving every recommended add-on','Comparing only the waiting room','Getting a second opinion'],3,'The FTC suggests considering a second opinion for an expensive or complicated repair. Ask about diagnostic charges and the findings.',AUTO],
 ['agent','THE NEXT MOVE','What should you review in a proposed buyer-agent agreement?',['Only the office address','Only the property photographs','Services, compensation, duration and terms','Only how many followers the agent has'],2,'NAR’s consumer guidance explains that the agreement describes services and compensation and that its terms are negotiable. Read the actual agreement.','https://www.nar.realtor/the-facts/consumer-guide-to-written-buyer-agreements'],
 ['budget','THE PROJECT BUDGET','A fictional project has $800 of work, $100 of materials and $50 of fees. Before any allowance, what is the total?',['$950','$850','$900','$1,050'],0,'$800 + $100 + $50 = $950. Keep a separately chosen allowance separate from the quoted work.','/project-budget/'],
 ['source','THE PRICE NOTEBOOK','What does a published “starting at” price establish?',['Every customer’s final bill','A limited starting scope, subject to its terms','A guaranteed lowest local price','A complete competing-bid survey'],1,'A starting price describes its stated starting scope. Confirm eligibility, exclusions and the final written proposal.','/pricing-guide/'],
 ['scope','THE WINDOW PROJECT','Which detail makes two window-installation estimates easier to compare?',['Same brochure paper','Same salesperson’s title','Matching openings, products and installation scope','Matching monthly payments only'],2,'Compare the exact openings, product specifications, removal, trim and finishing rather than the headline alone.','/guides/window-replacement-questions/'],
 ['prep','THE FIRST CALL','Which information is most useful when requesting help with a home project?',['Only the desired discount','Only the nearest billboard','A guess at the technician’s diagnosis','Your address, the concern and the project scope'],3,'A clear description and location help the business discuss project fit and coverage. You do not need to diagnose equipment.','/project-kit/'],
 ['quote','THE FULL PICTURE','Which proposal is easiest to evaluate before agreeing?',['A written scope, exclusions, price and payment terms','A price with no description','A verbal promise with blank terms','An ad with a countdown timer'],0,'Written scope, price and terms let you check what the agreement actually includes. Ask about any unclear item before signing.',HOME],
 ['wins','THE GOOD CALL CLUB','What can Wazoozie Wins unlock at launch?',['Guaranteed contractor discounts','Digital badges in this browser','Cash payments from affiliates','Professional credentials'],1,'Wins are nonmonetary game points for digital badges. They do not provide cash, discounts or professional credentials.','/good-call-club/#club-badges-title'],

 ['zones','ROOM-BY-ROOM COMFORT','Which details help define a ductless installation proposal?',['Only the indoor unit’s color','Only the advertised monthly payment','Rooms, equipment, line routes, drainage and electrical scope','Only the outdoor unit’s photograph'],2,'A ductless proposal needs both equipment and installation scope. The rooms, routes, drainage and electrical work affect the plan.','/services/ductless-mini-splits/'],
 ['maintenance','THE HVAC APPOINTMENT','Your heating system has stopped working. What should you tell the office before booking?',['Describe the current failure and ask which visit is appropriate','Book maintenance without mentioning the failure','Pick a replacement model before any assessment','Assume every maintenance plan covers the repair'],0,'Explain the active problem so the office can discuss a diagnostic visit and fees. Maintenance and fault diagnosis serve different purposes.','/services/heating-cooling/'],
 ['replacement','THE REPLACEMENT PLAN','Which information helps you review a heating-and-cooling replacement proposal?',['The ad’s font and truck color','Equipment, included installation, exclusions and written warranty terms','The largest discount percentage by itself','Only the age of the brochure'],1,'Compare the equipment and complete installation scope, then review exclusions and written equipment and labor terms.','/guides/compare-hvac-estimates/'],
 ['comfort','THE ONE UNCOMFORTABLE ROOM','What is a useful first step when discussing an upstairs room that feels different?',['Choose equipment from room color','Open electrical panels before the visit','Assume the largest unit is best','Describe the room, usage and comfort concern for assessment'],3,'Explain how the room is used and what you notice. A professional assessment helps determine appropriate equipment and installation options.','/services/ductless-mini-splits/'],


 ['credit','THE DISAPPEARING CREDIT','A fictional $100 visit fee is credited only if you approve a repair. You decline the repair. What visit fee remains due?',['$0','$50','$100','$200'],2,'The credit depends on approving work. If you decline, the stated $100 visit fee remains due in this example.','/pricing-guide/#offer-decoder'],
 ['gap','THE TWO-QUOTE PLOT TWIST','Two fictional written proposals total $3,500 and $4,200. What is the price difference, before comparing scope?',['$700','$500','$1,200','$7,700'],0,'$4,200 minus $3,500 is $700. The difference alone does not tell you whether the proposals include the same work.','/compare/'],
 ['vehicle','THE CALL TO THE SHOP','Which details help a repair shop discuss your car’s service needs?',['Only the paint color','Make, model, year and the concern','Only the nearest intersection','Only the discount you want'],1,'The vehicle details and what you noticed give the shop a useful starting point. Ask about the appropriate assessment and charge.','/guides/car-repair-estimate-changed/'],
 ['coverage','THE ROOF-ONLY REVEAL','One vinyl quote covers the roof; another covers the full exterior. Which comparison is most useful?',['Treat them as identical jobs','Compare only the deposit','Pick by brochure size','Match the coverage, film and preparation first'],3,'Roof-only work and a full-exterior wrap cover different surfaces. Match the scope before comparing the totals.','/vehicle-wraps/'],
 ['agreement','THE NEXT-CHAPTER CHECK','Before choosing a real estate professional, which details help define the working relationship?',['Office decor and ad size','Only the first property photo','Services, communication, fees and agreement terms','Only the advertised discount'],2,'Discuss the services, communication and written terms together. A familiar name or attractive ad does not define the agreement.','/real-estate-agents/'],
 ['finish','THE BEAUTIFUL-FINISH MYSTERY','A painting quote says “walls only.” What should you clarify if you also want the trim painted?',['The additional trim scope and price','The color of the contractor’s truck','The number of brochure pages','The nearest paint advertisement'],0,'Walls-only scope does not establish a price for trim. Have the added surfaces and preparation included in a written proposal.','/guides/painting-estimate-checklist/'],
 ['recommend','THE GOOD-NAME GAME','What does an owner recommendation on Wazoozie tell you?',['Every future outcome is guaranteed','The owner recommends the business; read the evidence and terms','All licenses were independently inspected','Every price is the lowest available'],1,'A recommendation records a reason to start a conversation. Read the profile’s evidence and confirm current scope, credentials and terms directly.','/our-standards/'],
 ['addon','THE UNINVITED ENCORE','An invoice includes an optional add-on you did not approve. What is a useful first step?',['Ignore the description','Assume every add-on is required','Approve any amount without explanation','Ask for the item’s purpose, price and authorization record'],3,'Ask the business to explain the charge and where it was approved. Keep the estimate and invoice together while discussing the discrepancy.','https://consumer.ftc.gov/articles/0211-auto-repair-basics'],

];
export const CLUB_KEY='wazoozie.good-call-club.v1';
export function easternDay(date=new Date()) {
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const part=type=>parts.find(p=>p.type===type).value;return `${part('year')}-${part('month')}-${part('day')}`;
}
const offset=(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
export const HVAC_IDS=new Set(['zones','maintenance','replacement','comfort']);
const TOPICS={auto:['approval','second','vehicle','addon'],wraps:['wrap','coverage'],property:['agent','agreement'],finishes:['paint','finish'],windows:['scope'],planning:['unknown','budget','prep','changes'],buying:['visit','loan','deadline','identity','quote','source','wins','credit','gap','recommend']};
function shuffle(items,seed){const result=[...items];for(let i=result.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
const dayNumber=day=>Math.floor(Date.parse(day+'T12:00:00Z')/86400000)>>>0;
export function legacyDailyQuestions(day){return shuffle(QUESTIONS.slice(0,21),dayNumber(day)).slice(0,5);}
export function dailyQuestions(day){
 const seed=dayNumber(day),count=seed%3;
 const hvac=shuffle(QUESTIONS.filter(q=>HVAC_IDS.has(q[0])),seed^12947).slice(0,count);
 const categories=['auto',...shuffle(Object.keys(TOPICS).filter(k=>k!=='auto'),seed^68317).slice(0,4-count)];
 const other=categories.map((key,i)=>shuffle(QUESTIONS.filter(q=>TOPICS[key].includes(q[0])),seed^(8123+i*971))[0]);
 return shuffle([...hvac,...other],seed^33791);
}
export function roundQuestions(state,day){const ids=state.decks?.[day];return ids?ids.map(id=>QUESTIONS.find(q=>q[0]===id)):dailyQuestions(day);}
export function cleanProgress(raw,today){
 const days={},decks={};if(!raw||![1,2].includes(raw.version)||!raw.days||typeof raw.days!=='object'||Array.isArray(raw.days))return {version:2,days,decks};
 for(const day of Object.keys(raw.days).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&d<=today&&d>=offset(today,-59)).sort()){
  const time=Date.parse(day+'T12:00:00Z');if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==day)continue;
  const row=raw.days[day];if(!row||typeof row!=='object'||Array.isArray(row))continue;
  let ids=raw.version===1?legacyDailyQuestions(day).map(q=>q[0]):raw.decks?.[day];
  if(!Array.isArray(ids)||ids.length!==5||new Set(ids).size!==5||ids.some(id=>!QUESTIONS.some(q=>q[0]===id)))ids=dailyQuestions(day).map(q=>q[0]);
  const answers={};for(const id of ids)if(Object.hasOwn(row,id)&&Number.isInteger(row[id])&&row[id]>=0&&row[id]<4)answers[id]=row[id];
  if(Object.keys(answers).length){days[day]=answers;decks[day]=ids;}
 }return {version:2,days,decks};
}
export function clubStats(state,today) {
 let points=0;for(const [day,answers] of Object.entries(state.days)){const qs=roundQuestions(state,day);for(const q of qs)if(answers[q[0]]===q[4])points+=10;if(Object.keys(answers).length===5)points+=10;}
 let streak=0,day=state.days[today]?today:offset(today,-1);while(state.days[day]){streak++;day=offset(day,-1);}
 return {points,streak};
}
export function initClub(doc,storage,now=()=>new Date()) {
 const root=doc.querySelector('#club-questions');if(!root)return;
 let today=easternDay(now()),state={version:2,days:{},decks:{}},saved=true;
 try{if(storage===undefined)storage=doc.defaultView.localStorage;state=cleanProgress(JSON.parse(storage.getItem(CLUB_KEY)||'null'),today);}catch{saved=false;}
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function save(){try{storage.setItem(CLUB_KEY,JSON.stringify(state));saved=true;}catch{saved=false;}}
 function render(){
  const stats=clubStats(state,today),answers=state.days[today]||{};
  doc.querySelector('#club-points').textContent=String(stats.points);doc.querySelector('#club-streak').textContent=stats.streak+' '+(stats.streak===1?'day':'days');
  const badges=[[10,'First Good Call'],[100,'Fine Print Detective'],[300,'Local Legend']];const next=badges.find(([n])=>stats.points<n);
  doc.querySelector('#club-next-badge').textContent=next?next[1]:'Local Legend';doc.querySelector('#club-next-progress').textContent=next?`${next[0]-stats.points} more Wins to unlock`:'All three badges unlocked';
  doc.querySelector('#club-storage').textContent=saved?'Progress is saved in this browser only. No account or email required.':'This browser cannot save progress. Play works in this open page; Wins and badges may disappear when you leave.';
  doc.querySelector('#club-date').textContent='TODAY’S FIVE · '+today+' · EASTERN TIME';const themes=['Five tiny mysteries.','The good-call shuffle.','House, wheels & what-ifs.','Today’s plot twists.'];doc.querySelector('#club-challenge-title').textContent=themes[dayNumber(today)%themes.length];doc.querySelector('#club-mix').textContent=state.days[today]?'Your started round stays the same so you keep your answers and Wins. Fresh rounds rotate the mix.':'A changing mix of home, auto, property and smart buying—with a maximum of two HVAC questions.';root.replaceChildren();
  for(const [i,q] of roundQuestions(state,today).entries()){
   const [id,topic,question,options,correct,explanation,url]=q,answered=Object.hasOwn(answers,id),card=el('article',undefined,'club-question');
   card.append(el('div',`${i+1} / 5 · ${topic}`,'eyebrow'));const heading=el('h3',question);heading.id='club-q-'+id;card.append(heading);
   const group=el('div',undefined,'club-options');group.setAttribute('role','group');group.setAttribute('aria-labelledby',heading.id);
   options.forEach((label,index)=>{const b=el('button',String.fromCharCode(65+index)+'. '+label);b.type='button';b.dataset.answer=String(index);b.dataset.question=id;b.disabled=answered;
    if(answered&&index===correct){b.className='club-correct';b.append(el('span',' · Best answer'));}else if(answered&&index===answers[id]){b.className='club-chosen';b.append(el('span',' · Your answer'));}
    b.addEventListener('click',()=>{
     const date=easternDay(now());if(date!==today){today=date;state=cleanProgress(state,today);render();doc.querySelector('#club-completion').textContent='A new Eastern-time day has started. Today’s challenge is ready.';return;}
     try{const other=cleanProgress(JSON.parse(storage.getItem(CLUB_KEY)||'null'),today);for(const [day,row] of Object.entries(other.days)){state.days[day]={...(state.days[day]||{}),...row};state.decks[day]=other.decks[day];}}catch{saved=false;}
     if(!roundQuestions(state,today).some(q=>q[0]===id)){render();return;}state.decks[today]??=roundQuestions(state,today).map(q=>q[0]);state.days[today]??={};if(Object.hasOwn(state.days[today],id)){render();return;}state.days[today][id]=index;save();render();
     const feedback=doc.querySelector('#club-feedback-'+id);feedback?.focus();
    });group.append(b);
   });card.append(group);
   if(answered){const f=el('div',undefined,'club-feedback');f.id='club-feedback-'+id;f.tabIndex=-1;f.append(el('strong',answers[id]===correct?'A good call. +10 Wins.':"Plot twist. Here’s the useful bit."));f.append(el('p',explanation));const a=el('a','Keep exploring →');a.href=url;f.append(a);card.append(f);}root.append(card);
  }
  const count=Object.keys(answers).length;doc.querySelector('#club-completion').textContent=count===5?'Daily five complete. Your 10-Win completion bonus is included. Come back tomorrow for the next challenge.':`${count} of 5 answered. Finish today’s five for a 10-Win completion bonus.`;
  const shelf=doc.querySelector('#club-badges');shelf.replaceChildren();const earned=[];
  for(const [threshold,title]of badges){const unlocked=stats.points>=threshold,c=el('article',undefined,unlocked?'badge-earned':'badge-locked');c.append(el('span',unlocked?'✦':'◇'),el('h3',title),el('p',unlocked?'Unlocked · '+threshold+' Wins':threshold+' Wins to unlock'));shelf.append(c);if(unlocked)earned.push(title);}
  doc.querySelector('#club-badge-status').textContent=earned.length?'Your badges: '+earned.join(', '):'Your first badge is one correct answer away.';
 }
 const clear=doc.querySelector('#club-clear');clear.hidden=false;clear.addEventListener('click',()=>{state={version:2,days:{},decks:{}};try{storage.removeItem(CLUB_KEY);saved=true;}catch{saved=false;}render();});
 const share=doc.querySelector('#club-share');if(share)share.addEventListener('click',async()=>{const text='Think you can spot the fine print? Try today’s five in Wazoozie Good Call Club: https://wazoozie.com/good-call-club/';const field=doc.querySelector('#club-share-text');field.value=text;try{await doc.defaultView.navigator.clipboard.writeText(text);doc.querySelector('#club-share-status').textContent='Copied. Challenge a friend wherever you like.';}catch{field.hidden=false;field.focus();field.select();doc.querySelector('#club-share-status').textContent='Select and copy the challenge link below.';}});
 render();
}
if(typeof document!=='undefined')initClub(document);
