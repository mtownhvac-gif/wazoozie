"""Keep Wazoozie's operator and related business visible across the directory."""
import json
import re

OPERATOR = 'Wazoozie is operated by Bryan Cordy, owner of Middletown HVAC.'
RELATIONSHIP = ('Middletown HVAC is a related business and receives the heating, cooling, '
                'Boiler and Water Heater inquiries you choose to direct to it. '
                'Other listed businesses operate separately. You choose who to contact.')


def finish(out, origin):
    disclosure = ('<section class="operator-disclosure" aria-label="Who operates Wazoozie">'
                  '<strong>Local people. A clear connection.</strong><p>' + OPERATOR + ' '
                  '<a href="/about/#who-runs-wazoozie">About our business relationships →</a>'
                  '</p></section>')
    details = ('<section id="who-runs-wazoozie" class="project-inline">'
               '<h2>Who runs Wazoozie?</h2><p>' + OPERATOR + '</p><p>' + RELATIONSHIP + '</p>'
               '<p>Questions about Wazoozie or your saved project? '
               '<a href="mailto:service@mtownhvac.com?subject=Wazoozie%20question">'
               'Contact the office at service@mtownhvac.com</a>.</p></section>')
    for target in out.rglob('*.html'):
        content = target.read_text()
        content = content.replace('<div class="footbottom">', disclosure + '<div class="footbottom">', 1)
        if target.relative_to(out).as_posix() in ('about/index.html', 'how-it-works/index.html', 'our-standards/index.html', 'privacy/index.html'):
            content = content.replace('</main>', '<div class="wrap">' + details + '</div></main>', 1)
        if target.relative_to(out).as_posix() == 'businesses/middletown-hvac/index.html':
            content = content.replace('<section class="evidence-panel"', '<div class="wrap"><p class="project-muted">Middletown HVAC shares an owner with Wazoozie. <a href="/about/#who-runs-wazoozie">Read about the connection →</a></p></div><section class="evidence-panel"', 1)
        def update_schema(match):
            data = json.loads(match[1])
            for entity in data.get('@graph', [data]):
                if entity.get('@type') == 'Organization' and entity.get('name') == 'Wazoozie':
                    entity['founder'] = {'@type':'Person', 'name':'Bryan Cordy'}
                    entity['description'] = 'Local home-service introductions operated by Bryan Cordy, owner of Middletown HVAC. Homeowners choose which business to contact.'
            return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
        content = re.sub(r'<script type="application/ld\+json">(.*?)</script>', update_schema, content, flags=re.S)
        content = content.replace('</head>', '<link rel="stylesheet" href="/assets/launch.css"></head>', 1)
        target.write_text(content)
    (out / 'assets/launch.css').write_text('.operator-disclosure{border-top:1px solid #ded6cc;padding:22px 0 10px;margin-top:24px;font-size:12px;line-height:1.7;color:var(--muted,#605f65)}.operator-disclosure strong{color:var(--ink,#262537);font-size:13px}.operator-disclosure p{margin:6px 0}.operator-disclosure a{text-decoration:underline;text-underline-offset:3px}#who-runs-wazoozie{scroll-margin-top:100px}#who-runs-wazoozie a{overflow-wrap:anywhere}@media(max-width:600px){.operator-disclosure{font-size:12px;line-height:1.8}.operator-disclosure a{display:inline-block}}\n')
    with (out / 'llms.txt').open('a') as handle:
        handle.write('\n## Operator and business relationship\n\n' + OPERATOR + ' ' + RELATIONSHIP + '\n')
