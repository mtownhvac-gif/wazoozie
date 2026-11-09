"""Published planning ranges with separately attributed local owner estimates."""
import html

HG='https://homeguide.com/costs/'
# National ranges are source-reported; local owner starting points are labeled separately.
RANGES=[
 ('hvac','Furnace + central AC replacement','$5,000–$11,000','Installed system replacement; adding new ductwork is a different scope.','hvac-cost'),
 ('hvac','Single-zone ductless installation','$2,500–$6,000','One outdoor unit and one indoor unit, installed. Heating performance, equipment and site work need a specific assessment.','ductless-mini-split-ac-cost'),
 ('hvac','Three-zone ductless installation','$6,500–$11,000','Source example for three indoor zones, installed. It is not the price for every multi-zone layout.','ductless-mini-split-ac-cost'),
 ('hvac','AC tune-up','$70–$200','An air-conditioning maintenance visit; repairs, parts and refrigerant are separate.','ac-maintenance-tune-up-service-cost'),
 ('hvac','AC diagnostic visit','$75–$200','An assessment of an AC problem, before repairs. Ask what the visit includes.','ac-maintenance-tune-up-service-cost'),
 ('water-heaters','Standard tank water heater replacement','$600–$3,100','Source range for a standard 40–50 gallon tank, installed, before incentives. Fuel and connection changes affect scope.','water-heater-installation-cost'),
 ('water-heaters','Tankless water heater installation','$1,400–$5,600','Installed planning range, before incentives. Venting, gas, electrical or plumbing changes can add work.','water-heater-installation-cost'),
 ('water-heaters','Boiler replacement','$2,200–$10,000','Installed boiler replacement reference. Fuel, equipment and distribution work need a written proposal.','hvac-cost'),
 ('directory-prices','Small plumbing repair','$125–$350','Source examples include minor toilet, sink or faucet repairs. Ask about call-out minimums and parts.','plumber-cost'),
 ('directory-prices','Outlet, switch or fixture replacement','$150–$400','TotalPower’s published Havertown example for this replacement scope. Confirm the complete visit charge and whether diagnosis, materials or wiring repairs are extra. This example is from TotalPower; other businesses set their own prices.','https://totalpowerpa.com/electrician-havertown-pa/'),
 ('directory-prices','Replace a standard 120V outlet','$80–$150','National replacement example for an existing standard outlet. New wiring, damaged boxes, trip charges and visit minimums can change the total.','cost-to-replace-an-outlet'),
 ('directory-prices','Add GFCI protection','$250+','JDV Electric owner Joe Voci’s Delaware County example for adding GFCI protection. Existing wiring and conditions affect the quote. Adding protection may involve different work from replacing an existing outlet.','https://www.owndelco.com/blog/home-inspection-electrical-delaware-county-pa/'),
 ('directory-prices','200-amp main-breaker panel replacement','$3,932–$4,612','Electrical Association of Philadelphia example contributed by Summers Quality Services, including permits and inspection. A main-breaker panel replacement is not the same scope as a complete service upgrade, meter or utility work. Ask which service, meter or utility work your proposal includes.','https://www.eap.org/blog/signs-you-need-an-electrical-panel-upgrade'),
 ('directory-prices','Hang an interior slab door — labor','$200–$570','Published slab-door installation labor range. Door, new hardware, frame repairs and disposal need their own written scope.','interior-door-installation-cost'),
 ('directory-prices','Repair an interior door','$75–$220','National interior-door repair reference. Frame damage, glass and replacement hardware can involve different work; ask about the visit minimum.','interior-door-installation-cost'),
 ('directory-prices','Patch a small drywall hole','$300–$500','Published professional patching range for a hole under four inches. Confirm minimum job charges, texture matching and whether painting is included.','drywall-repair-cost'),
 ('directory-prices','Repair a larger drywall hole','$500–$800+','Published larger-hole repair reference. Finish, access, painting and the cause of the damage affect the complete scope.','drywall-repair-cost'),
 ('directory-prices','Bedroom painting','$350–$850','Source bedroom example. Room size, preparation, coats, ceiling and trim scope must match.','cost-to-paint-interior-of-house'),
 ('directory-prices','Basic replacement window','$450–$1,500 / opening','Source range for installed single-hung windows in basic aluminum or vinyl frames; premium or custom openings differ.','window-replacement-cost'),
 ('directory-prices','Minor kitchen refresh','$10,000–$30,000','Source minor-remodel example, rather than a complete kitchen reconstruction or addition.','home-renovation-costs'),
 ('directory-prices','Small bathroom renovation','$3,000–$15,000+','Source small-bathroom example; moving fixtures, extensive tile or structural work changes scope.','home-renovation-costs'),
 ('directory-prices','New wood deck','$25–$50 / sq. ft.','Total installed source reference. Material, design, elevation, stairs and site work affect the proposal.','cost-to-build-a-deck'),
 ('directory-prices','Composite deck','$40–$80 / sq. ft.','Installed reference including the substructure. Compare the design, framing, railings and access.','composite-decking-prices'),
 ('auto-repair','Brake pad replacement','$335–$394','RepairPal’s general estimate; excludes taxes and fees and is not vehicle- or location-specific. Related repairs may be extra.','https://repairpal.com/estimator/brake-pad-replacement-cost'),
 ('auto-repair','Transmission fluid change','$294–$356','RepairPal’s general estimate; excludes taxes and fees. Confirm vehicle specifications and the precise service; this is not a transmission replacement.','https://repairpal.com/estimator/transmission-fluid-change-cost'),
 ('vehicle-wraps','Professional full-vehicle vinyl wrap','Around $2,000–$10,000+','Kelley Blue Book’s broad full-wrap reference. Vehicle size, film, coverage and preparation can make a large difference.','https://www.kbb.com/car-advice/how-much-cost-wrap-vehicle/'),
]


