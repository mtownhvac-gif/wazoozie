// Coverage is evidence, not a radius inferred from an address.
export const PUBLISHED_COVERAGE={
 'middletown-hvac':{towns:['Glen Mills','Media','West Chester','Newtown Square','Havertown','Wayne','Villanova','Garnet Valley'],source:'https://www.mtownhvac.com/contact/',checkedAt:'2026-11-09',basis:'Published service-area information'}
};
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+pa(?:\s+\d{5})?$/,'').trim();
export function coverageFor(slug,town){const entry=PUBLISHED_COVERAGE[slug];return {match:Boolean(normalize(town)&&entry?.towns.some(t=>normalize(t)===normalize(town))),entry};}
