export const CONSENT_VERSION = 'project-brief-2026-11-06-email';

export const BUSINESSES = {
  middletown: {
    defaultIntent:'comfort', email: 'service@mtownhvac.com', name: 'Middletown HVAC', phone: '610-500-6416', tel: '+16105006416',
    slug: 'middletown-hvac', image: 'middletown-conventional-project',
    booking: 'https://book.housecallpro.com/book/Middletown-HVAC-LLC/fee90a1b38e64428a9ebf1cf37e04197?v2=true&utm_source=wazoozie&utm_medium=referral&utm_campaign=project-brief&utm_content=start'
  },
  rolledright: {defaultIntent:'painting',name:'Rolled Right Painting, LLC',phone:'610-291-9552',tel:'+16102919552',email:'louislitwin618@gmail.com',slug:'rolled-right-painting',image:'valley-colonial-home'},
  ryan: {defaultIntent:'electrical',name: 'Ryan Dugan Electric LLC', phone: '445-258-9962', tel: '+14452589962', slug: 'ryan-dugan-electric', image: 'outdoor-lighting'},
  liberator: {defaultIntent:'plumbing',name: 'Liberator Service Company', phone: '267-328-5235', tel: '+12673285235', slug: 'liberator-service-company', image: 'sink'},
  cooke: {defaultIntent:'carpentry',name: 'Cooke Carpentry & Construction, LLC', phone: '484-948-3201', tel: '+14849483201', slug: 'cooke-carpentry-construction', image: 'carpentry'}
};

export const PROJECT_GROUPS = [
  {key:'systems',label:'Systems & everyday service',intents:['comfort','water','electrical','plumbing']},
  {key:'repairs',label:'Repairs & finishing',intents:['painting','carpentry']},
];

export const INTENTS = {
  painting: {label:'Painting & drywall',description:'A room to repaint. Walls, ceilings or drywall to finish.',provider:'rolledright',service:'painting',group:'repairs',scopeCheck:'Discuss the surfaces, preparation, finishes and current coverage directly with Rolled Right Painting.'},
  carpentry: {label:'Carpentry & home repairs',description:'Smaller trim, shelving, wood repairs and finishing details.',provider:'cooke',service:'handyman',group:'repairs'},
  comfort: {label:'Heating & cooling',description:'Repairs, Boilers, maintenance and new systems.',provider:'middletown',service:'heating-cooling',group:'systems'},
  water: {label:'Water Heaters & hot water',description:'Tank, tankless, repairs and replacements.',provider:'middletown',service:'water-heaters',group:'systems'},
  electrical: {label:'Electrical work',description:'Outlets, lighting, circuits and electrical projects.',provider:'ryan',service:'electrical',group:'systems'},
  plumbing: {label:'Plumbing & drains',description:'Leaks, fixtures, drains and general plumbing.',provider:'liberator',service:'plumbing',group:'systems'},
  boiler: {label:'Boilers & radiators',description:'Gas, oil, baseboards and radiator systems.',provider:'middletown',service:'boilers',parent:'comfort'},
  replacement: {label:'A new heating or cooling system',description:'Plan a replacement, conversion or ductless project.',provider:'middletown',service:'replacement-estimates',parent:'comfort'},
  maintenance: {label:'Heating & cooling maintenance',description:'Seasonal care and Get Comfortable Plans.',provider:'middletown',service:'maintenance',parent:'comfort'},
  secondopinion: {label:'An HVAC second opinion',description:'Understand a repair or replacement recommendation.',provider:'middletown',service:'second-opinion',parent:'comfort'}
};

export const PROJECT_QUESTIONS = {
  painting:['Interior or exterior, and which rooms or surfaces?','Any drywall damage, patching or preparation needed?','Approximate room size, access and preferred timing?'],
  comfort: ['What type of heating or cooling system do you have?', 'What changed, and which rooms are affected?', 'Any thermostat message or previous service findings?'],
  water: ['Tank or tankless, and which fuel if you know?', 'No hot water, inconsistent temperature or a visible leak?', 'Any model information or displayed error?'],
  boiler: ['Gas or oil, if you know?', 'Radiators, baseboards or another type of heat?', 'All rooms affected, or just one part of the home?'],
  replacement: ['What equipment and fuel do you use now?', 'A like-for-like replacement, conversion or ductless project?', 'What comfort problem do you want to improve?'],
  maintenance: ['Which equipment needs maintenance, and how many systems?', 'When was the last maintenance visit?', 'Any current problem that needs a diagnostic visit?'],
  secondopinion: ['What repair or replacement was recommended?', 'What symptoms led to the first visit?', 'Can you share the written recommendation directly with the business?'],
  electrical: ['What circuit, fixture or area needs attention?', 'A repair or a planned improvement?', 'Any previous electrician’s findings?'],
  plumbing: ['Which fixture, drain or pipe is involved?', 'A leak, blockage or planned replacement?', 'When did the problem start?'],
  carpentry: ['What would you like repaired or built?', 'Approximate size and materials, if known?', 'What timing or access details should the business know?']
};
