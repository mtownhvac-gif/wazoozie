import {APPLICATION_CONSENT_VERSION, CONTRACTOR_TRADES, CONTRACTOR_INTERESTS} from '../contractor-config.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const limits={businessName:120,contactName:100,email:180,phone:35,website:250,town:100,state:2,coverage:600,registration:150,insurance:20,interest:20,notes:1200};
export function validateApplication(data,now=Date.now()) {
  if(!data||typeof data!=='object'||Array.isArray(data))return {error:'Invalid application.'};
  if(data.fax)return {error:'Application not accepted.'};
  if(!UUID.test(data.id||'')||!Number.isFinite(data.startedAt)||now-data.startedAt<2000||now-data.startedAt>7200000)return {error:'Please reopen the application and try again.'};
  if(data.consent!==true||data.consentVersion!==APPLICATION_CONSENT_VERSION)return {error:'Please review and accept the application consent.'};
  const application={id:data.id};
  for(const [name,limit] of Object.entries(limits)){
    if(data[name]!==undefined&&(typeof data[name]!=='string'||data[name].length>limit))return {error:'One or more fields is too long or invalid.'};
    application[name]=(data[name]||'').trim();
  }
  if(application.businessName.length<2||application.contactName.length<2)return {error:'Enter your business name and contact name.'};
  const digits=application.phone.replace(/\D/g,'');
  if(digits.length<10||digits.length>15||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email))return {error:'Enter a valid business email and phone number.'};
  if(application.town.length<2||!['PA','NJ','DE'].includes(application.state)||application.coverage.length<10)return {error:'Enter your business location and the local areas you currently serve.'};
  if(application.website){try{const url=new URL(application.website);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error();}catch{return {error:'Use a complete http or https website address, or leave it blank.'};}}
  if(!Array.isArray(data.services)||data.services.length<1||data.services.length>6||data.services.some(key=>!Object.hasOwn(CONTRACTOR_TRADES,key))||new Set(data.services).size!==data.services.length)return {error:'Choose between one and six services your business handles.'};
  if(!['yes','no','discuss'].includes(application.insurance)||!Object.hasOwn(CONTRACTOR_INTERESTS,application.interest))return {error:'Choose your insurance status and listing interest.'};
  application.services=[...data.services].sort();application.consentVersion=APPLICATION_CONSENT_VERSION;
  return {application};
}
