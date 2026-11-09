"""Check generated pages before preview or static deployment."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json

ROOT=Path(__file__).parent/'dist'
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.links=[];self.h1=0;self.title=0;self.meta={};self.json=False;self.canonical=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        if tag=='title':self.title+=1
        if tag=='meta' and 'name' in a:self.meta[a['name']]=a.get('content')
        if tag=='link' and a.get('rel')=='canonical':self.canonical=a.get('href')
        if tag=='img':assert a.get('alt'), 'Missing image alt'
        if tag=='script' and a.get('type')=='application/ld+json':self.json=True
        if tag in ('a','link','script','img'):
            value=a.get('href') or a.get('src')
            if value:self.links.append(value)
    def handle_data(self,data):
        if self.json:json.loads(data)
    def handle_endtag(self,tag):
        if tag=='script':self.json=False

pages={}
for f in ROOT.rglob('*.html'):
    p=Page();p.feed(f.read_text());pages[f]=p
    assert p.h1==1, f'{f}: expected one h1, got {p.h1}'
    assert p.title==1, f'{f}: expected one title'
    assert len(p.ids)==len(set(p.ids)), f'{f}: duplicate IDs'
    assert p.meta.get('description'), f'{f}: missing description'
    assert p.meta.get('robots') in ('index,follow','noindex,nofollow'), f'{f}: indexing not declared'

for f,p in pages.items():
    for value in p.links:
        url=urlsplit(value)
        if url.scheme or url.netloc:continue
        dest=ROOT/unquote(url.path.lstrip('/')) if url.path.startswith('/') else f.parent/unquote(url.path)
        if not url.path:dest=f
        if dest.is_dir():dest=dest/'index.html'
        assert dest.is_file(), f'{f}: missing local destination {value}'
        if url.fragment and dest in pages:
            assert unquote(url.fragment) in pages[dest].ids, f'{f}: missing fragment {value}'

home=pages[ROOT/'index.html']
if home.meta['robots']=='index,follow':
    assert all(p.canonical for p in pages.values()), 'Production canonical missing'
    assert (ROOT/'sitemap.xml').is_file(), 'Production sitemap missing'
    assert 'Sitemap:' in (ROOT/'robots.txt').read_text(), 'Sitemap not advertised'
else:
    assert 'Disallow: /' in (ROOT/'robots.txt').read_text(), 'Preview must disallow crawling'
    assert not (ROOT/'sitemap.xml').exists(), 'Preview must not advertise a sitemap'
print(f'Checked {len(pages)} HTML files: headings, metadata, IDs, local links, schema, and crawl settings passed.')
