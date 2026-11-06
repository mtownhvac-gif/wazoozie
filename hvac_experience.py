"""A short HVAC entry path without replacing the neighborhood feed."""
import html
import json
import re
import shutil
import subprocess
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from editorial import write_editorial_page


def add(out, origin, pages):
    root = out.parent
    business = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
        "import {BUSINESSES} from './project-config.mjs'; console.log(JSON.stringify(BUSINESSES.middletown))"], cwd=root))
    booking = urlsplit(business['booking'])
    query = dict(parse_qsl(booking.query))
    query['utm_content'] = 'hvac'
    business['booking'] = urlunsplit(booking._replace(query=urlencode(query)))
    body = (root / 'templates/hvac.html').read_text()
    for key in ('phone', 'tel', 'booking', 'email'):
        body = body.replace('{{' + key + '}}', html.escape(business[key], quote=True))
    write_editorial_page(out, origin, pages, '/hvac/', 'Heating & cooling help with Middletown HVAC',
        'Choose your heating or cooling project, add your project ZIP and contact Middletown HVAC. Coverage and appointments are confirmed by the business.', body)
    intents = {'comfort', 'replacement', 'maintenance', 'secondopinion', 'boiler'}
    for target in out.rglob('*.html'):
        content = target.read_text()
        # Change only exact plain intent links. Leave referral-bearing URLs intact.
        content = re.sub(r'href="/start/\?intent=([a-z]+)"', lambda m: 'href="/hvac/?intent=' + m[1] + '"' if m[1] in intents else m[0], content)
        if target in (out / 'index.html', out / 'hvac/index.html'):
            content = content.replace('</head>', '<link rel="stylesheet" href="/assets/hvac.css"></head>')
        if target == out / 'privacy/index.html':
            notice = ('<h2>Short HVAC requests.</h2><p>The heating and cooling page asks for your name, one phone number or email address, '
                      'service, project ZIP, preferred timing, short project details and consent. Wazoozie is operated by Bryan Cordy, '
                      'owner of Middletown HVAC. If you explicitly choose to save privately, these details and your consent record '
                      'are stored privately on Cloudflare for about 90 days, with daily cleanup. The operator can review your request '
                      'and follow up about this project. Saving does not automatically notify Middletown HVAC and does not book an '
                      'appointment or dispatch service.</p><p>Unsaved form entries stay in the current browser page; Wazoozie does not '
                      'store them in local browser storage. Previewing an email does not save or send your request. Opening an email '
                      'draft passes the entered details to your email app, where you decide whether to send it to Middletown HVAC. '
                      'You can also copy the request yourself. No request is automatically emailed by Wazoozie.</p>')
            content = content.replace('<h2>Your private project brief.</h2>', notice + '<h2>Your private project brief.</h2>', 1)
        if target == out / 'hvac/index.html':
            image = (origin or 'http://localhost:8123') + '/assets/middletown-ductless-project.jpg'
            content = re.sub(r'(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*(")', lambda m: m[1] + image + m[2], content)
            content = content.replace('</body>', '<script type="module" src="/assets/hvac.js"></script></body>')
        target.write_text(content)
    shutil.copy(root / 'hvac-config.mjs', out / 'assets/hvac-config.mjs')
    for name in ('hvac.css', 'hvac.js'):
        shutil.copy(root / 'assets' / name, out / 'assets' / name)


def enhance_home(out):
    """Called after neighborhood_feed.add, which replaces the original hero."""
    target = out / 'index.html'
    content = target.read_text()
    starter = '<div class="hvac-starter"><div><span class="eyebrow">HEATING OR COOLING ON YOUR MIND?</span><h2>A little closer to comfortable.</h2><p>Repair, replacement or just not sure? Start with Middletown HVAC.</p></div><a class="btn primary" href="/hvac/">Start with HVAC →</a></div>'
    if 'class="hvac-starter"' not in content:
        content = content.replace('<div class="neighbor-composer">', starter + '<div class="neighbor-composer">', 1)
    content = re.sub(r'href="/start/\?intent=(comfort|replacement|maintenance|secondopinion|boiler)"', lambda m: 'href="/hvac/?intent=' + m[1] + '"', content)
    target.write_text(content)


def promote_help(out):
    """Keep the problem-to-trade guide visible before visitors choose a service."""
    for target in out.rglob('*.html'):
        content = target.read_text()
        content = re.sub(
            r'(<nav aria-label="Main navigation">.*?)<a href="(?:/)?#how">How it works</a>',
            r'\1<a href="/help/">Who do I call?</a>', content, count=1)
        content = content.replace('<nav aria-label="Mobile navigation">',
                                  '<nav aria-label="Mobile navigation"><a href="/help/">Who do I call?</a>', 1)
        content = content.replace('<a class="btn outline" href="/about/">About us</a>',
                                  '<a class="btn outline" href="/help/">Who do I call?</a>')
        if target == out / 'index.html':
            intro = '<p>Local work, useful ideas and people worth knowing. A little help for the place you call home.</p>'
            content = content.replace(intro, intro + '<a class="btn outline" href="/help/">Not sure who to call? Start here →</a>', 1)
        target.write_text(content)
