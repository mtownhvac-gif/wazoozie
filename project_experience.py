"""Project planning and real-work discovery, separate from directory generation."""
import html
import json
import re
import shutil

WORK = [
    ('middletown-conventional-project', 'Everyday hot water. Thoughtfully installed.', 'A conventional Bradford White tank Water Heater alongside a Heil Furnace, published by Middletown HVAC. Talk through tank size, available space and your household’s hot-water needs.', 'Conventional Water Heater', 'water-heaters', 'https://www.mtownhvac.com/services/tankless/'),
    ('middletown-conversion-project', 'A new direction for home comfort.', 'A technician at a Bosch outdoor Heat Pump installation, published by Middletown HVAC. A useful starting point for a conversation about changing how your home is heated.', 'Heating conversion', 'oil-to-gas-conversion', 'https://www.mtownhvac.com/conversion/'),
    ('middletown-tankless-project', 'The details behind hot water.', 'A Navien tankless Water Heater installation with visible copper piping. Published by Middletown HVAC as an example of its work.', 'Tankless Water Heater', 'water-heaters', 'https://www.mtownhvac.com/conversion/'),
    ('middletown-ductless-project', 'Comfort where you need it.', 'A Fujitsu indoor ductless unit installed above a bedroom doorway. Published by Middletown HVAC on its ductless service page.', 'Ductless indoors', 'ductless-mini-splits', 'https://www.mtownhvac.com/services/ductless/'),
    ('middletown-outdoor-project', 'A look outside, too.', 'A Fujitsu outdoor unit beside a stone wall and paver walkway. Published by Middletown HVAC on its ductless service page.', 'Ductless outdoors', 'ductless-mini-splits', 'https://www.mtownhvac.com/services/ductless/'),
]

