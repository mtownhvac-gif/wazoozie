"""Publish IndexNow ownership proof and validate public-only URL submissions."""
import json
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
                or parsed.query or parsed.fragment or parsed.path.startswith('/api/')
                or not parsed.path.endswith('/')):
            raise ValueError('Only canonical public page URLs may be submitted.')
        if url not in urls:
            urls.append(url)
    if not 1 <= len(urls) <= 10000:
        raise ValueError('IndexNow requires between 1 and 10,000 URLs.')
    return urls
