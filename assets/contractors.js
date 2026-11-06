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
const startedAt=Date.now();let ready=false;let submitting=false;
async function availability(){
  try{const response=await fetch('/api/project-capabilities',{cache:'no-store'});ready=response.ok&&(await response.json()).captureReady===true;}catch{ready=false;}
  button.disabled=!ready;
  document.querySelector('#retryApplication').hidden=ready;
  document.querySelector('#applicationStatus').textContent=ready?'Free to apply. Your details are saved privately for manual review.':'Applications are currently unavailable. Your details have not been submitted; please try again later.';
}
availability();document.querySelector('#retryApplication').addEventListener('click',availability);
function showError(message){error.textContent=message;error.focus();}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitting||!ready)return;
  for(const field of form.querySelectorAll('input,select,textarea'))if(!field.reportValidity())return;
  const fields=new FormData(form);const services=fields.getAll('services');
  if(services.length<1||services.length>6)return showError('Choose between one and six services you currently provide.');
  if(!form.elements.consent.checked)return showError('Please review the consent before submitting.');
  const data={...Object.fromEntries(fields),services,id,startedAt,consent:true,consentVersion:APPLICATION_CONSENT_VERSION};
  submitting=true;button.disabled=true;button.textContent='Saving your application…';error.textContent='';
  try{
    const response=await fetch('/api/contractor-applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'We could not confirm that your application was saved. Retry the same details.');
    if(result.status!=='awaiting_review'||result.reference!==id||result.published!==false||result.charged!==false)throw new Error('We could not confirm your application reference. Retry the same details.');
    form.hidden=true;document.querySelector('#applicationReceipt').hidden=false;
    document.querySelector('#applicationReference').textContent=`Reference WZ-B-${id.slice(0,8).toUpperCase()}`;
    document.querySelector('#applicationReceipt').focus();
  }catch(failure){showError(failure.message||'We could not confirm a save. Please retry.');}
  finally{submitting=false;button.disabled=!ready;button.textContent='Submit business application →';}
});
