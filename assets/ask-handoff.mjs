export const ASK_HANDOFF_KEY='wazoozie.ask.handoff.v1';
export function takeAskHandoff(storage,intent,now=Date.now()){
 try{const raw=storage.getItem(ASK_HANDOFF_KEY);if(!raw)return null;storage.removeItem(ASK_HANDOFF_KEY);const value=JSON.parse(raw);if(!value||value.intent!==intent||!Number.isFinite(value.at)||now-value.at<0||now-value.at>600000||typeof value.details!=='string'||!value.details.trim()||value.details.length>2500)return null;return value.details;}catch{return null;}
}
