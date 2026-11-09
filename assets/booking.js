import {coverageFor} from './coverage-config.mjs';
const normalize=value=>String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const searchText=value=>normalize(value)
 .replace(/\b(?:no heat|not heating|heat (?:is )?not working|ac (?:is )?not (?:working|cooling)|not cooling|air conditioner (?:is )?not working|furnace (?:is )?not working)\b/g,'hvac')
 .replace(/\b(?:no hot water|water heater (?:is )?not working)\b/g,'waterheater')
 .replace(/\b(?:lights? (?:are |is )?not working|outlets? (?:are |is )?not working|tripping breaker|breaker (?:keeps )?tripping)\b/g,'electrical')
 .replace(/\b(?:leaking (?:sink|faucet|toilet)|clogged (?:drain|toilet)|blocked drain|drain (?:is )?blocked)\b/g,'plumbing')
 .replace(/\b(?:air conditioning|air conditioners?|heat pumps?|mini splits?|ductless|heating|cooling|furnaces?|ac)\b/g,'hvac')
 .replace(/\b(?:water heaters?|hot water|tankless)\b/g,'waterheater')
 .replace(/\bplumbers?\b/g,'plumbing').replace(/\belectricians?\b/g,'electrical')
 .replace(/\bmechanics?\b/g,'mechanic').replace(/\b(?:real estate|realtors?)\b/g,'realestate')
 .replace(/\b(?:painters?|paint)\b/g,'painting');
const filler=new Set(['i','we','need','needs','a','an','the','for','to','my','our','with','help','someone','looking','near','me','please','fix','repair','repairs','service','services','install','installation','is','are','has','have']);
// Short words are complete words: car must never match carpentry, or art Hart.
// Longer prefixes still let visitors type Cook, carp, elect, etc.
const matchesTerm=(words,term)=>words.some(word=>word===term||(term.length>=4&&word.startsWith(term)));
export function initBooking(doc=document){
 const cards=[...doc.querySelectorAll('[data-book-category]')],buttons=[...doc.querySelectorAll('[data-book-filter]')],status=doc.querySelector('#booking-count'),input=doc.querySelector('#booking-query'),empty=doc.querySelector('#booking-empty');
 let category='all';
 const params=new URL(doc.defaultView?.location?.href||'https://wazoozie.com/book/').searchParams;
 const townInput=doc.querySelector('#booking-town'),coverageOnly=doc.querySelector('#booking-coverage-only');
 if(townInput)townInput.value=(params.get('town')||'').slice(0,80);
 if(coverageOnly)coverageOnly.checked=params.get('coverage')==='published';
 if(input)input.value=(params.get('q')||'').slice(0,100);
 if(['all','home','auto','realestate'].includes(params.get('category')))category=params.get('category');
 function filter(next=category){
  if(!['all','home','auto','realestate'].includes(next))return;category=next;
  const rawTerms=searchText(input?.value||'').split(' ').filter(Boolean);
  const terms=rawTerms.filter(term=>!filler.has(term));
  const town=townInput?.value.trim()||'';
  if(coverageOnly)coverageOnly.disabled=!town;
  for(const card of cards){const words=searchText(card.dataset.search||card.textContent).split(' '),coverage=coverageFor(card.dataset.business,town);card.hidden=(category!=='all'&&card.dataset.bookCategory!==category)||!terms.every(term=>matchesTerm(words,term))||Boolean(town&&coverageOnly?.checked&&!coverage.match);
   let area=card.querySelector('.booking-coverage');if(!area){area=doc.createElement('p');area.className='booking-coverage';card.querySelector('.booking-services')?.after(area);}area.hidden=!town;area.replaceChildren();
   if(town){area.textContent=coverage.match?'Published coverage includes '+town+'. Confirm your exact address and availability.':'Coverage for '+town+' needs confirmation with this business. This is not a refusal of service.';
    if(coverage.match){const source=doc.createElement('a');source.href=coverage.entry.source;source.textContent=' Service-area source (read '+coverage.entry.checkedAt+')';source.target='_blank';source.rel='noreferrer';area.append(source);}}
   let reason=card.querySelector('.booking-match');
   if(!reason){reason=doc.createElement('p');reason.className='booking-match';card.querySelector('.booking-services')?.after(reason);}
   reason.hidden=card.hidden||!terms.length;
   reason.textContent=terms.length?'Matches your search in this business’s name or listed services.':'';
  }
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.bookFilter===category));
  const count=cards.filter(card=>!card.hidden).length;if(status)status.textContent=count+' '+(count===1?'local contact':'local contacts')+(terms.length?' matching your search':'')+' · alphabetical order, not a rating'+(town&&coverageOnly?.checked?' · published coverage matches only; other businesses may also serve this town':'');if(empty)empty.hidden=count>0;
 }
 for(const button of buttons)button.addEventListener('click',()=>filter(button.dataset.bookFilter));
 input?.addEventListener('input',()=>filter());
 townInput?.addEventListener('input',()=>filter());coverageOnly?.addEventListener('change',()=>filter());
 doc.querySelector('.booking-search')?.addEventListener('submit',event=>{event.preventDefault();filter();status?.focus();});
 doc.querySelector('#booking-reset')?.addEventListener('click',()=>{if(input)input.value='';if(townInput)townInput.value='';if(coverageOnly)coverageOnly.checked=false;filter('all');input?.focus();});
 if(status)status.tabIndex=-1;filter();
}
if(typeof document!=='undefined')initBooking(document);
