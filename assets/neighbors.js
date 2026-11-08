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
  try{await navigator.share({title:'A little local help from Wazoozie',text:'If you need heating, cooling or hot-water help, you can find Middletown HVAC here. Tell their office I sent you before booking (or share this link). I may earn a $25 service credit after your first qualifying job is completed and paid. Your choice, no pressure.',url:link});}
  catch(failure){if(failure.name!=='AbortError')document.querySelector('#neighborStatus').textContent='You can copy the link instead.';}
});
document.querySelector('#copyNeighborNote').addEventListener('click',async()=>{
  if(!link)return;
  const text=`Hey! If you need heating, cooling or hot-water help, here’s Middletown HVAC through Wazoozie: ${link}\nTell their office I sent you before booking (or share this link). I may earn a $25 service credit after your first qualifying job is completed and paid. Your choice, no pressure. Offer details: https://wazoozie.com/neighbors/#reward-terms`;
  try{await navigator.clipboard.writeText(text);document.querySelector('#neighborStatus').textContent='Message copied. Review it and share it yourself. Nothing has been sent.';}
  catch{document.querySelector('#neighborNoteLabel').hidden=false;const field=document.querySelector('#neighborNote');field.value=text;field.focus();field.select();document.querySelector('#neighborStatus').textContent='Copy the selected message and share it yourself. Nothing has been sent.';}
});

const simpleText = 'Hey! If you need heating, cooling or hot-water help, take a look at Middletown HVAC: https://wazoozie.com/businesses/middletown-hvac/\nTell their office I sent you before booking. I may earn a $25 service credit after your first qualifying job is completed and paid. Your choice, no pressure. Terms: https://wazoozie.com/neighbors/#reward-terms';
document.querySelector('#copySimpleReferral').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(simpleText); document.querySelector('#simpleReferralStatus').textContent = 'Copied. Add your name so your friend knows who to mention, then send it yourself. Nothing has been sent.'; }
  catch { document.querySelector('#simpleReferralFallback').hidden = false; const field=document.querySelector('#simpleReferralText'); field.value=simpleText; field.focus(); field.select(); document.querySelector('#simpleReferralStatus').textContent = 'Copy this text, add your name, and send it yourself. Nothing has been sent.'; }
});
