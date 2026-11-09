"""Remove obsolete operator metadata while preserving the public site schema."""
import json
import re

def finish(out, origin):
    for target in out.rglob('*.html'):
        content = target.read_text()
        def update_schema(match):
            data = json.loads(match[1])
            for entity in data.get('@graph', [data]):
                if entity.get('@type') == 'Organization' and entity.get('name') == 'Wazoozie':
                    entity.pop('founder', None)
                    entity['description'] = 'Local home-service introductions with clear business relationships. Homeowners choose which business to contact.'
            return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
        content = re.sub(r'<script type="application/ld\+json">(.*?)</script>', update_schema, content, flags=re.S)
        target.write_text(content)
