const normalize=value=>String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export function initBooking(doc=document){
 const cards=[...doc.querySelectorAll('[data-book-category]')],buttons=[...doc.querySelectorAll('[data-book-filter]')],status=doc.querySelector('#booking-count'),input=doc.querySelector('#booking-query'),empty=doc.querySelector('#booking-empty');
 let category='all';
 const params=new URL(doc.defaultView?.location?.href||'https://wazoozie.com/book/').searchParams;
 if(input)input.value=(params.get('q')||'').slice(0,100);
 if(['all','home','auto','realestate'].includes(params.get('category')))category=params.get('category');
 function filter(next=category){
  if(!['all','home','auto','realestate'].includes(next))return;category=next;
  const terms=normalize(input?.value||'').split(' ').filter(Boolean);
  for(const card of cards){const haystack=normalize(card.dataset.search||card.textContent);card.hidden=(category!=='all'&&card.dataset.bookCategory!==category)||!terms.every(term=>haystack.includes(term));}
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.bookFilter===category));
  const count=cards.filter(card=>!card.hidden).length;if(status)status.textContent=count+' '+(count===1?'local contact':'local contacts')+(terms.length?' matching your search':'');if(empty)empty.hidden=count>0;
 }
 for(const button of buttons)button.addEventListener('click',()=>filter(button.dataset.bookFilter));
 input?.addEventListener('input',()=>filter());
 doc.querySelector('.booking-search')?.addEventListener('submit',event=>{event.preventDefault();filter();status?.focus();});
 doc.querySelector('#booking-reset')?.addEventListener('click',()=>{if(input)input.value='';filter('all');input?.focus();});
 if(status)status.tabIndex=-1;filter();
}
if(typeof document!=='undefined')initBooking(document);
