"""A deliberate, service-first homepage with tools and play at the entrance."""
import re
import shutil
from homeowner_tools import section_range


def add(out, origin, pages):
    for name in ('price-notebook','vinyl-road','front-door','fine-print-stage','good-call-club','hvac-comfort'):
        shutil.copy(out.parent/'assets'/(name+'.webp'),out/'assets'/(name+'.webp'))
    home=out/'index.html';s=home.read_text()
    def section(marker):
        a,b=section_range(s,marker);return s[a:b]
    def image(name,alt,cls=''):
        return '<img class="'+cls+'" src="/assets/'+name+'" alt="'+alt+'" width="960" height="640" loading="lazy" decoding="async">'
    hero=section('<section class="grand-hero"')
    hero=re.sub(r'<h1 id="hero-title">.*?</h1>','<h1 id="hero-title">What should<br><em>your project cost?</em></h1>',hero,flags=re.S)
    hero=hero.replace('Small businesses. Local affiliates. Reputations worth protecting. Meet the people behind the work—for the home you love, the car you count on and the next chapter you’re planning.','Start with clearer numbers. Stay for useful tools, a little local know-how and good people worth getting to know.')
    hero=hero.replace('href="/local-help/">Explore your local shortlist','href="/pricing-guide/">Explore the pricing guide').replace('href="/home-tips/">Wander through the field guide →','href="/good-call-club/">Play today’s Good Call →')
    hero=hero.replace('href="#grand-paths">Find your next good connection ↓','href="#explore">Tools, tips &amp; a little fun ↓')
    cards=[('price-notebook.webp','Illustrative project-planning notebook and materials','/pricing-guide/','THE PRICE NOTEBOOK','A number with context.','National cost ranges, scope notes and the offer decoder.'),('good-call-club.webp','Illustrative home-and-car board game with star badges','/good-call-club/','GOOD CALL CLUB','Five questions. A little glory.','Play the daily quiz. Collect Wins. Build your badge collection.'),('fine-print-stage.webp','Illustrative miniature theater with a receipt and magnifying glass','/before-you-say-yes/#fine-print-theater','FINE PRINT THEATER','The pitch. The plot twist.','Pull back the curtain on the details worth asking about.'),('carpentry.jpg','Illustrative carpentry planning scene','/project-kit/','THE PROJECT DESK','Make the first call count.','Prepare your questions, compare estimates and plan a budget.'),('valley-colonial-home.webp','Illustrative landscaped colonial home','/home-tips/','THE FIELD GUIDE','Your home, better understood.','Small discoveries, practical tips and seasonal inspiration.'),('front-door.webp','Illustrative welcoming stone-house entrance','/local-help/','THE LOCAL SHORTLIST','People worth a conversation.','Find help for the house, the car and your next move.')]
    hub='<section class="wrap explore-hub buying-home" id="explore" aria-labelledby="explore-title"><div class="homepage-heading"><div><div class="eyebrow">THE WAZOOZIE EDIT</div><h2 id="explore-title">Useful. Delightful.<br><em>Worth coming back for.</em></h2></div><p>Your local starting point for smart decisions,<br>good connections and a little everyday discovery.</p></div><div class="explore-grid">'
    for name,alt,url,kicker,title,copy in cards:
        hub+='<a class="explore-card" href="'+url+'">'+image(name,alt)+'<div><span>'+kicker+'</span><h3>'+title+'</h3><p>'+copy+'</p><strong>Explore →</strong></div></a>'
    hub+='</div><p class="homepage-image-note">Editorial illustrations are illustrative; labeled project photos show published business work.</p></section>'
    start=s.index('<div class="wrap grand-paths"');depth=0;end=None
    for m in re.finditer(r'</?div\b[^>]*>',s[start:]):
        depth+=-1 if m.group().startswith('</') else 1
        if depth==0:end=start+m.end();break
    assert end is not None;paths=s[start:end]
    for url,name,alt in [('/#find','outdoor-lighting.jpg','Illustrative home lighting scene'),('/auto-mechanics/','sound-wraps-project.webp','Sound Wraps vehicle project, published on its Facebook page'),('/real-estate-agents/','front-door.webp','Illustrative stone-house doorway')]:
        paths=paths.replace('<a href="'+url+'">','<a href="'+url+'">'+image(name,alt,'path-photo'),1)
    finder=section('<section class="concierge-home wrap grand-finder"')
    finder=finder.replace('Choose the project, see the named business and decide how you want to make contact.','Choose the service first. Your selected business appears at the contact step, where you decide how to get in touch.')
    finder=finder.replace('<div class="grand-finder-links">','<figure class="comfort-art">'+image('hvac-comfort.webp','Custom illustration of home comfort with ductless and outdoor heat-pump equipment')+'<figcaption>Room-by-room possibilities. Custom editorial illustration.</figcaption></figure><div class="grand-finder-links">',1)
    why=section('<section class="wrap why-local"')
    tools=section('<section class="workbench-tools"').replace('class="workbench-tools"','class="workbench-tools" id="home-tools"',1)
    for url,name,alt in [('/project-kit/','carpentry.jpg','Illustrative carpentry planning scene'),('/compare/','window-framing.jpg','Illustrative window and construction scene'),('/my-home/','sink.jpg','Illustrative home plumbing scene')]:
        tools=tools.replace('href="'+url+'" class="workbench-tool">','href="'+url+'" class="workbench-tool">'+image(name,alt,'tool-photo'),1)
    journal=section('<section class="wrap journal-home"')
    for url,name,alt in [('/guides/painting-estimate-checklist/','valley-colonial-home.webp','Illustrative painted colonial home'),('/guides/electrical-project-estimate/','outdoor-lighting.jpg','Illustrative outdoor lighting'),('/services/ductless-mini-splits/','middletown-ductless-project.jpg','Published Middletown HVAC ductless project'),('/seasonal-home-checklist/','valley-stone-home.webp','Illustrative autumn stone home')]:
        journal=journal.replace('<a href="'+url+'">','<a href="'+url+'">'+image(name,alt,'journal-read-photo'),1)
    club='<section class="wrap club-home" aria-labelledby="club-home-title"><div class="club-home-art">'+image('good-call-club.webp','Illustrative Good Call Club game board')+image('fine-print-stage.webp','Illustrative Fine Print Theater stage','club-secondary-art')+'</div><div><div class="eyebrow">YOUR DAILY GOOD CALL</div><h2 id="club-home-title">A little wiser.<br><em>A little more legendary.</em></h2><p>Meet Good Call Club. Five daily questions about homes, cars and buying smarter. Collect Wazoozie Wins, earn digital badges and make a return visit a good habit.</p><a class="btn primary" href="/good-call-club/">Play today’s five →</a><p class="club-home-fine">Free to play. No account needed. Digital badges only; no cash value or business discounts. Progress stays in this browser.</p></div></section>'
    directory=section('<section class="directory"')
    directory=directory.replace('Your next call starts with a name.','Your local contacts.').replace('The people behind the work','WHEN YOU’RE READY TO CONNECT')
    wrap=lambda x:'<div class="wrap">'+x+'</div>'
    content=hero+hub+paths+finder+why+wrap(tools)+club+journal+directory+wrap(section('<section class="account-home-invite"'))+wrap(section('<section class="neighbor-layout"'))+wrap(section('<section class="read-section"'))+wrap(section('<section class="how"'))+wrap(section('<section class="valley"'))+wrap(section('<section class="recruit partner-band"'))
    s=re.sub(r'<main id="main">.*?</main>',lambda _:'<main id="main">'+content+'</main>',s,count=1,flags=re.S)
    s=s.replace('</head>','<link rel="stylesheet" href="/assets/homepage-layout.css"></head>',1)
    for path in ('services/heating-cooling','services/ductless-mini-splits'):
        target=out/path/'index.html';t=target.read_text().replace('</main>','<figure class="wrap service-comfort-art">'+image('hvac-comfort.webp','Illustrative heating and cooling concept with ductless and outdoor heat-pump equipment')+'<figcaption>Custom Wazoozie editorial illustration. Equipment and installation depend on a site assessment.</figcaption></figure></main>',1).replace('</head>','<link rel="stylesheet" href="/assets/homepage-layout.css"></head>',1);target.write_text(t)
    # Keep service selection neutral; provider identity remains explicit at contact.
    home.write_text(s)
    for path,name,alt in [('pricing-guide','price-notebook','Illustrative project-planning notebook'),('before-you-say-yes','fine-print-stage','Illustrative Fine Print Theater stage')]:
        target=out/path/'index.html';t=target.read_text();visual='<figure class="section-visual">'+image(name+'.webp',alt)+'<figcaption>Custom editorial illustration for Wazoozie.</figcaption></figure>';t=t.replace('<div class="buying-intro">',visual+'<div class="buying-intro">',1).replace('</head>','<link rel="stylesheet" href="/assets/homepage-layout.css"></head>',1);target.write_text(t)
    for target in out.rglob('*.html'):
        t=target.read_text().replace('<a href="/project-kit/">Project tools</a>','<a href="/#explore">Tools, tips &amp; play</a>')
        t=t.replace('<strong>The useful details</strong>','<strong>The useful details</strong><a href="/good-call-club/">Good Call Club · daily quiz</a>',1)
        target.write_text(t)
    shutil.copy(out.parent/'assets/homepage-layout.css',out/'assets/homepage-layout.css')
