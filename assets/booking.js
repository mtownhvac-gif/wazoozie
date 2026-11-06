export function initBooking(doc=document){
 const cards=[...doc.querySelectorAll('[data-book-category]')],buttons=[...doc.querySelectorAll('[data-book-filter]')],status=doc.querySelector('#booking-count');
 function filter(category){
  if(!['all','home','auto','realestate'].includes(category))return;
  for(const card of cards)card.hidden=category!=='all'&&card.dataset.bookCategory!==category;
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.bookFilter===category));
  const count=cards.filter(card=>!card.hidden).length;if(status)status.textContent=count+' '+(count===1?'business':'businesses');
 }
 for(const button of buttons)button.addEventListener('click',()=>filter(button.dataset.bookFilter));filter('all');
}
if(typeof document!=='undefined')initBooking(document);
