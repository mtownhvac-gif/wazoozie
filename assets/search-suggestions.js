export const SERVICE_SUGGESTIONS=[
 ['Car repair','car','auto'],['Vehicle wraps','wraps','auto'],['Transmission repair','transmission','auto'],['Tires','tires','auto'],
 ['Heating & AC repair','hvac','home','ac heating cooling furnace air conditioning'],['No heat','no heat','home'],['AC not cooling','ac not cooling','home'],['No hot water','no hot water','home'],['Water Heaters & tankless','water heater','home'],['Boilers & radiators','boiler','home'],
 ['Plumbing & drains','plumbing','home','plumber'],['Leaking sink','leaking sink','home'],['Clogged drain','clogged drain','home'],['Electrical work','electrical','home','electrician'],['Breaker keeps tripping','breaker keeps tripping','home'],['Painting & drywall','painting','home','painter paint'],['Carpentry & home repairs','carpentry','home','handyman shelving trim'],['Windows & doors','windows','home'],['Decks & remodeling','decks','home'],['Real estate agents','real estate','realestate','realtor buying selling']
].map(([label,query,category,aliases=''])=>({label,query,category,aliases}));
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export function matchingSuggestions(query,items=SERVICE_SUGGESTIONS){
 const tokens=normalize(query).split(' ').filter(Boolean);if(normalize(query).length<2)return [];
 const words=item=>normalize(item.label+' '+item.query+' '+(item.aliases||'')).split(' ');
 // Exact short words win over unrelated prefixes: car excludes carpentry.
 const exact=items.filter(item=>tokens.every(t=>words(item).includes(t)));
 const choices=exact.length?exact:items.filter(item=>tokens.every(t=>words(item).some(w=>w.startsWith(t))));
 return choices.slice(0,6);
}
export function initSearchSuggestions(doc,items=SERVICE_SUGGESTIONS){
 const inputs=[...doc.querySelectorAll('#home-service-query,#booking-query')];
 for(const input of inputs){
  if(input.dataset.suggestionsReady)continue;input.dataset.suggestionsReady='true';
  const list=doc.createElement('ul');list.id=input.id+'-suggestions';list.className='wz-search-suggestions';list.setAttribute('role','listbox');list.setAttribute('aria-label','Search suggestions');list.hidden=true;input.insertAdjacentElement('afterend',list);
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
  let matches=[],active=-1,choosing=false;
  function close(){list.hidden=true;active=-1;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
  function highlight(){[...list.children].forEach((option,i)=>option.setAttribute('aria-selected',String(i===active)));if(active>=0)input.setAttribute('aria-activedescendant',list.children[active].id);else input.removeAttribute('aria-activedescendant');}
  function choose(index){const item=matches[index];if(!item)return;choosing=true;input.value=item.query;input.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));input.dispatchEvent(new doc.defaultView.CustomEvent('wz-search-choice',{bubbles:true,detail:{category:item.category}}));close();input.focus();choosing=false;}
  function render(){if(choosing)return;matches=matchingSuggestions(input.value,items);active=-1;list.replaceChildren();matches.forEach((item,i)=>{const option=doc.createElement('li');option.id=list.id+'-'+i;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.textContent=item.label;option.addEventListener('pointerdown',e=>e.preventDefault());option.addEventListener('click',()=>choose(i));list.append(option);});list.hidden=!matches.length;input.setAttribute('aria-expanded',String(Boolean(matches.length)));input.removeAttribute('aria-activedescendant');}
  input.addEventListener('input',render);input.addEventListener('focus',()=>{if(!choosing)render();});input.addEventListener('blur',close);
  input.addEventListener('keydown',event=>{if(event.isComposing)return;if(event.key==='Escape'){close();return;}if(event.key==='Tab'){close();return;}if(list.hidden)return;
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();active=event.key==='ArrowDown'?(active+1)%matches.length:(active<=0?matches.length-1:active-1);highlight();}
   else if(event.key==='Enter'&&active>=0){event.preventDefault();choose(active);}
  });
  input.form?.addEventListener('submit',close);
 }
}
if(typeof document!=='undefined'){
 initSearchSuggestions(document);
 fetch('/assets/search-suggestions.json',{credentials:'omit',referrerPolicy:'no-referrer'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
  if(!Array.isArray(data))return;const businesses=data.filter(i=>i&&typeof i.label==='string'&&i.label.length<=150&&typeof i.query==='string'&&i.query.length<=150&&['home','auto','realestate'].includes(i.category)).slice(0,30);
  // Extend the shared catalog; do not interrupt a list already open while typing.
  SERVICE_SUGGESTIONS.push(...businesses);
 }).catch(()=>{});
}
