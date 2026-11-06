"""Wholesome clay-style editorial art, with explicit illustration labels."""
import html
import re
import shutil

SCENES = {
    'clay-auto-pickup': ('Clay-style mechanic greeting a family beside a parked car', ['auto-mechanics']),
    'clay-home-keys': ('Clay-style real-estate professional and family with a house key', ['real-estate-agents']),
    'clay-family-shelving': ('Clay-style carpenter, parent and child beside a fitted bookshelf', ['businesses/cooke-carpentry-construction']),
    'clay-outdoor-lighting': ('Clay-style electrician and family admiring a warmly lit porch and garden path', ['services/electrical', 'businesses/ryan-dugan-electric']),
    'clay-tankless-bath': ('Clay-style parent supervising a bubbly bath beside a separate utility space with a tankless water heater', ['services/water-heaters', 'guides/plan-a-tankless-conversion']),
    'clay-family-painting': ('A smiling clay-style family painting a room together', ['services/painting', 'guides/painting-estimate-checklist', 'businesses/rolled-right-painting']),
    'clay-door-replacement': ('Clay-style carpenter adjusting a front door beside a closed glazed window', ['services/handyman']),
    'clay-window-renovation': ('Clay-style family and installer admiring a new glazed window', ['services/construction-remodeling', 'guides/window-replacement-questions']),
    'clay-dusty-filter': ('Clay-style technician removing a filter with an enormous fictional dust-bunny cloud', ['services/maintenance', 'seasonal-home-checklist']),
    'clay-ductless-comfort': ('Clay-style parent, child and cat enjoying a room with a wall-mounted mini-split', ['services/ductless-mini-splits', 'services/heating-cooling', 'guides/one-room-too-hot-too-cold']),
    'clay-hot-water': ('Clay-style parent and child washing flour from their hands with a water heater in the background', []),
    'clay-plumbing-leak': ('Clay-style plumber and homeowner beside a small contained under-sink leak', ['services/plumbing', 'businesses/liberator-service-company']),
    'clay-electrical-help': ('Clay-style electrician and homeowner discussing a pendant light', ['guides/electrical-project-estimate']),
}


def add(out):
    root = out.parent
    for name, (alt, routes) in SCENES.items():
        shutil.copy(root/'assets'/(name+'.webp'), out/'assets'/(name+'.webp'))
        caption = 'AI-created clay-style illustration · Fictional scene, not a documented customer project or business employee.'
        if name == 'clay-dusty-filter':
            caption += ' Dust cloud exaggerated for a little housekeeping humor.'
        figure = '<figure class="clay-editorial"><img src="/assets/'+name+'.webp" alt="'+html.escape(alt, quote=True)+'" width="1200" height="800" decoding="async"><figcaption>'+caption+'</figcaption></figure>'
        for route in routes:
            target = out/route/'index.html'
            if not target.exists():
                continue
            content = target.read_text()
            if '<div class="page-art">' in content:
                content = re.sub(r'<div class="page-art">.*?</div>', lambda _: '<div class="page-art clay-page-art">'+figure+'</div>', content, count=1, flags=re.S)
            elif '<div class="situation-cover">' in content:
                content = re.sub(r'(<div class="situation-cover">.*?<figure>).*?</figure>', lambda m:m.group(1).split('<figure>')[0]+figure, content, count=1, flags=re.S)
            elif '<div class="local-intro">' in content:
                start = content.index('<div class="local-intro">')
                depth = 0
                for tag in re.finditer(r'</?div\b[^>]*>', content[start:]):
                    depth += -1 if tag.group().startswith('</') else 1
                    if depth == 0:
                        end = start + tag.end()
                        break
                content = content[:start]+'<section class="local-clay-cover">'+content[start:end]+figure+'</section>'+content[end:]
            else:
                # Editorial pages without a side image get one below the intro.
                main = content.index('<main id="main">')
                end = content.find('</section>', main)
                if end != -1:
                    content = content[:end+10]+'<div class="wrap clay-feature">'+figure+'</div>'+content[end+10:]
            target.write_text(content)
    for route in ('home-tips',):
        target = out/route/'index.html'
        content = target.read_text()
        content = re.sub(r'(<section class="journal-cover wrap">.*?<figure>).*?</figure>', lambda m:m.group(1).split('<figure>')[0]+'<figure><img src="/assets/clay-family-painting.webp" alt="AI-created clay-style family sharing a painting project" width="1200" height="800" fetchpriority="high" decoding="async"><figcaption>AI-created editorial illustration · A little thought. A place that feels like you.</figcaption></figure>', content, count=1, flags=re.S)
        target.write_text(content)
    shutil.copy(root/'assets/clay-fine-print-pitchman.webp', out/'assets/clay-fine-print-pitchman.webp')
    target = out/'before-you-say-yes/index.html'
    content = target.read_text()
    satire = '<figure class="clay-editorial theater-pitchman"><img src="/assets/clay-fine-print-pitchman.webp" width="1200" height="800" loading="lazy" decoding="async" alt="Fictional clay-style sales pitchman with a $49 tune-up ticket, commission slips, add-ons and scare-script props"><figcaption>AI-created fictional caricature of pressure selling. Not an actual person, business or verified offer. A low introductory price or commission alone does not establish dishonesty.</figcaption></figure><aside class="theater-facts"><h3>Safety first. Clear findings next.</h3><p>A tune-up, a dispatch visit and a diagnosis can cover different work. Confirm the included checks, complete charges and what happens if you decline additional work. Ask about sales incentives and request the actual findings, proposed options and written scope.</p><p>This satire does not dismiss a real carbon-monoxide alarm or verified hazard. If a CO alarm activates, leave the home and contact emergency services from outdoors. Return only after responders allow it. <a href="https://www.cpsc.gov/s3fs-public/pdfs/blk_pdf_Talking_Points.pdf">CPSC carbon-monoxide alarm guidance ↗</a></p><p>Once immediate safety is addressed, ask the professional to document the finding and explain the options. A sales deadline does not replace an explanation.</p></aside>'
    content = content.replace('<div class="theater-grid">', satire+'<div class="theater-grid">', 1)
    target.write_text(content)
