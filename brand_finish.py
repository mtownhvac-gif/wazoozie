"""A coherent publication-style finish for Wazoozie's existing destinations."""
import html
import re
import shutil
from editorial import write_editorial_page

E = html.escape
COLLECTIONS = [
    ('heating-cooling', 'Heating & cooling', 'Furnace trouble, AC repairs and replacement plans.', 'middletown-outdoor-project'),
    ('ductless-mini-splits', 'Room-by-room comfort', 'For the room that is always too hot or too cold.', 'clay-ductless-comfort'),
    ('water-heaters', 'Hot water & tankless', 'Plan a replacement or find out about tankless.', 'clay-tankless-bath'),
    ('plumbing', 'Plumbing & drains', 'Leaks, slow drains and fixture projects.', 'clay-plumbing-leak'),
    ('electrical', 'Electrical & lighting', 'Outdoor lighting, outlets and bigger electrical jobs.', 'clay-outdoor-lighting'),
    ('painting', 'Painting & finishing', 'Walls, cabinets, drywall and the prep work.', 'clay-family-painting'),
    ('handyman', 'Carpentry & home repairs', 'Doors, trim and the repairs you keep putting off.', 'clay-door-replacement'),
    ('construction-remodeling', 'Windows & remodeling', 'Windows, decks and changes to the space you have.', 'clay-window-renovation'),
    ('maintenance', 'Seasonal maintenance', 'Find out what is included before you book a tune-up.', 'clay-dusty-filter'),
]


def div_range(content, marker):
    start = content.index(marker)
    depth = 0
    for match in re.finditer(r'</?div\b[^>]*>', content[start:]):
        depth += -1 if match.group().startswith('</') else 1
        if depth == 0:
            return start, start + match.end()
    raise ValueError('Unbalanced container: '+marker)


def art(name, alt, priority=False):
    return '<figure class="brand-art"><img src="/assets/'+name+'.webp" alt="'+E(alt, quote=True)+'" width="1200" height="800" decoding="async" '+('fetchpriority="high"' if priority else 'loading="lazy"')+'><figcaption>AI-created clay illustration · Fictional people and scenes.</figcaption></figure>'


def visual_card(url, title, copy, name, number, real=False):
    is_project = name.startswith('middletown-')
    is_home = name.startswith('valley-')
    label = 'Photo: Sound Wraps' if real else 'Published work · Middletown HVAC' if is_project else 'Editorial home imagery' if is_home else 'The Wazoozie collection'
    alt = 'Published Sound Wraps vehicle project' if real else 'Outdoor heat-pump project published by Middletown HVAC' if is_project else 'Illustrative Pennsylvania stone home' if is_home else 'AI-created clay illustration for '+title.lower()
    extension = '.jpg' if is_project else '.webp'
    return '<a class="brand-collection-card" href="'+url+'"><div class="brand-collection-image"><img src="/assets/'+name+extension+'" alt="'+E(alt, quote=True)+'" width="1200" height="800" loading="lazy" decoding="async"><span>'+label+'</span></div><div class="brand-collection-copy"><span class="brand-card-number">'+number+'</span><h3>'+E(title)+'</h3><p>'+E(copy)+'</p><strong>Take a look <span aria-hidden="true">↗</span></strong></div></a>'


