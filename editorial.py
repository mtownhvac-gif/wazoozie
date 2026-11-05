"""Render editorial pages with consistent, page-specific sharing and search metadata."""
import html
import json
import re


def write_editorial_page(out, origin, pages, path, title, description, body):
    template = (out / 'about/index.html').read_text()
    content = re.sub(r'<main id="main">.*?</main>', lambda _: '<main id="main">' + body + '</main>', template, count=1, flags=re.S)
    content = re.sub(r'<title>.*?</title>', lambda _: '<title>' + html.escape(title) + ' | Wazoozie</title>', content, count=1)
    # Preserve shared image/card settings; replace all inherited page text.
    content = re.sub(r'<meta (?:name="(?:description|twitter:(?:title|description|url))"|property="og:(?:title|description|url)")[^>]*>', '', content)
    content = re.sub(r'<link rel="canonical"[^>]*>', '', content)
    content = re.sub(r'<script type="application/ld\+json">.*?</script>', '', content, flags=re.S)
    base = origin or 'http://localhost:8123'
    url = base + path
    escape = lambda value: html.escape(value, quote=True)
    metadata = f'<meta name="description" content="{escape(description)}"><meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="{url}"><meta name="twitter:title" content="{escape(title)}"><meta name="twitter:description" content="{escape(description)}"><link rel="canonical" href="{url}">'
    schema = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Organization', '@id': base + '/#organization', 'name': 'Wazoozie', 'url': base + '/'},
        {'@type': 'WebSite', '@id': base + '/#website', 'name': 'Wazoozie', 'url': base + '/', 'publisher': {'@id': base + '/#organization'}},
        {'@type': 'WebPage', '@id': url + '#page', 'name': title, 'description': description, 'url': url, 'isPartOf': {'@id': base + '/#website'}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': base + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': title, 'item': url}]}]}
    content = content.replace('</head>', metadata + '<script type="application/ld+json">' + json.dumps(schema).replace('<', '\\u003c') + '</script></head>')
    target = out / path.strip('/') / 'index.html'
    target.parent.mkdir(exist_ok=True)
    target.write_text(content)
    if path not in pages:
        pages.append(path)
