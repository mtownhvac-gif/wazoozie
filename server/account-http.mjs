import {INTENTS,BUSINESSES} from '../project-config.mjs';
import {PROJECT_STAGES} from '../project-progress.mjs';
export const ORIGIN='https://wazoozie.com',RPID='wazoozie.com',DAY=86400000;
export const SESSION='__Host-wz_session',FLOW='__Host-wz_flow';
export const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
export const cookie=(name,value,seconds)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
const getCookie=(req,name)=>{const values=(req.headers.get('cookie')||'').split(';').map(x=>x.trim().split('='));return values.find(x=>x[0]===name)?.[1]||'';};
export const json=(data,status=200,cookies=[])=>{const h=new Headers({'Cache-Control':'no-store','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'});for(const c of cookies)h.append('Set-Cookie',c);return Response.json(data,{status,headers:h});};
export function validateAccountData(body){
 if(!body||!Number.isSafeInteger(body.version)||body.version<0||!Array.isArray(body.projects)||body.projects.length>14||!Array.isArray(body.favorites)||body.favorites.length>6) return null;
 const seen=new Set(),projects=[];
 for(const item of body.projects){if(!item||!Object.hasOwn(INTENTS,item.intent)||!Object.hasOwn(PROJECT_STAGES,item.stage)||seen.has(item.intent))return null;seen.add(item.intent);projects.push({intent:item.intent,stage:item.stage});}
 if(body.favorites.some(key=>typeof key!=='string'||!Object.hasOwn(BUSINESSES,key))||new Set(body.favorites).size!==body.favorites.length)return null;
 return {projects,favorites:[...body.favorites]};
}
async function readBody(request){
 if(Number(request.headers.get('content-length'))>20000)throw Error('large');
 const reader=request.body?.getReader();if(!reader)throw Error('json');let bytes=0,parts=[];
 while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>20000){await reader.cancel();throw Error('large');}parts.push(value);}
 const joined=new Uint8Array(bytes);let offset=0;for(const part of parts){joined.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(joined));
}
export async function handleAccount(request,env){
 const u=new URL(request.url);
 if(u.origin!==ORIGIN)return json({error:'Use wazoozie.com to sign in.'},403);
 if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Use this site directly.'},403);
 if(!['GET','POST','PUT','DELETE'].includes(request.method))return json({error:'Method not allowed.'},405);
 if(request.method!=='GET'&&(request.headers.get('origin')!==ORIGIN||!request.headers.get('content-type')?.startsWith('application/json')))return json({error:'A same-site JSON request is required.'},403);
 if(!env.HOME_ACCOUNTS)return json({error:'Accounts are temporarily unavailable. Your device-only list still works.'},503);
 let body={};if(request.method!=='GET'){try{body=await readBody(request);}catch{return json({error:'Invalid or oversized request.'},400);}}
 const client=await digest(new Date().toISOString().slice(0,10)+'|'+(request.headers.get('cf-connecting-ip')||'unknown'));
 try{return await env.HOME_ACCOUNTS.get(env.HOME_ACCOUNTS.idFromName('homeowners-v1')).route(u.pathname,request.method,body,getCookie(request,SESSION),getCookie(request,FLOW),client);}catch{return json({error:'We could not complete that request. Please try again.'},503);}
}
