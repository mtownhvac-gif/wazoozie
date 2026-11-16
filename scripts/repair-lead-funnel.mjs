// Final, narrow MH-41 repairs. One request component and one existing backend.
import {JSDOM} from 'jsdom';
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {BUSINESSES,INTENTS} from '../project-config.mjs';
const out=resolve(process.argv[2]);
const files=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(resolve(dir,e.name)):e.name.endsWith('.html')?[resolve(dir,e.name)]:[]);
const requestDocument=new JSDOM(readFileSync(resolve(out,'request/index.html'),'utf8')).window.document;
const card=requestDocument.querySelector('.request-card');
const select=card.querySelector('[name=intent]');
for(const [value,intent] of Object.entries(INTENTS)){const o=requestDocument.createElement('option');o.value=value;o.textContent=intent.label;select.append(o);}
const sourceCard=card.outerHTML;
const replacements=[
 [/supplied by Wazoozie[’']s owner/gi,'provided to Wazoozie'],
 [/Wazoozie[’']s owner recommends/gi,'Wazoozie recommends'],
 [/Wazoozie[’']s owner recommended/gi,'Wazoozie recommended'],
 [/recommended by Wazoozie[’']s owner/gi,'Recommended by Wazoozie'],
 [/Wazoozie[’']s owner/gi,'Wazoozie'],
 [/owner-recommended/gi,'Wazoozie-recommended']
];
for(const file of files(out)){
 const path='/'+relative(out,file).replace(/index\.html$/,'');
 const dom=new JSDOM(readFileSync(file,'utf8')),d=dom.window.document;
 const main=d.querySelector('main');if(!main)continue;
 // The unused legacy dialog was still indexed, although its email-only controller
 // is no longer loaded. Remove it rather than showing an untracked email draft.
 if(!d.querySelector('script[src="/assets/home.js"]'))d.querySelector('#requestDialog')?.remove();
 const profile=Object.entries(BUSINESSES).find(([,b])=>path===`/businesses/${b.slug}/`);
 const serviceIntent=Object.entries(INTENTS).find(([,i])=>path===`/services/${i.service}/`);
 const needsForm=path==='/'||profile||serviceIntent;
 if(path==='/request/')d.querySelector('.request-card').outerHTML=sourceCard;
 else if(needsForm){
  const section=d.createElement('section');section.className='wrap embedded-request';section.id='request-help';section.innerHTML=sourceCard;
  const f=section.querySelector('form');f.dataset.intent=profile?BUSINESSES[profile[0]].defaultIntent:serviceIntent?serviceIntent[0]:'comfort';
  const option=section.querySelector(`option[value="${f.dataset.intent}"]`);option?.setAttribute('selected','');
  const b=BUSINESSES[INTENTS[f.dataset.intent].provider];
  section.querySelector('#request-business').innerHTML=`<p>Your request is for: <strong>${b.name}</strong>. <a href="tel:${b.tel}">Call ${b.phone}</a></p>`;
  section.querySelector('#request-permission').textContent=`I agree to Wazoozie saving these details and emailing them to wazooziehelp@gmail.com for review and forwarding to ${b.name}.`;
  if(path==='/')main.append(section);else main.querySelector('.page-hero')?.after(section);
  if(!section.isConnected)main.append(section);
 }
 if(needsForm||path==='/request/'){
  if(!d.querySelector('script[src="/assets/quick-request.js"]')){const script=d.createElement('script');script.type='module';script.src='/assets/quick-request.js';d.body.append(script);}
  const note=d.createElement('p');note.className='request-note';note.textContent='Wazoozie Help receives this request at wazooziehelp@gmail.com and forwards it to your selected business. For Middletown HVAC, office hours are Monday to Friday, 8:00 AM to 4:30 PM. For no heat or another emergency, call 610-500-6416 to check availability.';
  d.querySelector('#request-status').before(note);
 }
 // Optional name is saved under the existing private brief retention/consent.
 const projectForm=d.querySelector('#projectForm');
 if(projectForm&&!projectForm.querySelector('[name=referrer_name]')){
  const label=d.createElement('label');label.className='field';label.innerHTML='Who sent you? (optional)<input name="referrer_name" maxlength="100" autocomplete="off">';
  projectForm.querySelector('[name=name]')?.closest('label')?.after(label);
 }
 if(path==='/how-it-works/'){
  const preserved=[...main.querySelectorAll('.network-wide-next,.network-how')];
  main.innerHTML='<section class="wrap request-intro"><h1>How Wazoozie works</h1><p>Choose the work. See the business. Send one request.</p></section><section class="wrap request-card"><h2>Start with the help you need.</h2><p>Our directory connects you with named local businesses. Each business agrees on its work, pricing and scheduling directly with you.</p><h2>Send your request.</h2><p>The form shows your selected business before you send. With your consent, Wazoozie saves your brief and sends an alert to wazooziehelp@gmail.com. Wazoozie Help reviews it and forwards it to that business. Your receipt includes a reference and the alert status.</p><p>A submitted request is not a confirmed appointment. The business confirms your address, scope, timing and charges with you.</p><h2>Know someone who needs help?</h2><p>Add their name in “Who sent you?” if a friend introduced you. <a href="/neighbors/#reward-terms">Read the Middletown referral-credit terms</a>.</p><h2>Need urgent service?</h2><p>Call the business directly to check availability. For Middletown HVAC, call <a href="tel:+16105006416">610-500-6416</a>. This form is not emergency dispatch.</p><a class="btn primary" href="/request/">Request local help →</a> <a href="/book/">Call a business directly →</a></section>';
  for(const section of preserved)main.append(section);
 }
 if(path==='/local-help/'){
  const section=d.createElement('section');section.className='wrap';section.innerHTML='<h2>Meet the listed businesses</h2><div class="local-pro-grid"></div>';
  for(const slug of readdirSync(resolve(out,'businesses'))){
   const target=resolve(out,'businesses',slug,'index.html');if(!existsSync(target))continue;
   const pd=new JSDOM(readFileSync(target,'utf8')).window.document;const h=pd.querySelector('h1');if(!h)continue;
   const a=d.createElement('a');a.className='local-pro-card';a.href=`/businesses/${slug}/`;a.textContent=h.textContent.trim().replace(/\.$/,'');section.querySelector('div').append(a);
  }main.append(section);
 }
 if(path==='/businesses/middletown-hvac/'){
  const proof=d.querySelector('.rating-proof');if(proof)proof.innerHTML='<strong>200+ reviews, <a href="https://www.mtownhvac.com/reviews/">5.0 Google rating</a></strong><span>See the published reviews and current rating at the source.</span>';
 }
 // Replace the old furnace image with an inspected, already published real Bosch
 // installation. Never rebadge a different machine or claim a fabricated job.
 for(const img of d.querySelectorAll('img[src*="middletown-conventional-project"]')){
  // A space-heating photo must not masquerade as a conventional water heater.
  const card=img.closest('.hot-water-card,figure');
  if(card){card.remove();continue;}
  img.closest('picture')?.querySelectorAll('source').forEach(source=>source.remove());
  img.src='/assets/middletown-conversion-project.jpg';img.removeAttribute('srcset');img.width=1200;img.height=1600;img.alt='Middletown HVAC technician working on a published Bosch heat pump installation';
 }
 for(const meta of d.querySelectorAll('meta[content*="middletown-conventional-project"]'))meta.content=meta.content.replace('middletown-conventional-project','middletown-conversion-project');
 // Remove duplicate FAQ entries if present, not their linked evidence.
 if(path==='/contact/'){
  const seen=new Set();for(const detail of d.querySelectorAll('details')){const q=detail.querySelector('summary')?.textContent.trim();if(q&&seen.has(q))detail.remove();else if(q)seen.add(q);}
 }
 for(const script of d.querySelectorAll('script[type="application/ld+json"]')){
  let content=script.textContent;for(const [from,to]of replacements)content=content.replace(from,to);script.textContent=content;
 }
 const walker=d.createTreeWalker(d.body,dom.window.NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(node.parentElement.closest('script,style,blockquote'))continue;
  let value=node.nodeValue;for(const [from,to] of replacements)value=value.replace(from,to);node.nodeValue=value;
 }
 for(const el of d.querySelectorAll('[title],[alt],meta[content]'))for(const attribute of ['title','alt','content']){
  if(!el.hasAttribute(attribute))continue;let value=el.getAttribute(attribute);for(const [from,to]of replacements)value=value.replace(from,to);el.setAttribute(attribute,value);
 }
 if(path==='/privacy/'){
  const h=[...d.querySelectorAll('h2')].find(x=>x.textContent.includes('Neighbor introductions'));
  if(h){const p=d.createElement('p');p.textContent='You may also supply a referrer name in “Who sent you?”. That optional name and any valid neighbor referral code are saved with the private brief and included in the Wazoozie Help alert for attribution. They do not create an automatic reward or subscribe anyone to marketing.';h.after(p);}
 }
 writeFileSync(file,dom.serialize());dom.window.close();
}
