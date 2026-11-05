export const CONSENT_VERSION = 'project-brief-2026-11-05';

export const BUSINESSES = {
  middletown: {
    defaultIntent:'comfort', email: 'service@mtownhvac.com', name: 'Middletown HVAC', phone: '610-500-6416', tel: '+16105006416',
    slug: 'middletown-hvac', image: 'middletown-conventional-project',
    booking: 'https://book.housecallpro.com/book/Middletown-HVAC-LLC/fee90a1b38e64428a9ebf1cf37e04197?v2=true&utm_source=wazoozie&utm_medium=referral&utm_campaign=project-brief&utm_content=start'
  },
  hart: {defaultIntent:'additions',name:'Hart Builders, Inc.',phone:'215-350-5502',tel:'+12153505502',email:'quality@hartbuildersinc.com',slug:'hart-builders',image:'window-framing'},
  rolledright: {defaultIntent:'painting',name:'Rolled Right Painting, LLC',phone:'610-291-9552',tel:'+16102919552',email:'louislitwin618@gmail.com',slug:'rolled-right-painting',image:'valley-colonial-home'},
  ryan: {defaultIntent:'electrical',name: 'Ryan Dugan Electric LLC', phone: '445-258-9962', tel: '+14452589962', slug: 'ryan-dugan-electric', image: 'outdoor-lighting'},
  liberator: {defaultIntent:'plumbing',name: 'Liberator Service Company', phone: '267-328-5235', tel: '+12673285235', slug: 'liberator-service-company', image: 'sink'},
  cooke: {defaultIntent:'carpentry',name: 'Cooke Carpentry & Construction, LLC', phone: '484-948-3201', tel: '+14849483201', slug: 'cooke-carpentry-construction', image: 'carpentry'}
};

export const PROJECT_GROUPS = [
  {key:'systems',label:'Systems & everyday service',intents:['comfort','water','electrical','plumbing']},
  {key:'repairs',label:'Repairs & finishing',intents:['doors','windows','painting','carpentry']},
  {key:'projects',label:'Bigger home projects',intents:['decks','additions']}
];

export const INTENTS = {
  doors: {label:'Hang or repair a door',description:'Interior doors, sticking doors, hardware and trim.',provider:'cooke',service:'handyman',group:'repairs'},
  windows: {label:'Replace or repair windows',description:'Window replacement, frames and surrounding trim.',provider:'cooke',service:'handyman',group:'repairs',scopeCheck:'Confirm window installation, product selection and project coverage directly with Cooke before arranging work.'},
  painting: {label:'Painting & drywall',description:'A room to repaint. Walls, ceilings or drywall to finish.',provider:'rolledright',service:'painting',group:'repairs',scopeCheck:'Discuss the surfaces, preparation, finishes and current coverage directly with Rolled Right Painting.'},
  carpentry: {label:'Carpentry & home repairs',description:'Trim, shelving, wood repairs and the unfinished details.',provider:'cooke',service:'handyman',group:'repairs'},
  decks: {label:'Build or repair a deck',description:'Decks, porches, stairs, railings and outdoor projects.',provider:'cooke',service:'handyman',group:'projects',scopeCheck:'Discuss the deck or porch scope, design, permits and current availability directly with Cooke.'},
  additions: {label:'Remodel or build an addition',description:'More space, a new layout or a room ready for a change.',provider:'hart',service:'construction-remodeling',group:'projects',scopeCheck:'Confirm that Hart Builders accepts your remodeling or addition scope. Design, engineering, permits and trade coordination must be agreed directly.'},
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
  doors:['A new door, a replacement or a repair?','Interior or exterior, and how many doors?','Door, frame, hardware or trim—which parts need attention?'],
  windows:['Repair or replacement, and how many windows?','Any frame damage, drafts or water entry?','Have you selected a product, or do you need help planning?'],
  painting:['Interior or exterior, and which rooms or surfaces?','Any drywall damage, patching or preparation needed?','Approximate room size, access and preferred timing?'],
  decks:['A new deck or repairs to an existing one?','Approximate size, materials and height above ground?','Any plans, permit information or railing/stair requirements?'],
  additions:['Which space would you like to add or remodel?','Approximate size and what you want the space to do?','Do you have drawings, permits or a preferred timeline?'],
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
