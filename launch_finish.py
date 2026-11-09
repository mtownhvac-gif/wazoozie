"""Keep the related-business note contextual to Middletown HVAC."""
import json
import re

def finish(out, origin):
    for target in out.rglob('*.html'):
        content = target.read_text()
        if target.relative_to(out).as_posix() == 'businesses/middletown-hvac/index.html':
            content = content.replace('<section class="evidence-panel"', '<div class="wrap"><p class="project-muted">Middletown HVAC is a related Wazoozie business.</p></div><section class="evidence-panel"', 1)
        def update_schema(match):
            data = json.loads(match[1])
            for entity in data.get('@graph', [data]):
                if entity.get('@type') == 'Organization' and entity.get('name') == 'Wazoozie':
                    entity.pop('founder', None)
                    entity['description'] = 'Local home-service introductions with clear business relationships. Homeowners choose which business to contact.'
            return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
        content = re.sub(r'<script type="application/ld\+json">(.*?)</script>', update_schema, content, flags=re.S)
        target.write_text(content)
