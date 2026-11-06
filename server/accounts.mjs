import {DurableObject} from 'cloudflare:workers';
import {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse} from '@simplewebauthn/server';
import {digest,validateAccountData,json,cookie,random,ORIGIN,RPID,DAY,SESSION,FLOW} from './account-http.mjs';
export class HomeAccounts extends DurableObject{
 constructor(ctx,env){super(ctx,env);this.sql=ctx.storage.sql;this.ctx=ctx;
  this.sql.exec('CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,name TEXT NOT NULL,created INTEGER NOT NULL,version INTEGER NOT NULL DEFAULT 0,data TEXT NOT NULL,recovery_hash TEXT NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS credentials(id TEXT PRIMARY KEY,account_id TEXT NOT NULL,public_key BLOB NOT NULL,counter INTEGER NOT NULL,transports TEXT NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS credentials_account ON credentials(account_id)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,account_id TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_account ON sessions(account_id)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS flows(hash TEXT PRIMARY KEY,kind TEXT NOT NULL,challenge TEXT NOT NULL,account_id TEXT,name TEXT,user_id TEXT,expires INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL)');
 }
 one(query,...args){return this.sql.exec(query,...args).toArray()[0];}
 async alarm(){const now=Date.now();for(const table of ['sessions','flows','limits'])this.sql.exec(`DELETE FROM ${table} WHERE expires < ?`,now);await this.ctx.storage.setAlarm(now+DAY);}
 async limited(client,max=150){const now=Date.now(),key=client+'|'+Math.floor(now/3600000);let count;this.ctx.storage.transactionSync(()=>{const row=this.one('SELECT count FROM limits WHERE key=?',key);count=(row?.count||0)+1;this.sql.exec('INSERT OR REPLACE INTO limits VALUES(?,?,?)',key,count,now+2*DAY);});if(!await this.ctx.storage.getAlarm())await this.ctx.storage.setAlarm(now+DAY);return count>max;}
 async session(token){if(!/^[a-f0-9]{64}$/.test(token))return null;const row=this.one('SELECT * FROM sessions WHERE hash=? AND expires>?',await digest(token),Date.now());if(!row)return null;const account=this.one('SELECT * FROM accounts WHERE id=?',row.account_id);return account?{account,session:row}:null;}
 view(account){return {id:account.id,name:account.name,version:account.version,...JSON.parse(account.data),passkeys:this.one('SELECT count(*) AS n FROM credentials WHERE account_id=?',account.id).n};}
 async newSession(account,recovery){const token=random(),now=Date.now();this.sql.exec('DELETE FROM sessions WHERE account_id=? AND expires<?',account.id,now);const old=this.sql.exec('SELECT hash FROM sessions WHERE account_id=? ORDER BY created DESC',account.id).toArray();for(const s of old.slice(9))this.sql.exec('DELETE FROM sessions WHERE hash=?',s.hash);this.sql.exec('INSERT INTO sessions VALUES(?,?,?,?)',await digest(token),account.id,now,now+14*DAY);return json({account:this.view(account),...(recovery?{recoveryCode:recovery}:{})},200,[cookie(SESSION,token,14*86400),cookie(FLOW,'',0)]);}
 async route(path,method,body,token,flowToken,client){
  const routes={'/api/account/status':'GET','/api/account/register/options':'POST','/api/account/register/verify':'POST','/api/account/login/options':'POST','/api/account/login/verify':'POST','/api/account/recover':'POST','/api/account/data':'PUT','/api/account/logout':'POST','/api/account/delete':'POST','/api/account/backup/options':'POST','/api/account/backup/verify':'POST'};
  if(!Object.hasOwn(routes,path))return json({error:'Not found.'},404);if(routes[path]!==method)return json({error:'Method not allowed.'},405);
  if(await this.limited(client))return json({error:'Too many requests. Please try again in an hour.'},429);
  const signed=await this.session(token),account=signed?.account;
  if(path==='/api/account/status')return json({account:account?this.view(account):null});
  if(path==='/api/account/logout'){if(token)this.sql.exec('DELETE FROM sessions WHERE hash=?',await digest(token));return json({signedOut:true},200,[cookie(SESSION,'',0),cookie(FLOW,'',0)]);}
  if(path==='/api/account/recover'){
   const code=typeof body.code==='string'?body.code.trim():'';
   if(!/^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(code))return json({error:'That recovery code could not be verified.'},400);
   const a=this.one('SELECT * FROM accounts WHERE id=?',code.split('.')[0]);const hash=await digest(code);
   if(!a||a.recovery_hash!==hash)return json({error:'That recovery code could not be verified.'},400);
   const next=a.id+'.'+random(),nextHash=await digest(next);let consumed=false;
   this.ctx.storage.transactionSync(()=>{const current=this.one('SELECT recovery_hash FROM accounts WHERE id=?',a.id);if(current?.recovery_hash!==hash)return;this.sql.exec('UPDATE accounts SET recovery_hash=? WHERE id=?',nextHash,a.id);this.sql.exec('DELETE FROM sessions WHERE account_id=?',a.id);consumed=true;});
   if(!consumed)return json({error:'That recovery code has already been used.'},400);return this.newSession(a,next);
  }
  if(path.endsWith('/options')){
   if(await this.limited(client+'|auth',20))return json({error:'Too many sign-in attempts. Please try again in an hour.'},429);
   const kind=path.includes('/register/')?'register':path.includes('/backup/')?'backup':'login';
   let id=account?.id,name=account?.name,options;
   if(kind==='register'){
    if(account)return json({error:'You are already signed in. Add a backup passkey instead.'},409);
    name=typeof body.name==='string'?body.name.trim():'';if(name.length<1||name.length>60||/[\u0000-\u001f<>]/.test(name))return json({error:'Use a first name or nickname of 1–60 characters.'},400);id=random().slice(0,32);
   }
   if(kind==='backup'&&(!account||Date.now()-signed.session.created>600000))return json({error:'Sign in again before adding a backup passkey.'},401);
   if(kind==='backup'&&this.view(account).passkeys>=5)return json({error:'This account already has five passkeys.'},400);
   if(kind==='login')options=await generateAuthenticationOptions({rpID:RPID,userVerification:'required'});
   else options=await generateRegistrationOptions({rpName:'Wazoozie',rpID:RPID,userID:new TextEncoder().encode(id),userName:name+' · '+id.slice(0,6),userDisplayName:name,attestationType:'none',supportedAlgorithmIDs:[-7,-257],authenticatorSelection:{residentKey:'required',userVerification:'required'},excludeCredentials:kind==='backup'?this.sql.exec('SELECT id FROM credentials WHERE account_id=?',id).toArray().map(c=>({id:c.id})):[]});
   const secret=random();if(/^[a-f0-9]{64}$/.test(flowToken))this.sql.exec('DELETE FROM flows WHERE hash=?',await digest(flowToken));
   this.sql.exec('INSERT INTO flows VALUES(?,?,?,?,?,?,?)',await digest(secret),kind,options.challenge,id||null,name||null,options.user?.id||null,Date.now()+300000);
   return json({options},200,[cookie(FLOW,secret,300)]);
  }
  if(path.endsWith('/verify')){
   const hash=/^[a-f0-9]{64}$/.test(flowToken)?await digest(flowToken):'';let flow;
   this.ctx.storage.transactionSync(()=>{flow=this.one('SELECT * FROM flows WHERE hash=?',hash);this.sql.exec('DELETE FROM flows WHERE hash=?',hash);});
   const kind=path.includes('/register/')?'register':path.includes('/backup/')?'backup':'login';
   if(!flow||flow.kind!==kind||flow.expires<Date.now())return json({error:'That sign-in attempt expired. Please start again.'},400,[cookie(FLOW,'',0)]);
   if(kind==='backup'&&(!account||flow.account_id!==account.id||Date.now()-signed.session.created>600000))return json({error:'Sign in again before adding a passkey.'},401);
   try{
    if(kind==='login'){
     const c=typeof body.id==='string'?this.one('SELECT * FROM credentials WHERE id=?',body.id):null;if(!c)return json({error:'That passkey could not sign you in.'},400);
     const result=await verifyAuthenticationResponse({response:body,expectedChallenge:flow.challenge,expectedOrigin:ORIGIN,expectedRPID:RPID,requireUserVerification:true,credential:{id:c.id,publicKey:new Uint8Array(c.public_key),counter:c.counter,transports:JSON.parse(c.transports)}});
     if(!result.verified)return json({error:'That passkey could not sign you in.'},400);
     const a=this.one('SELECT * FROM accounts WHERE id=?',c.account_id);if(!a)return json({error:'Account unavailable.'},401);
     this.sql.exec('UPDATE credentials SET counter=? WHERE id=?',result.authenticationInfo.newCounter,c.id);return this.newSession(a);
    }
    const result=await verifyRegistrationResponse({response:body,expectedChallenge:flow.challenge,expectedOrigin:ORIGIN,expectedRPID:RPID,requireUserVerification:true});
    if(!result.verified)return json({error:'The passkey could not be verified.'},400);
    const c=result.registrationInfo.credential;
    if(this.one('SELECT id FROM credentials WHERE id=?',c.id))return json({error:'That passkey is already registered.'},409);
    const recovery=flow.account_id+'.'+random(),recoveryHash=await digest(recovery);
    this.ctx.storage.transactionSync(()=>{
     if(kind==='register')this.sql.exec('INSERT INTO accounts(id,name,created,data,recovery_hash) VALUES(?,?,?,?,?)',flow.account_id,flow.name,Date.now(),JSON.stringify({projects:[],favorites:[]}),recoveryHash);
     else if(!this.one('SELECT id FROM accounts WHERE id=?',flow.account_id))throw Error('deleted');
     this.sql.exec('INSERT INTO credentials VALUES(?,?,?,?,?)',c.id,flow.account_id,c.publicKey.buffer.slice(c.publicKey.byteOffset,c.publicKey.byteOffset+c.publicKey.byteLength),c.counter,JSON.stringify(c.transports||[]));
    });
    return this.newSession(this.one('SELECT * FROM accounts WHERE id=?',flow.account_id),kind==='register'?recovery:undefined);
   }catch{return json({error:'The passkey could not be verified. Please try again.'},400,[cookie(FLOW,'',0)]);}
  }
  if(!account)return json({error:'Please sign in to your account.'},401);
  if(path==='/api/account/data'){
   const data=validateAccountData(body);if(!data)return json({error:'Invalid saved-project data.'},400);
   let changed=false;this.ctx.storage.transactionSync(()=>{const latest=this.one('SELECT version FROM accounts WHERE id=?',account.id);if(latest?.version!==body.version)return;this.sql.exec('UPDATE accounts SET data=?,version=version+1 WHERE id=?',JSON.stringify(data),account.id);changed=true;});
   if(!changed)return json({error:'Your account changed in another tab. Reload before editing again.'},409);return json({account:this.view(this.one('SELECT * FROM accounts WHERE id=?',account.id))});
  }
  if(path==='/api/account/delete'){
   if(body.confirm!=='DELETE'||Date.now()-signed.session.created>600000)return json({error:'Sign in again, then type DELETE to remove your account.'},400);
   this.ctx.storage.transactionSync(()=>{for(const table of ['credentials','sessions','flows'])this.sql.exec(`DELETE FROM ${table} WHERE account_id=?`,account.id);this.sql.exec('DELETE FROM accounts WHERE id=?',account.id);});return json({deleted:true},200,[cookie(SESSION,'',0),cookie(FLOW,'',0)]);
  }
  return json({error:'Not found.'},404);
 }
}
