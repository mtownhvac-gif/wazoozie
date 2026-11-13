import {BUSINESSES, INTENTS, PROJECT_QUESTIONS} from './project-config.mjs';

const root = document.querySelector('.project-finder');
const result = document.querySelector('#project-finder-result');
let selected;
let planning = false;
const choices = {
  comfort: {repair:'comfort',plan:'replacement',title:'Heating & cooling',note:'Have the equipment type, thermostat setting and affected rooms ready. Leave covers and safety controls in place.'},
  water: {repair:'water',plan:'water',title:'Hot water',note:'Tank or tankless? Note the fuel, any error code and whether every tap is affected.'},
  plumbing: {repair:'plumbing',plan:'plumbing',title:'Plumbing & drains',note:'Note the fixture, when it started and any visible water damage. Avoid using a blocked fixture.'},
  electrical: {repair:'electrical',plan:'electrical',title:'Electrical work',note:'Note the affected circuit or room. Do not open a panel or touch exposed wiring.'},
  painting: {repair:'painting',plan:'painting',title:'Painting & drywall',note:'List the rooms or surfaces, any patching and whether furniture needs moving.'},
  carpentry: {repair:'carpentry',plan:'carpentry',title:'Small home repairs',note:'Group the jobs into one list. A few measurements and photos can help explain the work.'},
  windows: {repair:'doors',plan:'windows',title:'Doors & windows',note:'Choose the work below. The business will confirm the scope and availability.',variants:['doors','windows']},
  decks: {repair:'decks',plan:'additions',title:'Decks & remodeling',note:'Choose the work below. Ask about design, permits and which trades are included.',variants:['decks','additions']},
};
let variant;
const make = (tag,text,cls) => { const el=document.createElement(tag); if(text)el.textContent=text;if(cls)el.className=cls;return el; };
const link=(text,url,cls)=>{const a=make('a',text,cls);a.href=url;return a;};

function render() {
  const choice=choices[selected];
  if(!choice)return;
  const intent=choice.variants ? variant || choice.variants[0] : planning ? choice.plan : choice.repair;
  const meta=INTENTS[intent], business=BUSINESSES[meta.provider];
  result.replaceChildren();
  const heading=make('h3',choice.title);heading.id='project-finder-result-title';
  result.append(make('span','YOUR NEXT STEP','project-finder-kicker'),heading);
  const modes=make('div','','project-finder-modes');
  modes.setAttribute('role','group');modes.setAttribute('aria-label',choice.variants?'Project type':'Your goal');
  for(const [value,label] of choice.variants ? choice.variants.map(key=>[key,INTENTS[key].label]) : [[false,'Fix a problem'],[true,'Plan an upgrade']]) {
    const button=make('button',label);button.type='button';
    button.setAttribute('aria-pressed',String(choice.variants ? intent===value : planning===value));
    button.addEventListener('click',()=>{if(choice.variants)variant=value;else planning=value;render();const target=[...result.querySelectorAll('button')].find(b=>b.textContent===label);target?.focus();});
    modes.append(button);
  }
  if(choice.variants||choice.repair!==choice.plan)result.append(modes);
  const provider=make('div','','project-finder-provider');
  provider.append(make('span','BUSINESS TO CONTACT'),link(business.name,`/businesses/${business.slug}/`),make('p','Confirm your address, project fit and timing with the business.'));
  result.append(provider,make('p',choice.note,'project-finder-prep'));
  const details=make('details');details.append(make('summary','What’s useful to have ready?'));
  const list=make('ul');for(const question of PROJECT_QUESTIONS[intent])list.append(make('li',question));details.append(list);result.append(details);
  const actions=make('div','','project-finder-actions');
  actions.append(link(`Call ${business.phone}`,`tel:${business.tel}`,'btn primary'),link('Send a request →',`/request/?intent=${intent}&entry=home`,'btn outline'));
  result.append(actions,make('p','Wazoozie Help reviews and forwards submitted requests. For urgent help, call to ask about availability.','project-finder-footnote'));
  document.querySelector('#project-finder-announcement').textContent=`${choice.title}: ${business.name}. Contact options and preparation tips are ready.`;
}

if(root&&result){
  for(const anchor of root.querySelectorAll('[data-project-choice]'))anchor.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
    const key=anchor.dataset.projectChoice;if(!Object.hasOwn(choices,key))return;
    event.preventDefault();selected=key;variant=undefined;planning=false;
    for(const item of root.querySelectorAll('[data-project-choice]')){if(item===anchor)item.setAttribute('aria-current','true');else item.removeAttribute('aria-current');}
    render();
    // Keep the selected control in view; the result follows it on small screens.
    if(window.matchMedia?.('(max-width: 760px)').matches){result.scrollIntoView?.({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  });
}
