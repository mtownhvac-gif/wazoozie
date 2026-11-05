"""Useful homeowner guidance, visible evidence and a settled local voice."""
import html
import json
import re
import shutil
from editorial import write_editorial_page


def strengthen(out, origin, pages, providers):
    root = out.parent
    escape = html.escape
    for name in ('problem-guide.js', 'decisions.js'):
        shutil.copy(root / 'assets' / name, out / 'assets' / name)
    problems = json.loads((root / 'assets/problem-config.json').read_text())
    (out / 'assets/problem-config.mjs').write_text('export const PROBLEMS = ' + json.dumps(problems) + ';\n')
    fallback = ''.join('<a href="/start/?intent=' + escape(problem['intent'], quote=True) + '" data-problem="' + escape(problem['key'], quote=True) + '">' + escape(problem['label']) + ' →</a>' for problem in problems)
    guide = (root / 'templates/problem-guide.html').read_text().replace('<div id="problemChoices" class="problem-choices"></div>', '<div id="problemChoices" class="problem-choices">' + fallback + '</div>')
    write_editorial_page(out, origin, pages, '/help/', 'Who do I call? Local help for home problems', 'Find the right trade for no heat, no hot water, Boiler trouble, plumbing, electrical work and home repairs. No contact details required.', guide)

    points = [
        ('The problem and the proposed work', 'Ask what was found, what the work includes and which parts of the problem it is intended to resolve.'),
        ('Repair and replacement options', 'Ask whether a repair is practical, what alternatives exist and why the recommended option fits your home.'),
        ('The complete written price', 'Confirm equipment, materials, labor, disposal, permits, payment schedule and any items priced separately.'),
        ('Equipment and installation details', 'For a new system, get the model numbers and discuss sizing, placement, controls and any electrical or venting work.'),
        ('Warranty and maintenance responsibilities', 'Ask what parts and labor are covered, who handles registration and what maintenance or exclusions apply.'),
        ('Coverage, scheduling and access', 'Confirm your address is covered, the arrival window, access arrangements and who to contact if plans change.'),
        ('Current business documents', 'Ask for registration or licensing and insurance relevant to your project. Confirm any permit requirements before work begins.'),
        ('Your approval before additional work', 'Agree on how the business will explain and obtain approval for work outside the written scope.'),
    ]
    checks = ''.join(f'<label><input type="checkbox" data-decision-check><span><strong>{escape(title)}</strong><small>{escape(description)}</small></span></label>' for title, description in points)
    checklist = '<div class="wrap project-page"><div class="breadcrumb"><a href="/">Home</a><span>/</span>Before you approve</div><section class="project-intro"><div class="eyebrow">A BETTER CONVERSATION. A CLEARER DECISION.</div><h1>Good questions.<br><em>Before good work.</em></h1><p class="lede">A useful proposal should make the next step clearer. Keep these questions beside you when you talk through a repair or installation.</p></section><section class="project-panel" aria-label="Proposal conversation checklist"><h2>Before you say yes.</h2><p id="decisionStatus" role="status"></p><div class="decision-list">' + checks + '</div><button id="printChecklist" class="btn primary" type="button">Print my checklist ↓</button><p class="project-muted">Your checks stay in this open page only. Refreshing clears them. This is a conversation guide, not a technical inspection or a promise about any business.</p></section><section class="project-invite"><div><div class="eyebrow">STILL HAVE QUESTIONS?</div><h2>Take another look.</h2><p>If a heating, cooling, Boiler or Water Heater recommendation leaves you unsure, ask Middletown HVAC about a second-opinion visit.</p><a class="btn primary" href="/start/?intent=secondopinion">Plan a second opinion →</a></div><div><h3>Keep the original recommendation handy.</h3><p>A written scope, equipment information and the symptoms that prompted the first visit help make the conversation useful. An onsite diagnosis may be necessary.</p><a href="/services/second-opinion/">What a second opinion involves →</a></div></section></div><script src="/assets/decisions.js" defer></script>'
    write_editorial_page(out, origin, pages, '/before-you-approve/', 'Questions to ask before approving home-service work', 'An eight-point homeowner checklist for written estimates, repair options, equipment, warranties, scheduling and approval of additional work.', checklist)

    reviews = json.loads((root / 'trade_reviews.json').read_text())
    for key, business in providers.items():
        target = out / 'businesses' / business['slug'] / 'index.html'
        content = target.read_text()
        source = ('<a href="' + escape(business['web'], quote=True) + '" target="_blank" rel="noopener">Business website ↗</a>') if business.get('official_web') is not False else 'Business-provided contact details; current website not confirmed.'
        review = reviews.get(business['slug'])
        review_source = ('<a href="' + escape(review['source'], quote=True) + '" target="_blank" rel="noopener">' + escape(review['label']) + ' ↗</a>') if review else '<a href="https://www.mtownhvac.com/reviews/" target="_blank" rel="noopener">Published Middletown HVAC reviews ↗</a>' if key == 'middletown' else 'Review source not recorded.'
        evidence = f'''<section class="evidence-panel" aria-labelledby="evidence-title"><div class="eyebrow">WHY THIS BUSINESS?</div><h2 id="evidence-title">Something concrete<br>to go on.</h2><p>Read the sources. Ask the questions that matter for your home.</p><div class="evidence-grid"><article class="evidence-item"><span class="evidence-state">Business information</span><h3>A name you can contact.</h3><p>{escape(business['trade'])}</p>{source}</article><article class="evidence-item"><span class="evidence-state">Published feedback</span><h3>Read beyond the excerpt.</h3><p>Review excerpts link to their published sources. Wazoozie has not independently inspected the work described.</p>{review_source}</article><article class="evidence-item"><span class="evidence-state">Coverage & availability</span><h3>Your address comes first.</h3><p>Confirm your town, exact address, job type and timing directly. A directory listing is not address-level approval.</p><a href="tel:{escape(business['tel'], quote=True)}">Call {escape(business['phone'])}</a></article><article class="evidence-item"><span class="evidence-state">Documents to request</span><h3>Check the current details.</h3><p>License or registration and insurance documents are not recorded in this directory. Request current documents relevant to your project.</p><a href="/before-you-approve/">Questions to ask before hiring →</a></article></div>'''
        if key == 'middletown':
            evidence += '<p><a href="/projects/">See four published installation photographs →</a></p>'
        evidence += '<p class="project-muted">Directory evidence record updated November 5, 2026. This date records the profile update, not a credential inspection or guarantee of work.</p></section>'
        content = re.sub(r'<section class="evidence-panel".*?</section>', lambda _: evidence, content, count=1, flags=re.S)
        target.write_text(content)

    story = '<section class="origin-story" aria-labelledby="origin-title"><div class="origin-photo"><img src="/assets/valley-stone-home.jpg" alt="Illustrative Pennsylvania fieldstone home beneath autumn trees" width="1200" height="675" loading="lazy"><span>Home deserves a little more care.</span></div><div class="origin-copy"><div class="eyebrow">LOCAL KNOWLEDGE. CLEAR EXPECTATIONS.</div><h2 id="origin-title">Good people.<br>Close to home.</h2><p class="origin-lead">The Furnace on the coldest morning. The room that never feels right. The project you’ve been meaning to finish.</p><p>Finding help should feel straightforward. Wazoozie brings together local service businesses, useful project information and direct ways to reach the people doing the work.</p><p>Get to know the business. Look at published work and customer feedback. Ask about your address, the scope and the price before making plans.</p><a class="btn primary" href="/help/">Find the right kind of help →</a></div></section>'
    promo = '<section class="guide-promo" aria-label="Help choosing a service"><a href="/help/">Not sure who to call? Start with what’s happening →</a><p class="project-muted">No contact details needed. Find the right trade and three useful things to tell the business.</p></section>'
    replacements = {
        'All four businesses have been vetted by Wazoozie.': 'Each profile links to business information and published review sources.',
        'All four listed businesses have been vetted by Wazoozie.': 'Business profiles include direct contacts and linked review sources.',
        'All four current businesses have been vetted by Wazoozie.': 'Each current business has a profile with contact details and linked sources.',
        'Each business has been vetted by Wazoozie.': 'Each business has a profile with direct contact details and linked sources.',
        'This business has been vetted by Wazoozie.': 'Read the profile evidence and request current documents before hiring.',
        'The listed businesses have been vetted by Wazoozie.': 'The profiles identify businesses, contact details and published sources.',
        'The four current businesses have been vetted by Wazoozie.': 'The profile evidence panels distinguish published information from documents not recorded here.',
        'Local businesses vetted by Wazoozie.': 'Local businesses. Clear information. Your choice.',
        'We bring together local businesses we’ve vetted, with clear information about what they do and how to reach them.': 'We bring together local businesses with clear profiles, linked sources and direct ways to reach them.',
        'vetted local businesses': 'local businesses with linked sources',
        'Vetted Businesses': 'Business Evidence',
        'Vetted by Wazoozie': 'Local business',
        '5.0 on Google': 'Published homeowner reviews',
        'WHY WE STARTED WAZOOZIE': 'THE LOCAL STANDARD',
        'A growing directory.': 'The people behind the work.',
        'The initial directory includes': 'The directory includes',
        'Our regional plans span Pennsylvania, New Jersey, and Delaware.': 'Our local focus is Delco, Chester County and the Main Line.',
        'New Jersey and Delaware provider coverage is being developed.': 'New Jersey and Delaware provider coverage is not confirmed.',
        'Wazoozie is being built for the broader Delco, Chester County and the Main Line.': 'Wazoozie helps homeowners explore services in Delco, Chester County and the Main Line.',
        'The current directory contains four business listings.': 'The directory includes HVAC, electrical, plumbing and carpentry businesses.',
        'Wazoozie’s plans cover Delco, Chester County and the Main Line.': 'Wazoozie focuses on Delco, Chester County and the Main Line.',
        'Our aim is straightforward: fair, homeowner-first recommendations.': 'Clear information helps homeowners make better decisions.',
        'The highest possible rating.': 'Follow the source for current ratings and full reviews.',
    }
    for target in out.rglob('*.html'):
        content = target.read_text()
        content = re.sub(r'<section class="origin-story".*?</section>', lambda _: story, content, count=1, flags=re.S)
        if target == out / 'index.html':
            content = content.replace('<h2 class="browse-label">', promo + '<h2 class="browse-label">', 1)
            content = content.replace('<option value="roofing">Roofing · joining soon</option>', '')
        content = content.replace('<strong>The useful details</strong>', '<strong>The useful details</strong><a href="/help/">Who do I call?</a><a href="/before-you-approve/">Before you approve</a><a href="/projects/">Real local work</a>')
        if target == out / 'our-standards/index.html':
            content = content.replace('</main>', '<div class="wrap"><section class="project-inline"><h2>Selection and document checks are different.</h2><p>Being included in Wazoozie is an editorial selection. It is not a license, insurance certification, competitive quality ranking or guarantee. Profile evidence panels identify linked business information and review sources, and explicitly show which documents are not recorded.</p><p><a href="/before-you-approve/">Use the homeowner hiring checklist →</a></p></section></div></main>')
        for before, after in replacements.items():
            content = content.replace(before, after)
        # Avoid announcing a new operation or suggesting unconfirmed coverage.
        content = content.replace('>Growing coverage.<', '>Coverage for your home.<')
        target.write_text(content)
    for name in ('home.js',):
        target = out / 'assets' / name
        content = target.read_text()
        for before, after in replacements.items():
            content = content.replace(before, after)
        target.write_text(content)
    target = out / 'llms.txt'
    content = target.read_text()
    for before, after in replacements.items():
        content = content.replace(before, after)
    content += '\n## Homeowner tools\n\n- ' + origin + '/help/: plain-language problem-to-trade guide; not a diagnosis.\n- ' + origin + '/before-you-approve/: printable proposal conversation checklist.\n\nProfile evidence panels identify public business and review sources. License/registration and insurance documents are not recorded in this directory. Confirm exact service coverage directly.\n'
    target.write_text(content)