def human_copy(content):
    edits = {
        'The house. The car. The next move. We make room for small businesses and local affiliates with strong reputations. Read who recommended each new connection, check the linked evidence and talk directly with the people behind the work.': 'Need a repair, a mechanic, or help with a move? Start with the people here. Read why they’re listed, check their details, and give the business a call.',
        'A clearer next step.': 'Here’s where to start.',
        'Your next good step.': 'What to do next.',
        'Get to know your next good connection.': 'Find someone you’d feel good calling.',
        'Get to know the business.': 'About the business.',
        'MAKE YOUR NEXT PROJECT A CLEARER CONVERSATION.': 'LET’S TALK ABOUT THE JOB.',
        'FROM POSSIBILITY TO A PLAN.': 'LET’S GET IT SORTED.',
        'Small details worth noticing. Better questions worth asking. Practical ideas for making the place you call home feel more considered.': 'Things you can check, questions worth asking, and jobs you can stop putting off.',
        'A little wiser.': 'Know your house.',
        'Find your next good idea': 'Find a tip you can use',
        'Useful things.': 'Tools you’ll actually use.',
        'Excellent rabbit holes.': 'A few things just for fun.',
        'Each tool and collection has its own home. Find the one that fits what you’re wondering about.': 'Compare a quote, plan a project or play the daily quiz. Pick what you came for.',
        'The pitch. The plot twist.': 'The pitch sounded great…',
        'People worth a conversation.': 'People worth calling.',
        'Make the first call count.': 'Get ready for the first call.',
        'Your home, better understood.': 'Get to know your house.',
        'A little thought. A place that feels like you.': 'A house you’re happy to come home to.',
        'Good local people. Clearer numbers. A little more happy at home.': 'Find good local help, get a handle on the cost, and get on with your day.',
        'Get choosy. Go Wazoozie.': 'I’m choosy. I use Wazoozie.',
        'GET CHOOSY. GO WAZOOZIE.': 'I’M CHOOSY. I USE WAZOOZIE.',
    }
    # Edit site copy, leaving quoted reviews, code, input values and sources alone.
    protected = re.split(r'(<(?:script|style|blockquote|textarea|pre|code)\b.*?</(?:script|style|blockquote|textarea|pre|code)>)', content, flags=re.S|re.I)
    for index, section in enumerate(protected):
        if re.match(r'<(?:script|style|blockquote|textarea|pre|code)\b', section, re.I):
            continue
        pieces = re.split(r'(<[^>]+>)', section)
        for n in range(0, len(pieces), 2):
            for old, new in edits.items():
                pieces[n] = pieces[n].replace(old, new)
        protected[index] = ''.join(pieces)
    content = ''.join(protected)
    content = content.replace('Let your work<br><em>make the introduction.</em>', 'Run a good local business?<br><em>Let’s help people find you.</em>')
    content = content.replace('Something on<br><em>your home’s mind?</em>', 'What needs<br><em>doing at home?</em>')
    content = content.replace('A room to rethink. A repair to take care of. A bigger idea that’s finally ready for its first conversation.', 'Tell us what you need done. We’ll point you toward the right business and help you get ready to call.')
    content = content.replace('Find your next<br><em>good discovery.</em>', 'Have a look<br><em>around.</em>')
    return content


