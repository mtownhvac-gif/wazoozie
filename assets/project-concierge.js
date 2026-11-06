import {INTENTS, BUSINESSES, PROJECT_QUESTIONS} from './project-config.mjs';

export const HOME_LIST_KEY = 'wazoozie.home-list.v1';
const STAGES = {planning:'Thinking it through', calling:'Ready to talk', done:'Finished'};
const SEARCH_WORDS = {
  comfort:'furnace ac air conditioning heat pump ductless mini split heating cooling',
  water:'hot water water heater tankless tank', electrical:'electrician outlet socket lighting circuit panel',
  plumbing:'plumber drain fixture faucet sink toilet pipe', carpentry:'handyman shelving trim small wood repair',
  painting:'painter drywall walls ceiling cabinet finish', doors:'hang door frame hardware',
  windows:'window draft frame replacement', decks:'deck porch stairs railing', additions:'builder addition remodeling renovation construction',
  boiler:'boiler radiator oil gas baseboard', maintenance:'tune up seasonal maintenance comfort plan',
  replacement:'new hvac system replace conversion heat pump', secondopinion:'second opinion estimate proposal repair recommendation'
};
const normalize = text => String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export function matchingProjects(query) {
  const tokens=normalize(query).split(' ').filter(Boolean);
  return Object.keys(INTENTS).filter(key=>{const haystack=normalize(INTENTS[key].label+' '+INTENTS[key].description+' '+SEARCH_WORDS[key]);return tokens.every(token=>token.length<3?haystack.split(' ').includes(token):haystack.includes(token));});
}
export function sanitizeList(raw) {
  if (!raw || raw.version!==1 || !Array.isArray(raw.items)) return [];
  const seen=new Set();
  return raw.items.slice(0,50).filter(item=>{
    if (!item || typeof item.intent!=='string' || !Object.hasOwn(INTENTS,item.intent) || !Object.hasOwn(STAGES,item.stage) || seen.has(item.intent)) return false;
    seen.add(item.intent); return true;
  }).map(({intent,stage})=>({intent,stage})).slice(0,Object.keys(INTENTS).length);
}

