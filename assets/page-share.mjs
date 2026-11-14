// Page links contain no request text, search terms, location, account or saved notes.
export function publicPageURL(location) {
  const url=new URL(location.href);
  url.search='';url.hash='';
  return url.href;
}
export function mountPageSharing(win) {
  const d=win.document;
  for(const bar of d.querySelectorAll('.wz-page-share')){
    const copy=bar.querySelector('[data-wz-copy-page]'),native=bar.querySelector('[data-wz-native-share]'),status=bar.querySelector('[role="status"]'),fallback=bar.querySelector('output');
    const url=publicPageURL(win.location);
    copy.addEventListener('click',async()=>{
      try{if(!win.navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await win.navigator.clipboard.writeText(url);status.textContent='Link copied.';fallback.hidden=true;}
      catch{fallback.textContent=url;fallback.hidden=false;fallback.focus();status.textContent='Select and copy this link.';}
    });
    if(typeof win.navigator.share==='function'){
      native.hidden=false;
      native.addEventListener('click',async()=>{try{await win.navigator.share({title:d.title,url});status.textContent='';}catch(error){if(error.name!=='AbortError')status.textContent='Use Copy page link to share this page.';}});
    }
  }
}
if(typeof window!=='undefined')mountPageSharing(window);
