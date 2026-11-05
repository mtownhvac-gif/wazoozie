"""Neighbor introductions: private identity, public opaque sharing link."""
import shutil
from editorial import write_editorial_page


def add(out, origin, pages):
    root=out.parent
    shutil.copy(root/'assets/neighbors.js',out/'assets/neighbors.js')
    shutil.copy(root/'neighbor-config.mjs',out/'assets/neighbor-config.mjs')
    write_editorial_page(out, origin, pages, '/neighbors/', 'Share a little local help with your neighbors', 'Create a private-credit neighbor referral link for Wazoozie. Let friends choose a local business without sharing anyone’s contact details in a URL.', (root/'templates/neighbors.html').read_text())
    notice='<h2>Neighbor introductions.</h2><p>If you create a neighbor link, Wazoozie privately stores your name, email or phone, consent record, an anonymous sharing code and creation time for about 90 days. Your link contains only the code. It does not publish your identity, invite anyone automatically or subscribe anyone to marketing. If a visitor keeps the referral attached and saves a brief before the code expires, that brief records the code so the operator can attribute the introduction. Attribution is self-reported; it does not verify a customer relationship, completed job or reward eligibility. Referrers cannot retrieve a neighbor’s project details. Contact the operator below about access or deletion.</p>'
    promo='<section class="project-invite" aria-labelledby="neighbor-invite-title"><div><div class="eyebrow">ONE GOOD INTRODUCTION CAN GO A LONG WAY.</div><h2 id="neighbor-invite-title">For the neighbor<br>with a project in mind.</h2><p>The door that sticks. A room ready for fresh paint. A home that needs a little more comfort. Pass along a place to start, and let them choose the next step.</p><a class="btn primary" href="/neighbors/">Share a little local help →</a></div><div><h3>A personal introduction.<br>On their terms.</h3><p>Create a link, add your own note and share it yourself. Your contact details stay private, and your neighbor decides who to call.</p><a href="/#find">See the local businesses →</a></div></section>'
    for target in out.rglob('*.html'):
        content=target.read_text().replace('<strong>The useful details</strong>','<strong>The useful details</strong><a href="/neighbors/">For your neighbors</a>')
        if target==out/'index.html':content=content.replace('<section class="origin-story"',promo+'<section class="origin-story"',1)
        if target==out/'privacy/index.html':content=content.replace('<h2>Technical services.</h2>',notice+'<h2>Technical services.</h2>')
        if target==out/'start/index.html':
            content=content.replace('<form id="projectForm"','<div id="neighborCredit" class="project-notice" hidden><strong>A neighbor sent you.</strong><p>You can attach their introduction to this saved project brief. Their contact details stay private.</p><label><input id="keepNeighborCredit" type="checkbox" checked> Credit this neighbor introduction when I save</label><p id="neighborCreditStatus" role="status"></p></div><form id="projectForm"',1)
            content=content.replace('<div id="receiptShare"></div>','<div id="receiptShare"></div><p id="receiptNeighborStatus" role="status"></p><p><a href="/neighbors/">Know a neighbor who could use a little help? Make your own share link →</a></p>')
        target.write_text(content)
    with (out/'llms.txt').open('a') as f:f.write('\n## Neighbor introductions\n\n'+origin+'/neighbors/ creates a shareable opaque referral code after the referrer consents to private storage. A saved brief can attribute this introduction if its visitor chooses. No automatic invitations, provider delivery, booked job, reward or public access to referrer details is promised.\n')