def upgrade(out, public, pages, booking):
    root = out.parent
    for name in ('project.js', 'established.css'):
        shutil.copy(root / 'assets' / name, out / 'assets' / name)
    shutil.copy(root / 'project-config.mjs', out / 'assets/project-config.mjs')
    from editorial import write_editorial_page

    def page(path, title, description, body):
        write_editorial_page(out, public, pages, path, title, description, body)

    page('/start/', 'Plan a home project with a named local business', 'Choose a service, meet the business and prepare a private project brief. Contact your chosen business directly to confirm service.', (root / 'templates/project-start.html').read_text())
    cards = ''
    for image, title, description, label, service, source in WORK:
        cards += f'<figure class="project-work"><img src="/assets/{image}.jpg" alt="{html.escape(description, quote=True)}" width="1000" height="750" loading="lazy"><figcaption><div class="eyebrow">{label.upper()}</div><h2>{title}</h2><p>{description}</p><p><a href="/services/{service}/">Explore this service →</a></p><a href="{source}" target="_blank" rel="noopener">Published by Middletown HVAC ↗</a></figcaption></figure>'
    gallery = '<div class="wrap project-page"><div class="breadcrumb"><a href="/">Home</a><span>/</span>Real local work</div><section class="project-intro project-gallery-intro"><div class="eyebrow">LESS GUESSWORK. MORE TO GO ON.</div><h1>Good work.<br><em>Worth a closer look.</em></h1><p class="lede">Real installations. The business behind them. A little more confidence before the first conversation.</p><p>These photographs were published by Middletown HVAC. They show examples of its work; your project’s design, price and requirements will be confirmed individually.</p></section><section class="project-gallery" aria-label="Published Middletown HVAC projects">' + cards + '</section><section class="project-invite"><div><div class="eyebrow">YOUR HOME COULD BE NEXT</div><h2>What have you<br>been thinking about?</h2><p>A repair, a more comfortable room, or a system that’s ready for a change. Start with the problem, then talk through the options.</p><a class="btn primary" href="/start/?intent=replacement">Plan my project →</a></div><div><h3>Know who you’re speaking with.</h3><p>Read about the business, see its services and follow the sources behind the photos.</p><a href="/businesses/middletown-hvac/">Meet Middletown HVAC →</a></div></section></div>'
    page('/projects/', 'Real local work by Middletown HVAC', 'Explore published Middletown HVAC project photos: tank and tankless Water Heaters, Heat Pumps and ductless installations.', gallery)
    invite = '<section class="project-invite" aria-labelledby="project-invite-title"><div><div class="eyebrow">FROM “WHO DO I CALL?” TO A CLEAR NEXT STEP.</div><h2 id="project-invite-title">Less searching.<br>More getting somewhere.</h2><p>Tell us what needs attention. See the business that handles it. Put the right details in one place before you call.</p><a class="btn primary" href="/start/">Start your project →</a><p><a href="/projects/">Take a closer look at real local work ↗</a></p></div><div><img src="/assets/middletown-conventional-project.jpg" alt="Conventional tank Water Heater and Heil Furnace installation published by Middletown HVAC" width="1100" height="973" loading="lazy"><p class="project-photo-label">Actual Middletown HVAC work · Published project photo</p></div></section>'
    saved_notice = '<h2>Your private project brief.</h2><p>When you choose to save a brief on the project-planning page, Wazoozie stores your name, phone, optional email, town, ZIP, state, project details, preferences and consent record privately on Cloudflare for about 90 days, with daily cleanup. The site operator can review the brief and follow up about this project. Saving alone does not notify a provider. For Middletown HVAC, the submit action and consent checkbox authorize sending the brief and contact details through Zapier to service@mtownhvac.com for project follow-up. Other providers are not automatically emailed. Zapier processes the email request under its own retention policies; contact us about deletion. Email does not book an appointment. Do not include payment details or other sensitive information. Contact the operator below to ask about access or deletion.</p>'
    for target in out.rglob('*.html'):
        content = target.read_text()
        content = content.replace('</head>', '<link rel="stylesheet" href="/assets/established.css"></head>')
        content = content.replace('<nav aria-label="Mobile navigation">', '<nav aria-label="Mobile navigation"><a href="/start/">Start a project</a><a href="/projects/">Real local work</a>')
        content = content.replace('<a class="btn primary" href="/about/">About Wazoozie →</a>', '<a class="btn primary" href="/start/">Start your project →</a>')
        if target == out / 'index.html':
            content = content.replace('Find help for your home →', 'Start your project →').replace('<a class="btn primary" href="#find">Start your project', '<a class="btn primary" href="/start/">Start your project')
            content = content.replace('<section class="origin-story"', invite + '<section class="origin-story"', 1)
            content = content.replace('</body>', '<script src="/assets/project-links.js" defer></script></body>')
        if target == out / 'privacy/index.html':
            context_notice = '<h2>Request context and follow-up.</h2><p>When you follow an on-site request link, a short page category such as pricing, guide or home may travel with that link and be saved with a submitted brief. This does not record your browsing history, full page URL or search terms, and uses no tracking cookie. A missing category is recorded as direct or unknown. The operator may keep a private follow-up log with the request reference, service, source category, delivery evidence, contact and appointment outcomes, owner and next action. Customer contact details stay in the original request or customer system. Email acceptance, inbox receipt, customer contact and a booked appointment are separate outcomes. Ask the operator about access or deletion of this log.</p>'
            content = content.replace('<h2>Email request forms.</h2>', saved_notice + context_notice + '<h2>Email request forms.</h2>')
            content = content.replace('This notice describes the current static site; it must be updated when lead storage or delivery changes.', 'This notice describes browsing, optional email drafts and private project briefs. Wazoozie sends a brief only to Middletown HVAC when the homeowner submits a request with consent for delivery through Zapier.')
        if '/businesses/' in str(target):
            keys = {'middletown-hvac': 'middletown', 'ryan-dugan-electric': 'ryan', 'liberator-service-company': 'liberator', 'cooke-carpentry-construction': 'cooke', 'hart-builders':'hart', 'rolled-right-painting':'rolledright'}
            key = keys.get(target.parent.name)
            if key:
                box = f'<div class="wrap"><section class="project-inline"><h2>Make the first conversation easier.</h2><p>Put your location, timing and project details in a clear brief for the business you choose.</p><a class="btn primary" href="/start/?provider={key}">Plan a project with this business →</a>'
                if key == 'middletown':
                    box += '<p><a href="/projects/">See published installation photos →</a></p>'
                content = content.replace('</main>', box + '</section></div></main>')
        target.write_text(content)
    (out / 'assets/project-links.js').write_text("document.addEventListener('click',event=>{const button=event.target.closest('[data-request]');if(!button)return;const key=button.dataset.request;if(!['middletown','ryan','liberator','cooke','hart','rolledright'].includes(key))return;event.preventDefault();event.stopImmediatePropagation();location.assign('/start/?provider='+key);},true);")
    # AI-discoverable facts match the actual delivery behavior.
    with (out / 'llms.txt').open('a') as handle:
        handle.write('\n## Project planning\n\n' + (public or '') + '/start/ helps homeowners choose a named business and save a private project brief with consent. Saving alone does not notify the business. Middletown request submission with consent authorizes delivery through Zapier. No appointment is booked. Call or use the named provider booking link directly. ' + (public or '') + '/projects/ shows sourced actual Middletown HVAC project photographs.\n')
