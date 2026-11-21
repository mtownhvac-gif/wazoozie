import {requestPageContext} from './lead-context.mjs';
document.addEventListener('click',event=>{
 const anchor=event.target.closest('a[href]');if(!anchor||event.defaultPrevented||event.button>0)return;
 let url;try{url=new URL(anchor.href,location.origin);}catch{return;}
 const requestPaths=['/start/','/request/'];
 if(url.origin!==location.origin||!requestPaths.includes(url.pathname)||requestPaths.includes(location.pathname))return;
 url.searchParams.set('entry',requestPageContext(location.pathname));anchor.href=url.href;
});
