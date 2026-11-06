"""Direct scheduling, a short service finder, and clear booking handoffs."""
import html
import json
import re
import shutil
import subprocess
from editorial import write_editorial_page
from local_help import PEOPLE


def add(out, origin, pages):
    e=html.escape
    root=out.parent
    businesses=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {BUSINESSES} from './project-config.mjs';process.stdout.write(JSON.stringify(BUSINESSES))"],cwd=root,text=True))
    records=[]
    for key,business in businesses.items():
        records.append(dict(key=key,name=business['name'],slug=business['slug'],phone=business['phone'],tel=business['tel'],category='home',booking=business.get('booking'),intent=business['defaultIntent']))
    for person in PEOPLE:
        records.append(dict(key=person['slug'],name=person['name'],slug=person['slug'],phone=person.get('phone',''),tel=person.get('tel',''),category='auto' if person['category']=='automotive' else 'realestate',web=person['website'],services=person['label'],location=person['detail'],keywords='mechanic car auto repair' if person['category']=='automotive' and not person.get('vehiclewrap') else ''))
    services={'middletown':'Heating, cooling, ductless mini splits, furnaces, AC, boilers & hot water','hart':'Windows, doors, decks, additions & remodeling','rolledright':'Painting, drywall & wall preparation','ryan':'Electrical, lighting, outlets, panels & circuits','liberator':'Plumbing, drains, leaks & fixtures','cooke':'Carpentry, shelving, trim & home repairs'}
    for record in records:
        if record['category']=='home':record['services']=services[record['key']]
    by_slug={r['slug']:r for r in records}
    def actions(r,compact=False):
        buttons=[]
        if r.get('booking'):
            buttons.append('<a class="btn primary" href="'+e(r['booking'],quote=True)+'">Book online'+(' with Middletown' if not compact else '')+'</a>')
            buttons.append('<a class="btn outline" href="tel:'+r['tel']+'">Call'+(' '+r['phone'] if not compact else '')+'</a>')
        elif r['slug']=='c-and-j-automotive-upper-chichester':
            buttons.append('<a class="btn primary" href="https://candjautorepair.com/upper-chi/">Request service online</a>')
            buttons.append('<a class="btn outline" href="tel:'+r['tel']+'">Call'+(' '+r['phone'] if not compact else '')+'</a>')
        elif r.get('tel'):
            buttons.append('<a class="btn primary" href="tel:'+r['tel']+'">Call to schedule'+(' · '+r['phone'] if not compact else '')+'</a>')
            if not compact:buttons.append('<a class="btn outline" href="/businesses/'+r['slug']+'/">About the business</a>')
        else:
            buttons.append('<a class="btn primary" href="https://www.soundwraps.com/contact.html">Ask about a wrap</a>')
        return ''.join(buttons)
    cards=[]
    for r in sorted(records,key=lambda r:(r['key']!='middletown',r['name'].casefold())):
        note='Housecall Pro handles the booking steps and confirmation. Enter your details there.' if r.get('booking') else 'Use “Book Service Now” on the Upper Chi page, or call the shop. Confirm the visit with the business.' if r['slug']=='c-and-j-automotive-upper-chichester' else 'Describe your vehicle and wrap ideas on Sound Wraps’ contact page. The business will discuss timing with you.' if not r.get('tel') else 'Call the business to discuss your project and arrange a time.'
        search=e(' '.join([r['name'],r['services'],r.get('location',''),r.get('keywords',''),r['category']]),quote=True)
        cards.append('<article class="booking-card" data-search="'+search+'" data-book-category="'+r['category']+'" data-business="'+r['slug']+'"><div><span class="eyebrow">'+('HOME SERVICES' if r['category']=='home' else 'AUTO &amp; VEHICLE CARE' if r['category']=='auto' else 'REAL ESTATE')+'</span><h2>'+'<a href="/businesses/'+r['slug']+'/">'+e(r['name'])+'</a></h2><p class="booking-services">'+e(r['services'])+'</p><p>'+note+'</p></div><div class="booking-actions">'+actions(r)+'</div></article>')
    body='<div class="wrap booking-page"><div class="breadcrumb"><a href="/local-help/">Local help</a><span>/</span>Book or call</div><header class="booking-intro"><div class="eyebrow">LET’S GET IT SORTED.</div><h1>Ready to<br><em>get in touch?</em></h1><p>Choose your business below. Book online where it’s offered, request a visit, or call to arrange a time.</p></header><form class="booking-search" role="search"><label for="booking-query">What needs doing?</label><div><input id="booking-query" type="search" name="q" maxlength="100" placeholder="Try mini split, painting, wraps or a name" autocomplete="off"><button class="btn primary" type="submit">Find local help</button></div><p>Search services or business names. You can narrow the results by category below.</p></form><div class="booking-filters" aria-label="Choose a business category"><button type="button" data-book-filter="all" aria-pressed="true">Everyone</button><button type="button" data-book-filter="home" aria-pressed="false">Home services</button><button type="button" data-book-filter="auto" aria-pressed="false">Auto &amp; wraps</button><button type="button" data-book-filter="realestate" aria-pressed="false">Real estate</button></div><p id="booking-count" role="status" aria-live="polite"></p><div class="booking-grid">'+''.join(cards)+'</div><div id="booking-empty" hidden><h2>Let’s try another way.</h2><p>Try a shorter service name or clear your search to see every contact.</p><button type="button" id="booking-reset" class="btn outline">Show all local contacts</button><a href="/services/">Browse home service categories →</a></div><p class="booking-footnote">Each business handles its own availability, visit charges and appointment confirmation. Contacting a business or saving a planner doesn’t reserve a time.</p><noscript><p>All contacts are shown above. Category filters need JavaScript.</p></noscript></div>'
    write_editorial_page(out,origin,pages,'/book/','Book or contact a local business','Book online with Middletown HVAC, request a service visit or call a listed local business to arrange a time. Find the right contact for home services, auto care, wraps and real estate.',body)
    target=out/'book/index.html';target.write_text(target.read_text().replace('</body>','<script type="module" src="/assets/booking.js"></script></body>'))

    shutil.copy(root/'assets/clay-family-porch.webp',out/'assets/clay-family-porch.webp')
    local=out/'local-help/index.html'
    local.write_text(local.read_text().replace('/assets/brand-family-porch.webp','/assets/clay-family-porch.webp').replace('AI-created editorial image · Fictional people and scenes.','AI-created clay illustration · Fictional people and scenes.'))
    sharing=out/'share-wazoozie/index.html'
    share=sharing.read_text()
    photo='<figure class="brand-art"><img src="/assets/brand-family-porch.webp" width="1200" height="800" loading="lazy" alt="Fictional family spending time on a stone-house porch"><figcaption>AI-created editorial image · Fictional people and scenes.</figcaption></figure>'
    share=re.sub(r'<header class="growth-intro">.*?</header>',lambda m:'<div class="brand-cover">'+m.group()+photo+'</div>',share,count=1,flags=re.S)
    sharing.write_text(share)

    home=out/'index.html';content=home.read_text()
    content=content.replace('href="/pricing-guide/">Explore the pricing guide', 'href="/pricing-guide/">Check project costs')
    content=content.replace('href="/local-help/">Find local help →', 'href="/services/">Find your service →',1)
    choices=[('/services/heating-cooling/','Heating & cooling'),('/services/plumbing/','Plumbing'),('/services/electrical/','Electrical'),('/services/painting/','Painting'),('/auto-mechanics/','Auto care'),('/real-estate-agents/','Real estate')]
    common='<nav class="home-service-shortcuts" aria-label="Common services">'+''.join('<a href="'+url+'">'+label+'</a>' for url,label in choices)+'</nav>'
    quick_search='<form class="home-quick-search" role="search" action="/book/"><label for="home-service-query">What needs doing at your place?</label><div><input type="search" id="home-service-query" name="q" maxlength="100" placeholder="A project, a service, a business…"><button class="btn primary" type="submit">Find local help</button></div></form>'
    content=content.replace('<div class="grand-hero-bottom">',quick_search+common+'<div class="grand-hero-bottom">',1)
    home.write_text(content)

    from home_match import add as add_home_match
    add_home_match(out, origin, pages)

    for target in out.rglob('*.html'):
        content=target.read_text()
        content=content.replace('>Tools &amp; stories</a>', '>Tools &amp; play</a>').replace('>Tools & stories</a>', '>Tools &amp; play</a>')
        content=content.replace('</nav></details></div></header>', '</nav></details></div><p class="header-tagline">I’m choosy. I use Wazoozie.</p></header>', 1)
        path='/' if target==home else '/'+str(target.parent.relative_to(out))+'/'
        content=content.replace('href="/local-help/">Find local help <span aria-hidden="true">↗</span>', 'href="/book/">Book or call <span aria-hidden="true">↗</span>')
        content=content.replace('<nav aria-label="Mobile navigation">','<nav aria-label="Mobile navigation"><a href="/book/">Book or call a business</a>',1)
        # Add an explicit scheduling action on every existing business profile.
        slug=target.parent.name
        r=by_slug.get(slug) if '/businesses/' in path else None
        if r:
            intro='<section class="profile-scheduling wrap" aria-label="Arrange a visit"><div><span class="eyebrow">YOUR NEXT STEP</span><h2>'+('Book with Middletown HVAC' if r.get('booking') else 'Arrange a time with '+e(r['name']))+'</h2><p>'+('Continue to Housecall Pro to enter your details and complete its booking steps.' if r.get('booking') else 'Contact the business directly to discuss availability and agree on a time.')+'</p></div><div class="booking-actions">'+actions(r)+'</div></section>'
            if r['key']=='middletown':
                intro += '<p class="wrap"><a href="/contact/">All Middletown contact options →</a></p>'
            content=content.replace('</main>',intro+'</main>',1)
        if path=='/our-standards/':
            content=content.replace('</main>','<section class="wrap profile-scheduling"><div><h2>The basics, in one place.</h2><p>Looking for a compact reference?</p></div><a href="/facts/">Home-service names, services and contact details →</a></section></main>',1)
        # Small-screen actions reflect the business on the current page.
        selected=r
        if path.startswith('/services/'):
            service=path.split('/')[2]
            provider={'heating-cooling':'middletown','ductless-mini-splits':'middletown','water-heaters':'middletown','boilers':'middletown','maintenance':'middletown','replacement-estimates':'middletown','second-opinion':'middletown','oil-to-gas-conversion':'middletown','electrical':'ryan','plumbing':'liberator','handyman':'cooke','painting':'rolledright','construction-remodeling':'hart'}.get(service)
            selected=next((x for x in records if x['key']==provider),None)
        if path=='/start/':
            dock='<aside id="projectConnectionDock" class="contact-dock" aria-label="Contact your selected business" hidden></aside>'
        elif selected:
            dock='<aside class="contact-dock provider-dock" aria-label="Contact '+e(selected['name'],quote=True)+'">'+actions(selected,True)+'</aside>'
        else:
            dock='<aside class="contact-dock" aria-label="Find or schedule local help"><a class="btn outline" href="/services/">Find a service</a><a class="btn primary" href="/book/">Book or call</a></aside>'
        content=re.sub(r'<aside class="contact-dock".*?</aside>',lambda _:dock,content,count=1,flags=re.S)
        # A short handoff note sits next to Middletown's direct booking buttons.
        if selected and selected.get('booking') and '/services/' in path:
            content=re.sub(r'(<div class="emailactions">.*?</div>)',lambda m:m.group(1)+'<p class="booking-handoff">Online booking opens Housecall Pro. Enter your details there; the planner is optional.</p>',content,count=1,flags=re.S)
        content=content.replace('</head>','<link rel="stylesheet" href="/assets/audit-finish.css"></head>',1)
        content=content.replace('</body>','<script type="module" src="/assets/action-icons.js"></script></body>',1)
        target.write_text(content)
    for name in ('audit-finish.css','action-icons.js','booking.js'):
        shutil.copy(root/'assets'/name,out/'assets'/name)
