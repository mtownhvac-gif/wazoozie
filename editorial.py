"""Render editorial pages with the existing shell and page-specific metadata."""
import html
import json
import re


def write_editorial_page(out, origin, pages, path, title, description, body):
    template = (out / 'about/index.html').read_text()
    content = re.sub(r'<main id="main">.*?</main>', lambda _: '<main id="main">' + body + '</main>', template, count=1, flags=re.S)
    content = re.sub(r'<title>.*?</title>', lambda _: '<title>' + html.escape(title) + ' | Wazoozie</title>', content, count=1)
    content = re.sub(r'<meta (?:name="description"|property="og:(?:title|description|url)")[^>]*>', '', content)
    content = re.sub(r'<link rel="canonical"[^>]*>', '', content)
    content = re.sub(r'<script type="application/ld\+json">.*?</script>', '', content, flags=re.S)
    url = (origin or 'http://localhost:8123') + path
    escape = lambda value: html.escape(value, quote=True)
    metadata = f'<meta name="description" content="{escape(description)}"><meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="{url}"><link rel="canonical" href="{url}">'
    schema = {'@context': 'https://schema.org', '@type': 'WebPage', 'name': title, 'description': description, 'url': url}
    content = content.replace('</head>', metadata + '<script type="application/ld+json">' + json.dumps(schema).replace('<', '\\u003c') + '</script></head>')
    target = out / path.strip('/') / 'index.html'
    target.parent.mkdir(exist_ok=True)
    target.write_text(content)
    if path not in pages:
        pages.append(path)
