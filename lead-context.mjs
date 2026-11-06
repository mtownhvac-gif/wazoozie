// Last request-link page category only. Never store URLs, searches or form text.
export const ENTRY_CONTEXTS=['direct','home','pricing','quiz','field-guide','situation-guide','guide','service','profile','other'];
export function entryContext(value){return typeof value==='string'&&ENTRY_CONTEXTS.includes(value)?value:'direct';}
export function requestPageContext(path){
 if(path==='/')return 'home';
 if(path==='/pricing-guide/')return 'pricing';
 if(path==='/good-call-club/')return 'quiz';
 if(path==='/home-tips/')return 'field-guide';
 if(['/guides/surprise-repair-quote/','/guides/one-room-too-hot-too-cold/','/guides/car-repair-estimate-changed/'].includes(path))return 'situation-guide';
 if(path.startsWith('/guides/'))return 'guide';
 if(path.startsWith('/services/'))return 'service';
 if(path.startsWith('/businesses/'))return 'profile';
 return 'other';
}
