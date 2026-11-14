// Final presentation pass: retain working forms, consent, sources and application hooks.
import {JSDOM} from 'jsdom';
import {BUSINESSES} from '../project-config.mjs';
import {readFileSync, writeFileSync, readdirSync, copyFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||resolve(root,'dist'));
const origin=process.argv[3]||'http://localhost:8123';
const text=s=>s.replace(/\s+/g,' ').trim();
const headings={
 '/about/':'About Wazoozie', '/account/':'Your saved projects', '/ask/':'Get ready for your home project',
 '/auto-mechanics/':'Auto repair shops in Delco', '/before-it-disappears/':'Before It Disappears',
 '/before-you-approve/':'Before you approve the work', '/before-you-say-yes/':'Questions to ask before you hire',
 '/book/':'Find a business to call', '/compare/':'Compare two estimates', '/contact/':'Contact Middletown HVAC',
 '/delaware-valley/':'Where to find local help', '/explore/':'Project tools, guides and quizzes',
 '/facts/':'Business names, services and contacts', '/for-contractors/':'List your local business',
 '/good-call-club/':'Good Call Club', '/guides/':'Home and car repair guides', '/hello/':'Contact Wazoozie',
 '/help/':'Not sure who to call?', '/home-care-reminder/':'Set a home-care reminder', '/home-services/':'Home services in Delco and the Main Line',
 '/home-tips/':'Get to know your home', '/how-it-works/':'How Wazoozie works', '/local-help/':'Meet the local businesses',
 '/local-stories/':'Local projects and businesses', '/my-home/':'Your home project list',
 '/neighbors/':'Refer a friend to Middletown HVAC', '/our-standards/':'How businesses are listed',
 '/play/':'The homeowner playground', '/pricing-guide/':'What should your project cost?', '/privacy/':'Privacy and your information',
 '/project-budget/':'Plan your project budget', '/project-kit/':'Make a project checklist', '/projects/':'See actual local work',
 '/real-estate-agents/':'Local real estate agents', '/request/':'What can we help you with?',
 '/seasonal-home-checklist/':'Your seasonal home checklist', '/second-invoice/':'The Second Invoice',
 '/services/':'Find the service you need', '/share-wazoozie/':'Share Wazoozie with a neighbor',
 '/start/':'Plan your project and choose a business', '/vehicle-wraps/':'Vehicle wraps and vinyl customization',
 '/who-would-you-call/':'Good Call or Gotcha?', '/auto-mechanics/transmission-repair/':'Transmission repair: what to ask the shop',
 '/guides/car-repair-estimate-changed/':'When the car repair estimate changes', '/guides/compare-hvac-estimates/':'How to compare HVAC estimates',
 '/guides/electrical-project-estimate/':'What to ask before electrical work', '/guides/one-room-too-hot-too-cold/':'One room too hot or too cold?',
 '/guides/painting-estimate-checklist/':'What a painting estimate should include', '/guides/plan-a-tankless-conversion/':'Planning a tankless Water Heater conversion',
 '/guides/prepare-for-plumbing-service/':'Before you call a plumber', '/guides/prepare-for-service/':'Get ready for a service visit',
 '/guides/repair-or-replace-hvac/':'Should you repair or replace your HVAC system?', '/guides/surprise-repair-quote/':'What to ask about a large repair quote',
 '/guides/window-replacement-questions/':'What to ask about replacement windows', '/real-estate-agents/first-time-home-buyers/':'Buying your first home',
 '/services/boilers/':'Boiler repair, maintenance and replacement', '/services/construction-remodeling/':'Remodeling, doors, windows and decks',
 '/services/ductless-mini-splits/':'Ductless mini-split heating and cooling', '/services/electrical/':'Electrical repairs and upgrades',
 '/services/electrical-panel-upgrades/':'Planning an electrical panel upgrade', '/services/furnace-repair/':'Furnace not heating?',
 '/services/handyman/':'Carpentry and small home repairs', '/services/heating-cooling/':'Heating & AC repair with Middletown HVAC, Glen Mills',
 '/services/maintenance/':'Heating and cooling maintenance', '/services/oil-to-gas-conversion/':'Replacing your oil heating system',
 '/services/painting/':'Painting and drywall repair', '/services/plumbing/':'Plumbing repairs and drains',
 '/services/replacement-estimates/':'Get an HVAC replacement estimate', '/services/second-opinion/':'Get a second opinion on an HVAC repair',
 '/services/water-heaters/':'Water Heater repair and replacement', '/404/':'That page isn’t here.'
};
const copyPairs={
 'Your home deserves good people.':'Local businesses. Direct contacts.',
 'Small businesses. Reputations worth protecting.':'Local businesses to get to know.',
 'A recommendation with a name behind it.':'Choose who you contact.',
 'Confidence starts with clarity.':'Know who you’re hiring.',
 'A useful first introduction.':'About the business.',
 'Your home deservesgood people.':'About Wazoozie',
 'You don’t needall the answers yet.':'Start with what you know.',
 'The people behind the work.':'Businesses in the directory.',
 'Good people.Close to home.':'Help for local homes.',
 'A name. A number.A place to start.':'Choose a project to see who handles it.',
 'One request.A business you can name.':'See who you’re contacting.',
 'A little more home.':'Ideas for your home.',
 'Room for your everyday.':'Plan the space you need.',
 'Make the next idea feel possible.':'Make a project checklist.',
 'Five questions. A little glory.':'Try the daily home quiz.',
 'Play the daily quiz. Collect Wins. Build your badge collection.':'Five questions about repairs, estimates and the details worth checking.',
 'Know your house.A little more legendary.':'Good Call Club',
 'Have a lookaround.':'Find the tool you need.',
 'The pitch sounded great…':'Check the proposal.',
 'National cost ranges, scope notes and the offer decoder.':'Planning prices and what the work includes.',
 'People worth calling.':'Local business contacts.',
 'THE GOOD PART OF GETTING IT DONE.':'IDEAS FOR YOUR HOME',
 'THE GOOD LIFE, LOCALLY.':'LOCAL BUSINESSES · HOME, AUTO & REAL ESTATE',
 'THE PEOPLE BEHIND THE WORK.':'HOME SERVICES',
 'LOCAL PEOPLE. REPUTATIONS WORTH PROTECTING.':'YOUR CHOICE OF BUSINESS',
 'A GOOD PROJECT STARTS WITH A GOOD QUESTION.':'PROJECT PLANNING',
 'For the rest of life:':'Also looking for:',
 'Make room for your next home project.':'Set a home-care reminder',
 'Vetted by Wazoozie.':'Listed on Wazoozie.',
 'VETTED BY WAZOOZIE':'LISTED ON WAZOOZIE',
 'OWNER-RECOMMENDED · PUBLIC SOURCES LINKED':'LOCAL RECOMMENDATION · SOURCES BELOW',
 'Good work.Worth a closer look.':'See actual local work',
 'Before you replace it.Take another look.':'Get a second opinion on an HVAC repair',
 'Help with home services.':'Plan your next step.',
 'A little local goes a long way.':'Wazoozie illustration',
};
const replacementsFile=resolve(root,'site-copy-review.json');
let reviewed=[];try{reviewed=JSON.parse(readFileSync(replacementsFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const sameHref=(a,href)=>a.getAttribute('href')===href;
function element(d,tag,cls,html){const el=d.createElement(tag);if(cls)el.className=cls;if(html)el.innerHTML=html;return el;}
function isVehicle(path){return path.startsWith('/auto-mechanics/')||path==='/vehicle-wraps/'||/\/(authority-auto|c-and-j|trans-man|sound-wraps)/.test(path);}
function isProperty(path){return path.startsWith('/real-estate-agents/')||/\/(caitlin-kerezsi|megan-kerezsi|libbi-skivo)\//.test(path);}
function context(path){
 if(/vehicle-wraps|sound-wraps/.test(path))return {label:'VEHICLE WRAPS',title:'Talk through your wrap project.',note:'Agree on the film, preparation and which panels are included.',links:[['/vehicle-wraps/','Explore vehicle wrap services'],['/businesses/sound-wraps-west-chester/','See Sound Wraps’ contact details'],['/pricing-guide/','Check wrap planning prices']]};
 if(isVehicle(path)||path==='/guides/car-repair-estimate-changed/')return {label:'AUTO CARE',title:'Find a shop for your vehicle.',note:'Call with the vehicle details and symptoms. Ask about the diagnostic charge before booking.',links:[['/auto-mechanics/','Compare local auto shops'],['/auto-mechanics/transmission-repair/','Transmission repair questions'],['/guides/car-repair-estimate-changed/','When an estimate changes']]};
 if(isProperty(path))return {label:'BUYING & SELLING',title:'Talk through your next move.',note:'Meet the agents, ask about your area and discuss the services and fees before signing.',links:[['/real-estate-agents/','Meet local real estate agents'],['/real-estate-agents/first-time-home-buyers/','First-home buying questions'],['/before-you-say-yes/','Before you sign an agreement']]};
 if(/plumb/.test(path))return {label:'PLUMBING',title:'Ready to call a plumber?',note:'Have the affected fixture, symptoms and your town ready.',links:[['/request/?intent=plumbing&entry=guide','Request plumbing help'],['/businesses/liberator-service-company/','Meet Liberator Service Company'],['/guides/prepare-for-plumbing-service/','Prepare for the service visit']]};
 if(/electri|ryan-dugan/.test(path))return {label:'ELECTRICAL',title:'Find help with electrical work.',note:'Describe the problem or improvement. Let the electrician decide what needs testing.',links:[['/request/?intent=electrical&entry=guide','Request electrical help'],['/businesses/ryan-dugan-electric/','Meet Ryan Dugan Electric'],['/guides/electrical-project-estimate/','Questions for an electrical estimate']]};
 if(/painting|rolled-right/.test(path))return {label:'PAINTING',title:'Talk through the finish you want.',note:'List the rooms, surfaces and any preparation or drywall repairs.',links:[['/request/?intent=painting&entry=guide','Request painting help'],['/businesses/rolled-right-painting/','Meet Rolled Right Painting'],['/guides/painting-estimate-checklist/','Compare painting estimates']]};
 if(/window|construction|handyman|hart-builders|cooke/.test(path))return {label:'REPAIRS & REMODELING',title:'Get the work clear before you book.',note:'Describe what needs repairing or building and agree on the complete scope.',links:[['/home-services/','Meet the home-service businesses'],['/project-kit/','Make a project checklist'],['/guides/window-replacement-questions/','Questions about replacement windows']]};
 if(/hvac|heating|furnace|boiler|ductless|oil-to-gas|maintenance|replacement|second-opinion|tankless|water-heater|middletown/.test(path))return {label:'HEATING, COOLING & HOT WATER',title:'Talk with Middletown HVAC.',note:'Describe your equipment, the problem or the installation you have in mind.',links:[['/request/?intent='+(/tankless|water-heater/.test(path)?'water':/replacement|ductless|oil-to-gas/.test(path)?'replacement':'comfort')+'&entry=guide','Request service or an estimate'],['/businesses/middletown-hvac/','See Middletown HVAC’s details'],['/guides/compare-hvac-estimates/','Compare HVAC estimates']]};
 return {label:'YOUR NEXT STEP',title:'Find the business for your project.',note:'Browse the services, see the business details and choose how to get in touch.',links:[['/home-services/','Find home services'],['/book/','See all business contacts'],['/project-kit/','Make a project checklist']]};
}
function refreshHeader(d,path){
 const header=d.querySelector('body>header');if(!header)return;header.classList.add('wz-site-header');
 const nav=header.querySelector('nav[aria-label="Main navigation"]');
 const vehicle=isVehicle(path)||path==='/guides/car-repair-estimate-changed/',property=isProperty(path);
 const action=/vehicle-wraps|sound-wraps/.test(path)?['/book/?q=wraps','Wrap contacts']:vehicle?['/book/?q=mechanic','Find a shop']:property?['/book/?q=realtor','Find an agent']:['/request/','Request help'];
 const links=[['/local-help/','Find a business'],['/pricing-guide/','Prices'],['/guides/','Guides'],['/explore/','Tools']];
 if(nav){nav.replaceChildren();for(const [href,label] of [...links,action]){const a=element(d,'a',href===action[0]?'btn primary':'');a.href=href;a.textContent=label;if(path===href)a.setAttribute('aria-current','page');nav.append(a);}}
 const quick=header.querySelector('.account-top-link');if(quick){quick.href=action[0];quick.textContent=action[1];}
 const menu=header.querySelector('nav[aria-label="Mobile navigation"]');
 if(menu){menu.replaceChildren();for(const [href,label] of [action,['/local-help/','All businesses'],['/home-services/','Home services'],['/auto-mechanics/','Auto care'],['/real-estate-agents/','Real estate'],['/vehicle-wraps/','Vehicle wraps'],['/pricing-guide/','Prices'],['/guides/','Guides'],['/explore/','Tools & quizzes'],['/projects/','Actual local work'],['/account/','Your saved projects'],['/for-contractors/','List your business']]){const a=element(d,'a');a.href=href;a.textContent=label;menu.append(a);}}
 const dock=d.querySelector('.contact-dock');if(dock){const actions=[...dock.querySelectorAll('a')];if(actions.length>1){actions[0].href='/local-help/';actions[0].textContent='Find a business';actions.at(-1).href=action[0];actions.at(-1).textContent=action[1];}}
 const tag=header.querySelector('.header-tagline');if(tag)tag.setAttribute('aria-hidden','true');
 const beta=d.querySelector('body>.beta');if(beta)beta.textContent='DELCO · CHESTER COUNTY · THE MAIN LINE';
}
function refreshHome(d){
 const main=d.querySelector('main');if(!main)return;
 const cover=d.querySelector('.grand-hero'),picture=cover?.querySelector('.grand-hero-image');
 if(picture){const figure=element(d,'figure','wz-hero-art');picture.before(figure);figure.append(picture,element(d,'figcaption','','Wazoozie illustration'));}
 const search=cover?.querySelector('.home-quick-search');if(search){const strip=element(d,'div','wz-search-strip');strip.append(search);cover.append(strip);}
 const oldBottom=cover?.querySelector('.grand-hero-bottom');if(oldBottom){const contact=oldBottom.querySelector('a');if(contact){contact.href='/book/';contact.textContent='See all contacts →';contact.classList.add('wz-hero-contact');cover.querySelector('.grand-hero-actions')?.append(contact);}oldBottom.remove();}
 // Keep the source photos and live project finder as the first useful stops.
 const folded=element(d,'details','wz-more-tools');folded.append(element(d,'summary','', 'More planning tools, quizzes and referral details <span aria-hidden="true">+</span>'));
 const inside=element(d,'div','wz-more-tools-content');folded.append(inside);
 const essential=new Set(['grand-hero','local-proof','project-finder','network-intro']);
 for(const el of [...main.children]){if([...essential].some(c=>el.classList.contains(c))||['find','explore'].includes(el.id))continue;inside.append(el);}
 if(inside.children.length)main.append(folded);
 // Put actual ways to contact people before optional browsing and games.
 const network=main.querySelector(':scope>.network-intro'),find=main.querySelector(':scope>#find'),explore=main.querySelector(':scope>#explore');
 if(network&&find)network.after(find);if(find&&explore)find.after(explore);
 const hero=d.querySelector('.grand-hero-inner>p');if(hero)hero.textContent='Find local businesses for your home, your car and your next move. See their details and choose who to contact.';
 const kicker=d.querySelector('.grand-kicker');if(kicker)kicker.textContent='HOME · AUTO · REAL ESTATE';
 const bottom=d.querySelector('.grand-hero-bottom>a');if(bottom){bottom.href='/book/';bottom.textContent='Prefer to call? See all contacts →';}
 const shortcuts=d.querySelector('.home-service-shortcuts');if(shortcuts)shortcuts.setAttribute('aria-label','Popular services');
 const intro=d.querySelector('.network-intro');if(intro){const h=intro.querySelector('h2');if(h)h.textContent='Know who you’re contacting.';const p=intro.querySelector('p');if(p)p.textContent='Business names, services, phone numbers and sources are available before you make contact.';}
 const proof=d.querySelector('.local-proof-heading p');if(proof)proof.textContent='Published Middletown HVAC installations. See the work and ask about your own home.';
 const feature=d.querySelector('.local-proof-contact h3');if(feature)feature.textContent='Ready to talk about your project?';
 const finder=d.querySelector('#project-finder-result-title');if(finder)finder.textContent='Choose the work you need.';
 const explain=d.querySelector('.project-finder-heading p');if(explain)explain.textContent='Pick a project to see the business, its number and what to have ready.';
}
function refreshFooter(d){
 const footer=d.querySelector('body>footer');if(!footer)return;footer.classList.add('wz-site-footer');
 const first=footer.querySelector('.footergrid>div:first-child p');if(first)first.innerHTML='I’m choosy. I use Wazoozie.<br><span>Local help for home, auto and real estate.</span>';
 const labels=footer.querySelectorAll('.footergrid strong');if(labels[0])labels[0].textContent='Find what you need';if(labels[1])labels[1].textContent='About & contact';
 for(const a of footer.querySelectorAll('a')){const labels={'/explore/':'Tools & quizzes','/projects/':'Actual local work','/account/':'Your saved projects','/our-standards/':'How businesses are listed','/hello/':'Contact Wazoozie','/for-contractors/':'List your business'};if(labels[a.getAttribute('href')])a.textContent=labels[a.getAttribute('href')];}
 const bottom=footer.querySelector('.footbottom>span:last-child');if(bottom)bottom.textContent='You choose who you contact.';
}
function replaceText(d,el,value){
 const old=[...el.querySelectorAll('a')].map(a=>({label:text(a.textContent),href:a.getAttribute('href'),target:a.getAttribute('target'),rel:a.getAttribute('rel')})).filter(a=>a.label&&value.includes(a.label));
 // Preserve business profile links when a shorter company name is used.
 for(const b of Object.values(BUSINESSES)){const label=b.name.replace(/,? (?:LLC|Inc\.?)\.?$/,'');if(value.includes(label)&&!old.some(a=>a.label===label))old.push({label,href:'/businesses/'+b.slug+'/'});}
 // Preserve applicable source links and make the corrected contact address usable.
 if(value.includes('wazooziehelp@gmail.com')&&!old.some(a=>a.label==='wazooziehelp@gmail.com'))old.push({label:'wazooziehelp@gmail.com',href:'mailto:wazooziehelp@gmail.com'});
 el.replaceChildren();let offset=0;
 while(offset<value.length){let next;for(const a of old){const at=value.indexOf(a.label,offset);if(at>=0&&(!next||at<next.at||at===next.at&&a.label.length>next.label.length))next={...a,at};}
  if(!next){el.append(d.createTextNode(value.slice(offset)));break;}
  el.append(d.createTextNode(value.slice(offset,next.at)));const a=d.createElement('a');a.textContent=next.label;a.href=next.href;if(next.target)a.target=next.target;if(next.rel)a.rel=next.rel;el.append(a);offset=next.at+next.label.length;
 }
}
function copyReview(d,path){
 let changes=0;
 // Exact, editorial replacements; do not edit sourced review quotations or controls.
 const walker=d.createTreeWalker(d.body,4);let node;
 while((node=walker.nextNode())){if(node.parentElement?.closest('script,style,textarea,code,blockquote,input,select'))continue;for(const [before,after] of Object.entries(copyPairs))if(node.nodeValue.includes(before)){node.nodeValue=node.nodeValue.replaceAll(before,after);changes++;}}
 for(const item of reviewed){if(item.paths&&!item.paths.includes(path))continue;for(const el of d.querySelectorAll(item.selector||'p,h2,h3,li,summary')){
  if(el.closest('blockquote,script,style,textarea'))continue;
  if(text(el.textContent)===item.before){if(item.html)el.innerHTML=item.html;else replaceText(d,el,item.after);changes++;}
 }}
 // Keep caller attribution without making every page read like analytics documentation.
 for(const el of d.querySelectorAll('.service-attribution')){el.innerHTML='Found the business here? Mention Wazoozie when you call. <a href="/how-it-works/">How introductions work →</a>';changes++;}
 if(path==='/guides/car-repair-estimate-changed/')for(const p of d.querySelectorAll('p'))if(p.textContent.includes('HVAC contact and estimator links lead to Middletown HVAC')){p.textContent='Business profiles link to the named shop and its public sources. Call the shop to discuss your vehicle, estimate and appointment.';changes++;}
 return changes;
}
function relatedAndSharing(d,path){
 if(path==='/'||['/404/','/account/','/my-home/','/request/','/start/','/privacy/','/for-contractors/'].includes(path))return;
 const main=d.querySelector('main');if(!main)return;const c=context(path);
 if(!['/about/','/our-standards/','/how-it-works/','/hello/','/facts/'].includes(path)){
  const panel=element(d,'section','wrap wz-next-step');panel.setAttribute('aria-label','Related help');
  const copy=element(d,'div');copy.append(element(d,'span','eyebrow',c.label),element(d,'h2','',c.title),element(d,'p','',c.note));
  const nav=element(d,'nav');nav.setAttribute('aria-label','Related pages');
  for(const [href,label] of c.links){if(href===path)continue;const a=element(d,'a');a.href=href;a.textContent=label+' →';nav.append(a);}
  panel.append(copy,nav);main.append(panel);
 }
 const share=element(d,'div','wrap wz-page-share');share.innerHTML='<span>Useful to someone you know?</span><button type="button" data-wz-copy-page>Copy page link</button><button type="button" data-wz-native-share hidden>Share page</button><span class="wz-share-status" role="status"></span><output class="wz-share-fallback" aria-label="Page link to copy" tabindex="0" hidden></output>';
 main.append(share);
}
function contents(d,path){
 const main=d.querySelector('main');if(!main||['/','/start/','/request/','/account/','/my-home/','/for-contractors/'].includes(path))return;
 const words=main.textContent.split(/\s+/).length;if(words<800)return;
 const titles=[...main.querySelectorAll('h2')].filter(h=>!h.closest('aside,form,details,.wz-next-step,.project-inline,.profile-facts')).slice(0,7);
 if(titles.length<3)return;
 const nav=element(d,'nav','wz-page-contents');nav.setAttribute('aria-label','On this page');nav.append(element(d,'span','','On this page'));
 for(const [i,h] of titles.entries()){if(!h.id){let id='page-section-'+(i+1);while(d.getElementById(id))id+='-item';h.id=id;}const a=element(d,'a');a.href='#'+h.id;a.textContent=text(h.textContent);nav.append(a);}
 const hero=main.querySelector('.page-hero,.buying-intro,.destination-intro,.project-intro,.local-profile-hero');if(hero)hero.after(nav);else main.prepend(nav);
}
function social(d,path){
 let image=d.querySelector('.page-hero img,.local-profile-hero img,.brand-cover img,.brand-cost-cover img,main figure img,.grand-hero img');
 if(!image)image=d.querySelector('main img');
 let src=image?.getAttribute('src');if(!src?.startsWith('/'))return;
 const set=(key,value)=>{let m=d.head.querySelector('meta['+(key.startsWith('og:')?'property':'name')+'="'+key+'"]');if(!m){m=d.createElement('meta');m.setAttribute(key.startsWith('og:')?'property':'name',key);d.head.append(m);}m.content=value;};
 set('og:image',origin+src);set('twitter:image',origin+src);set('og:image:alt',image.getAttribute('alt')||'Wazoozie local services');set('twitter:image:alt',image.getAttribute('alt')||'Wazoozie local services');
 // Only publish dimensions actually supplied for this image.
 for(const key of ['og:image:width','og:image:height'])d.head.querySelector('meta[property="'+key+'"]')?.remove();
 if(image.getAttribute('width')&&image.getAttribute('height')){set('og:image:width',image.getAttribute('width'));set('og:image:height',image.getAttribute('height'));}
}
const report=[];
for(const file of readdirSync(out,{recursive:true}).filter(p=>p.endsWith('.html'))){
 const path=file==='404.html'?'/404/':'/'+file.replace(/index\.html$/,'');
 const dom=new JSDOM(readFileSync(resolve(out,file),'utf8'),{url:origin+path}),d=dom.window.document;
 d.body.classList.add('wz-refresh');d.body.dataset.page=path;d.body.dataset.pageKind=path==='/'?'home':path.startsWith('/businesses/')?'business':path.startsWith('/guides/')?'guide':path.startsWith('/services/')?'service':'page';
 const oldHeading=d.querySelector('h1')?.textContent;
 if(headings[path]&&d.querySelector('h1'))d.querySelector('h1').textContent=headings[path];
 const changes=copyReview(d,path);
 if(path==='/')refreshHome(d);
 refreshHeader(d,path);refreshFooter(d);contents(d,path);relatedAndSharing(d,path);social(d,path);
 if(path==='/privacy/'){const section=element(d,'section','wrap project-inline');section.innerHTML='<h2>Sharing a page</h2><p>Page-sharing buttons use the public page address without search terms, request details or link fragments. Your notes and saved projects are not included. Your device handles any sharing app you choose.</p>';d.querySelector('main')?.append(section);}
 // A visible illustration label must describe the image, not imply a completed job.
 for(const art of d.querySelectorAll('.page-art')){const label=art.querySelector('span');if(label)label.textContent='Wazoozie illustration';}
 const styles=[...d.head.querySelectorAll('link[rel=stylesheet]')].filter(el=>el.getAttribute('href')?.startsWith('/assets/'));
 const css=styles.map(el=>readFileSync(resolve(out,el.getAttribute('href').slice(1)),'utf8')).join('\n')+'\n'+readFileSync(resolve(root,'assets/sitewide-refresh.css'),'utf8');
 const bundle='site-'+createHash('sha256').update(css).digest('hex').slice(0,12)+'.css';writeFileSync(resolve(out,'assets',bundle),css);
 if(styles.length){styles[0].href='/assets/'+bundle;styles.slice(1).forEach(el=>el.remove());}else{const link=element(d,'link');link.rel='stylesheet';link.href='/assets/'+bundle;d.head.append(link);}
 const script=element(d,'script');script.type='module';script.src='/assets/page-share.mjs';d.body.append(script);
 writeFileSync(resolve(out,file),'<!DOCTYPE html>\n'+d.documentElement.outerHTML);
 report.push({path,headingChanged:oldHeading!==d.querySelector('h1')?.textContent,copyChanges:changes,title:d.title});dom.window.close();
}
for(const name of ['sitewide-refresh.css','page-share.mjs'])copyFileSync(resolve(root,'assets',name),resolve(out,'assets',name));
if(process.argv[4])writeFileSync(process.argv[4],JSON.stringify(report,null,2));
console.log('Refreshed '+report.length+' HTML entries: navigation, typography, wording, related pages and sharing.');
