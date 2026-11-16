"""Seasonal no-heat artwork with direct, named Middletown HVAC contacts."""
import html
import re
import shutil
from urllib.parse import urlencode

ART = 'wazoozie-no-heat-clay-2026.webp'
ALT = 'Claymation illustration of a heating technician greeting a homeowner wrapped in a blanket on a frosty morning'


def add(out, providers):
    hvac = providers['middletown']
    contact = hvac['web'] + '?' + urlencode({'utm_source': 'wazoozie', 'utm_medium': 'referral', 'utm_campaign': 'no_heat', 'utm_content': 'home_feature'})
    esc = lambda value: html.escape(value, quote=True)
    figure = '<figure class="no-heat-art"><img src="/assets/' + ART + '" width="1536" height="1024" alt="' + esc(ALT) + '" decoding="async" loading="lazy"><figcaption>Wazoozie illustration</figcaption></figure>'
    feature = '<section class="wrap no-heat-feature" aria-labelledby="no-heat-title">' + figure + '<div class="no-heat-copy"><span class="eyebrow">HEATING HELP</span><h2 id="no-heat-title">No heat?<br>Let’s get it working.</h2><p>Talk with Middletown HVAC about Furnace, Boiler or heat pump service.</p><div class="no-heat-actions"><a class="btn primary" href="' + esc(contact) + '">Middletown HVAC →</a><a href="tel:' + esc(hvac['tel']) + '">Call ' + esc(hvac['phone']) + '</a></div><a class="no-heat-guide" href="/services/furnace-repair/">Simple checks before you call →</a><p class="no-heat-note">The office confirms your service area, visit charge and availability.</p></div></section>'
    home = out / 'index.html'
    content = home.read_text()
    # Preserve the hero, actual-work photos and project finder as the first three stops.
    marker = re.search(r'<section[^>]*class="[^"]*same-job-home[^"]*"', content)
    if not marker:
        raise ValueError('No-heat homepage placement not found')
    content = content[:marker.start()] + feature + content[marker.start():]
    home.write_text(content.replace('</head>', '<link rel="stylesheet" href="/assets/no-heat.css"></head>', 1))
    furnace = out / 'services/furnace-repair/index.html'
    content = furnace.read_text()
    cover = figure.replace('loading="lazy"', 'loading="eager" fetchpriority="high"')
    content, count = re.subn(r'<aside class="intent-hero-note">.*?</aside>', lambda _: cover, content, count=1, flags=re.S)
    if count != 1:
        raise ValueError('No-heat service illustration placement not found')
    furnace.write_text(content.replace('</head>', '<link rel="stylesheet" href="/assets/no-heat.css"></head>', 1))
    for name in [ART, 'no-heat.css']:
        shutil.copy(out.parent / 'assets' / name, out / 'assets' / name)
