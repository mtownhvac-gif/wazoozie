"""Show sourced tank and tankless installations without illustrative product proof."""
import re
import shutil

PHOTOS = (
    ('middletown-tankless-project', 'Tankless Water Heater',
     'Navien installation with copper piping, published by Middletown HVAC.',
     '1200', '1600', 'https://www.mtownhvac.com/conversion/',
     'Discuss hot-water demand, fuel supply, venting and maintenance before choosing a system.'),
    ('middletown-conventional-project', 'Conventional Water Heater',
     'Bradford White tank Water Heater beside a Heil Furnace, published by Middletown HVAC.',
     '1100', '973', 'https://www.mtownhvac.com/services/tankless/',
     'Talk through tank size, recovery time, available space and replacement options for your home.'),
)


def presentation(suffix):
    cards = []
    for image, title, description, width, height, source, advice in PHOTOS:
        cards.append(f'''<figure class="hot-water-card">
<div class="hot-water-photo"><img src="/assets/{image}.jpg" alt="{description}" width="{width}" height="{height}" loading="lazy" decoding="async"></div>
<figcaption><span class="eyebrow">MIDDLETOWN HVAC · PUBLISHED WORK</span><h3>{title}</h3><p>{advice}</p><a class="hot-water-source" href="{source}" target="_blank" rel="noopener">View the published photo source ↗</a></figcaption></figure>''')
    return f'''<section class="hot-water-showcase" aria-labelledby="hot-water-title-{suffix}">
<div class="hot-water-heading"><div><span class="eyebrow">HOT WATER. OPTIONS THAT FIT YOUR HOME.</span><h2 id="hot-water-title-{suffix}">A closer look at the possibilities.</h2></div><p>Tank or tankless starts with your household, your space and how you use hot water. These are examples of Middletown HVAC’s published installations.</p></div>
<div class="hot-water-grid">{''.join(cards)}</div>
<div class="hot-water-next"><p>Not sure which way to go? Start with what’s happening at home.</p><a class="btn primary" href="/start/?intent=water">Talk through my Water Heater options →</a></div></section>'''


def improve(out):
    shutil.copy(out.parent / 'assets/water-heaters.css', out / 'assets/water-heaters.css')
    targets = [('services/water-heaters/index.html', 'service'), ('businesses/middletown-hvac/index.html', 'business')]
    for path, suffix in targets:
        target = out / path
        content = target.read_text()
        content = content.replace('</head>', '<link rel="stylesheet" href="/assets/water-heaters.css"></head>')
        if suffix == 'business':
            content = re.sub(r'<section class="published-proof".*?</section>', presentation(suffix), content, count=1, flags=re.S)
        else:
            content = content.replace('<div class="page-content">', presentation(suffix) + '<div class="page-content">', 1)
        target.write_text(content)
