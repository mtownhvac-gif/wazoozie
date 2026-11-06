"""Reduce render-blocking requests and expose honest public discovery tools."""
import hashlib
import html
import json
import re
import shutil
from urllib.parse import parse_qs,urlsplit
from local_help import PEOPLE


def add(out,origin,pages,providers):
    root=out.parent
    for name in ('valley-stone-home','valley-colonial-home'):
        for suffix in ('.webp','-small.webp'):shutil.copy(root/'assets'/(name+suffix),out/'assets'/(name+suffix))
    records=[{'name':p['name'],'category':'home','services':p['trade'],'phone':p['phone'],'profileUrl':origin+'/businesses/'+p['slug']+'/','officialUrl':p['web']} for p in providers.values()]
    records += [{'name':p['name'],'category':'auto' if p['category']=='automotive' else 'realestate','services':p['label'],'phone':p['phone'],'profileUrl':origin+'/businesses/'+p['slug']+'/','officialUrl':None if p.get('website_label') else p['website'],'publicSourceUrl':p['website']} for p in PEOPLE]
    records.sort(key=lambda p:p['name'].casefold())
    (out/'assets/public-discovery.json').write_text(json.dumps({'businesses':records,'planning':{'repairQuoteGuide':origin+'/guides/surprise-repair-quote/','roomComfortGuide':origin+'/guides/one-room-too-hot-too-cold/','autoRepairGuide':origin+'/guides/car-repair-estimate-changed/','dailyQuiz':origin+'/good-call-club/','pricingGuide':origin+'/pricing-guide/','buyerQuestions':origin+'/before-you-say-yes/','projectSheet':origin+'/project-kit/','compareEstimates':origin+'/compare/','budget':origin+'/project-budget/','homeTips':origin+'/home-tips/','reminder':origin+'/home-care-reminder/','ductless':origin+'/services/ductless-mini-splits/'}},ensure_ascii=False))
    shutil.copy(root/'assets/public-discovery.js',out/'assets/public-discovery.js')
    target=out/'services/ductless-mini-splits/index.html';s=target.read_text()
    title='Ductless Mini-Split Installation & Cost Planning | Middletown HVAC'
    desc='Explore ductless installation for bedrooms, additions and home offices. See what affects installed cost and use Middletown HVAC’s Fujitsu pricing tool.'
    s=re.sub(r'<h1[^>]*>.*?</h1>', '<h1>Ductless mini-splits.<br><em>Comfort, room by room.</em></h1>', s, count=1, flags=re.S)
    s=re.sub(r'<title>.*?</title>',lambda _: '<title>'+html.escape(title)+' | Wazoozie</title>',s,count=1)
    for attr,key,value in [('name','description',desc),('property','og:title',title),('property','og:description',desc),('name','twitter:title',title),('name','twitter:description',desc)]:
        s=re.sub(r'<meta '+attr+'="'+re.escape(key)+r'"[^>]*>',lambda _,a=attr,k=key,v=value:'<meta '+a+'="'+k+'" content="'+html.escape(v,quote=True)+'">',s,count=1)
    cost='''<section class="wrap project-inline" aria-labelledby="ductless-cost-title"><div class="eyebrow">THE QUESTION BEFORE THE ESTIMATE</div><h2 id="ductless-cost-title">How much does a ductless mini-split installation cost?</h2><p>The installed cost depends on the equipment, number of zones and work needed in your home. A single-room project and a multi-room plan can involve different scopes. Use Middletown’s published Fujitsu pricing tool for planning, then arrange a site assessment to confirm the equipment and complete installation.</p><div class="growth-grid"><article><h3>The rooms and equipment.</h3><p>Explain which spaces need attention and how you use them. Ask how equipment selection, heating needs and indoor-unit placement are assessed.</p></article><article><h3>The complete installation.</h3><p>Ask which line routes, drainage, electrical work, outdoor support, permits and finishing details are included, and which require separate pricing.</p></article><article><h3>The years after the visit.</h3><p>Request the maintenance requirements and written equipment and labor terms. Ask who handles a service concern after installation.</p></article><article><h3>What an online price can tell you.</h3><p>A pricing tool helps start the conversation. It does not inspect your house or establish the final installed scope, schedule or equipment fit.</p></article></div><p><a class="btn primary" href="https://www.mtownhvac.com/ductless-estimator/?utm_source=wazoozie&amp;utm_medium=referral&amp;utm_campaign=ductless-cost">Explore the Fujitsu ductless pricing tool ↗</a></p><p><a href="/project-kit/?intent=replacement">Prepare my installation questions →</a> · <a href="/compare/">Compare two written proposals →</a></p><p>Source: <a href="https://www.mtownhvac.com/services/ductless/">Middletown’s published ductless service and planning information</a>.</p></section>'''
    s=s.replace('</main>',cost+'</main>',1).replace('</head>','<link rel="stylesheet" href="/assets/growth.css"></head>')
    def page_schema(match):
        data=json.loads(match.group(1))
        for item in data.get('@graph',[data]):
            if item.get('@type')=='WebPage':item.update(name=title+' | Wazoozie',description=desc)
        return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+'</script>'
    s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',page_schema,s,flags=re.S)
    target.write_text(s)
    for target in out.rglob('*.html'):
        s=target.read_text()
        # Keep dimensions/aspect ratio and accessible descriptions; offer smaller image candidates.
        def image(match):
            tag=match.group(0);name=re.search(r'/assets/(valley-(?:stone|colonial)-home)\.jpg',tag).group(1)
            sizes='100vw' if 'grand-hero-image' in tag else '(max-width: 650px) 100vw, 640px'
            tag=tag.replace(name+'.jpg',name+'.webp')
            tag=re.sub(r'\s+(?:width|height)="\d+"','',tag)
            return tag[:-1]+f' width="1280" height="853" srcset="/assets/{name}-small.webp 768w, /assets/{name}.webp 1280w" sizes="{sizes}" decoding="async">'
        s=re.sub(r'<img\b[^>]*src="/assets/valley-(?:stone|colonial)-home\.jpg"[^>]*>',image,s)
        relative=target.relative_to(out).as_posix()
        if relative not in ('account/index.html','start/index.html','for-contractors/index.html','404.html'):
            s=s.replace('</body>','<script src="/assets/public-discovery.js" defer></script></body>')
        # All local styles remain in their original cascade order, in one versioned file.
        links=list(re.finditer(r'<link rel="stylesheet" href="(/assets/[^"?]+\.css)">',s))
        if len(links)>1:
            assert '<style' not in s[links[0].start():links[-1].end()],target
            imports=[];bodies=[];families=set()
            for match in links:
                css=(out/match.group(1).lstrip('/')).read_text()
                for statement in re.findall(r'@import\s+url\([^)]*\);',css):
                    url=re.search(r'url\([\'\"]?([^\'\")]+)',statement).group(1)
                    params=parse_qs(urlsplit(url).query);current=set(params.get('family',[]))
                    if not current or not current.issubset(families):
                        if statement not in imports:imports.append(statement)
                        families.update(current)
                bodies.append(re.sub(r'@import\s+url\([^)]*\);','',css))
            combined='\n'.join(imports+bodies)
            name='site-'+hashlib.sha256(combined.encode()).hexdigest()[:12]+'.css'
            (out/'assets'/name).write_text(combined)
            first=links[0].group(0);s=s.replace(first,'<link rel="stylesheet" href="/assets/'+name+'">',1)
            for match in links[1:]:s=s.replace(match.group(0),'',1)
        target.write_text(s)
    with (out/'llms.txt').open('a') as f:
        f.write('\n## Public browser-agent discovery\n\nOn public browsing pages, supported browsers can use read-only WebMCP tools to search the public business catalog and retrieve planning links. These tools return public information only and do not read accounts, send inquiries, make bookings or change saved projects. Browser support varies.\n')
