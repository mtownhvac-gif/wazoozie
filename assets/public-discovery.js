(() => {
 let controller;
 const api = document.modelContext || navigator.modelContext;
 if (!api || typeof api.registerTool !== 'function') return;
 const categories = ['all','home','auto','realestate'];
 const normalize = value => value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 async function register() {
  if (controller) return;
  controller = new AbortController();
  const current = controller;
  try {
   const response = await fetch('/assets/public-discovery.json', {credentials:'omit',referrerPolicy:'no-referrer',signal:current.signal});
   if (!response.ok) throw Error('Public catalog unavailable');
   const catalog = await response.json();
   await api.registerTool({name:'search_local_businesses',description:'Find public local listings; distinguish published town coverage from coverage that needs confirmation.',inputSchema:{type:'object',properties:{query:{type:'string',maxLength:100,description:'The service, business or professional to find.'},category:{type:'string',enum:categories,default:'all',description:'The type of local help to explore.'},town:{type:'string',maxLength:80,description:'Town only, not a street address.'},publishedCoverageOnly:{type:'boolean',default:false}},additionalProperties:false},execute: async(input={})=>{
    if (!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).some(key=>!['query','category','town','publishedCoverageOnly'].includes(key))) throw Error('Use the listed search fields.');
    const query=input.query??'',category=input.category??'all';
    if(typeof query!=='string'||query.length>100||!categories.includes(category))throw Error('Use a short search query and a listed category.');
    const town=input.town??'',only=input.publishedCoverageOnly??false;if(typeof town!=='string'||town.length>80||typeof only!=='boolean')throw Error('Use a town up to 80 characters and a boolean coverage filter.');
    const words=normalize(query).split(' ').filter(Boolean);
    const aliases={home:'home house contractor',auto:'auto automotive car vehicle',realestate:'real estate agent property buying selling home'};
    const area=value=>normalize(value).replace(/\s+pa(?:\s+\d{5})?$/,'');
    const matches=catalog.businesses.filter(item=>{const terms=normalize(item.name+' '+item.services+' '+aliases[item.category]).split(' ');return (category==='all'||item.category===category)&&words.every(word=>terms.some(term=>term===word||(word.length>=4&&term.startsWith(word))));}).map(item=>({...item,coverageStatus:town?(item.publishedCoverage?.towns.some(t=>area(t)===area(town))?'published_match':'unconfirmed'):'town_not_provided'})).filter(item=>!only||!town||item.coverageStatus==='published_match');
    return {matches,note:'A published match is not a booked appointment or availability check. Unconfirmed coverage does not mean the business refuses service. Read profile sources and confirm directly.'};
   },annotations:{readOnlyHint:true}},{signal:current.signal});
   await api.registerTool({name:'get_project_planning_resources',description:'Find public Wazoozie checklists, project-preparation tools and home-planning resources.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:async(input={})=>{
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw Error('This tool takes no input.');
    return {resources:catalog.planning};
   },annotations:{readOnlyHint:true}},{signal:current.signal});
  } catch { current.abort(); if(controller===current)controller=undefined; }
 }
 window.addEventListener('pagehide',()=>{controller?.abort();controller=undefined;});
 window.addEventListener('pageshow',event=>{if(event.persisted)void register();});
 void register();
})();
