"""Crawlable directory content and consistent public search identities."""
import html,json,re
from emblems import ICONS

def improve(out,origin,providers):
    e=html.escape
    keys={p['slug']:k for k,p in providers.items()}
    home=out/'index.html';s=home.read_text()
    cards=[];items=[]
    order={providers[k]['slug']:i for i,k in enumerate(providers)}
    for position,p in enumerate(sorted(providers.values(),key=lambda p:order[p['slug']]),1):
        url='/businesses/'+p['slug']+'/'
        cards.append('<article class="procard"><div class="procover">'+ICONS.get(keys[p['slug']], ICONS['cooke'])+'<span class="procover-tag">'+e(p['trade'])+'</span><div class="procover-text">'+e(p['name'])+'</div></div><span class="badge green">Vetted by Wazoozie</span><div class="protop"><h3><a href="'+url+'">'+e(p['name'])+'</a></h3></div><p>'+e(p['intro'])+'</p><div class="proactions"><a class="btn primary" href="'+url+'">Meet the business →</a><a class="btn outline" href="tel:'+p['tel']+'">Call '+p['phone']+'</a></div></article>')
        items.append({'@type':'ListItem','position':position,'url':origin+url,'name':p['name']})
    s=s.replace('<div class="progrid" id="providerResults"></div>','<div class="progrid all-providers" id="providerResults">'+''.join(cards)+'</div>')
    if origin:
        data={'@context':'https://schema.org','@type':'ItemList','name':'Wazoozie local home-service businesses','itemListOrder':'https://schema.org/ItemListUnordered','itemListElement':items}
        s=s.replace('</head>','<script type="application/ld+json">'+json.dumps(data).replace('<','\\u003c')+'</script></head>')
    s=re.sub(r'(<[^>]+id="resultCount"[^>]*>).*?(</[^>]+>)', lambda m:m[1]+str(len(providers))+' businesses listed · confirm address coverage'+m[2], s, count=1)
    home.write_text(s)
    for f in out.rglob('*.html'):
        s=f.read_text()
        # Prioritize the visible page image; gallery images keep lazy loading.
        s=re.sub(r'(<img\b[^>]*src="/hero-home.jpg")',r'\1 fetchpriority="high" decoding="async"',s,count=1)
        s=s.replace('content="index,follow"','content="index,follow,max-image-preview:large"')
        if origin:
            org={'@context':'https://schema.org','@type':'Organization','@id':origin+'/#organization','name':'Wazoozie','url':origin+'/','description':'Local home-service recommendations for Delco, Chester County and the Main Line.'}
            s=s.replace('</head>','<script type="application/ld+json">'+json.dumps(org)+'</script></head>')
        f.write_text(s)
