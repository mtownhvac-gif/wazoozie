"""A cinematic homepage entrance with immediate, honest referral paths."""
import html
import json
import re
import shutil
from homeowner_tools import section_range


def add(out,origin,pages):
    home=out/'index.html';s=home.read_text()
    start,end=section_range(s,'<section class="concierge-home wrap"')
    old=s[start:end]
    finder=old[old.index('<div class="concierge-finder"'):old.rfind('</section>')]
    entrance='''<section class="grand-hero" aria-labelledby="hero-title"><img class="grand-hero-image" src="/assets/valley-stone-home.jpg" width="1536" height="1024" alt="Illustrative Pennsylvania stone home with an autumn garden" fetchpriority="high"><div class="wrap grand-hero-inner"><div class="grand-kicker"><span class="grand-line" aria-hidden="true"></span> THE GOOD LIFE, LOCALLY.</div><h1 id="hero-title">A life well lived.<br><em>People well chosen.</em></h1><p>The home you love. The car you count on. The next chapter you’re planning. Start with a local name and a clearer conversation.</p><div class="grand-hero-actions"><a class="grand-primary" href="/local-help/">Explore your local shortlist <span aria-hidden="true">↗</span></a><a class="grand-secondary" href="/home-tips/">Wander through the field guide →</a></div><div class="grand-hero-bottom"><span>DELCO · CHESTER COUNTY · THE MAIN LINE</span><a href="#grand-paths">Find your next good connection ↓</a></div></div></section><div class="wrap grand-paths" id="grand-paths"><a href="/#find"><span class="grand-number">01</span><div><small>THE PLACE YOU CALL HOME</small><h2>Care. Comfort. A little possibility.</h2><p>Meet local home-service businesses.</p></div><span class="grand-arrow" aria-hidden="true">↗</span></a><a href="/auto-mechanics/"><span class="grand-number">02</span><div><small>THE WAY YOU GET THERE</small><h2>A name for the road ahead.</h2><p>Get to know the automotive referral.</p></div><span class="grand-arrow" aria-hidden="true">↗</span></a><a href="/real-estate-agents/"><span class="grand-number">03</span><div><small>THE NEXT CHAPTER</small><h2>A move worth talking about.</h2><p>Meet recommended real estate professionals.</p></div><span class="grand-arrow" aria-hidden="true">↗</span></a></div><section class="concierge-home wrap grand-finder" aria-label="Find the right local help"><div class="grand-finder-intro"><div class="eyebrow">FROM POSSIBILITY TO A PLAN.</div><h2>Something on<br><em>your home’s mind?</em></h2><p>A room to rethink. A repair to take care of. A bigger idea that’s finally ready for its first conversation.</p><p>Choose the project, see the named business and decide how you want to make contact.</p><div class="grand-finder-links"><a href="/project-kit/">Prepare a project sheet ↗</a><a href="/compare/">Look at two estimates ↗</a><a href="/home-care-reminder/">Make a little room for later ↗</a></div><p class="grand-fine">Browsing and direct contact stay available without an account.</p></div>'''+finder+'</section>'
    s=s[:start]+entrance+s[end:]
    marker='<section class="wrap local-home-expansion"'
    if marker in s:
        a,b=section_range(s,marker);s=s[:a]+s[b:]
    title='Wazoozie | Local Help for Home, Auto & Real Estate'
    description='Explore local recommendations for your home, your car and your next move. Meet named businesses and professionals, read practical field notes and plan a useful first conversation.'
    s=re.sub(r'<title>.*?</title>',lambda _: '<title>'+html.escape(title)+'</title>',s,count=1)
    for attr,key,value in [('name','description',description),('property','og:title',title),('property','og:description',description),('name','twitter:title',title),('name','twitter:description',description)]:
        s=re.sub(r'<meta '+attr+'="'+re.escape(key)+r'"[^>]*>',lambda _,a=attr,k=key,v=value: '<meta '+a+'="'+k+'" content="'+html.escape(v,quote=True)+'">',s,count=1)
    def schema(match):
        data=json.loads(match.group(1))
        for item in data.get('@graph',[data]):
            if item.get('@type')=='WebPage':item.update(name=title,description=description)
        return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+'</script>'
    s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema,s,flags=re.S)
    s=s.replace('</head>','<link rel="stylesheet" href="/assets/grand.css"></head>')
    home.write_text(s);shutil.copy(out.parent/'assets/grand.css',out/'assets/grand.css')