def add(out, origin, pages):
    # A neutral service collection replaces the old single-business sidebar.
    target = out/'services/index.html'
    old = target.read_text()
    existing = re.findall(r'<a href="(/services/[^\"]+/)"><h3>(.*?)</h3>', old)
    primary = {'/services/'+slug+'/' for slug, *_ in COLLECTIONS}
    extra = [(url, html.unescape(re.sub(r'\s*↗$', '', title))) for url, title in existing if url not in primary]
    cards = ''.join(visual_card('/services/'+slug+'/', title, copy, image, f'{i:02d}') for i, (slug,title,copy,image) in enumerate(COLLECTIONS, 1))
    body = '<div class="wrap brand-service-collection"><div class="breadcrumb"><a href="/local-help/">Local help</a><span>/</span>Home services</div><header class="brand-collection-heading"><div><div class="eyebrow">THE HOME COLLECTION</div><h1>What needs<br><em>doing at your place?</em></h1><p>Some jobs need doing now. Others have been on the list for a while. Find yours below, then get to know the person you’ll call.</p></div><aside><span>GET CHOOSY. GO WAZOOZIE.</span><p>Start with the job.<br>Find someone you’d feel good calling.</p><a href="/home-services/">Browse the local businesses →</a></aside></header><section class="brand-collection-grid" aria-label="Explore home services">'+cards+'</section><p class="brand-image-note">Clay scenes are AI-created illustrations. The outdoor-unit photo shows work published by <a href="https://www.mtownhvac.com/services/ductless/">Middletown HVAC ↗</a>.</p><section class="brand-specialist-links"><h2>A more specific project?</h2>'+''.join('<a href="'+url+'">'+E(title)+' →</a>' for url,title in extra)+'</section><section class="brand-next-step"><div><span class="eyebrow">BEFORE THE FIRST CONVERSATION</span><h2>Know what you’re asking for.</h2><p>Check the general cost ranges, prepare your questions, and confirm service fit, coverage and availability with the business.</p></div><div><a class="btn primary" href="/pricing-guide/">Explore the cost guide →</a><a href="/project-kit/">Prepare a project sheet →</a><a href="/our-standards/">How we choose & what we check →</a></div></section></div>'
    write_editorial_page(out, origin, pages, '/services/', 'Local home services | Heating, plumbing, electrical & home projects', 'Explore local heating, cooling, ductless, hot water, plumbing, electrical, painting, carpentry and remodeling services. Find the project and choose who you contact.', body)

    # Short, image-led category entries work on the front door and local hub.
    groups = [('/home-services/','The house.','Comfort, repairs and the next big project.','valley-stone-home',False),('/auto-mechanics/','The car.','Good local contacts for the road ahead.','clay-auto-pickup',False),('/vehicle-wraps/','The finishing touch.','Vehicle wraps and vinyl customization.','sound-wraps-project',True),('/real-estate-agents/','The next chapter.','People to talk to about your next move.','clay-home-keys',False)]
    group_cards = ''.join(visual_card(url,title,copy,image,f'{i:02d}',real) for i,(url,title,copy,image,real) in enumerate(groups,1))
    note = '<p class="brand-image-note">Clay scenes and home imagery are AI-created illustrations. Vehicle-wrap photo: Sound Wraps, from its <a href="https://www.facebook.com/photo/?fbid=1575250094402346">published project photo ↗</a>.</p>'
    home = out/'index.html'
    content = home.read_text()
    a,b = div_range(content, '<div class="front-door-categories">')
    content = content[:a]+'<div class="front-door-categories brand-category-grid">'+group_cards+'</div>'+note+content[b:]
    content = content.replace('Good help starts here.', 'Local people. Real possibilities.')
    comfort = '<aside class="brand-comfort-callout" aria-label="Ductless planning with Middletown HVAC"><img src="/assets/clay-ductless-comfort.webp" width="1200" height="800" loading="lazy" alt="AI-created illustration of a family enjoying a room with a mini-split"><div><span class="eyebrow">HEATING &amp; COOLING</span><h3>Got a room that’s never comfortable?</h3><p>Middletown HVAC’s ductless tool can help you start planning. Have them check the room before you pick a system.</p><div><a href="/services/ductless-mini-splits/">See the ductless options →</a><a href="https://www.mtownhvac.com/ductless-estimator/?utm_source=wazoozie&amp;utm_medium=referral&amp;utm_campaign=home-comfort">Try Middletown’s estimator ↗</a></div><small>AI-created editorial illustration.</small></div></aside>'
    content = content.replace('</section><section class="wrap front-door-note"', comfort+'</section><section class="wrap front-door-note"', 1)
    home.write_text(content)
    local = out/'local-help/index.html'
    content = local.read_text()
    a,b = div_range(content, '<div class="local-category-grid">')
    content = content[:a]+'<div class="local-category-grid brand-category-grid">'+group_cards+'</div>'+note+content[b:]
    local.write_text(content)

    # Give the tools and cost guide a considered editorial cover.
    target = out/'explore/index.html'
    content = target.read_text()
    content = re.sub(r'<header class="wrap destination-intro">.*?</header>', lambda m:'<div class="wrap brand-cover brand-discovery-cover">'+m.group().replace('class="wrap destination-intro"','class="destination-intro"')+'<figure class="brand-art"><img src="/assets/valley-colonial-home.webp" alt="Illustrative colonial home with mature landscaping" width="1280" height="853" fetchpriority="high"><figcaption>AI-created editorial home imagery.</figcaption></figure>'+'</div>', content, count=1, flags=re.S)
    target.write_text(content)
    target = out/'pricing-guide/index.html'
    content = target.read_text()
    a,b = div_range(content, '<div class="buying-intro">')
    content = content[:a]+'<div class="brand-cover brand-cost-cover">'+content[a:b]+art('clay-window-renovation','A fictional family discussing a window project with an installer',True)+'</div>'+content[b:]
    target.write_text(content)

    hvac_intents = {'heating-cooling':'comfort','ductless-mini-splits':'comfort','water-heaters':'water','boilers':'boiler','maintenance':'maintenance','replacement-estimates':'replacement','oil-to-gas-conversion':'replacement','second-opinion':'secondopinion'}
    work_photos = {'heating-cooling':'middletown-outdoor-project','ductless-mini-splits':'middletown-ductless-project','water-heaters':'middletown-tankless-project'}
    for slug, intent in hvac_intents.items():
        target = out/'services'/slug/'index.html'
        content = target.read_text()
        request_link = '<a class="btn outline" href="/start/?intent='+intent+'">Send Middletown a request →</a>'
        content = re.sub(r'(<div class="emailactions">.*?)(</div>)', lambda m:m.group(1)+request_link+m.group(2), content, count=1, flags=re.S)
        if slug in work_photos:
            photo = work_photos[slug]
            proof = '<figure class="brand-middletown-work"><img src="/assets/'+photo+'.jpg" width="1000" height="750" loading="lazy" alt="Installation photo published by Middletown HVAC"><figcaption>Published Middletown HVAC project · <a href="/projects/">See the work →</a></figcaption></figure>'
            content = content.replace('<aside class="contact-card">', '<aside class="contact-card">'+proof, 1)
        target.write_text(content)

    for name in ('brand-family-porch','clay-local-pro','brand-family-planning','clay-gutter-care'):
        shutil.copy(out.parent/'assets'/(name+'.webp'), out/'assets'/(name+'.webp'))
    covers = [
        ('local-help','<div class="local-intro">','brand-family-porch','A fictional family relaxing on a stone-house porch',False),
        ('project-kit','<div class="workbench-page-head">','brand-family-planning','A fictional family planning a home project at the kitchen table',False),
        ('home-care-reminder','<div class="growth-intro">','clay-gutter-care','A fictional tradesperson clearing a detached gutter section at a ground-level workbench',True),
    ]
    for route, marker, name, alt, is_clay in covers:
        target = out/route/'index.html'
        content = target.read_text()
        a,b = div_range(content, marker)
        intro = content[a:b]
        if route == 'home-care-reminder':
            after = re.match(r'(<p>.*?</p>)', content[b:], flags=re.S)
            if after:
                intro += after.group()
                b += len(after.group())
        figure = art(name, alt, True)
        if not is_clay:
            figure = figure.replace('AI-created clay illustration', 'AI-created editorial image')
        content = content[:a]+'<div class="brand-cover brand-people-cover"><div>'+intro+'</div>'+figure+'</div>'+content[b:]
        target.write_text(content)
    target = out/'for-contractors/index.html'
    content = target.read_text()
    content = re.sub(r'<section class="project-intro">.*?</section>', lambda m:'<div class="brand-cover brand-people-cover">'+m.group()+art('clay-local-pro','Fictional local tradesperson carrying a folded ladder and greeting a homeowner',True)+'</div>', content, count=1, flags=re.S)
    target.write_text(content)

    # Consistent navigation, active states and share imagery across destinations.
    image_by_route = {'/':'clay-family-painting','/services/':'clay-family-shelving','/local-help/':'brand-family-porch','/home-services/':'clay-hot-water','/explore/':'clay-family-shelving','/pricing-guide/':'clay-window-renovation','/project-kit/':'brand-family-planning','/home-care-reminder/':'clay-gutter-care','/for-contractors/':'clay-local-pro','/before-you-say-yes/':'clay-fine-print-pitchman','/auto-mechanics/':'clay-auto-pickup','/real-estate-agents/':'clay-home-keys'}
    from clay_storytelling import SCENES
    for name, (_, routes) in SCENES.items():
        for route in routes:
            image_by_route['/'+route+'/'] = name
    for target in out.rglob('*.html'):
        content = target.read_text()
        path = '/' if target == out/'index.html' else '/'+str(target.parent.relative_to(out))+'/'
        current = 'people' if path.startswith(('/services/','/businesses/')) or path in ('/local-help/','/home-services/','/auto-mechanics/','/vehicle-wraps/','/real-estate-agents/') else 'cost' if path == '/pricing-guide/' else 'account' if path == '/account/' else 'explore' if path in ('/explore/','/home-tips/','/good-call-club/','/before-you-say-yes/','/local-stories/','/project-kit/','/compare/','/project-budget/','/home-care-reminder/') or path.startswith('/guides/') else ''
        links = [('people','/local-help/','Local people'),('cost','/pricing-guide/','Cost guide'),('explore','/explore/','Tools & stories'),('account','/account/','Log in / Create account')]
        nav = '<nav aria-label="Main navigation">'+''.join('<a href="'+url+'"'+((' aria-current="page"' if path == url else ' aria-current="location"') if key == current else '')+'>'+label+'</a>' for key,url,label in links)+'<a class="btn primary" href="/local-help/">Find local help <span aria-hidden="true">↗</span></a></nav>'
        content = re.sub(r'<nav aria-label="Main navigation">.*?</nav>', lambda _:nav, content, count=1, flags=re.S)
        mobile = [('Explore local help','/local-help/'),('Cost guide','/pricing-guide/'),('Home services','/home-services/'),('Auto care','/auto-mechanics/'),('Vehicle wraps','/vehicle-wraps/'),('Real estate','/real-estate-agents/'),('Tools, guides & play','/explore/'),('Log in / Create account','/account/'),('For local businesses','/for-contractors/')]
        content = re.sub(r'<nav aria-label="Mobile navigation">.*?</nav>', lambda _:'<nav aria-label="Mobile navigation">'+''.join('<a href="'+url+'">'+label+'</a>' for label,url in mobile)+'</nav>', content, count=1, flags=re.S)
        # Keep clear captions compact and readable, including on business pages.
        content = content.replace('AI-created clay-style illustration · Fictional scene, not a documented customer project or business employee.', 'AI-created clay illustration · Fictional people and scenes.')
        name = image_by_route.get(path)
        if name:
            url = (origin or 'http://localhost:8123')+'/assets/'+name+'.webp'
            for attr,key,value in [('property','og:image',url),('property','og:image:width','1200'),('property','og:image:height','800'),('property','og:image:alt','Wazoozie AI-created editorial image; fictional people and scenes'),('name','twitter:image',url),('name','twitter:card','summary_large_image')]:
                tag = '<meta '+attr+'="'+key+'" content="'+E(value,quote=True)+'">'
                pattern = r'<meta '+attr+'="'+re.escape(key)+r'"[^>]*>'
                if re.search(pattern, content):
                    content = re.sub(pattern, lambda _:tag, content)
                else:
                    content = content.replace('</head>',tag+'</head>',1)
        content = human_copy(content)
        content = content.replace('<body>', '<body class="brand-finished">', 1)
        content = content.replace('</head>', '<link rel="stylesheet" href="/assets/brand-finish.css"></head>', 1)
        target.write_text(content)
    shutil.copy(out.parent/'assets/brand-finish.css', out/'assets/brand-finish.css')
