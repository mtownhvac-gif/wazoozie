import {INTENTS,BUSINESSES} from './project-config.mjs';
import {HOME_LIST_KEY,sanitizeList} from './project-concierge.js';
export async function initAccounts(doc,api,passkeys){
 const root=doc.querySelector('.account-page');if(!root)return;
 const win=doc.defaultView,$=id=>doc.getElementById(id),status=$('account-status');
 const make=(tag,text,className)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
 const link=(text,href)=>{const node=make('a',text);node.href=href;return node;};
 const request=api||(async(path,body,method=body?'POST':'GET')=>{const response=await win.fetch('/api/account/'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});let result;try{result=await response.json();}catch{throw Error('Account service is unavailable. Please try again.');}if(!response.ok)throw Error(result.error||'Please try again.');return result;});
 passkeys=passkeys||win.SimpleWebAuthnBrowser;
 let account=null,busy=false;
 function tell(text){status.textContent=text;}
 function local(){try{return sanitizeList(JSON.parse(win.localStorage.getItem(HOME_LIST_KEY)||'null'));}catch{return [];}}
 function setBusy(value){busy=value;root.querySelectorAll('button,input,select').forEach(n=>{n.disabled=value;});}
 async function act(action){if(busy)return;setBusy(true);tell('Working on it…');try{await action();}catch(error){render();tell(error.name==='NotAllowedError'?'The passkey step was cancelled or timed out. You can try again.':error.message||'Please try again.');}finally{setBusy(false);}}
 function recovery(code){$('account-recovery').hidden=!code;$('account-recovery-code').textContent=code||'';}
 function render(){
  $('account-auth').hidden=Boolean(account);$('account-dashboard').hidden=!account;
  if(!account)return;
  $('account-greeting').textContent='Good to see you, '+account.name+'.';
  const done=account.projects.filter(p=>p.stage==='done').length;
  $('account-summary').textContent=account.projects.length+' '+(account.projects.length===1?'project':'projects')+' · '+done+' finished · '+account.favorites.length+' favorite '+(account.favorites.length===1?'business':'businesses');
  $('account-empty').hidden=account.projects.length>0;$('account-import-panel').hidden=!local().length;
  $('account-key-count').textContent=account.passkeys+' '+(account.passkeys===1?'passkey':'passkeys')+' registered. A backup helps if you lose a device.';
  const board=$('account-projects');board.replaceChildren();
  for(const item of account.projects){const intent=INTENTS[item.intent],business=BUSINESSES[intent.provider],card=make('article',undefined,'account-project');
   card.append(make('h3',intent.label),make('p',intent.description));
   const label=make('label','Your progress'),select=make('select');select.setAttribute('aria-label','Progress for '+intent.label);
   for(const [key,text] of [['planning','Thinking it through'],['calling','Ready to talk'],['done','Finished']]){const opt=make('option',text);opt.value=key;select.append(opt);}select.value=item.stage;
   select.addEventListener('change',()=>act(async()=>{await save(data=>{data.projects.find(p=>p.intent===item.intent).stage=select.value;});tell('Progress saved to your account.');}));label.append(select);card.append(label);
   const actions=make('div',undefined,'account-project-actions');actions.append(link('Build my project sheet ↗','/project-kit/?intent='+item.intent),link('Meet '+business.name,'/businesses/'+business.slug+'/'),link('Call '+business.phone,'tel:'+business.tel));
   const remove=make('button','Remove project');remove.type='button';remove.setAttribute('aria-label','Remove '+intent.label);remove.addEventListener('click',()=>act(async()=>{await save(data=>{data.projects=data.projects.filter(p=>p.intent!==item.intent);});tell('Project removed from your account.');}));actions.append(remove);card.append(actions);board.append(card);
  }
  const choices=$('account-project-choice'),previous=choices.value;choices.replaceChildren();for(const [key,intent] of Object.entries(INTENTS)){if(account.projects.some(p=>p.intent===key))continue;const opt=make('option',intent.label);opt.value=key;choices.append(opt);}if([...choices.options].some(o=>o.value===previous))choices.value=previous;
  $('account-add-project').hidden=!choices.options.length;choices.hidden=!choices.options.length;
  const favorites=$('account-businesses');favorites.replaceChildren();
  for(const [key,business] of Object.entries(BUSINESSES)){const card=make('div',undefined,'account-business');card.append(link(business.name,'/businesses/'+business.slug+'/'));
   const saved=account.favorites.includes(key),button=make('button',saved?'Saved ♥':'Save ♡');button.type='button';button.setAttribute('aria-pressed',String(saved));button.setAttribute('aria-label',(saved?'Unsave ':'Save ')+business.name);
   button.addEventListener('click',()=>act(async()=>{await save(data=>{data.favorites=saved?data.favorites.filter(k=>k!==key):[...data.favorites,key];});tell(saved?'Favorite removed.':'Business saved. No inquiry was sent.');}));card.append(button);favorites.append(card);
  }
 }
 async function save(transform){const data={version:account.version,projects:account.projects.map(p=>({...p})),favorites:[...account.favorites]};transform(data);const result=await request('data',data,'PUT');account=result.account;render();}
 async function authenticate(mode){
  if(!passkeys?.browserSupportsWebAuthn())throw Error('This browser cannot use passkeys. Try a current browser, use your recovery code, or keep using the device-only list.');
  const result=await request(mode+'/options',mode==='register'?{name:$('account-name').value.trim()}:{});
  const credential=mode==='login'?await passkeys.startAuthentication({optionsJSON:result.options}):await passkeys.startRegistration({optionsJSON:result.options});
  const verified=await request(mode+'/verify',credential);account=verified.account;render();if(verified.recoveryCode)recovery(verified.recoveryCode);tell(mode==='register'?'Your account is ready. Save your recovery code below.':mode==='backup'?'Backup passkey added.':'You’re signed in. Your saved projects are ready.');
 }
 $('account-create').addEventListener('submit',event=>{event.preventDefault();act(()=>authenticate('register'));});
 $('account-login').addEventListener('click',()=>act(()=>authenticate('login')));
 $('account-backup').addEventListener('click',()=>act(()=>authenticate('backup')));
 $('account-recover').addEventListener('submit',event=>{event.preventDefault();act(async()=>{const r=await request('recover',{code:$('account-recovery-input').value.trim()});$('account-recovery-input').value='';account=r.account;render();recovery(r.recoveryCode);tell('You’re signed in. Save the new recovery code; the old one no longer works.');});});
 $('account-copy-recovery').addEventListener('click',async()=>{try{await win.navigator.clipboard.writeText($('account-recovery-code').textContent);tell('Recovery code copied. Keep it somewhere private.');}catch{const range=doc.createRange();range.selectNodeContents($('account-recovery-code'));win.getSelection().removeAllRanges();win.getSelection().addRange(range);tell('Your recovery code is selected. Use your device’s Copy command.');}});
 $('account-hide-recovery').addEventListener('click',()=>{recovery('');tell('Your recovery code is hidden. Keep your saved copy safe.');});
 $('account-add-project').addEventListener('click',()=>act(async()=>{const key=$('account-project-choice').value;if(!Object.hasOwn(INTENTS,key))return;await save(data=>data.projects.push({intent:key,stage:'planning'}));tell('Project saved to your account.');}));
 $('account-import').addEventListener('click',()=>act(async()=>{const imported=local();await save(data=>{for(const p of imported)if(!data.projects.some(x=>x.intent===p.intent))data.projects.push(p);});tell('Device-only projects copied into your account. Your original local list is still available.');}));
 $('account-logout').addEventListener('click',()=>act(async()=>{await request('logout',{});account=null;recovery('');render();tell('You’re signed out. Your account projects are saved.');}));
 $('account-delete').addEventListener('submit',event=>{event.preventDefault();act(async()=>{await request('delete',{confirm:$('account-delete-confirm').value});account=null;$('account-delete-confirm').value='';recovery('');render();tell('Your account and its saved data have been deleted.');});});
 try{const r=await request('status');account=r.account;render();tell(account?'Your saved projects are ready.':'Create an account or sign in when you’re ready.');}catch(error){$('account-auth').hidden=true;tell(error.message+' You can keep browsing or use My home list on this device.');}
 return {snapshot:()=>account};
}
if(typeof document!=='undefined')initAccounts(document);
