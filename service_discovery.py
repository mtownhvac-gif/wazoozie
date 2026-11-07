"""Local search clarity and direct service paths, without new tracking or promises."""
import html
import json
import re
import shutil
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

METADATA = {
    '/': ('Local Services in Delco & the Main Line', 'Find local HVAC, plumbing, electrical, painting and home-repair businesses in Delco, Chester County and the Main Line. Call your chosen business directly.'),
    '/home-services/': ('Home Services in Delco & Chester County', 'Compare named local contacts for heating, cooling, plumbing, electrical work, painting and home repairs. Read profiles and confirm your address with the business.'),
    '/local-help/': ('Local Businesses in Delco, Chester County & the Main Line', 'Explore local home services, auto care and real estate contacts. Read the business profiles and choose who you contact. Each business confirms its service area.'),
    '/book/': ('Call or Book a Local Service Business', 'Contact Middletown HVAC and other listed local businesses directly. Find phone numbers, booking options and service details without creating an account.'),
    '/businesses/middletown-hvac/': ('Middletown HVAC in Glen Mills, PA | Services & Contact', 'Call Middletown HVAC at 610-500-6416 for heating, AC, boiler and water-heater inquiries. Read published reviews and confirm service coverage and availability.'),
    '/services/heating-cooling/': ('Heating & AC Repair | Middletown HVAC in Glen Mills', 'Furnace, AC and heat-pump repair inquiries with Glen Mills-based Middletown HVAC. Call 610-500-6416 to confirm address coverage, the diagnostic fee and availability.'),
    '/services/boilers/': ('Boiler Repair & Service | Middletown HVAC, Glen Mills', 'Gas or oil boiler trouble? Contact Glen Mills-based Middletown HVAC about repairs, maintenance or replacement. Confirm coverage, visit charges and availability.'),
    '/services/water-heaters/': ('Water Heater Service | Middletown HVAC, Glen Mills', 'No hot water or planning a replacement? Ask Middletown HVAC in Glen Mills about tank and tankless water heaters. Call 610-500-6416 to discuss your home.'),
    '/services/maintenance/': ('HVAC Maintenance | Middletown HVAC, Glen Mills', 'Plan heating and cooling maintenance with Glen Mills-based Middletown HVAC. Ask about your equipment, current plan terms, service coverage and appointment options.'),
    '/contact/': ('Contact Middletown HVAC in Glen Mills | 610-500-6416', 'Call Middletown HVAC, book through Housecall Pro or send a service request. Heating, AC, boilers and hot water. No Wazoozie account is needed to make contact.'),
}
HVAC_INTENTS = {
    'heating-cooling': 'comfort', 'boilers': 'boiler', 'water-heaters': 'water',
    'maintenance': 'maintenance', 'second-opinion': 'secondopinion',
    'replacement-estimates': 'replacement', 'oil-to-gas-conversion': 'replacement',
    'ductless-mini-splits': 'comfort',
}


def update_metadata(content, path, origin):
    e = html.escape
    if path in METADATA:
        title, description = METADATA[path]
        title += ' | Wazoozie'
        content = re.sub(r'<title>.*?</title>', lambda _: '<title>'+e(title)+'</title>', content, count=1)
        for attr, name, value in [('name','description',description),('property','og:title',title),('property','og:description',description),('name','twitter:title',title),('name','twitter:description',description)]:
            tag = '<meta '+attr+'="'+name+'" content="'+e(value, quote=True)+'">'
            pattern = r'<meta '+attr+'="'+re.escape(name)+r'"[^>]*>'
            content = re.sub(pattern, lambda _: tag, content) if re.search(pattern,content) else content.replace('</head>',tag+'</head>',1)
    title = html.unescape(re.search(r'<title>(.*?)</title>', content, re.S).group(1))
    description = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', content).group(1))
    # Late page transformations must not leave old titles/descriptions in JSON-LD.
    def schema(match):
        data = json.loads(match.group(1))
        for node in data.get('@graph', [data]):
            if node.get('@type') in ('WebPage', 'ProfilePage', 'CollectionPage', 'ContactPage'):
                node.update(name=title, description=description, url=origin+path)
                node.setdefault('@id', origin+path+'#page')
            if node.get('@type') == 'WebSite':
                node['publisher'] = {'@id': origin+'/#organization'}
            if node.get('@type') == 'Organization' and node.get('@id') == origin+'/#organization':
                node['sameAs'] = ['https://www.facebook.com/profile.php?id=61596314640388', 'https://www.instagram.com/wazoozie.local/']
            if node.get('@type') == 'Service' and path.startswith('/services/'):
                node.update(url=origin+path, description=description)
                provider = node.get('provider', {})
                if provider.get('name') == 'Middletown HVAC':
                    provider.update({'@id':'https://www.mtownhvac.com/#business', '@type':'HVACBusiness'})
            if node.get('@type') == 'BreadcrumbList' and node.get('itemListElement'):
                node['itemListElement'][-1]['name'] = title.removesuffix(' | Wazoozie')
        return '<script type="application/ld+json">'+json.dumps(data, ensure_ascii=False).replace('<','\\u003c')+'</script>'
    return re.sub(r'<script type="application/ld\+json">(.*?)</script>', schema, content, flags=re.S)


