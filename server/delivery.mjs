export const SEND_CONSENT_VERSION='hvac-send-2026-11-v1';
const address=value=>typeof value==='string'&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)&&value.length<=180;
export function deliveryReady(env){
  return env.INQUIRY_DELIVERY_ENABLED==='1'&&env.MIDDLETOWN_DELIVERY_CONFIRMED==='1'&&Boolean(env.RESEND_API_KEY)&&Boolean(env.RESEND_WEBHOOK_SECRET)&&address(env.WAZOOZIE_FROM)&&address(env.WAZOOZIE_OPERATOR_EMAIL)&&env.MIDDLETOWN_INQUIRY_EMAIL==='service@mtownhvac.com';
}
export function makeDelivery(brief,env,inbox){
  if(!deliveryReady(env)||brief.provider!=='middletown')throw Error('Delivery unavailable');
  const text=`Wazoozie inquiry ${brief.id}\nService: ${brief.intent}\nName: ${brief.name}\nPhone: ${brief.phone}\nEmail: ${brief.email}\nZIP: ${brief.zip}\nTiming: ${brief.timing}\n\n${brief.details}\n\nThe homeowner explicitly requested this email. No appointment or dispatch is booked.`;
  return [...new Set([env.MIDDLETOWN_INQUIRY_EMAIL,env.WAZOOZIE_OPERATOR_EMAIL])].map((to,index)=>({id:`inquiry/${brief.id}/${index}`,payload:{from:env.WAZOOZIE_FROM,to:[to],subject:'New Wazoozie inquiry',text,tags:[{name:'inbox',value:inbox.replace(':','-')}],...(address(brief.email)?{reply_to:brief.email}:{})}}));
}
export async function handleDeliveryWebhook(request,env){
  const reply=(body,status)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  if(request.method!=='POST')return reply({error:'Method not allowed'},405);
  if(!env.RESEND_WEBHOOK_SECRET||!env.PROJECT_INBOX)return reply({error:'Unavailable'},503);
  const reader=request.body?.getReader();let raw='';let bytes=0;const decoder=new TextDecoder();
  if(!reader)return reply({error:'Invalid webhook'},400);
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>16384){await reader.cancel();return reply({error:'Too large'},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();
  try{
    const id=request.headers.get('svix-id'),stamp=request.headers.get('svix-timestamp'),signatures=request.headers.get('svix-signature')||'';
    if(!id||id.length>200||!/^\d+$/.test(stamp||'')||Math.abs(Date.now()/1000-Number(stamp))>300)throw Error();
    const key=await crypto.subtle.importKey('raw',Uint8Array.from(atob(env.RESEND_WEBHOOK_SECRET.replace(/^whsec_/,'')),c=>c.charCodeAt(0)),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    let verified=false;
    for(const signature of signatures.split(' ')){if(!signature.startsWith('v1,'))continue;try{if(await crypto.subtle.verify('HMAC',key,Uint8Array.from(atob(signature.slice(3)),c=>c.charCodeAt(0)),new TextEncoder().encode(`${id}.${stamp}.${raw}`)))verified=true;}catch{}}
    if(!verified)throw Error();
    const event=JSON.parse(raw),state={'email.delivered':'delivered','email.bounced':'failed','email.failed':'failed','email.complained':'failed'}[event.type];
    if(!state)return reply({received:true},200);
    const tag=event.data?.tags?.inbox;
    const inbox=typeof tag==='string'?tag.replace(/^middletown-/, 'middletown:'):'';
    if(!/^middletown:\d{4}-\d{2}$/.test(inbox||'')||typeof event.data?.email_id!=='string')throw Error();
    await env.PROJECT_INBOX.getByName(inbox).deliveryEvent(id,event.data.email_id,state,Date.now());
    return reply({received:true},200);
  }catch{return reply({error:'Webhook not accepted'},400);}
}