export function initConcierge(doc, suppliedStorage) {
  const win=doc.defaultView;
  let storage=suppliedStorage, items=[], storageAvailable=true, removed=null;
  try { if(storage===undefined)storage=win.localStorage; items=sanitizeList(JSON.parse(storage?.getItem(HOME_LIST_KEY)||'null')); }
  catch { storageAvailable=false; }
  const el=(tag,content,className)=>{const node=doc.createElement(tag);if(content!==undefined)node.textContent=content;if(className)node.className=className;return node;};
  const link=(label,url,className)=>{const a=el('a',label,className);a.href=url;return a;};
  const feedback=el('p','', 'home-save-feedback'); feedback.id='home-save-feedback'; feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');doc.body.append(feedback);
  let toastTimer;
  function announce(message){feedback.textContent=message;win.clearTimeout(toastTimer);toastTimer=win.setTimeout(()=>{feedback.textContent='';},5000);}
  function persist(){
    try {if(!storage)throw Error('No storage');if(items.length)storage.setItem(HOME_LIST_KEY,JSON.stringify({version:1,items}));else storage.removeItem(HOME_LIST_KEY);storageAvailable=true;}
    catch {storageAvailable=false;}
  }
  function storageNotice(){const p=doc.querySelector('#home-storage-status');if(p)p.textContent=storageAvailable?'':'This browser cannot save your list. Changes stay in this open page only. Print it before leaving if you want a copy.';}
  function save(intent){
    if(!Object.hasOwn(INTENTS,intent))return;
    if(items.some(item=>item.intent===intent)){announce('Already on your home list. Open My home list to change or remove it.');return;}
    items.push({intent,stage:'planning'});persist();render();
    announce(storageAvailable?'Saved to My home list on this device.':'Added for this open page only. Browser storage is unavailable.');
  }
  function remove(intent){removed={item:items.find(item=>item.intent===intent),index:items.findIndex(item=>item.intent===intent)};items=items.filter(item=>item.intent!==intent);persist();render();const undo=doc.querySelector('#home-list-undo');if(undo)undo.hidden=false;doc.querySelector('#home-list-undo-button')?.focus();}
  function render(){
    doc.querySelectorAll('[data-home-count]').forEach(node=>{node.textContent=items.length?'('+items.length+')':'';});
    doc.querySelectorAll('[data-home-save]').forEach(button=>{
      button.hidden=false;
      const intent=button.dataset.homeSave;if(!Object.hasOwn(INTENTS,intent))return;
      const saved=items.some(item=>item.intent===intent);
      button.setAttribute('aria-pressed',String(saved));
      button.setAttribute('aria-label',(saved?'Already saved: ':'Save ')+INTENTS[intent].label+(saved?'. Open My home list to manage.':' to My home list'));
      if(button.classList.contains('concierge-save'))button.textContent=saved?'✓':'+';
      else if(!button.dataset.originalLabel)button.dataset.originalLabel=button.textContent;
      if(!button.classList.contains('concierge-save'))button.textContent=saved?'Saved ✓':button.dataset.originalLabel;
    });
    storageNotice();
    const board=doc.querySelector('#home-list-board');if(!board)return;
    board.replaceChildren();
    const finished=items.filter(item=>item.stage==='done').length;
    doc.querySelector('#home-list-summary').textContent=items.length?items.length+' '+(items.length===1?'project':'projects')+' on your list · '+finished+' finished':'Your next good project can start below.';
    doc.querySelector('#home-list-empty').hidden=items.length>0;
    doc.querySelector('#home-list-print').hidden=items.length===0;
    for(const item of items){
      const intent=INTENTS[item.intent],business=BUSINESSES[intent.provider];
      const card=el('article',undefined,'home-project');card.dataset.project=item.intent;card.dataset.stage=item.stage;
      const header=el('div',undefined,'home-project-heading');const text=el('div');text.append(el('span',STAGES[item.stage],'home-project-stage'),el('h2',intent.label));
      const removeButton=el('button','Remove','home-project-remove');removeButton.type='button';removeButton.setAttribute('aria-label','Remove '+intent.label+' from My home list');removeButton.addEventListener('click',()=>remove(item.intent));header.append(text,removeButton);card.append(header,el('p',intent.description));
      const label=el('label','Where are you with this?','home-project-stage-label');const select=el('select');select.setAttribute('aria-label','Progress for '+intent.label);
      for(const [key,value] of Object.entries(STAGES)){const option=el('option',value);option.value=key;select.append(option);}select.value=item.stage;
      select.addEventListener('change',()=>{item.stage=select.value;persist();render();doc.querySelector(`[data-project="${item.intent}"] select`)?.focus();});label.append(select);card.append(label);
      const details=el('details');details.open=item.stage!=='done';details.append(el('summary','Before the first conversation'));
      const list=el('ul');for(const question of PROJECT_QUESTIONS[item.intent]||PROJECT_QUESTIONS.comfort)list.append(el('li',question));details.append(list);card.append(details);
      const contact=el('div',undefined,'home-project-contact');contact.append(el('strong',business.name),link('Meet the business ↗','/businesses/'+business.slug+'/'));
      const actions=el('div',undefined,'home-project-actions');actions.append(link('Plan this project →','/start/?intent='+item.intent,'btn primary'),link('Call '+business.phone,'tel:'+business.tel));contact.append(actions,el('span',business.phone,'home-project-print-phone'));card.append(contact);
      card.append(el('p','Confirm your address, scope, availability and any visit charge directly. Saving this project does not send an inquiry.','home-project-footnote'));board.append(card);
    }
  }
  doc.querySelectorAll('[data-home-save]').forEach(button=>button.addEventListener('click',()=>save(button.dataset.homeSave)));
  doc.querySelector('#home-list-undo-button')?.addEventListener('click',()=>{if(!removed?.item)return;if(!items.some(item=>item.intent===removed.item.intent))items.splice(removed.index,0,removed.item);removed=null;persist();render();doc.querySelector('#home-list-undo').hidden=true;announce('Project restored.');});
  doc.querySelector('#home-list-print')?.addEventListener('click',()=>{const closed=[...doc.querySelectorAll('.home-project details:not([open])')];closed.forEach(node=>{node.open=true;});win.addEventListener('afterprint',()=>closed.forEach(node=>{node.open=false;}),{once:true});win.print();});
  const search=doc.querySelector('#concierge-search'),showAll=doc.querySelector('#concierge-show-all');let expanded=false;
  function filter(){
    const query=search.value.trim();const keys=matchingProjects(query);let count=0;
    doc.querySelectorAll('[data-project-choice]').forEach(card=>{const visible=keys.includes(card.dataset.projectChoice)&&(query||expanded||card.dataset.projectExtra!=='true');card.hidden=!visible;if(visible)count++;});
    const status=doc.querySelector('#concierge-results');status.replaceChildren();
    if(query){status.append(el('span',count?count+' '+(count===1?'project matches':'projects match'):'No close match. '));if(!count)status.append(link('Try the who-to-call guide →','/help/'));}
    showAll.hidden=Boolean(query);showAll.textContent=expanded?'Show fewer projects ↑':'See all projects ↓';
  }
  if(search&&showAll){search.hidden=false;showAll.hidden=false;search.addEventListener('input',filter);showAll.addEventListener('click',()=>{expanded=!expanded;filter();});filter();}
  win.addEventListener('storage',event=>{if(event.key!==HOME_LIST_KEY&&event.key!==null)return;try{items=sanitizeList(JSON.parse(storage?.getItem(HOME_LIST_KEY)||'null'));render();}catch{storageAvailable=false;storageNotice();}});
  win.addEventListener('pageshow',()=>{try{if(storageAvailable)items=sanitizeList(JSON.parse(storage?.getItem(HOME_LIST_KEY)||'null'));render();}catch{storageAvailable=false;storageNotice();}});
  render();return {snapshot:()=>items.map(item=>({...item}))};
}
if(typeof document!=='undefined')initConcierge(document);