def add(out, origin, pages, booking):
    origin = origin or 'http://localhost:8123'
    shutil.copy(out.parent/'assets/service-discovery.css', out/'assets/service-discovery.css')
    e = html.escape
    booking_parts = urlsplit(html.unescape(booking))
    booking_query = dict(parse_qsl(booking_parts.query))
    booking_query.update(utm_source='wazoozie',utm_medium='referral',utm_campaign='service-contact',utm_content='home')
    home_booking = e(urlunsplit(booking_parts._replace(query=urlencode(booking_query))), quote=True)
    home = out/'index.html'
    s = home.read_text()
    s = re.sub(r'<h1 id="hero-title">.*?</h1>', '<h1 id="hero-title">Local help for<br><em>Delco &amp; the Main Line.</em></h1>', s, count=1, flags=re.S)
    s = s.replace('Find good local help, get a handle on the cost, and get on with your day.', 'Meet local businesses for your home, your car and your next move. Serving the Delco, Chester County and Main Line community, with coverage confirmed by each business.')
    s = s.replace('href="/pricing-guide/">Check project costs', 'href="/home-services/">Find home services', 1)
    s = s.replace('href="/services/">Find your service →', 'href="/pricing-guide/">Check project costs →', 1)
    direct = '''<section class="wrap service-direct" aria-labelledby="service-direct-title"><div class="service-direct-heading"><div><span class="eyebrow">READY TO TALK TO SOMEONE?</span><h2 id="service-direct-title">Heating, AC or hot-water trouble?</h2><p><a href="/businesses/middletown-hvac/">Middletown HVAC</a> is based in Glen Mills. Call about your system, confirm your address and ask about the diagnostic charge and next available visit.</p></div><div class="service-direct-actions"><a class="btn primary" href="tel:+16105006416">Call Middletown · 610-500-6416</a><a class="btn outline" href="/start/?intent=comfort">Send a service request</a><a class="service-direct-book" href="'''+home_booking+'''">Check online booking ↗</a></div></div><p class="service-direct-note">No Wazoozie account needed. A request is not a confirmed appointment. When you call, mention that you found Middletown on Wazoozie.</p><p class="service-direct-disclosure">Featured business: Wazoozie and Middletown HVAC share an owner. <a href="/how-it-works/">About our business relationships</a>.</p><nav class="service-direct-trades" aria-label="Other local home-service businesses"><span>Need another trade?</span><a href="/businesses/ryan-dugan-electric/">Ryan Dugan · electrical</a><a href="/businesses/liberator-service-company/">Liberator · plumbing</a><a href="/businesses/rolled-right-painting/">Rolled Right · painting</a><a href="/businesses/hart-builders/">Hart Builders · remodeling</a><a href="/businesses/cooke-carpentry-construction/">Cooke · carpentry</a><a href="/local-help/">Auto, wraps &amp; real estate →</a></nav></section>'''
    s = s.replace('<section class="wrap explore-hub', direct+'<section class="wrap explore-hub', 1)
    home.write_text(s)

    repair = '''<section class="service-decision" aria-labelledby="repair-help-title"><h2 id="repair-help-title">No heat, weak cooling or a system that keeps stopping?</h2><p>Start with a service conversation, not a replacement decision. Tell Middletown HVAC which system is affected, when the problem started and whether the whole home or just one room feels different. A technician needs to evaluate the equipment before recommending a repair.</p><div class="service-decision-grid"><div><h3>Furnace or heat pump not heating</h3><p>Note the thermostat setting, the indoor temperature and any displayed message. Say whether the fan runs and whether any heat reaches the rooms. Do not bypass a safety control or repeatedly reset equipment that shuts down.</p></div><div><h3>AC running without cooling</h3><p>Describe weak airflow, warm air or visible ice from a safe distance. Mention when cooling last worked normally. Refrigerant and electrical testing belong with a qualified technician.</p></div><div><h3>Boiler or radiator trouble</h3><p>Tell the office whether the boiler uses gas or oil, and whether every room or only one area has lost heat. <a href="/services/boilers/">Read about boiler service</a>. Do not open fuel lines or work on hot or pressurized equipment.</p></div><div><h3>One uncomfortable room</h3><p>Describe the room, when it is uncomfortable and how the rest of the house feels. Ask about airflow and system assessment before deciding whether <a href="/services/ductless-mini-splits/">ductless equipment</a> is appropriate.</p></div></div><h3>What to confirm before a service visit</h3><ul><li>Your town and exact service address are covered.</li><li>The diagnostic or visit charge, and whether any credit is conditional on a repair.</li><li>The expected arrival window and how scheduling is confirmed.</li><li>That you receive repair options and pricing before approving extra work.</li></ul><p>For a home in Glen Mills, Media or elsewhere in Delaware County, share the exact address before booking. A nearby listing does not guarantee coverage, emergency availability or same-day service. Chester County and Main Line homeowners should also confirm their address and job type directly.</p><p><strong>Safety first:</strong> if you smell gas, have a carbon monoxide alarm or suspect an immediate hazard, leave the building and call emergency services or the utility from a safe location. Do not wait for a website reply.</p><p class="service-content-source">Service information: <a href="https://www.mtownhvac.com/services/">Middletown HVAC’s published service menu</a>. This page helps prepare the conversation; it does not diagnose your equipment. <a href="/businesses/middletown-hvac/">Business details, published reviews and ownership disclosure →</a></p></section>'''
    target = out/'services/heating-cooling/index.html'
    s = target.read_text()
    s = re.sub(r'<h1[^>]*>.*?</h1>', '<h1>Heating &amp; AC repair.<br><em>Middletown HVAC, Glen Mills.</em></h1>', s, count=1, flags=re.S)
    s = s.replace('<article class="prose">', '<article class="prose">'+repair, 1)
    target.write_text(s)

    attribution = '<p class="service-attribution">Found us on Wazoozie? Mention Wazoozie when you call so the office can record where your inquiry came from. Call clicks alone do not tell us whether you reached the business.</p>'
    paths = ['services/'+slug+'/index.html' for slug in HVAC_INTENTS] + ['businesses/middletown-hvac/index.html', 'contact/index.html']
    for relative in paths:
        target = out/relative
        s = target.read_text()
        s = re.sub(r'(<div class="emailactions">.*?</div>)', lambda m:m.group(1)+attribution, s, count=1, flags=re.S)
        if relative in ('businesses/middletown-hvac/index.html','contact/index.html'):
            s = re.sub(r'(<div class="emailactions">.*?)(</div>)', lambda m:m.group(1)+'<a class="btn outline" href="/start/?intent=comfort">Send a service request →</a>'+m.group(2), s, count=1, flags=re.S)
        target.write_text(s)
    standards = out/'our-standards/index.html'
    s = standards.read_text().replace('The homepage shows all listed businesses.', 'The directory links to the current business profiles.')
    s = s.replace('Email forms prepare a draft for you to review and send. The form does not automatically distribute your information to multiple businesses.', 'On the project planner, Middletown HVAC can receive an email request when delivery is available and you explicitly consent to sending it. Other businesses keep their direct call, website or email-draft options; a saved brief alone does not notify them. Email-draft links open your own email app for you to review and send. Your information is not automatically distributed to multiple businesses.')
    standards.write_text(s)
    privacy = out/'privacy/index.html'
    s = privacy.read_text().replace('selected website links, plus successfully saved briefs.', 'selected website links and Middletown pricing-tool links, plus successfully saved briefs.')
    s = s.replace('Click counts do not confirm that a call connected, an email was sent, or an appointment was booked.', 'Click counts do not confirm that a call connected, an email was sent, a pricing tool was completed, or an appointment was booked.')
    privacy.write_text(s)
    # All metadata comes from the final visible page, after other render passes.
    for target in out.rglob('*.html'):
        path = '/' if target==home else '/404/' if target.name=='404.html' else '/'+target.parent.relative_to(out).as_posix()+'/'
        s = target.read_text()
        if path=='/' or target.relative_to(out).as_posix() in paths:
            s = s.replace('</head>','<link rel="stylesheet" href="/assets/service-discovery.css"></head>',1)
        target.write_text(s)


def finalize(out, origin):
    """Synchronize schemas only after every page/optimization pass is complete."""
    origin = origin or 'http://localhost:8123'
    for target in out.rglob('*.html'):
        path = '/' if target==out/'index.html' else '/404/' if target.name=='404.html' else '/'+target.parent.relative_to(out).as_posix()+'/'
        target.write_text(update_metadata(target.read_text(), path, origin))
