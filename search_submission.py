"""Publish IndexNow ownership proof and validate public-only URL submissions."""
import json
from html.parser import HTMLParser
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).parent


def configuration():
    config = json.loads((ROOT / 'indexnow-config.json').read_text())
    if config['origin'] != 'https://wazoozie.com' or not re.fullmatch(r'[a-f0-9]{32}', config['key']):
        raise ValueError('Invalid IndexNow configuration.')
    return config


def prepare(out, origin):
    config = configuration()
    if origin == config['origin']:
        (out / (config['key'] + '.txt')).write_text(config['key'] + '\n', encoding='utf-8')


def canonical_urls(xml, origin):
    root = ET.fromstring(xml)
    if root.tag != '{http://www.sitemaps.org/schemas/sitemap/0.9}urlset':
        raise ValueError('Expected a public URL sitemap.')
    urls = []
    for loc in root.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
        url = (loc.text or '').strip()
        parsed = urlsplit(url)
        if (parsed.scheme + '://' + parsed.netloc != origin or parsed.username or parsed.password
                or parsed.query or parsed.fragment
                or not re.fullmatch(r'/(?:[a-z0-9-]+/)*', parsed.path)
                or parsed.path.split('/')[1] in {'api', 'account', 'model-lab', 'agent-content', '404'}):
            raise ValueError('Only canonical public page URLs may be submitted.')
        if url not in urls:
            urls.append(url)
    if not 1 <= len(urls) <= 10000:
        raise ValueError('IndexNow requires between 1 and 10,000 URLs.')
    return urls


class PublicPage(HTMLParser):
    """Read indexing signals from delivered HTML, without executing page code."""
    def __init__(self):
        super().__init__()
        self.canonicals = []
        self.robots = []
        self.html = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html':
            self.html = True
        if tag == 'link' and 'canonical' in attrs.get('rel', '').lower().split():
            self.canonicals.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot', 'bingbot'):
            self.robots.extend(re.split(r'[\s,]+', attrs.get('content', '').lower()))


def validate_public_page(markup, url):
    page = PublicPage()
    page.feed(markup)
    if not page.html or page.canonicals != [url]:
        raise ValueError(f'{url}: live HTML must declare exactly one matching canonical.')
    if any(rule in page.robots for rule in ('noindex', 'none')):
        raise ValueError(f'{url}: live page disallows indexing; nothing should be submitted.')


def select_urls(sitemap_urls, requested=None, all_urls=False):
    """Select only explicitly requested, sitemap-listed public URLs."""
    if requested and all_urls:
        raise ValueError('Choose changed URLs or --all, not both.')
    if all_urls:
        return list(sitemap_urls)
    selected = list(dict.fromkeys(requested or []))
    if not selected:
        raise ValueError('Specify changed pages with --url, or --all for an intentional full submission.')
    if any(url not in sitemap_urls for url in selected):
        raise ValueError('Every requested URL must exactly match a canonical URL in the live sitemap.')
    return selected
