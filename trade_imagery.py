"""Distribute category-specific editorial art without replacing published job photos."""
import json
import re
import shutil
from html import escape
from pathlib import Path

ROUTES = {
    '/services/plumbing/': 'plumbing',
    '/services/electrical/': 'electrical',
    '/services/handyman/': 'carpentry',
    '/services/construction-remodeling/': 'construction',
    '/services/painting/': 'painting',
    '/auto-mechanics/': 'automotive',
    '/vehicle-wraps/': 'wraps',
    '/real-estate-agents/': 'realestate',
}


def add(out):
    root = Path(__file__).parent
    images = {item['key']: item for item in json.loads((root / 'trade-imagery.json').read_text())['images']}
    for item in images.values():
        shutil.copy(root / 'assets' / item['file'], out / 'assets' / item['file'])
    shutil.copy(root / 'assets/trade-imagery.css', out / 'assets/trade-imagery.css')

    def image(item, card=False):
        return '<img class="trade-category-image" src="/assets/' + item['file'] + '" alt="' + escape(item['alt'], quote=True) + '" width="1200" height="800" ' + ('loading="lazy"' if card else 'fetchpriority="high"') + ' decoding="async">'

    note = '<span class="trade-art-note">Editorial illustration · fictional specialist.</span>'
    for route, key in ROUTES.items():
        target = out / route.strip('/') / 'index.html'
        html = target.read_text()
        item = images[key]
        if route.startswith('/services/'):
            html, count = re.subn(r'(<div class="page-art[^"]*">).*?</div>', lambda m: m[1] + '<figure class="clay-editorial trade-category-cover">' + image(item) + '<figcaption>Editorial illustration · fictional specialist.</figcaption></figure></div>', html, count=1, flags=re.S)
        else:
            html, count = re.subn(r'<figure class="clay-editorial"><img[^>]*>(?:<figcaption>.*?</figcaption>)?</figure>', lambda _: '<figure class="clay-editorial trade-category-cover">' + image(item) + '<figcaption>Editorial illustration · fictional specialist.</figcaption></figure>', html, count=1, flags=re.S)
        assert count == 1, 'Missing trade hero: ' + route
        # Keep preview metadata aligned with the category illustration.
        html = re.sub(r'(<meta property="og:image" content=")[^"]+', lambda m: m[1] + 'https://wazoozie.com/assets/' + item['file'], html, count=1)
        target.write_text(html)

    # Existing cards keep their original links and actions. Only their media changes.
    for target in out.rglob('*.html'):
        html = target.read_text()
        used = 'trade-category-image' in html
        def card(match):
            nonlocal used
            start, body = match[1], match[2]
            href = re.search(r'href="([^"]+)"', start)
            route = href[1] if href else ''
            if route not in ROUTES:
                return match[0]
            item = images[ROUTES[route]]
            if '<img ' in body:
                body = re.sub(r'<img\b[^>]*>', lambda _: image(item, True), body, count=1)
            elif 'service-tile' in start:
                body = '<span class="trade-tile-media">' + image(item, True) + '</span>' + body
            else:
                return match[0]
            used = True
            return start + body + '</a>'
        html = re.sub(r'(<a\b[^>]*class="[^"]*(?:brand-collection-card|service-tile)[^"]*"[^>]*>)(.*?)</a>', card, html, flags=re.S)
        if 'service-choice-grid' in html:
            html = html.replace('<p class="service-direct-note">', '<p class="service-direct-note">Service artwork depicts fictional specialists. ', 1)
        if used:
            html = html.replace('</head>', '<link rel="stylesheet" href="/assets/trade-imagery.css"></head>', 1)
        target.write_text(html)
