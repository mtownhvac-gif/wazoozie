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
   await api.registerTool({name:'search_local_businesses',description:'Find public Wazoozie business and professional listings for a local service inquiry.',inputSchema:{type:'object',properties:{query:{type:'string',maxLength:100,description:'The service, business or professional to find.'},category:{type:'string',enum:categories,default:'all',description:'The type of local help to explore.'}},additionalProperties:false},execute: async(input={})=>{
    if (!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).some(key=>!['query','category'].includes(key))) throw Error('Use a query and a listed category.');
    const query=input.query??'',category=input.category??'all';
    if(typeof query!=='string'||query.length>100||!categories.includes(category))throw Error('Use a short search query and a listed category.');
    const words=normalize(query).split(' ').filter(Boolean);
    const aliases={home:'home house contractor repairs heating cooling hvac plumbing electrical painting carpentry',auto:'auto automotive car mechanic repair tires',realestate:'real estate agent property buying selling home'};
    const matches=catalog.businesses.filter(item=>(category==='all'||item.category===category)&&words.every(word=>normalize(item.name+' '+item.services+' '+aliases[item.category]).includes(word)));
    return {matches,note:'Read each profile for its recommendation basis and public sources. Confirm coverage, availability and terms directly.'};
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
