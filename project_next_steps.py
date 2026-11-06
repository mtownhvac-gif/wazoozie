"""Keep cost, preparation and contact choices relevant to the selected project."""
import html

HOME={
 'heating-cooling':('heating & cooling','hvac','/guides/prepare-for-service/','heating'),
 'ductless-mini-splits':('ductless comfort','hvac','/guides/one-room-too-hot-too-cold/','mini split'),
 'water-heaters':('hot water','water-heaters','/guides/plan-a-tankless-conversion/','hot water'),
 'boilers':('boilers','water-heaters','/guides/prepare-for-service/','boiler'),
 'maintenance':('HVAC maintenance','hvac','/home-care-reminder/','heating'),
 'replacement-estimates':('system replacement','hvac','/guides/compare-hvac-estimates/','heating'),
 'oil-to-gas-conversion':('heating conversion','hvac','/guides/compare-hvac-estimates/','heating'),
 'second-opinion':('an HVAC second opinion','hvac','/guides/surprise-repair-quote/','heating'),
 'plumbing':('plumbing','directory-prices','/project-kit/?intent=plumbing','plumbing'),
 'electrical':('electrical work','directory-prices','/guides/electrical-project-estimate/','electrical'),
 'painting':('painting','directory-prices','/guides/painting-estimate-checklist/','painting'),
 'handyman':('carpentry & home repairs','directory-prices','/project-kit/?intent=carpentry','carpentry'),
 'construction-remodeling':('windows & remodeling','directory-prices','/guides/window-replacement-questions/','windows')
}


def add(out):
    e=lambda s:html.escape(s,quote=True)
    records=[('services/'+slug,label,group,guide,'/book/?q='+query.replace(' ','+'),'Explore relevant cost ranges') for slug,(label,group,guide,query) in HOME.items()]
    records += [('auto-mechanics','auto care','auto-repair','/guides/car-repair-estimate-changed/','/book/?category=auto','Explore auto-care cost ranges'),('vehicle-wraps','vehicle wraps','vehicle-wraps','/before-you-say-yes/','/book/?q=wraps','Explore wrap cost ranges'),('real-estate-agents','your next move','real-estate','/real-estate-agents/#real-estate-questions','/book/?category=realestate','Understand service fees')]
    real=out/'real-estate-agents/index.html';real.write_text(real.read_text().replace('<section class="local-question-band">','<section id="real-estate-questions" class="local-question-band">',1))
    for route,label,group,guide,contact,cost_label in records:
        target=out/route/'index.html'
        body='<section class="project-next-steps wrap" aria-label="Next steps for '+e(label)+'"><div class="eyebrow">FOR THIS PROJECT</div><h2>A clearer next step for '+e(label)+'.</h2><div><a href="/pricing-guide/#'+group+'"><span>01 / THE BUDGET</span><h3>'+e(cost_label)+'</h3><p>See the scope and source behind the numbers.</p></a><a href="'+e(guide)+'"><span>02 / THE CONVERSATION</span><h3>Get your questions ready</h3><p>Bring the details that matter for this kind of work.</p></a><a href="'+e(contact)+'"><span>03 / THE CONNECTION</span><h3>Find the relevant contact</h3><p>Choose how you want to get in touch.</p></a></div></section>'
        target.write_text(target.read_text().replace('</main>',body+'</main>',1))
    seasonal=out/'seasonal-home-checklist/index.html'
    section='''<section class="seasonal-scope" aria-labelledby="seasonal-scope-title"><div class="eyebrow">THE WHOLE HOUSE, THROUGH THE SEASONS</div><h2 id="seasonal-scope-title">More than a furnace tune-up.</h2><p>Gutter clearing, downspout cleanup, weatherstripping, exterior touch-ups and small repairs can all belong on your seasonal list. Write down the job, the access needed and what you want included in the quote.</p><div><article><h3>Gutters &amp; exterior upkeep</h3><p>Ask about clearing and disposal, downspouts, access and photos of the completed work. Have the business confirm its scope and equipment for your property.</p><strong class="seasonal-coming">Building this part of the shortlist</strong><p>We’re looking for a good gutter-cleaning and seasonal-upkeep connection. There isn’t a gutter-cleaning provider to book here yet.</p><a href="/for-contractors/#business-application">Know a great local business? Introduce them →</a></article><article><h3>Small jobs, one useful list</h3><p>Group the door adjustments, trim touch-ups and other little repairs you’d like to discuss. Confirm which jobs the business accepts before arranging a visit.</p><a href="/services/handyman/">Explore the current carpentry &amp; home-repair listing →</a></article><article><h3>Heating &amp; cooling care</h3><p>Keep equipment care on its own schedule, following the manufacturer’s instructions and your service professional’s advice.</p><a href="/services/maintenance/">Explore HVAC maintenance →</a><p><a href="/home-care-reminder/">Make your own calendar reminder →</a></p></article></div></section>'''
    seasonal.write_text(seasonal.read_text().replace('<aside class="growth-next">',section+'<aside class="growth-next">',1))
    services=out/'services/index.html';s=services.read_text()
    from brand_finish import visual_card
    card=visual_card('/seasonal-home-checklist/','Seasonal home care','Gutters, exterior upkeep and the small jobs between seasons.','clay-gutter-care','10')
    s=s.replace('</section><p class="brand-image-note">',card+'</section><p class="brand-image-note">',1);services.write_text(s)
