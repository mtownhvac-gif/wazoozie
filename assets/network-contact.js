import {BUSINESSES,INTENTS} from './project-config.mjs';

// Availability is read-only. This component never submits a homeowner request.
export async function initNetworkContact(doc,{fetcher=globalThis.fetch}={}){
 const panels=[...doc.querySelectorAll('[data-network-business]')];
 if(!panels.length)return;
 for(const panel of panels){panel.querySelector('[data-callback-slot]')?.replaceChildren();const status=panel.querySelector('[data-callback-status]');if(status)status.textContent='Call the business directly to discuss your project.';}
 let capabilities;
 try{const response=await fetcher('/api/project-capabilities',{cache:'no-store',credentials:'same-origin'});if(!response.ok)return;capabilities=await response.json();}catch{return;}
 if(capabilities.captureReady!==true||!Array.isArray(capabilities.emailProviders))return;
 for(const panel of panels){
  const key=panel.dataset.networkBusiness,intent=panel.dataset.networkIntent,business=BUSINESSES[key];
  if(!business||INTENTS[intent]?.provider!==key||!capabilities.emailProviders.includes(key))continue;
  const slot=panel.querySelector('[data-callback-slot]');if(!slot)continue;
  const link=doc.createElement('a');link.className='btn outline';link.href='/start/?intent='+encodeURIComponent(intent);link.textContent='Request a callback';
  slot.replaceChildren(link);
  const status=panel.querySelector('[data-callback-status]');
  if(status)status.textContent=`Selected business: ${business.name}. Requests are emailed to wazooziehelp@gmail.com for review and forwarding. Review your details and consent before sending. For urgent help, call directly.`;
 }
}
if(typeof document!=='undefined')initNetworkContact(document);
