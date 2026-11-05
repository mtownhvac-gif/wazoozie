export const CONSENT_VERSION = 'project-brief-2026-11-05';

export const BUSINESSES = {
  middletown: {
    name: 'Middletown HVAC', phone: '610-500-6416', tel: '+16105006416',
    slug: 'middletown-hvac', image: 'middletown-outdoor-project',
    booking: 'https://book.housecallpro.com/book/Middletown-HVAC-LLC/fee90a1b38e64428a9ebf1cf37e04197?v2=true&utm_source=wazoozie&utm_medium=referral&utm_campaign=project-brief&utm_content=start'
  },
  ryan: {name: 'Ryan Dugan Electric LLC', phone: '445-258-9962', tel: '+14452589962', slug: 'ryan-dugan-electric', image: 'outdoor-lighting'},
  liberator: {name: 'Liberator Service Company', phone: '267-328-5235', tel: '+12673285235', slug: 'liberator-service-company', image: 'sink'},
  cooke: {name: 'Cooke Carpentry & Construction, LLC', phone: '484-948-3201', tel: '+14849483201', slug: 'cooke-carpentry-construction', image: 'carpentry'}
};

export const INTENTS = {
  comfort: {label: 'Heating & cooling repair', description: 'Something stopped working. Or never feels quite right.', provider: 'middletown', service: 'heating-cooling'},
  water: {label: 'Hot water', description: 'Tank, tankless, or a change you’re considering.', provider: 'middletown', service: 'water-heaters'},
  boiler: {label: 'Boilers & radiators', description: 'Gas, oil, baseboards, and radiator systems.', provider: 'middletown', service: 'boilers'},
  replacement: {label: 'A new system', description: 'Plan a replacement, conversion, or ductless project.', provider: 'middletown', service: 'replacement-estimates'},
  maintenance: {label: 'Maintenance', description: 'Seasonal care and Get Comfortable Plans.', provider: 'middletown', service: 'maintenance'},
  secondopinion: {label: 'A second opinion', description: 'Understand an existing repair or replacement recommendation.', provider: 'middletown', service: 'second-opinion'},
  electrical: {label: 'Electrical work', description: 'Lighting, outlets, repairs, and electrical projects.', provider: 'ryan', service: 'electrical'},
  plumbing: {label: 'Plumbing & drains', description: 'Leaks, fixtures, slow drains, and sewer inquiries.', provider: 'liberator', service: 'plumbing'},
  carpentry: {label: 'Carpentry & home repairs', description: 'The unfinished detail. The project taking shape.', provider: 'cooke', service: 'handyman'}
};
