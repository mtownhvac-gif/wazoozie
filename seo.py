"""Page-specific search and social metadata, aligned with visible services."""
import html,json,re
PAGES={
'/':('Local Home Services in Delco and the Main Line','Get to know Wazoozie and vetted local businesses for heating, cooling, plumbing, electrical work, carpentry and home repairs. Connect directly.'),
'/about/':('About Wazoozie | Local Home Services','Why Wazoozie helps homeowners avoid poor work and find vetted local businesses for heating, cooling, plumbing, electrical work and home repairs.'),
'/contact/':('Contact Middletown HVAC | Call or Book Online','Call Middletown HVAC at 610-500-6416 or book online for heating, cooling, Boilers and hot water. Confirm your address and appointment with the office.'),
'/businesses/middletown-hvac/':('Middletown HVAC | Heating, Cooling & Hot Water','Meet Middletown HVAC, a family-owned business in Glen Mills. Explore heating, cooling, Boiler and Water Heater services, published reviews and direct booking.'),
'/businesses/ryan-dugan-electric/':('Ryan Dugan Electric | Electrical Repairs & Lighting','Explore Ryan Dugan Electric for electrical repairs, lighting, outlets and panel projects. Read sourced reviews and contact this Wazoozie-vetted business.'),
'/businesses/liberator-service-company/':('Liberator Service Company | Plumbing & Drains','Explore Liberator Service Company for plumbing, fixtures and drain inquiries. Read published review excerpts and contact this Wazoozie-vetted business.'),
'/businesses/cooke-carpentry-construction/':('Cooke Carpentry & Construction | Home Repairs','Contact Cooke Carpentry & Construction for carpentry, remodeling and home-repair inquiries. Read sourced reviews and discuss your project directly.'),
'/services/':('HVAC, Plumbing, Electrical & Home Repair Services','Find the right help for heating, cooling, hot water, plumbing, electrical work and carpentry around Delco, Chester County and the Main Line.'),
'/services/heating-cooling/':('Heating & AC Repair | Middletown HVAC','Connect with Middletown HVAC for furnace, air conditioning, heat pump and ductless service. Call or book online and confirm coverage for your address.'),
'/services/boilers/':('Gas & Oil Boiler Service | Middletown HVAC','Ask Middletown HVAC about gas and oil Boiler repairs, maintenance and replacement planning. Describe your system and confirm the right service visit.'),
'/services/water-heaters/':('Water Heater & Tankless Service | Middletown HVAC','Get help with tank and tankless Water Heaters from Middletown HVAC. Discuss hot-water problems, replacement options and installation requirements.'),
'/services/maintenance/':('HVAC Maintenance & Comfort Plans | Middletown','Explore heating and cooling maintenance with Middletown HVAC. Ask about seasonal visits and Get Comfortable Plans for your equipment.'),
'/services/replacement-estimates/':('HVAC Replacement Estimates | Middletown HVAC','Plan your heating or cooling replacement with Middletown HVAC. Discuss sizing, installation scope and written pricing before choosing a system.'),
'/services/second-opinion/':('HVAC Second Opinions | Middletown HVAC','Unsure about a major heating, cooling or hot-water repair? Ask Middletown HVAC for a second opinion and a clear explanation of your options.'),
'/services/plumbing/':('Plumbing & Drain Help | Liberator Service Company','Connect with Liberator Service Company about leaks, fixtures, drains and sewer concerns. Confirm your project, address coverage and availability directly.'),
'/services/electrical/':('Electrical Repair & Lighting | Ryan Dugan Electric','Contact Ryan Dugan Electric about electrical repairs, lighting, outlets and panel work. Discuss your home project and confirm scheduling directly.'),
'/services/handyman/':('Home Repairs & Carpentry | Cooke Construction','Discuss home repairs, carpentry and renovation projects with Cooke Carpentry & Construction. Confirm the job scope, service area and availability.'),
'/delaware-valley/':('Delco, Chester County & Main Line Home Services','Explore home-service connections around Delco, Chester County and the Main Line. Each business confirms its service area and availability for your address.'),
'/guides/':('Homeowner Guides | Repairs, HVAC & Hot Water','Practical guides for comparing HVAC estimates, planning tankless hot water and preparing for a home-service visit. Know what to ask before work begins.'),
'/guides/compare-hvac-estimates/':('How to Compare HVAC Estimates','Compare HVAC proposals by equipment, sizing, installation scope, warranty terms and total price. Prepare better questions before choosing a replacement.'),
'/guides/plan-a-tankless-conversion/':('Planning a Tankless Water Heater Conversion','Consider hot-water demand, fuel supply, venting and installation scope before switching to tankless. Prepare for a conversation with Middletown HVAC.'),
'/guides/prepare-for-service/':('How to Prepare for an HVAC Service Visit','Prepare equipment details, symptoms, access and questions before a service visit. Help your contractor understand the problem and explain the next steps.'),
'/facts/':('Wazoozie Business Directory | Contact & Service Facts','Find business names, phone numbers, websites and service routing for Middletown HVAC, Ryan Dugan Electric, Liberator and Cooke Carpentry & Construction.'),
'/our-standards/':('Our Standards | Vetted Businesses & Sourced Reviews','Learn how Wazoozie presents its vetted local businesses, sourced review excerpts, listing standards and direct homeowner-to-business connections.'),
'/how-it-works/':('How Wazoozie Works | Find and Contact a Local Pro','Choose a home service, meet the business and contact it directly. Learn how Wazoozie handles calling, online booking and email drafts.'),
'/privacy/':('Privacy & Your Information','Read how Wazoozie handles information when you browse, follow booking links or prepare an email request. You choose which business receives your inquiry.'),
'/404/':('Page Not Found','Return to Wazoozie to explore local HVAC, plumbing, electrical and home-repair services or contact Middletown HVAC.')}
def optimize(out,public):
 for f in out.rglob('*.html'):
  path='/' if f==out/'index.html' else '/404/' if f==out/'404.html' else '/'+str(f.parent.relative_to(out))+'/'
  title,desc=PAGES[path];title+=' | Wazoozie';s=f.read_text();e=html.escape
  s=re.sub(r'<title>.*?</title>',lambda m:'<title>'+e(title)+'</title>',s,count=1)
  for key,value,attr in [('description',desc,'name'),('og:title',title,'property'),('og:description',desc,'property')]:
   s=re.sub(r'<meta '+attr+'="'+re.escape(key)+r'"[^>]*>',lambda m:'<meta '+attr+'="'+key+'" content="'+e(value,quote=True)+'">',s,count=1)
  s=s.replace('</head>','<meta name="twitter:title" content="'+e(title,quote=True)+'"><meta name="twitter:description" content="'+e(desc,quote=True)+'"></head>')
  def schema(m):
   data=json.loads(m.group(1))
   for item in data.get('@graph',[data]):
    if item.get('@type') in ('WebPage','ProfilePage'):item.update(name=title,description=desc)
    if item.get('@type')=='BreadcrumbList':item['itemListElement'][-1]['name']=title.removesuffix(' | Wazoozie')
   return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+'</script>'
  s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema,s,flags=re.S)
  f.write_text(s)
