import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,randomBytes,createHash,sign} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {validateAccountData,handleAccount} from '../server/account-http.mjs';
const hash=b=>createHash('sha256').update(b).digest(),b64=b=>Buffer.from(b).toString('base64url');
function cbor(v){
 const head=(major,n)=>n<24?Buffer.from([major*32+n]):n<256?Buffer.from([major*32+24,n]):Buffer.from([major*32+25,n>>8,n&255]);
 if(typeof v==='number')return head(v<0?1:0,v<0?-1-v:v);
 if(typeof v==='string'){const b=Buffer.from(v);return Buffer.concat([head(3,b.length),b]);}
 if(v instanceof Map)return Buffer.concat([head(5,v.size),...[...v].flatMap(([k,x])=>[cbor(k),cbor(x)])]);
 const bytes=Buffer.from(v);return Buffer.concat([head(2,bytes.length),bytes]);
}
function authenticator(){const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),jwk=publicKey.export({format:'jwk'}),id=randomBytes(32),key=cbor(new Map([[1,2],[3,-7],[-1,1],[-2,Buffer.from(jwk.x,'base64url')],[-3,Buffer.from(jwk.y,'base64url')]]));
 return {id:b64(id),register(options,origin='https://wazoozie.com'){
  const client=Buffer.from(JSON.stringify({type:'webauthn.create',challenge:options.challenge,origin,crossOrigin:false}));
  const length=Buffer.alloc(2);length.writeUInt16BE(id.length);const authData=Buffer.concat([hash('wazoozie.com'),Buffer.from([0x45]),Buffer.alloc(4),Buffer.alloc(16),length,id,key]);
  return {id:b64(id),rawId:b64(id),type:'public-key',clientExtensionResults:{credProps:{rk:true}},response:{clientDataJSON:b64(client),attestationObject:b64(cbor(new Map([['fmt','none'],['attStmt',new Map()],['authData',authData]]))),transports:['internal']}};
 },login(options,counter=1,origin='https://wazoozie.com',flags=5){const client=Buffer.from(JSON.stringify({type:'webauthn.get',challenge:options.challenge,origin,crossOrigin:false})),count=Buffer.alloc(4);count.writeUInt32BE(counter);const auth=Buffer.concat([hash('wazoozie.com'),Buffer.from([flags]),count]);return {id:b64(id),rawId:b64(id),type:'public-key',clientExtensionResults:{},response:{clientDataJSON:b64(client),authenticatorData:b64(auth),signature:b64(sign('sha256',Buffer.concat([auth,hash(client)]),privateKey)),userHandle:null}};}};
}
async function runtime(){const built=await build({stdin:{contents:"import {HomeAccounts} from './server/accounts.mjs';import {handleAccount} from './server/account-http.mjs';export class TestAccounts extends HomeAccounts {async cleanup(){return this.alarm();}};export default {fetch:handleAccount};",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers'],target:'es2022'});return new Miniflare(convertV4MiniflareOptions({unsafeInspectDurableObjects:true,modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-11-04',durableObjects:{HOME_ACCOUNTS:{className:'TestAccounts',useSQLite:true}}}));}
function client(mf,ip='192.0.2.10'){const cookies=new Map();return {cookies,async call(path,body,method=body?'POST':'GET',extra={}){const headers={'Origin':'https://wazoozie.com','CF-Connecting-IP':ip,...extra};if(body)headers['Content-Type']='application/json';headers.Cookie=[...cookies].map(([k,v])=>k+'='+v).join('; ');const response=await mf.dispatchFetch('https://wazoozie.com/api/account/'+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});for(const cookie of response.headers.getSetCookie()){const [pair]=cookie.split(';'),[k,v]=pair.split('=');if(v)cookies.set(k,v);else cookies.delete(k);}return {status:response.status,headers:response.headers,data:await response.json()};}};}
test('account request gate rejects foreign origins, insecure hosts, oversized data and missing bindings',async()=>{
 const req=(origin,body={})=>new Request('https://wazoozie.com/api/account/register/options',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await handleAccount(req('https://evil.invalid'),{})).status,403);
 assert.equal((await handleAccount(req('https://wazoozie.com'),{})).status,503);
 assert.equal((await handleAccount(new Request('https://www.wazoozie.com/api/account/status'),{})).status,403);
 const env={HOME_ACCOUNTS:{get(){throw Error('must not reach storage');},idFromName(){return 'id';}}};assert.equal((await handleAccount(req('https://wazoozie.com',{name:'x'.repeat(21000)}),env)).status,400);
 assert.deepEqual(validateAccountData({version:0,projects:[{intent:'water',stage:'planning',email:'not stored'}],favorites:['hart']}),{projects:[{intent:'water',stage:'planning'}],favorites:['hart']});
 for(const projects of [[{intent:'__proto__',stage:'planning'}],[{intent:'comfort',stage:'evil'}],[{intent:'water',stage:'done'},{intent:'water',stage:'planning'}]])assert.equal(validateAccountData({version:0,projects,favorites:[]}),null);
});
test('real passkey registration/login, private accounts, replay resistance, recovery, conflicts, logout and deletion',async()=>{
 const mf=await runtime();try{
  const alice=client(mf),stranger=client(mf,'192.0.2.11'),auth=authenticator();
  assert.equal((await alice.call('status')).data.account,null);
  const options=await alice.call('register/options',{name:'Synthetic Homeowner'});assert.equal(options.status,200);assert.equal(options.data.options.authenticatorSelection.userVerification,'required');
  const reg=auth.register(options.data.options),registered=await alice.call('register/verify',reg);assert.equal(registered.status,200,JSON.stringify(registered.data));
  assert.match(registered.headers.get('set-cookie'),/HttpOnly/);assert.match(registered.headers.get('set-cookie'),/Secure/);assert.match(registered.data.recoveryCode,/^[a-f0-9]{32}\.[a-f0-9]{64}$/);
  assert.equal((await alice.call('register/verify',reg)).status,400);
  assert.equal((await stranger.call('status')).data.account,null);assert.equal((await stranger.call('data',{version:0,projects:[],favorites:[]},'PUT')).status,401);
  let saved=await alice.call('data',{version:0,projects:[{intent:'water',stage:'calling'}],favorites:['hart']},'PUT');assert.equal(saved.status,200);assert.equal(saved.data.account.version,1);
  assert.equal((await alice.call('data',{version:0,projects:[],favorites:[]},'PUT')).status,409);
  await alice.call('logout',{});assert.equal((await alice.call('status')).data.account,null);
  let login=await alice.call('login/options',{});const bad=auth.login(login.data.options,1,'https://evil.invalid');assert.equal((await alice.call('login/verify',bad)).status,400);
  login=await alice.call('login/options',{});assert.equal((await alice.call('login/verify',auth.login(login.data.options,1,'https://wazoozie.com',1))).status,400,'user verification is required');
  login=await alice.call('login/options',{});const signed=await alice.call('login/verify',auth.login(login.data.options));assert.equal(signed.status,200);assert.equal(signed.data.account.projects[0].intent,'water');
  const originalCookie=alice.cookies.get('__Host-wz_session');await stranger.call('recover',{code:registered.data.recoveryCode+'x'});assert.equal((await stranger.call('status')).data.account,null);
  const recovered=await stranger.call('recover',{code:registered.data.recoveryCode});assert.equal(recovered.status,200);assert.notEqual(recovered.data.recoveryCode,registered.data.recoveryCode);
  assert.equal((await alice.call('status')).data.account,null,'recovery revokes prior sessions');assert.equal((await alice.call('recover',{code:registered.data.recoveryCode})).status,400,'recovery codes are single use');
  const backup=authenticator(),backupOptions=await stranger.call('backup/options',{});assert.equal((await stranger.call('backup/verify',backup.register(backupOptions.data.options))).data.account.passkeys,2);
  const unknown=await alice.call('register/options',{name:'Other synthetic account'});const other=authenticator();assert.equal((await alice.call('register/verify',other.register(unknown.data.options))).status,200);assert.equal((await alice.call('status')).data.account.projects.length,0);
  assert.equal((await stranger.call('delete',{confirm:'no'})).status,400);assert.equal((await stranger.call('delete',{confirm:'DELETE'})).status,200);assert.equal((await stranger.call('status')).data.account,null);assert.equal((await stranger.call('recover',{code:recovered.data.recoveryCode})).status,400);
  stranger.cookies.set('__Host-wz_session',originalCookie);assert.equal((await stranger.call('status')).data.account,null);
  const ns=await mf.getDurableObjectNamespace('HOME_ACCOUNTS'),store=ns.get(ns.idFromName('homeowners-v1'));const sql=await mf.unsafeGetDurableObjectStorage(undefined,'TestAccounts',{name:'homeowners-v1'});await sql.exec('UPDATE sessions SET expires=0');await store.cleanup();assert.equal((await alice.call('status')).data.account,null);
 }finally{await mf.dispose();}
});
