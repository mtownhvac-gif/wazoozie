export const ESTIMATE_HANDOFF_KEY='wazoozie.estimate.questions.v1';
const intents=new Set(['secondopinion','replacement','water','plumbing','electrical','painting','carpentry','additions']);
export function saveEstimateHandoff(storage,intent,details,now=Date.now()){
 if(!intents.has(intent)||typeof details!=='string'||!details.trim()||details.length>2400||!Number.isFinite(now))return false;
 try{storage.setItem(ESTIMATE_HANDOFF_KEY,JSON.stringify({intent,details,at:now}));return true;}catch{return false;}
}
export function takeEstimateHandoff(storage,intent,now=Date.now()){
 try{const raw=storage.getItem(ESTIMATE_HANDOFF_KEY);if(!raw)return null;storage.removeItem(ESTIMATE_HANDOFF_KEY);const x=JSON.parse(raw);if(!Number.isFinite(now)||!x||!intents.has(intent)||x.intent!==intent||typeof x.details!=='string'||!x.details.trim()||x.details.length>2400||!Number.isFinite(x.at)||now<x.at||now-x.at>600000)return null;return x.details;}catch{return null;}
}
