import {neighborCode} from './neighbor-config.mjs';
import {requestPageContext} from './lead-context.mjs';
document.addEventListener('click',event=>{
 const anchor=event.target.closest('a[href]');if(!anchor||event.defaultPrevented||event.button>0)return;
 let url;try{url=new URL(anchor.href,location.origin);}catch{return;}
 if(url.origin!==location.origin||!['/start/','/request/'].includes(url.pathname))return;
 const code=neighborCode(new URLSearchParams(location.search).get('neighbor'));if(code&&!url.searchParams.has('neighbor'))url.searchParams.set('neighbor',code);
 url.searchParams.set('entry',requestPageContext(location.pathname));anchor.href=url.href;
});
