import {HVAC_CONSENT_VERSION, HVAC_INTENTS} from '../hvac-config.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const bounds={name:100,contact:180,zip:5,details:1500,timing:30,intent:30};
const control=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export function validateHvacRequest(data,now=Date.now()){
  if(!data||typeof data!=='object'||Array.isArray(data))return {error:'Invalid request.'};
  if(data.company)return {error:'Request not accepted.'};
  if(!UUID.test(data.id||'')||!Number.isFinite(data.startedAt)||now-data.startedAt<2000||now-data.startedAt>7200000)return {error:'Reopen the request form and try again.'};
  if(data.consent!==true||data.consentVersion!==HVAC_CONSENT_VERSION)return {error:'Review the saving notice and check the consent box.'};
  if(!HVAC_INTENTS.includes(data.intent)||(data.provider!==undefined&&data.provider!=='middletown'))return {error:'Choose an HVAC service for Middletown HVAC.'};
  for(const [field,max] of Object.entries(bounds))if(typeof data[field]!=='string'||data[field].length>max||control.test(data[field]))return {error:'One or more request fields is invalid or too long.'};
  const name=data.name.trim(),contact=data.contact.trim(),zip=data.zip.trim(),details=data.details.trim(),timing=data.timing.trim();
  if(name.length<2||/[\r\n]/.test(name+contact))return {error:'Enter your name and one phone number or email address.'};
  if(!/^\d{5}$/.test(zip)||zip==='00000')return {error:'Enter a five-digit ZIP code. Coverage is confirmed by Middletown.'};
  const isEmail=contact.includes('@');const digits=contact.replace(/\D/g,'');
  if(isEmail?!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact):(!/^[+\d\s().-]+$/.test(contact)||digits.length<10||digits.length>15))return {error:'Enter one valid phone number or email address.'};
  if(details.length<15)return {error:'Add a little more detail about what needs attention.'};
  if(!['This week','Planning ahead','Urgent'].includes(timing))return {error:'Choose your preferred timing.'};
  // Unasked fields stay empty. Do not invent a town, state, property type or role.
  return {brief:{id:data.id,provider:'middletown',intent:data.intent,name,phone:isEmail?'':contact,email:isEmail?contact:'',town:'',zip,state:'',details,timing,role:'',property:'',equipment:'',source:'hvac-page',consentVersion:HVAC_CONSENT_VERSION}};
}
