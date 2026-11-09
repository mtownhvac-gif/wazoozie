import {keepProjectStep} from './project-concierge.js';
export function receiptTracking(doc,container,{intent,delivery},suppliedStorage){
 const make=(tag,text)=>{const node=doc.createElement(tag);node.textContent=text;return node;};
 let track=container.querySelector('#receiptTrack');if(!track){track=doc.createElement('section');track.className='receipt-track';track.id='receiptTrack';container.append(track);}
 track.replaceChildren(make('h3','Keep your next step in view.'),make('p','Save this project category and your next step to My home list on this device. Your name, contact details and request text are not copied. Download your brief to keep its reference.'));
 const button=make('button','Keep on My home list');button.type='button';button.className='btn outline';const status=make('p','');status.setAttribute('role','status');
 button.addEventListener('click',()=>{try{const storage=suppliedStorage===undefined?doc.defaultView.localStorage:suppliedStorage;const state=keepProjectStep(storage,intent,['automation_accepted','pending'].includes(delivery)?'waiting':'calling');status.textContent=state.existing?'Already on your home list. Your existing progress was kept.':'Saved on this device. Update your progress after you hear from the business.';button.disabled=true;}catch{status.textContent='This browser could not save your list. Download your brief to keep a copy; your submitted request is unchanged.';}});
 const link=make('a','Open My home list →');link.href='/my-home/';track.append(button,link,status);
}
