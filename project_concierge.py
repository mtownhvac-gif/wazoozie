"""A direct project finder and a homeowner-owned, browser-local project list."""
import html
import json
import shutil
import subprocess
from editorial import write_editorial_page


def add(out, origin, pages):
    root = out.parent
    catalog = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', "import {INTENTS,BUSINESSES,PROJECT_QUESTIONS} from './project-config.mjs';process.stdout.write(JSON.stringify({intents:INTENTS,businesses:BUSINESSES,questions:PROJECT_QUESTIONS}));"], cwd=root, text=True))
    e = html.escape
    primary = ['comfort', 'water', 'electrical', 'plumbing', 'carpentry', 'painting']
    labels = {'comfort':'Heating & cooling', 'water':'Hot water', 'electrical':'Electrical', 'plumbing':'Plumbing & drains', 'carpentry':'Small home repairs', 'painting':'Painting & drywall', 'doors':'Doors', 'windows':'Windows', 'decks':'Decks & porches', 'additions':'Remodeling & additions', 'boiler':'Boilers & radiators', 'maintenance':'Seasonal maintenance', 'replacement':'A new HVAC system', 'secondopinion':'HVAC second opinion'}
    symbols = {'comfort':'01', 'water':'02', 'electrical':'03', 'plumbing':'04', 'carpentry':'05', 'painting':'06', 'doors':'07', 'windows':'08', 'decks':'09', 'additions':'10', 'boiler':'11', 'maintenance':'12', 'replacement':'13', 'secondopinion':'14'}
    cards = []
    for key in primary + [k for k in catalog['intents'] if k not in primary]:
        intent = catalog['intents'][key]
        business = catalog['businesses'][intent['provider']]
        cards.append(f'<article class="concierge-choice" data-project-choice="{key}" data-project-extra="{str(key not in primary).lower()}"><a href="/start/?intent={key}"><span class="concierge-number" aria-hidden="true">{symbols[key]}</span><span><strong>{e(labels[key])}</strong><small>See your contact →</small></span><span aria-hidden="true">↗</span></a><button type="button" class="concierge-save" data-home-save="{key}" aria-pressed="false" aria-label="Save {e(labels[key], quote=True)} to My home list" hidden>+</button></article>')
    finder = '<div class="concierge-finder" data-project-finder><div class="concierge-finder-heading"><h2>What’s on your home’s list?</h2><span>Choose your service. See your contact next.</span></div><label class="concierge-search">Find your project<input type="search" id="concierge-search" placeholder="Try Boilers, painting or windows" autocomplete="off" maxlength="80" aria-controls="concierge-choices" hidden></label><div id="concierge-choices" class="concierge-choices">' + ''.join(cards) + '</div><p id="concierge-results" class="concierge-status" role="status" aria-live="polite"></p><button type="button" class="concierge-text-button" id="concierge-show-all" hidden>See all projects ↓</button><a class="concierge-list-link" href="/my-home/">My home list <span data-home-count></span> →</a><noscript><p>Choose a project above to see the business and plan your next step. Saving a list on this device needs JavaScript.</p></noscript></div>'
    home = out / 'index.html'
    content = home.read_text()
    marker = '<section class="neighbor-layout"'
    panel = '<section class="concierge-home wrap" aria-label="Find help or save a home project"><div class="concierge-feature"><div class="eyebrow">FROM “SOMEDAY” TO SORTED.</div><h2>A warmer room.<br>A fresh finish.<br><em>A good place to start.</em></h2><p>Meet the business before the conversation. Start with what your home needs, or keep a few ideas for later.</p><div class="concierge-feature-actions"><a class="btn primary" href="/start/?intent=comfort">Heating & cooling help →</a><a href="/help/">Not sure who to call?</a></div><div class="concierge-feature-photo"><img src="/assets/middletown-ductless-project.jpg" width="1000" height="750" alt="Published Middletown HVAC ductless installation above a bedroom doorway" loading="lazy"><span>Real local work · Middletown HVAC</span></div></div>' + finder + '</section>'
    content = content.replace(marker, panel + marker, 1)
    home.write_text(content)

    body = '<div class="wrap home-list-page"><div class="breadcrumb"><a href="/">Home</a><span>/</span>My home list</div><section class="home-list-intro"><div><div class="eyebrow">A LITTLE LESS TO KEEP IN YOUR HEAD.</div><h1>Your home.<br><em>Your next good thing.</em></h1><p class="lede">Keep the projects you’re considering in one place. When you’re ready, the business and the next conversation are right here.</p></div><aside><strong>Just on this device.</strong><p>Your list stores project categories and progress in this browser. No name, contact details or account. It does not send requests or book visits.</p></aside></section><div class="home-list-toolbar"><p id="home-list-summary" role="status" aria-live="polite">Save a project below to start your list.</p><button type="button" id="home-list-print" hidden>Print my list ↗</button></div><p id="home-storage-status" class="concierge-status" role="status" aria-live="polite"></p><div id="home-list-board" class="home-list-board"></div><div id="home-list-empty" class="home-list-empty"><span aria-hidden="true">⌂</span><h2>Every good project starts somewhere.</h2><p>Add the repair, refresh or bigger change you have in mind. You can remove it whenever you like.</p></div><div id="home-list-undo" class="home-list-undo" hidden><span>Project removed.</span><button type="button" id="home-list-undo-button">Undo</button></div><section class="home-list-add"><h2>Make a little room for what’s next.</h2><p>Choose a project to save. No contact information needed.</p><div class="home-list-add-options">' + ''.join(f'<button type="button" data-home-save="{key}" aria-pressed="false" hidden>{e(labels[key])} <span aria-hidden="true">+</span></button>' for key in primary + ['doors','windows','decks','additions']) + '</div><noscript><p>Enable JavaScript to keep a list on this device, or <a href="/start/">plan a project directly</a>.</p></noscript></section><section class="home-list-note"><h2>A good first conversation.</h2><p>Describe what you want to change. Confirm the business serves your address, ask about diagnostic or estimate charges, and agree on the scope before work begins.</p><a href="/before-you-approve/">Keep the proposal checklist handy →</a></section></div>'
    write_editorial_page(out, origin, pages, '/my-home/', 'My home list | Keep your next projects together', 'Save home-project categories privately on this device, prepare a useful conversation and contact the named local business when you are ready.', body)
    for target in out.rglob('*.html'):
        content = target.read_text()
        for key, business in catalog['businesses'].items():
            if target == out / 'businesses' / business['slug'] / 'index.html':
                intent = business['defaultIntent']
                prompts = catalog['questions'].get(intent, catalog['questions']['comfort'])
                prep = '<section class="profile-next-step wrap" aria-label="Prepare for your conversation"><div><div class="eyebrow">MAKE THE FIRST CALL COUNT.</div><h2>Three useful things<br>to bring to the conversation.</h2><ul>' + ''.join('<li>' + e(p) + '</li>' for p in prompts) + '</ul></div><div class="profile-next-actions"><strong>' + e(business['name']) + '</strong><a class="btn primary" href="tel:' + business['tel'] + '">Call ' + e(business['phone']) + '</a><a href="/start/?intent=' + intent + '">Prepare my project →</a><button type="button" data-home-save="' + intent + '" aria-pressed="false" hidden>Save to My home list +</button><p>No appointment is made until you arrange one with the business.</p></div></section>'
                content = content.replace('</main>', prep + '</main>', 1)
        content = content.replace('<strong>The useful details</strong>', '<strong>The useful details</strong><a href="/my-home/">My home list <span data-home-count></span></a>', 1)
        content = content.replace('</head>', '<link rel="stylesheet" href="/assets/project-concierge.css"></head>', 1)
        content = content.replace('</body>', '<script type="module" src="/assets/project-concierge.js"></script></body>', 1)
        target.write_text(content)
    for name in ('project-concierge.css', 'project-concierge.js'):
        shutil.copy(root / 'assets' / name, out / 'assets' / name)
    with (out / 'llms.txt').open('a') as handle:
        handle.write('\n## Homeowner project list\n\n' + (origin or '') + '/my-home/ lets homeowners save project categories and progress on their own device. It never sends a request or books an appointment.\n')
    privacy = out / 'privacy/index.html'
    content = privacy.read_text().replace('</main>', '<div class="wrap"><section class="project-inline"><h2>My home list.</h2><p>If you choose to save projects, this browser stores only the project categories and progress you select. Wazoozie does not receive this list. It is separate from a submitted project brief, does not sync across devices and may disappear if browser data is cleared. Remove saved projects on the My home list page. Avoid shared devices if you do not want other users to see your choices.</p></section></div></main>', 1)
    privacy.write_text(content)