LOCAL_STARTS={
 'AC tune-up':('$125+','AC maintenance planning start supplied by Wazoozie’s owner. Repairs, parts and refrigerant are separate.','November 6, 2026'),
 'AC diagnostic visit':('$120+','Diagnostic-visit planning start supplied by Wazoozie’s owner. Confirm the assessment and full visit charge before booking.','November 6, 2026'),
 'Single-zone ductless installation':('$4,500+','Local planning start for one indoor zone, supplied by Wazoozie’s owner. Equipment, heating performance, line runs and site work affect the installed quote.','November 7, 2026'),
 'Three-zone ductless installation':('$9,500+','Local planning start for three indoor zones, supplied by Wazoozie’s owner. Confirm equipment, capacity, line runs and installation scope.','November 7, 2026'),
 'Standard tank water heater replacement':('$2,000–$3,500','Local installed planning range supplied by Wazoozie’s owner. Confirm tank size, fuel, removal, connections and permit responsibilities; changes to the installation can add cost.','November 7, 2026'),
 'Tankless water heater installation':('$5,000–$8,000','Local installed planning range supplied by Wazoozie’s owner. Confirm equipment, venting, fuel supply, electrical work, removal and permits in the written proposal.','November 7, 2026'),
 'Boiler replacement':('$8,000–$15,000','Local replacement planning range supplied by Wazoozie’s owner. Equipment, fuel, controls, venting and distribution work affect the complete scope.','November 7, 2026'),
}

# A national component price does not establish a local complete-job minimum.
QUOTE_REQUIRED={
 'Small plumbing repair':'Describe the fault and request the complete visit-and-repair price, including diagnosis, parts, access and any after-hours charge.',
 'Replace a standard 120V outlet':'Ask for the complete visit price for the number of outlets involved, including diagnosis, device, box condition, grounding and testing.',
}

LOCAL_SOURCES={
 'Add GFCI protection':('OwnDelco / Joe Voci, JDV Electric','Published September 25, 2026 · checked November 7, 2026'),
 '200-amp main-breaker panel replacement':('Electrical Association of Philadelphia / Summers Quality Services','Publication date not stated on page · checked November 7, 2026'),
 'Outlet, switch or fixture replacement':('TotalPower','Publication date not stated · checked November 7, 2026'),
}

