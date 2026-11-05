"""Static contact journeys and consistent, visible business identities."""
import html
import json
import re
import shutil
from urllib.parse import urlsplit, parse_qsl, urlencode, urlunsplit

DISCLOSURE = 'Wazoozie promotes Middletown HVAC, its founding home-comfort business. Featured placement is a referral relationship, not an independent ranking.'

def enhance(out, public, pages, booking):
    for name in ("valley-stone-home.jpg", "valley-colonial-home.jpg", "porch-homeowners.jpg", "family-at-home.jpg", "weil-mclain-evergreen.jpg", "outdoor-lighting.jpg", "sink.jpg", "tankless.jpg", "carpentry.jpg", "tempstar-ion-risers.jpg", "garden-fountain.jpg", "window-framing.jpg", "electrical-outlet.jpg"):
        shutil.copy(out.parent/"assets"/name, out/"assets"/name)
    e = html.escape
    phone = '<a href="tel:+16105006416">610-500-6416</a>'
    bar = f'<aside class="contact-dock" aria-label="Contact Middletown HVAC"><span>Middletown HVAC</span><a class="btn outline" href="tel:+16105006416">Call now</a><a class="btn primary" href="{e(booking, quote=True)}">Book online ↗</a></aside>'
    menu = '<details class="mobile-menu"><summary>Menu</summary><nav aria-label="Mobile navigation"><a href="/contact/">Contact Middletown</a><a href="/services/">All services</a><a href="/services/second-opinion/">Second opinions</a><a href="/delaware-valley/">Coverage</a><a href="/about/">About Wazoozie</a></nav></details>'
    choices = [
        ('Repair', 'Heating or AC not working?', 'Describe the symptoms and equipment when you book.', 'heating-cooling'),
        ('Hot water', 'Water heater or Boiler trouble?', 'Tank, tankless, gas or oil: tell the office what you have.', 'water-heaters'),
        ('Replacement', 'Planning a new system?', 'Request an estimate and discuss the complete installation.', 'replacement-estimates'),
        ('Second opinion', 'Unsure about a big repair?', 'Bring the diagnosis or estimate for another assessment.', 'second-opinion'),
        ('Maintenance', 'Keep your system ready.', 'Ask about a maintenance visit or Get Comfortable Plans.', 'maintenance'),
    ]
    tiles = ''.join(f'<article><span class="eyebrow">{label}</span><h3>{title}</h3><p>{desc}</p><a class="btn primary" href="{e(booking, quote=True)}">Book with Middletown ↗</a><a class="detail-link" href="/services/{slug}/">What to expect →</a></article>' for label,title,desc,slug in choices)
    story = '<section class="origin-story" aria-labelledby="origin-title"><div class="origin-photo"><img src="/assets/valley-stone-home.jpg" alt="Illustrative Pennsylvania fieldstone home beneath autumn trees" width="1200" height="675" loading="lazy"><span>Home should feel like the good part of your day.</span></div><div class="origin-copy"><div class="eyebrow">WHY WE STARTED WAZOOZIE</div><h2 id="origin-title">Your home is not<br>someone’s practice run.</h2><p class="origin-lead">Sloppy work. Vague estimates. Pressure to replace something before anyone explains what’s wrong. Homeowners deserve better.</p><p>We started Wazoozie because finding help for your home should not feel like a gamble. You should know who you’re calling, what they do, and what questions to ask before anyone starts work.</p><p>Our starting point is Middletown HVAC: a family-owned, technician-led business. For heating, cooling and hot water, we make that connection direct. If a big repair or replacement doesn’t make sense to you, ask for a second opinion.</p><p>No invented ratings. No claims that every listing has been vetted. Just named businesses, clear information, and room to make your own decision.</p><a class="btn primary" href="/services/second-opinion/">Make a more informed choice →</a></div></section><section class="home-journal" aria-labelledby="home-journal-title"><div><div class="eyebrow">THE PLACES WE CALL HOME</div><h2 id="home-journal-title">Worth looking after.</h2><p>The old stone house. The porch everyone gathers on. The rooms that should feel comfortable in every season.</p></div><figure><img src="/assets/valley-colonial-home.jpg" alt="Illustrative white brick and cedar colonial home with a welcoming garden path" width="1200" height="800" loading="lazy"><figcaption>AI-generated home imagery for atmosphere; these are not photographs of Middletown projects.</figcaption></figure></section>'
    reviews = '<section class="real-reviews" aria-labelledby="reviews-title"><div class="eyebrow">PUBLISHED HOMEOWNER FEEDBACK</div><h2 id="reviews-title">In their own words.</h2><p>Short excerpts from published Middletown HVAC reviews. Read the full accounts at the linked sources.</p><div class="review-grid"><figure><blockquote>“He took his time and was clean and thorough.”</blockquote><figcaption>Karen G. · June 2026<br><a href="https://www.mtownhvac.com/reviews/" target="_blank" rel="noopener">Google review reproduced on Middletown’s website ↗</a></figcaption></figure><figure><blockquote>“we found their customer service excellent”</blockquote><figcaption>Mary Ellen M. · May 2026<br><a href="https://www.mtownhvac.com/reviews/" target="_blank" rel="noopener">Google review reproduced on Middletown’s website ↗</a></figcaption></figure><figure><blockquote>“the service was professional and thorough.”</blockquote><figcaption>William C. · December 2023<br><a href="https://www.homeadvisor.com/rated.MiddletownHVAVC.140421192.html" target="_blank" rel="noopener">Read the published HomeAdvisor review ↗</a></figcaption></figure></div></section>'
    family = '<figure class="family-scene"><img src="/assets/family-at-home.jpg" width="1200" height="800" loading="lazy" alt="Illustrative family relaxing while a child plays with a wooden truck on the living room rug"><figcaption>Illustrative family scene · AI-generated, not a customer photograph.</figcaption></figure>'
    porch = '<figure class="porch-scene"><img src="/assets/porch-homeowners.jpg" width="1200" height="675" loading="lazy" alt="Illustrative homeowners enjoying a relaxed conversation on a stone porch"><figcaption>A little more time to enjoy home. Illustrative AI-generated scene, not customers pictured.</figcaption></figure>'
    contact = f'''<div class="wrap contact-page"><div class="breadcrumb"><a href="/">Home</a><span>/</span>Contact Middletown HVAC</div><section class="contact-intro"><div class="eyebrow">DIRECT TO THE BUSINESS</div><h1>Let’s make home<br><em>comfortable again.</em></h1><p class="lede">Heating, cooling, Boilers and hot water. Connect directly with Middletown HVAC in Glen Mills—without filling out a separate Wazoozie request.</p><div class="emailactions"><a class="btn primary" href="{e(booking, quote=True)}">Book with Middletown ↗</a><a class="btn outline" href="tel:+16105006416">Call 610-500-6416</a></div><p class="contact-note">Online booking opens Middletown’s Housecall Pro page. Availability, service coverage and appointment details must be confirmed with the office.</p></section><section class="contact-steps" aria-label="What happens next"><div><b>01 · Choose your next step</b><p>Call with an urgent service question, or use online booking to arrange a visit.</p></div><div><b>02 · Share the basics</b><p>Your address, equipment type and what changed help the team plan the right visit.</p></div><div><b>03 · Confirm before the visit</b><p>Ask about coverage, the appointment window and any diagnostic charge.</p></div></section><section aria-labelledby="contact-needs"><h2 id="contact-needs">What can we help with?</h2><div class="contact-options">{tiles}</div></section><section class="contact-answers"><h2>A few things worth knowing.</h2><details><summary>Do you serve my address?</summary><p>Middletown is based in Glen Mills. Call {phone} to confirm your exact address. New Jersey and Delaware coverage is not confirmed; regional directory pages are not a promise of service.</p></details><details><summary>What if I need help urgently?</summary><p>Call {phone} to ask about availability. Online booking and email are not emergency dispatch services. For an immediate threat to life or safety, call 911.</p></details><details><summary>Can I email instead?</summary><p><a href="mailto:service@mtownhvac.com?subject=Wazoozie%20service%20inquiry">Email service@mtownhvac.com</a>. This opens your email app; you must send the message yourself. If email does not open, call or use online booking. Wazoozie cannot confirm email delivery.</p></details><details><summary>Who receives my information?</summary><p>Calls and bookings go directly to Middletown HVAC or its booking provider. Wazoozie does not send your inquiry to multiple contractors. <a href="/privacy/">Read the privacy notice</a>.</p></details><p class="relationship">{DISCLOSURE} <a href="/about/">About Wazoozie →</a></p></section></div>'''
    # Reuse the site's existing head, navigation and footer for the new contact page.
    template=(out/'about/index.html').read_text()
    template=re.sub(r'<main id="main">.*?</main>',lambda _: '<main id="main">'+contact+'</main>',template,count=1,flags=re.S)
    template=template.replace('About Wazoozie | Wazoozie','Contact Middletown HVAC | Wazoozie')
    template=template.replace(public+'/about/',public+'/contact/') if public else template
    template=template.replace('Wazoozie introduces Delaware Valley homeowners to local service businesses. Explore local services and make contact directly.','Call or book Middletown HVAC for heating, cooling, Boilers and Water Heaters. Confirm your address and appointment directly.')
    (out/'contact').mkdir(exist_ok=True)
    (out/'contact/index.html').write_text(template)
    pages.append('/contact/')
    for f in out.rglob('*.html'):
        text=f.read_text()
        path='/404/' if f==out/'404.html' else '/' if f==out/'index.html' else '/'+str(f.parent.relative_to(out))+'/'
        text=text.replace('</head>','<link rel="stylesheet" href="/assets/contact.css"></head>')
        text=text.replace('</nav></div></header>','</nav>'+menu+'</div></header>',1)
        text=re.sub(r'<div class="mobilebar">.*?</div><a.*?</a></div>','',text,flags=re.S)
        # The original homepage dock has nested markup; remove it through its known outer tail.
        text=re.sub(r'<div class="mobilebar">.*?</a></div>','',text,flags=re.S)
        text=text.replace('</body>',bar+'</body>')
        text=text.replace('No invented ratings. No claims that every listing has been vetted.', 'Clear information, without pretending every listing has been vetted.')
        text=text.replace('<strong>The useful details</strong>','<strong>The useful details</strong><a href="/contact/">Contact Middletown HVAC</a>')
        text=text.replace('<span>© 2026 Wazoozie.</span>',f'<span>© 2026 Wazoozie.</span><span class="relationship">{DISCLOSURE}</span>')
        if path=='/':
            text=text.replace('<div class="wrap"><section class="feature"', '<div class="wrap">'+reviews+'<section class="feature"',1)
            text=text.replace('<section class="trust-section wrap"', '<div class="wrap">'+story+'</div><section class="trust-section wrap"',1)
            text=re.sub(r'(<h1 id="hero-title">).*?</h1>',r'\1A comfortable home.<br><em>A clear next step.</em></h1>',text,count=1,flags=re.S)
            text=re.sub(r'(<p class="lede">).*?</p>',r'\1Heating, cooling and hot water help from Middletown HVAC. Based in Glen Mills. Book directly, ask about your address, or get a second opinion.</p>',text,count=1,flags=re.S)
            hero=f'<div class="hero-intents"><a class="btn primary" href="{e(booking, quote=True)}">Book with Middletown ↗</a><a class="btn outline" href="tel:+16105006416">Call 610-500-6416</a></div><div class="quick-paths"><a href="/contact/">Help me choose →</a><a href="/services/second-opinion/">Get a second opinion →</a></div><p class="contact-note">Direct contact. Confirm your address and appointment with the office.</p><h2 class="browse-label">Looking for another home service?</h2>'
            text=re.sub(r'<div class="hero-intents">.*?</div>',lambda _:hero,text,count=1,flags=re.S)
            text=text.replace('<div class="region-strip"><span>Pennsylvania</span><span>New Jersey</span><span>Delaware</span></div>','<p class="region-disclosure">Exploring the Delaware Valley. Each business confirms coverage; NJ and DE availability is not confirmed.</p>')
        if path=='/businesses/middletown-hvac/':
            text=text.replace('<article class="prose">','<article class="prose">'+family,1)
            text=text.replace('</main>','<div class="wrap">'+reviews+'</div></main>')
            text=text.replace('Not yet collected or verified by Wazoozie.','Published review excerpts are linked below. Wazoozie has not independently verified the underlying work. Images are illustrative.')
        galleries = {
            '/businesses/middletown-hvac/': [('weil-mclain-evergreen', 'Weil-McLain Evergreen gas Boiler manufacturer product photograph'), ('tankless', 'Illustrative Navien tankless Water Heater'), ('tempstar-ion-risers', 'Illustrative Tempstar Ion heat pump on six-inch risers above a square gray equipment pad')],
            '/businesses/ryan-dugan-electric/': [('outdoor-lighting', 'Illustrative outdoor lighting at a stone home'), ('electrical-outlet', 'Illustrative residential electrical outlet')],
            '/businesses/liberator-service-company/': [('sink', 'Illustrative kitchen sink and faucet'), ('garden-fountain', 'Illustrative garden fountain')],
            '/businesses/cooke-carpentry-construction/': [('carpentry', 'Illustrative timber structure under construction'), ('window-framing', 'Illustrative window framing renovation')],
        }
        if path in galleries:
            photos = ''.join('<img class="'+('product-image' if name in ('weil-mclain-evergreen','tempstar-ion') else '')+'" src="/assets/'+name+('.png' if name=='tempstar-ion' else '.jpg')+'" alt="'+alt+'" width="'+('659' if name=='weil-mclain-evergreen' else '1200')+'" height="'+('500' if name=='weil-mclain-evergreen' else '800')+'" loading="lazy">' for name,alt in galleries[path])
            text=text.replace('</main>', '<div class="wrap"><div class="service-gallery" aria-label="Service illustrations">'+photos+'</div></div></main>')
        if path=='/about/':
            text=text.replace('</main>','<div class="wrap">'+porch+'</div></main>')
            text=text.replace('</main>','<div class="wrap">'+story+'</div></main>')
            text=text.replace('<h2>Meet the business first.</h2>',f'<h2>Our relationship with Middletown HVAC.</h2><p>{DISCLOSURE} The site is intended to help homeowners find and contact Middletown for home-comfort work. Other listed businesses are not confirmed partners.</p><h2>Meet the business first.</h2>')
        # Link attribution contains only page/channel names, never form values or personal data.
        def attributed(m):
            url=html.unescape(m.group(1));p=urlsplit(url)
            q=dict(parse_qsl(p.query));q['utm_content']='home' if path=='/' else path.strip('/').replace('/','-')
            return 'href="'+e(urlunsplit((p.scheme,p.netloc,p.path,urlencode(q),p.fragment)),quote=True)+'"'
        text=re.sub(r'href="(https://book\.housecallpro\.com/[^"]+)"',attributed,text)
        if public:
            mid='https://www.mtownhvac.com/#business'
            business={'@type':'HVACBusiness','@id':mid,'name':'Middletown HVAC','url':'https://www.mtownhvac.com/','telephone':'+16105006416','email':'service@mtownhvac.com','description':'Family-owned, technician-led heating, cooling, Boiler and Water Heater business based in Glen Mills. Confirm address coverage and appointment availability directly.','sameAs':['https://www.mtownhvac.com/'],'hasOfferCatalog':{'@type':'OfferCatalog','name':'Home comfort services','itemListElement':[{'@type':'Offer','itemOffered':{'@type':'Service','name':name,'url':public+'/services/'+slug+'/','provider':{'@id':mid}}} for name,slug in [('Heating and cooling','heating-cooling'),('Boiler service','boilers'),('Water Heaters and tankless','water-heaters'),('Maintenance','maintenance'),('Replacement estimates','replacement-estimates'),('Second opinions','second-opinion')]]}}
            graph=[{'@type':'WebSite','@id':public+'/#website','name':'Wazoozie','url':public+'/'}, {'@type':'WebPage','@id':public+path+'#page','url':public+path,'isPartOf':{'@id':public+'/#website'},'about':{'@id':mid}}]
            if path in ('/','/contact/','/facts/','/businesses/middletown-hvac/'):
                graph.append(business)
            if path!='/':
                label='Contact Middletown HVAC' if path=='/contact/' else re.sub('<.*?>','',re.search(r'<title>(.*?)</title>',text).group(1)).split(' | ')[0]
                graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':public+'/'},{'@type':'ListItem','position':2,'name':html.unescape(label),'item':public+path}]})
            # Only HVAC-related pages describe Middletown as their subject.
            if any(x in path for x in ('ryan-dugan','liberator','cooke','plumbing','electrical','handyman')):
                graph[1].pop('about',None)
            encoded=json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False).replace('<','\\u003c')
            text=text.replace('</head>','<script type="application/ld+json">'+encoded+'</script></head>')
        if path=='/404/':
            text=text.replace('content="index,follow"','content="noindex,nofollow"')
        # Service illustrations are not represented as completed projects or customers.
        text=re.sub(r'<figcaption>(?:AI-generated home imagery|Illustrative family scene|A little more time to enjoy home).*?</figcaption>', '', text, flags=re.S)
        f.write_text(text)
    facts=out/'llms.txt'
    facts.write_text(facts.read_text()+f'\n## Relationship and contact\n\n{DISCLOSURE}\n\n- [Contact Middletown HVAC]({public}/contact/): Direct calling, online booking, service choices and address-coverage guidance.\n')
