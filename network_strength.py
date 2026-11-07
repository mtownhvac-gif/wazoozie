"""Owner-selected local recommendations and consistent, capability-aware contact paths."""
import html
import json
import re
import shutil
import subprocess


REASONS = {
    'middletown': ('The team behind Wazoozie.', 'Wazoozie is operated by Bryan Cordy, owner of Middletown HVAC. Heating, cooling and hot-water inquiries you choose to send here go to his team.'),
    'ryan': ('The electrician Middletown calls.', 'Middletown HVAC uses Ryan Dugan Electric for its own electrical work. That working relationship is why Bryan recommends Ryan here.'),
    'liberator': ('A trusted plumbing contact.', 'Selected by Bryan for the local network for plumbing and drain inquiries. Start with the fixture, leak or blockage that needs attention.'),
    'cooke': ('The smaller jobs deserve good work, too.', 'Selected by Bryan for carpentry and home-repair inquiries, including trim, shelving and finishing details.'),
    'hart': ('A trusted name for a bigger project.', 'Selected by Bryan for construction and remodeling inquiries, including doors, windows, decks and additions.'),
    'rolledright': ('A good finish starts with good preparation.', 'Selected by Bryan for painting, drywall repairs and cabinet-refinishing inquiries.'),
}


def add(out, origin, pages, providers):
    root = out.parent
    e = html.escape
    catalog = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', "import {BUSINESSES,INTENTS} from './project-config.mjs';console.log(JSON.stringify({businesses:BUSINESSES,intents:INTENTS}))"], cwd=root, text=True))
    businesses, intents = catalog['businesses'], catalog['intents']
    reviews = json.loads((root/'trade_reviews.json').read_text())
    for name in ('network-contact.js', 'network-strength.css'):
        shutil.copy(root/'assets'/name, out/'assets'/name)

    def contact(key, intent):
        b = businesses[key]
        booking = '<a class="btn outline" href="'+e(b['booking'], quote=True)+'" target="_blank" rel="noopener">Book online with '+e(b['name'])+' ↗</a>' if b.get('booking') else ''
        return '<section class="network-contact" data-network-business="'+key+'" data-network-intent="'+intent+'" aria-label="Contact '+e(b['name'], quote=True)+'"><div class="eyebrow">YOUR NEXT STEP</div><h2>Talk to '+e(b['name'])+'.</h2><p>Start with your project, your town and when you’d like help.</p><div class="network-actions"><a class="btn primary" href="tel:'+e(b['tel'], quote=True)+'">Call '+e(b['phone'])+'</a>'+booking+'<span data-callback-slot></span></div><p class="network-contact-status" data-callback-status role="status">Call the business directly to discuss your project.</p><a class="network-notes" href="/start/?intent='+intent+'">Prepare project notes first →</a><small>No Wazoozie account needed. An appointment is confirmed by the business.</small></section>'

    for key, b in businesses.items():
        p = providers[key]
        target = out/'businesses'/b['slug']/'index.html'
        s = target.read_text()
        heading, reason = REASONS[key]
        review = reviews.get(b['slug'])
        review_url = review['source'] if review else 'https://www.mtownhvac.com/reviews/' if key == 'middletown' else ''
        links = '<a href="'+e(p['web'], quote=True)+'" target="_blank" rel="noopener">Business website ↗</a>' if p.get('official_web') is not False else '<a href="tel:'+e(b['tel'], quote=True)+'">Speak with the business</a>'
        if review_url:
            links += '<a href="'+e(review_url, quote=True)+'" target="_blank" rel="noopener">Published customer feedback ↗</a>'
        if key == 'middletown':
            links += '<a href="/projects/">See published installation photos →</a>'
        evidence = '<section class="evidence-panel network-evidence"><div class="eyebrow">WHY WE RECOMMEND THEM</div><h2>'+heading+'</h2><p class="network-reason">'+e(reason)+'</p><div class="network-source-links">'+links+'</div><details><summary>About this recommendation</summary><p>Bryan selects the businesses in Wazoozie’s local network. This is his recommendation. It is not a credential inspection or a competitive ranking. Read the business’s own information and agree on your project directly.</p></details></section>'
        s = re.sub(r'<section class="evidence-panel".*?</section>', lambda _: evidence, s, count=1, flags=re.S)
        s = s.replace('<article class="prose">', '<article class="prose">'+contact(key, b['defaultIntent']), 1)
        # Keep one clear contact block rather than repeating generic next-step panels.
        s = re.sub(r'<section class="profile-scheduling wrap".*?</section>', '', s, flags=re.S)
        target.write_text(s)

    # Every service panel resolves its recipient from the same routing catalog as intake.
    service_intents = {value['service']: key for key, value in intents.items()}
    from service_discovery import HVAC_INTENTS
    service_intents.update(HVAC_INTENTS)
    for service, intent in service_intents.items():
        target = out/'services'/service/'index.html'
        if target.exists():
            s = target.read_text().replace('<article class="prose">', '<article class="prose">'+contact(intents[intent]['provider'], intent), 1)
            target.write_text(s)

    neutral = '<aside class="contact-card network-wide-next"><span class="eyebrow">YOUR NEXT CONVERSATION</span><h2>Find your trusted local contact.</h2><p>Choose the work you need, meet the business and make contact directly.</p><div class="emailactions"><a class="btn primary" href="/local-help/">Meet the local network →</a><a class="btn outline" href="/book/">Call or book a business →</a></div><small>No account needed. You choose who receives your inquiry.</small></aside>'
    for path in ('about','how-it-works','our-standards','facts','delaware-valley'):
        target = out/path/'index.html'
        s = re.sub(r'<aside class="contact-card">.*?</aside>', lambda _: neutral, target.read_text(), count=1, flags=re.S)
        target.write_text(s)

    names = ', '.join('<a href="/businesses/'+b['slug']+'/">'+e(b['name'])+'</a>' for b in sorted(businesses.values(), key=lambda b:b['name']))
    about = out/'about/index.html'
    s = about.read_text()
    s = re.sub(r'(<h2>The people behind the work\.</h2>)<p>.*?</p>', lambda m:m[1]+'<p>Our home-service network brings together '+names+'. Bryan selects and recommends these businesses for the quality of their work and the people behind them.</p><p>You can also meet trusted local contacts for <a href="/auto-mechanics/">auto care</a>, <a href="/vehicle-wraps/">vehicle wraps</a> and <a href="/real-estate-agents/">real estate</a>.</p>', s, count=1, flags=re.S)
    about.write_text(s)

    how = out/'how-it-works/index.html'
    s = how.read_text()
    steps = '<section class="network-how"><div class="eyebrow">A GOOD INTRODUCTION SHOULD BE SIMPLE.</div><h2>Choose the work. Meet the people. Make the call.</h2><ol><li><strong>Find the right business.</strong><p>Start with your project. Read why the business is recommended and follow its work and customer-feedback links.</p></li><li><strong>Choose how to connect.</strong><p>Call the named business, book where an online booking link is offered, or request a callback where the request option is available.</p></li><li><strong>Agree on your next step.</strong><p>The business confirms your address, the work, timing and price with you. Wazoozie does not book an appointment just because you prepared notes.</p></li></ol><h3>What happens to a request?</h3><p>Callback options appear only for businesses with an available email-request route. The review page names the recipient and asks for your consent. The receipt distinguishes accepted, queued and unsent requests; email acceptance is not a booked appointment.</p><p>“Prepare project notes” creates a brief you can copy or share yourself. Saving notes alone does not notify a business. An email-draft link opens your email app, where you review and send it.</p><a class="btn primary" href="/local-help/">Find your local business →</a></section>'
    s = re.sub(r'<article class="prose">.*?</article>', lambda _: '<article class="prose">'+steps+'<h2>Trusted local businesses. Your choice.</h2><p>Bryan selects and recommends the local businesses in this network. Wazoozie makes introductions; each business handles its own work, scheduling and project agreement. Read the profile and agree on the scope and written terms directly.</p></article>', s, count=1, flags=re.S)
    how.write_text(s)

    home = out/'index.html'
    s = home.read_text()
    s = s.replace('Meet local businesses for your home, your car and your next move. Serving the Delco, Chester County and Main Line community, with coverage confirmed by each business.', 'Trusted local businesses for your home, your car and your next move. Chosen for the quality of their work and the people behind them.')
    intro = '<section class="wrap network-intro" aria-labelledby="network-intro-title"><div><span class="eyebrow">LOCAL PEOPLE. REPUTATIONS WORTH PROTECTING.</span><h2 id="network-intro-title">A recommendation<br>with a name behind it.</h2><p>Bryan Cordy selects the businesses in Wazoozie’s local network. Meet the people, see why they’re here and choose who you want to call.</p><a href="/how-it-works/">How our introductions work →</a></div><ol><li><span>01</span><strong>Choose your project.</strong><p>Start with what needs doing.</p></li><li><span>02</span><strong>Meet your local business.</strong><p>Read the profile and follow the sources.</p></li><li><span>03</span><strong>Connect directly.</strong><p>Call, book or use an available callback option.</p></li></ol></section>'
    s = s.replace('<section class="wrap explore-hub', intro+'<section class="wrap explore-hub',1)
    home.write_text(s)

    # Remove stale absence-of-document copy added by older build passes.
    for target in out.rglob('*.html'):
        s = target.read_text().replace(' Registration and insurance documents have not been recorded.', '')
        s = s.replace('email request forms prepare drafts rather than automatically delivering requests.', 'email-draft links open your email app for you to review and send. Available callback options use a separate, consented request flow.')
        s = re.sub(r'Has ([^<]*?) been vetted by Wazoozie\?', r'Why is \1 listed on Wazoozie?', s)
        if 'data-network-business=' in s:
            s = s.replace('</body>', '<script type="module" src="/assets/network-contact.js"></script></body>',1)
        if 'network-' in s:
            s = s.replace('</head>', '<link rel="stylesheet" href="/assets/network-strength.css"></head>',1)
        target.write_text(s)
    llms = out/'llms.txt'
    s = llms.read_text().replace(' No credential inspection is recorded.', '')
    s += '\n## Recommendation and contact model\n\nBryan Cordy, owner of Middletown HVAC and operator of Wazoozie, selects and recommends the local network. Ryan Dugan Electric handles Middletown HVAC’s electrical work. Profiles distinguish the operator’s recommendation, published business sources and customer feedback. Call the selected business directly, book where a booking link is offered, or use a callback option only where email-request delivery is available. Saving project notes alone does not notify a business or book an appointment.\n'
    llms.write_text(s)