def guide_body():
    e=html.escape
    body='''<div class="buying-intro"><div class="eyebrow">THE WAZOOZIE COST CHECK</div><h1>What should<br><em>your project cost?</em></h1><p class="buying-lede">Get a starting point for the budget.</p><p>Start with <strong>local owner planning estimates</strong>, published local examples and <strong>U.S. planning ranges</strong>. Each card tells you where its numbers come from and what to ask before booking.</p><p>Around Delco, Chester County and the Main Line, your price will depend on the equipment or materials, access and what the job includes. Use these figures to plan, then ask for a written quote for your home. A starting price leaves room for a bigger or more involved job.</p></div><nav class="buying-jumps" aria-label="Price guide sections"><a href="#hvac">Heating &amp; cooling</a><a href="#water-heaters">Hot water &amp; boilers</a><a href="#directory-prices">Home projects</a><a href="#auto-repair">Auto care</a><a href="#vehicle-wraps">Vehicle wraps</a><a href="#real-estate">Real estate</a><a href="#method">Sources &amp; method</a></nav>'''
    headings=[('hvac','HEATING & COOLING','Comfort has a scope.'),('water-heaters','HOT WATER & BOILERS','Price the complete installation.'),('directory-prices','AROUND THE HOUSE','From small fixes to bigger ideas.'),('auto-repair','THE CAR YOU COUNT ON','Start with the vehicle and the finding.'),('vehicle-wraps','A DIFFERENT KIND OF CURB APPEAL','Coverage changes the cost.')]
    for group,kicker,title in headings:
        body+='<section id="'+group+'" class="buying-section"><div class="eyebrow">'+e(kicker)+'</div><h2>'+e(title)+'</h2><div class="price-grid">'
        for category,label,value,scope,source in RANGES:
            if category!=group:continue
            url=source if source.startswith('https://') else HG+source
            publisher='HomeGuide' if url.startswith(HG) else 'RepairPal' if 'repairpal.com' in url else 'Kelley Blue Book'
            local=LOCAL_STARTS.get(label)
            if label in LOCAL_SOURCES:
                publisher,source_date=LOCAL_SOURCES[label]
                body+='<article class="price-card" data-cost-category="'+group+'" data-price-basis="published-local"><p class="eyebrow">'+e(label)+'</p><h3>'+e(value)+'</h3><span class="price-type">PUBLISHED LOCAL EXAMPLE</span><p>'+e(scope)+'</p><a href="'+url+'">Source: '+e(publisher)+' ↗</a><small>'+e(source_date)+' · confirm a current quote</small></article>'
            elif label in QUOTE_REQUIRED:
                body+='<article class="price-card" data-cost-category="'+group+'" data-price-basis="quote-required"><p class="eyebrow">'+e(label)+'</p><h3>Request a local quote</h3><span class="price-type">LOCAL PRICE NEEDS CONFIRMATION</span><p>'+e(QUOTE_REQUIRED[label])+'</p><details><summary>Older national context, not a local quote</summary><p>'+publisher+' reports '+e(value)+' for the source scope: '+e(scope)+' These figures do not establish a complete local job price in 2026.</p><a href="'+url+'">National source: '+publisher+' ↗</a></details><small>Local range not verified · reviewed November 7, 2026</small></article>'
            elif local:
                display,local_scope,supplied=local
                body+='<article class="price-card" data-cost-category="'+group+'" data-price-basis="owner-estimate"><p class="eyebrow">'+e(label)+'</p><h3>'+e(display)+'</h3><span class="price-type">LOCAL OWNER PLANNING ESTIMATE</span><p>'+e(local_scope)+'</p><details><summary>Published national context</summary><p>'+publisher+' reports '+e(value)+' nationally for this scope. That broader national range is separate from the owner’s local planning estimate above.</p><a href="'+url+'">National source: '+publisher+' ↗</a></details><small>Owner estimate supplied '+supplied+' · not a guaranteed quote</small></article>'
            else:
                body+='<article class="price-card" data-cost-category="'+group+'" data-price-basis="published-national"><p class="eyebrow">'+e(label)+'</p><h3>'+e(value)+'</h3><span class="price-type">NATIONAL PLANNING REFERENCE</span><p>'+e(scope)+'</p><a href="'+url+'">Source: '+publisher+' ↗</a><small>Source checked November 6, 2026 · actual quotes vary</small></article>'
        body+='</div>'
        if group=='hvac':
            body+='''<aside class="range-next-step"><h3>Ready to price your own HVAC project?</h3><p>Try Middletown HVAC’s tools for a project-specific starting point, then discuss the installation details with the business.</p><a class="btn primary" href="https://www.mtownhvac.com/install-estimate/?utm_source=wazoozie&amp;utm_medium=referral&amp;utm_campaign=cost-guide">Explore the HVAC install estimator ↗</a><p><a href="https://www.mtownhvac.com/ductless-estimator/?utm_source=wazoozie&amp;utm_medium=referral&amp;utm_campaign=cost-guide">Plan a ductless project ↗</a> · <a href="/guides/compare-hvac-estimates/">Compare two HVAC scopes →</a></p></aside>'''
        else:
            destination='/auto-mechanics/' if group=='auto-repair' else '/vehicle-wraps/' if group=='vehicle-wraps' else '/local-help/'
            body+='<p><a href="'+destination+'">Find the right local contact →</a> · <a href="/compare/">Compare the written scope →</a></p>'
        body+='</section>'
    body+='''<section id="real-estate" class="buying-section"><div class="eyebrow">THE NEXT CHAPTER</div><h2>Agree on the service. Negotiate the fee.</h2><p>There is no universal “should cost” commission here. NAR’s buyer-agreement guidance states that compensation and agreement terms are negotiable. Ask each professional for the services, compensation, duration and obligations in writing.</p><p>A percentage, flat fee or another agreed structure needs to be evaluated with the service it buys. Confirm who pays, when payment is due and what happens if the transaction does not close.</p><p><a href="https://www.nar.realtor/the-facts/consumer-guide-to-written-buyer-agreements">Source: NAR consumer guidance ↗</a> · <a href="/real-estate-agents/">Meet local real estate professionals →</a></p></section><section class="buying-section buying-note"><h2>Make the quote work for you.</h2><p>Ask the business to walk you through the price: equipment, materials, preparation, permits and cleanup. When comparing estimates, line up the work included in each.</p><p>An easy replacement and a tricky retrofit are different jobs. A few questions now can make the choice feel much simpler.</p><a href="/before-you-say-yes/">Keep these questions handy →</a></section><section id="method" class="buying-section buying-note"><h2>Where the numbers come from.</h2><p>Owner planning estimates cover AC visits (November 6, 2026), ductless, water heaters and boilers (November 7, 2026). These are current local planning figures, not an independent market survey.</p><p>The local electrical examples come from TotalPower in Havertown, JDV Electric’s owner in OwnDelco, and Summers Quality Services via the Electrical Association of Philadelphia. Checked November 7, 2026; publication dates and scope are noted on each card. Each example belongs to the named contractor. For small plumbing repairs and individual standard outlets, ask for a complete local quote.</p><p>HomeGuide, RepairPal and Kelley Blue Book provide national background, checked November 6, 2026. Those figures describe their published scopes and may differ from a local proposal.</p><p>Check the notes on each card to see what is included, then open the source for more detail. Small repairs, visit minimums and full installations cover different amounts of work. For general carpentry or a list of small jobs, ask for a task-based quote covering labor, materials, access, preparation and cleanup; a generic national hourly low end is not a local contractor quote.</p><p>Wazoozie is operated by Bryan Cordy, owner of Middletown HVAC. The labeled estimator links take you to that business’s own planning tools.</p><p><a href="/project-budget/">Build a project budget →</a> · <a href="/compare/">Compare written estimates →</a> · <a href="/our-standards/">Read our standards →</a></p></section>'''
    body = body.replace('<p>Wazoozie is operated by Bryan Cordy, owner of Middletown HVAC. The labeled estimator links take you to that business’s own planning tools.</p>', '<p>The labeled estimator links take you to Middletown HVAC’s own planning tools.</p>')
    return body
