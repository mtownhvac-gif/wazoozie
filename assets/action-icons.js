// Draw navigation arrows with SVG so they do not depend on a font glyph.
const paths={'→':'M4 12h16m-6-6 6 6-6 6','←':'M20 12H4m6-6-6 6 6 6','↗':'M5 19 19 5M7 5h12v12','↓':'M12 4v16m-6-6 6 6 6-6','↑':'M12 20V4m-6 6 6-6 6 6'};
export function replaceActionArrows(root=document){
 const doc=root.ownerDocument||root;
 const links=[];
 if(root.nodeType===1&&root.matches('a,button'))links.push(root);
 if(root.nodeType===3){const link=root.parentElement?.closest('a,button');if(link)links.push(link);}
 if(root.querySelectorAll)links.push(...root.querySelectorAll('a,button'));
 for(const link of new Set(links)){
  const walker=doc.createTreeWalker(link,4),nodes=[];let node;
  while((node=walker.nextNode()))if(/[→←↗↓↑]/u.test(node.data)&&!node.parentElement.closest('svg,textarea,code,pre'))nodes.push(node);
  for(const node of nodes){
   const fragment=doc.createDocumentFragment();
   for(const part of node.data.split(/([→←↗↓↑])/u)){
    if(!paths[part]){fragment.append(doc.createTextNode(part));continue;}
    const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','14');svg.setAttribute('height','14');svg.setAttribute('class','action-arrow');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    const path=doc.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',paths[part]);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);fragment.append(svg);
   }
   node.replaceWith(fragment);
  }
 }
}
export function initActionIcons(doc=document){
 replaceActionArrows(doc);
 const observer=new doc.defaultView.MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)replaceActionArrows(node);});
 observer.observe(doc.body,{childList:true,subtree:true});
 doc.defaultView.addEventListener('pagehide',()=>observer.disconnect(),{once:true});return observer;
}
if(typeof document!=='undefined')initActionIcons(document);
