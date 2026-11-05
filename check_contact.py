"""Regression checks for critical contact paths and honest review presentation."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, parse_qs
import json
ROOT=Path(__file__).parent/'dist'
class Inspect(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.script=False;self.data=[];self.docks=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='a':self.links.append(a.get('href',''))
        if 'contact-dock' in a.get('class','').split():self.docks+=1
        if tag=='script' and a.get('type')=='application/ld+json':self.script=True
    def handle_data(self,data):
        if self.script:self.data.append(json.loads(data))
    def handle_endtag(self,tag):
        if tag=='script':self.script=False
for f in ROOT.rglob('*.html'):
    text=f.read_text();p=Inspect();p.feed(text)
    assert p.docks==1,f'{f}: one mobile contact dock required'
    hvac='/services/' in str(f) and any(x in str(f) for x in ('heating-cooling','boilers','water-heaters','maintenance','replacement-estimates','second-opinion')) or '/businesses/middletown-hvac/' in str(f) or '/contact/' in str(f)
    if hvac:assert 'tel:+16105006416' in p.links,f'{f}: missing HVAC phone'
    booking=[x for x in p.links if urlsplit(x).netloc=='book.housecallpro.com']
    if hvac:assert booking,f'{f}: missing booking path'
    for url in booking:
        q=parse_qs(urlsplit(url).query)
        assert q['utm_source']==['wazoozie']
        assert q.get('utm_content'),f'{f}: missing source-page attribution'
        assert set(q)<= {'v2','utm_source','utm_medium','utm_campaign','utm_content'}
    for item in p.data:
        serialized=json.dumps(item)
        assert '"aggregateRating"' not in serialized and '"@type": "Review"' not in serialized
home=(ROOT/'index.html').read_text();profile=(ROOT/'businesses/middletown-hvac/index.html').read_text()
assert home.count('<blockquote>')==0 and profile.count('<blockquote>')==3
assert 'founding' not in home.lower()
assert 'sample testimonial' not in home.lower()
assert 'MIDDLETOWN HVAC · PUBLISHED WORK' in profile
for page in (profile, (ROOT/'services/water-heaters/index.html').read_text()):
    assert 'middletown-conventional-project.jpg' in page and 'middletown-tankless-project.jpg' in page
    assert 'https://www.mtownhvac.com/services/tankless/' in page
    assert 'https://www.mtownhvac.com/conversion/' in page
    assert '/start/?intent=water' in page
assert 'Service illustrations' not in profile
assert 'family-at-home.jpg' not in profile
assert 'noindex,nofollow' in (ROOT/'404/index.html').read_text()
assert '/contact/' in (ROOT/'sitemap.xml').read_text() if (ROOT/'sitemap.xml').exists() else True
print('Contact paths, attribution privacy, review sources, image disclosure and 404 indexing passed.')
