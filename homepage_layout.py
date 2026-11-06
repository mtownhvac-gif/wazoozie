"""A short front door with dedicated destinations for discovery and services."""
import re
import shutil
from homeowner_tools import section_range
from editorial import write_editorial_page


def add(out, origin, pages):
    root = out.parent
    for name in ('price-notebook', 'vinyl-road', 'front-door', 'fine-print-stage', 'good-call-club', 'hvac-comfort'):
        shutil.copy(root/'assets'/(name+'.webp'), out/'assets'/(name+'.webp'))
    home = out/'index.html'
    original = home.read_text()

    def section(marker):
        a, b = section_range(original, marker)
        return original[a:b]

    def image(name, alt, cls=''):
        return '<img class="'+cls+'" src="/assets/'+name+'" alt="'+alt+'" width="960" height="640" loading="lazy" decoding="async">'

    cards = [
        ('price-notebook.webp', 'Illustrative project-planning notebook', '/pricing-guide/', 'THE PRICE NOTEBOOK', 'A number with context.', 'National cost ranges, scope notes and the offer decoder.'),
        ('good-call-club.webp', 'Illustrative home-and-car board game', '/good-call-club/', 'GOOD CALL CLUB', 'Five questions. A little glory.', 'Play the daily quiz. Collect Wins. Build your badge collection.'),
        ('clay-fine-print-pitchman.webp', 'Fictional clay-style sales pitchman with commission and scare-script props', '/before-you-say-yes/', 'FINE PRINT THEATER', 'The pitch. The plot twist.', 'Explore the details worth asking about before you approve.'),
        ('carpentry.jpg', 'Illustrative carpentry planning scene', '/project-kit/', 'THE PROJECT DESK', 'Make the first call count.', 'Prepare a project sheet with useful questions for your chosen business.'),
        ('clay-window-renovation.webp', 'AI-created clay-style family admiring a new window', '/home-tips/', 'THE FIELD GUIDE', 'Your home, better understood.', 'Practical tips, seasonal inspiration and friendly next steps.'),
        ('front-door.webp', 'Illustrative stone-house entrance', '/local-help/', 'THE LOCAL SHORTLIST', 'People worth a conversation.', 'Find help for the house, the car and your next move.'),
    ]

    def card(item):
        name, alt, url, kicker, title, copy = item
        return '<a class="explore-card" href="'+url+'">'+image(name, alt)+'<div><span>'+kicker+'</span><h3>'+title+'</h3><p>'+copy+'</p><strong>Explore →</strong></div></a>'

    hub = '<section class="wrap explore-hub buying-home" id="explore" aria-labelledby="explore-title"><div class="homepage-heading"><div><div class="eyebrow">THE WAZOOZIE EDIT</div><h2 id="explore-title">Find your next<br><em>good discovery.</em></h2></div><p>Choose a destination. Make a little room<br>for useful ideas and a good time.</p></div><div class="explore-grid">'+''.join(card(c) for c in cards)+'</div><p class="homepage-image-note">Editorial illustrations are illustrative; labeled project photos show published business work.</p></section>'
    explore_intro = '<header class="wrap destination-intro"><div class="breadcrumb"><a href="/">Home</a><span>/</span>Tools & discoveries</div><div class="eyebrow">PULL UP A CHAIR.</div><h1>Useful things.<br><em>Excellent rabbit holes.</em></h1><p>Each tool and collection has its own home. Find the one that fits what you’re wondering about.</p></header>'
    shortcuts = '<section class="wrap destination-shortcuts"><h2>Already know what you need?</h2><a href="/compare/">Compare two estimates →</a><a href="/project-budget/">Plan a project budget →</a><a href="/home-care-reminder/">Make a care reminder →</a><a href="/my-home/">Open my home list →</a><a href="/local-stories/">Around the neighborhood →</a></section>'
    write_editorial_page(out, origin, pages, '/explore/', 'Tools, guides & Good Call Club', 'Explore Wazoozie’s pricing guide, project tools, homeowner field guide and daily Good Call Club quiz. Choose a dedicated page for your next step.', explore_intro+hub+shortcuts)

    finder = section('<section class="concierge-home wrap grand-finder"')
    finder = finder.replace('Choose the project, see the named business and decide how you want to make contact.', 'Choose your project. Meet the business and decide how you want to get in touch.')
    finder = finder.replace('<div class="grand-finder-links">', '<figure class="clay-editorial finder-family"><img src="/assets/clay-hot-water.webp" alt="AI-created clay-style parent and child sharing an everyday kitchen moment" width="1200" height="800" loading="lazy"><figcaption>AI-created editorial illustration · Good help for everyday life.</figcaption></figure><div class="grand-finder-links">', 1)
    directory = section('<section class="directory"')
    directory = directory.replace('Your next call starts with a name.', 'Your local contacts.').replace('The people behind the work', 'WHEN YOU’RE READY TO CONNECT')
    services_intro = '<header class="wrap destination-intro"><div class="breadcrumb"><a href="/local-help/">Local help</a><span>/</span>Home services</div><div class="eyebrow">THE PEOPLE BEHIND THE WORK.</div><h1>Your home.<br><em>Good people to call.</em></h1><p>Heating, cooling, plumbing, electrical work, repairs and finishing touches. Start with the project or browse the business profiles.</p><a href="/services/">Browse every service category →</a></header>'
    write_editorial_page(out, origin, pages, '/home-services/', 'Local home-service businesses & project finder', 'Find local heating, cooling, plumbing, electrical, carpentry, painting and remodeling contacts. Explore profiles and choose how to contact the business.', services_intro+finder+directory+'<div class="wrap">'+section('<section class="valley"')+'</div>'+section('<section class="wrap why-local"'))

    service_page = out/'home-services/index.html'
    dialogs = ''.join(re.findall(r'<dialog\b.*?</dialog>', original, flags=re.S))
    service_page.write_text(service_page.read_text().replace('</body>', dialogs+'<script src="/assets/home.js" defer></script></body>'))
    stories_intro = '<header class="wrap destination-intro"><div class="breadcrumb"><a href="/explore/">Discoveries</a><span>/</span>Local stories</div><h1>Around the neighborhood.</h1><p>Published projects, service introductions and ideas for your next conversation. Illustrative scenes are labeled.</p></header>'
    write_editorial_page(out, origin, pages, '/local-stories/', 'Local project stories & service introductions', 'Browse Wazoozie’s curated local business introductions and published project stories, with clear image labels and direct service links.', stories_intro+'<div class="wrap">'+section('<section class="neighbor-layout"')+'</div>')
    story_page = out/'local-stories/index.html'
    story_page.write_text(story_page.read_text().replace('</head>', '<link rel="stylesheet" href="/assets/neighborhood-feed.css"></head>').replace('</body>', '<script src="/assets/neighborhood-feed.js" defer></script></body>'))

    hero = section('<section class="grand-hero"')
    hero = re.sub(r'<h1 id="hero-title">.*?</h1>', '<h1 id="hero-title">What should<br><em>your project cost?</em></h1>', hero, flags=re.S)
    hero = hero.replace('Small businesses. Local affiliates. Reputations worth protecting. Meet the people behind the work—for the home you love, the car you count on and the next chapter you’re planning.', 'Good local people. Clearer numbers. A little more happy at home.')
    hero = hero.replace('href="/local-help/">Explore your local shortlist', 'href="/pricing-guide/">Explore the pricing guide').replace('href="/home-tips/">Wander through the field guide →', 'href="/local-help/">Find local help →')
    hero = hero.replace('href="#grand-paths">Find your next good connection ↓', 'href="/explore/">Tools, guides & a little fun →')
    hero = hero.replace('/assets/valley-stone-home.jpg', '/assets/clay-family-painting.webp').replace('Illustrative Pennsylvania stone home with an autumn garden', 'AI-created clay-style family enjoying a painting project')
    hero = hero.replace('</section>', '<span class="grand-illustration-note">AI-created editorial illustration</span></section>', 1)
    front_cards = '<section class="wrap explore-hub buying-home front-door-edit" id="explore" aria-labelledby="explore-title"><div class="homepage-heading"><div><div class="eyebrow">MAKE YOURSELF AT HOME.</div><h2 id="explore-title">Where shall we start?</h2></div><a href="/explore/">All tools & discoveries →</a></div><div class="explore-grid">'+''.join(card(cards[i]) for i in (0,4,1))+'</div><p class="homepage-image-note">Custom editorial illustrations. Explore each collection on its own page.</p></section>'
    categories = [('/home-services/','01','The house.','Repairs, comfort and the next big project.'),('/auto-mechanics/','02','The car.','Auto care and transmission specialists.'),('/vehicle-wraps/','03','The finishing touch.','Vehicle wraps and vinyl customization.'),('/real-estate-agents/','04','The next chapter.','Conversations about buying and selling.')]
    local = '<section class="wrap front-door-local" id="find"><div class="homepage-heading"><div><div class="eyebrow">YOUR LOCAL SHORTLIST.</div><h2>Good help starts here.</h2></div><a href="/local-help/">Explore all local help →</a></div><div class="front-door-categories">'+''.join('<a href="'+url+'"><span>'+number+'</span><h3>'+title+'</h3><p>'+copy+'</p><strong>Meet your local contacts →</strong></a>' for url,number,title,copy in categories)+'</div></section>'
    trust = '<section class="wrap front-door-note" id="partners"><div><div class="eyebrow">GET CHOOSY. GO WAZOOZIE.</div><h2>Get to know your next good connection.</h2><p>Read why a business is listed, review the linked evidence and choose who you contact. Wazoozie is operated by Bryan Cordy, owner of Middletown HVAC. Recommendations and recorded checks are explained on the profiles.</p><a href="/our-standards/">How we choose & what we check →</a></div><aside><a href="/account/">Your Wazoozie · Create an account or sign in →</a><a href="/for-contractors/">Own a local business? Start here →</a><a href="/share-wazoozie/">Know someone who could use this? →</a></aside></section>'
    original = original.replace('<script src="/assets/home.js" defer></script>', '').replace('<script src="/assets/neighborhood-feed.js" defer></script>', '')
    home.write_text(re.sub(r'<main id="main">.*?</main>', lambda _:'<main id="main">'+hero+front_cards+local+trust+'</main>', original, count=1, flags=re.S))

    # Keep familiar links working while directing navigation to dedicated pages.
    for target in out.rglob('*.html'):
        content = target.read_text()
        content = content.replace('href="/#find"', 'href="/home-services/"').replace('href="/#explore"', 'href="/explore/"')
        if target == out/'home-services/index.html':
            content = content.replace('href="/home-services/"', 'href="#find"')
        content = content.replace('href="/project-kit/">Project tools</a>', 'href="/explore/">Tools, tips &amp; play</a>')
        content = content.replace('<strong>The useful details</strong>', '<strong>The useful details</strong><a href="/explore/">Tools &amp; discoveries</a><a href="/good-call-club/">Good Call Club · daily quiz</a>', 1)
        content = content.replace('Your home deserves good people.<br>', 'Get choosy. Go Wazoozie.<br>')
        footer = '<div class="footergrid"><div><a href="/" class="brand"><span class="wordmark">wazoozie<span style="color:var(--orange)">.</span></span></a><p>Get choosy. Go Wazoozie.<br>Good people for the place you call home.<br>Delco · Chester County · The Main Line</p></div><div><strong>Make yourself at home</strong><a href="/local-help/">Find local help</a><a href="/pricing-guide/">The pricing guide</a><a href="/explore/">Tools &amp; discoveries</a><a href="/home-tips/">The field guide</a><a href="/good-call-club/">Good Call Club</a><a href="/projects/">Published local work</a></div><div><strong>The useful details</strong><a href="/account/">Sign in / create an account</a><a href="/about/">About Wazoozie</a><a href="/our-standards/">How we choose</a><a href="/how-it-works/">How it works</a><a href="/for-contractors/">For local businesses</a><a href="/privacy/">Privacy</a></div></div>'
        content = re.sub(r'<div class="footergrid">.*?</div>(?=<section class="operator-disclosure")', lambda _: footer, content, count=1, flags=re.S)
        content = content.replace('</head>', '<link rel="stylesheet" href="/assets/homepage-layout.css"></head>', 1)
        target.write_text(content)
    from clay_storytelling import add as add_clay_storytelling
    add_clay_storytelling(out)
    from brand_finish import add as add_brand_finish
    add_brand_finish(out, origin, pages)
    shutil.copy(root/'assets/homepage-layout.css', out/'assets/homepage-layout.css')
