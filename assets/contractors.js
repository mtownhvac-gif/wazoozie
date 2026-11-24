import {APPLICATION_CONSENT_VERSION, CONTRACTOR_INTERESTS, CONTRACTOR_TRADES} from './contractor-config.mjs';
const form=document.querySelector('#contractorForm');
const interest=new URLSearchParams(location.search).get('interest');
if(Object.hasOwn(CONTRACTOR_INTERESTS,interest))form.elements.interest.value=interest;
const category=new URLSearchParams(location.search).get('category');
if(Object.hasOwn(CONTRACTOR_TRADES,category)){
  const choice=[...form.querySelectorAll('input[name="services"]')].find(input=>input.value===category);
  if(choice)choice.checked=true;
}
const button=document.querySelector('#submitApplication');
const error=document.querySelector('#applicationError');
const id=crypto.randomUUID ? crypto.randomUUID() : fallbackReference();
function fallbackReference(){
  const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
const startedAt=Date.now();let ready=false, submitting=false, checking=false, pending, pendingMonth, submitted;
const lockedControls=new Map();
function lock(locked){
  if(locked&&!lockedControls.size){for(const field of form.querySelectorAll('input,select,textarea')){lockedControls.set(field,field.disabled);field.disabled=true;}}
  else if(!locked){for(const [field,disabled] of lockedControls)field.disabled=disabled;lockedControls.clear();}
}
function update(){
  button.disabled=submitting||checking||!!submitted||(!pending&&!ready);
  button.textContent=submitting?'Saving your application…':pending?'Retry the same application →':'Submit business application →';
  document.querySelector('#retryApplication').hidden=checking||submitting||!!pending||!!submitted||ready;
  document.querySelector('#applicationStatus').textContent=submitting?'Saving your application…':pending?'Receipt is unconfirmed. Your details are held unchanged here for a safe retry.':checking?'Checking application availability…':ready?'Free to apply. Your details are saved privately for manual review.':'Applications are currently unavailable. Your details have not been submitted; please try again later.';
}
async function requestJSON(url,options={},timeout=12000){
  const controller=new AbortController();let timer;
  try{return await Promise.race([
    (async()=>{const response=await fetch(url,{...options,signal:controller.signal});return {response,result:await response.json()};})(),
    new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('The request timed out.'));},timeout);})
  ]);}finally{clearTimeout(timer);}
}
async function availability(){
  if(checking||submitting||pending||submitted)return;
  checking=true;ready=false;update();
  try{const {response,result}=await requestJSON('/api/project-capabilities',{cache:'no-store'});ready=response.ok&&result?.captureReady===true;}catch{ready=false;}
  checking=false;update();
}
availability();document.querySelector('#retryApplication').addEventListener('click',availability);
function showError(message){error.textContent=message;error.focus();}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitting||checking||submitted||(!pending&&!ready))return;
  if(pending&&pendingMonth!==new Date(Date.now()).toISOString().slice(0,7))return showError('This application can no longer be safely retried here. Ask Wazoozie Help to confirm reference WZ-B-'+id.slice(0,8).toUpperCase()+' before starting another application.');
  if(!pending){
    for(const field of form.querySelectorAll('input,select,textarea'))if(!field.reportValidity())return;
    const fields=new FormData(form);const services=fields.getAll('services');
    if(services.length<1||services.length>6)return showError('Choose between one and six services you currently provide.');
    if(!form.elements.consent.checked)return showError('Please review the consent before submitting.');
    pending={...Object.fromEntries(fields),services,id,startedAt,consent:true,consentVersion:APPLICATION_CONSENT_VERSION};
    pendingMonth=new Date(Date.now()).toISOString().slice(0,7);lock(true);
  }
  submitting=true;update();error.textContent='';
  try{
    const {response,result}=await requestJSON('/api/contractor-applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pending)},20000);
    if(!response.ok){
      if([400,422,429].includes(response.status)){pending=undefined;lock(false);}
      throw new Error(result?.error||'We could not confirm that your application was saved.');
    }
    if(result?.status!=='awaiting_review'||result.reference!==id||result.published!==false||result.charged!==false||!['automation_accepted','pending','failed','not_sent'].includes(result.officeDelivery))throw new Error('We could not confirm your application reference.');
    submitted=pending;pending=undefined;
    form.hidden=true;document.querySelector('#applicationReceipt').hidden=false;
    document.querySelector('#applicationReference').textContent=`Reference WZ-B-${id.slice(0,8).toUpperCase()}`;
    deskNote.textContent=result.officeDelivery==='automation_accepted'?'Your application was saved and the email service accepted the notification to wazooziehelp@gmail.com. Inbox delivery is not confirmed. Wazoozie will review it before any listing is published.':'Your application was saved. The office notification is not confirmed; use the email draft below to notify wazooziehelp@gmail.com directly.';
    document.querySelector('#applicationReceipt').focus();
  }catch(failure){showError(pending?'We could not confirm receipt. Retry the same application below, or ask Wazoozie Help to check reference WZ-B-'+id.slice(0,8).toUpperCase()+'. Do not start another application for the same business.':failure.message||'We could not confirm a save. Please retry.');}
  finally{submitting=false;update();}
});

// Explicit email handoff while automated delivery to the central inbox is unverified.
const deskLink=document.createElement('a');deskLink.className='btn primary';deskLink.textContent='Email this application to Wazoozie Help ↗';
const deskNote=document.createElement('p');deskNote.textContent='Your application was saved privately. To notify the Wazoozie team, open this email draft, review it and send it to wazooziehelp@gmail.com. No email is sent automatically.';
document.querySelector('#applicationReceipt').append(deskNote,deskLink);
deskLink.addEventListener('click',()=>{
 if(!submitted)return;
 const entries=Object.entries(submitted).filter(([key])=>!['fax','company','consent','consentVersion','id','startedAt'].includes(key));
 const body=['WAZOOZIE BUSINESS APPLICATION',`Reference WZ-B-${id.slice(0,8).toUpperCase()}`,...entries.map(([key,value])=>`${key}: ${Array.isArray(value)?value.join(", "):value}`)].join('\n');
 deskLink.href='mailto:wazooziehelp@gmail.com?subject='+encodeURIComponent('Wazoozie business introduction')+'&body='+encodeURIComponent(body);
});
