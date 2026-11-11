import {PLANNING_HAZARD,PLANNING_SAFETY} from './planning-safety.mjs';
export function quickPlan(intent,question,catalog){
 if(PLANNING_HAZARD.test(question))return {emergency:true,summary:PLANNING_SAFETY,questions:[],prepare:[]};
 const trade=catalog.INTENTS[intent];if(!trade)return null;
 return {kind:'checklist',emergency:false,summary:`Questions to ask about ${trade.label.toLowerCase()}.`,questions:[...(catalog.PROJECT_QUESTIONS?.[intent]||[])].slice(0,3),prepare:['Write down the result you want and what has changed.','Gather useful photos or visible labels only where it is safe.','Note access, preferred timing and who approves the work.']};
}
export function projectExample(intent,mode,catalog){
 const trade=catalog.INTENTS[intent];if(!trade)return null;
 if(mode==='estimate')return `Fictional example: I have a written quote for ${trade.label.toLowerCase()}, but it does not clearly state preparation, exclusions, cleanup or the warranty. What should I clarify?`;
 const first=catalog.PROJECT_QUESTIONS?.[intent]?.[0];
 return mode==='prepare'?`I am considering ${trade.label.toLowerCase()}. What should I have ready and what should I ask on the first call?`:`Fictional example: I am planning ${trade.label.toLowerCase()} and want to explain the job clearly. ${first?'One thing I need to know: '+first:''} What should I ask before booking?`;
}
export function planText(plan,catalog){
 if(!plan?.answer||!catalog.INTENTS[plan.intent])return '';
 const a=plan.answer;const responses=plan.responses||[],prepared=plan.prepared||[];
 const notes=a.questions.map((q,i)=>`• ${q}\n  My note: ${responses[i]?.trim()||'Still to confirm'}`);
 return ['WAZOOZIE · MY PROJECT PLAN',catalog.INTENTS[plan.intent].label,`My project: ${plan.question}`,`SUGGESTED PLAN\n${a.summary}`,`QUESTIONS & MY NOTES\n${notes.join('\n\n')}`,`PREPARATION CHECKLIST\n${a.prepare.map((p,i)=>`${prepared[i]?'[x]':'[ ]'} ${p}`).join('\n')}`,'Check the work, price and appointment with the business. Nothing has been sent or booked.'].join('\n\n');
}
export function requestNotes(plan){
 // Prioritize the visitor's own answers within the existing request form's limit.
 const lines=['HOMEOWNER PROJECT NOTES',plan.question.slice(0,1000),'MY ANSWERS TO PREPARATION QUESTIONS'];
 plan.answer.questions.forEach((q,i)=>{if(plan.responses?.[i]?.trim())lines.push(q.slice(0,150)+'\n'+plan.responses[i].trim().slice(0,300));});
 lines.push('SUGGESTED PLAN',plan.answer.summary.slice(0,350));
 const text=lines.join('\n\n');return text.length<=2500?text:text.slice(0,2420)+'\n\nNotes condensed for the request form. Please review before sending.';
}
export function validPlanExtras(record){
 return (record.responses===undefined||(Array.isArray(record.responses)&&record.responses.length<=3&&record.responses.every(s=>typeof s==='string'&&s.length<=400)))&&(record.prepared===undefined||(Array.isArray(record.prepared)&&record.prepared.length<=3&&record.prepared.every(x=>typeof x==='boolean')))&&(record.answer.kind===undefined||record.answer.kind==='checklist');
}

export function localSafety(plan){return PLANNING_HAZARD.test([plan.question,...(plan.responses||[])].join(' '))?PLANNING_SAFETY:null;}
