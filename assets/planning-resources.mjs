// Curated Wazoozie routes and planning context. Never accept model-generated links.
const guides={
 comfort:[['/services/heating-cooling/','Heating & cooling: what to ask','Describe the symptoms and equipment. Confirm findings, repair scope and availability with the business.']],
 water:[['/services/water-heaters/','Water Heater planning','Identify tank or tankless and the fuel if known. Confirm replacement scope and installation requirements on site.']],
 boiler:[['/services/boilers/','Boilers & radiators','Identify fuel, heat distribution and the affected areas. Testing and a site assessment establish the actual fault and scope.']],
 replacement:[['/services/replacement-estimates/','Plan a system replacement','An online starting point does not establish equipment sizing, fit, final scope or an installation date.']],
 maintenance:[['/services/maintenance/','Plan a maintenance visit','Distinguish scheduled maintenance from a current fault that needs a diagnostic visit. Confirm the equipment and included work.']],
 secondopinion:[['/services/second-opinion/','Questions for a second opinion','Gather the written recommendation and ask which recorded findings support it. Do not restart equipment shut down for safety.']],
 electrical:[['/services/electrical/','Prepare an electrical project','Describe the affected fixtures or circuits and visible symptoms. Do not open panels or touch exposed wiring.']],
 plumbing:[['/services/plumbing/','Plumbing & drain questions','Identify the fixture, visible issue and timing. Ask about access, scope and any diagnostic charge.']],
 painting:[['/guides/painting-estimate-checklist/','Compare painting estimates','Confirm surfaces, protection, preparation, repairs and finish coats so proposals cover the same work.']],
 carpentry:[['/services/handyman/','Plan a carpentry repair','Describe dimensions, materials, access and the result you want. Confirm that the business handles the exact scope.']],
 doors:[['/services/construction-remodeling/','Doors and surrounding work','Clarify whether the work includes the door, frame, hardware, trim and finishing. Confirm project fit with the business.']],
 windows:[['/services/construction-remodeling/','Windows and surrounding repairs','Clarify the number of windows, product choice, frame condition and surrounding restoration.']],
 decks:[['/services/construction-remodeling/','Deck and porch planning','Discuss size, materials, stairs, rails, access and responsibilities for design and permits.']],
 additions:[['/services/construction-remodeling/','Plan a remodeling project','Explain the intended space and identify responsibilities for design, permits and trade coordination.']]
};
export function planningResources(intent,mode='plan'){
 if(!Object.hasOwn(guides,intent))return [];
 const items=(guides[intent]||[]).map(([href,title,context])=>({href,title,context}));
 if(mode==='estimate')items.push({href:'/compare/',title:'Compare the written details',context:'Compare written scope, exclusions, payment terms, warranty and change approvals rather than judging by the total alone.'});
 else items.push({href:'/project-kit/?intent='+encodeURIComponent(intent),title:'Build a project sheet',context:'Write down the job and your questions before you call.'});
 return items.slice(0,2);
}
export function describeProject(existing,questions,answers,timing){
 const lines=questions.slice(0,3).flatMap((q,i)=>typeof answers[i]==='string'&&answers[i].trim()?[q+' '+answers[i].trim().slice(0,160)]:[]);
 if(timing)lines.push('Preferred timing: '+timing+'. Availability still needs confirmation.');
 if(!lines.length)return {error:'Add a detail or choose your preferred timing first.'};
 const text=[existing.trim(),...lines].filter(Boolean).join('\n');
 if(text.length>1800)return {error:'These details would exceed the question limit. Shorten your question or a detail first.'};
 return {text};
}
