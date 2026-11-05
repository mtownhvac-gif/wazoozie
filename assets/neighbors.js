import {NEIGHBOR_CONSENT_VERSION, neighborLink} from './neighbor-config.mjs';
const form=document.querySelector('#neighborForm');
const error=document.querySelector('#neighborError');
const startedAt=Date.now();
let id=crypto.randomUUID();
let pending=null, busy=false, link='';
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(busy || !form.reportValidity())return;
  const data={...Object.fromEntries(new FormData(form)),id,startedAt,consent:form.elements.consent.checked,consentVersion:NEIGHBOR_CONSENT_VERSION};
  if(!data.email.trim()&&!data.phone.trim()){error.textContent='Add your email or phone so we can identify the referral privately.';return;}
  // Retry the same request after an uncertain network response; changing details
  // produces a new reference instead of overwriting a previously saved identity.
  if(pending && JSON.stringify(data)!==JSON.stringify(pending)) data.id=id=crypto.randomUUID();
  pending=data;busy=true;error.textContent='';form.querySelector('button[type="submit"]').disabled=true;
  try{
    const response=await fetch('/api/neighbor-referrals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),referrerPolicy:'no-referrer'});
    const result=await response.json();
    if(!response.ok)throw Error(result.error||'We could not create the link. Please try again.');
    link=neighborLink(result.code);
    if(!link)throw Error('We could not confirm the link. Please retry.');
    document.querySelector('#neighborLink').value=link;
    form.hidden=true;document.querySelector('#neighborReceipt').hidden=false;
    document.querySelector('#shareNeighbor').hidden=typeof navigator.share!=='function';
    document.querySelector('#neighborReceipt').focus();
  }catch(failure){error.textContent=failure.message||'We could not confirm the save. Retry the same details.';}
  finally{busy=false;form.querySelector('button[type="submit"]').disabled=false;}
});
document.querySelector('#copyNeighbor').addEventListener('click',async()=>{
  if(!link)return;
  try{await navigator.clipboard.writeText(link);document.querySelector('#neighborStatus').textContent='Copied. Add a personal note and pass it along.';}
  catch{document.querySelector('#neighborLink').select();document.querySelector('#neighborStatus').textContent='Copy the selected link to share it.';}
});
document.querySelector('#shareNeighbor').addEventListener('click',async()=>{
  if(!link||typeof navigator.share!=='function')return;
  try{await navigator.share({title:'A little local help from Wazoozie',text:'For the next thing on your home’s list: meet local businesses and choose who you contact.',url:link});}
  catch(failure){if(failure.name!=='AbortError')document.querySelector('#neighborStatus').textContent='You can copy the link instead.';}
});
