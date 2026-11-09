"""Evidence-backed coverage, profile facts and a connected homeowner journey."""
import html
import json
import shutil
import subprocess
from local_help import PEOPLE

def add(out,origin,pages,providers):
    root=out.parent
    for name in ('coverage-config.mjs','project-progress.mjs'):
        shutil.copy(root/name,out/'assets'/name)
    shutil.copy(root/'assets/trust-followthrough.css',out/'assets/trust-followthrough.css')
    shutil.copy(root/'assets/receipt-tracking.js',out/'assets/receipt-tracking.js')
    shutil.copy(root/'assets/contact-outcome.js',out/'assets/contact-outcome.js')
    data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {PUBLISHED_COVERAGE} from './coverage-config.mjs';console.log(JSON.stringify(PUBLISHED_COVERAGE))"],cwd=root,text=True))
    (out/'assets/coverage-evidence.json').write_text(json.dumps(data))
    # Filtering needs no third-party geocoder or new service.
    for page,form_id,input_id in [('book/index.html','booking-search','booking-town'),('index.html','home-quick-search','home-town-query')]:
        target=out/page;s=target.read_text()
        start=s.index('<form class="'+form_id+'"');end=s.index('</form>',start)
        controls='<label class="location-label" for="'+input_id+'">Your town (optional)</label><input class="location-input" id="'+input_id+'" name="town" type="text" maxlength="80" autocomplete="address-level2" placeholder="For example, Media">'
        if form_id=='booking-search':controls+='<label class="coverage-toggle"><input type="checkbox" id="booking-coverage-only"> Only show published coverage matches</label><p class="coverage-note">An unlisted town means coverage is unconfirmed, not unavailable. A published match does not confirm an appointment.</p>'
        s=s[:end]+controls+s[end:];target.write_text(s)
    for slug in [p['slug'] for p in providers.values()]+[p['slug'] for p in PEOPLE]:
        target=out/'businesses'/slug/'index.html'
        if not target.exists():continue
        entry=data.get(slug);e=html.escape
        coverage=('<p><strong>Published coverage:</strong> '+e(', '.join(entry['towns']))+'. Other towns may also be served.</p><p><a href="'+e(entry['source'],quote=True)+'">Read the service-area source</a> · Source read '+entry['checkedAt']+'. This date applies to coverage only.</p>') if entry else '<p><strong>Address coverage:</strong> Not independently recorded here. Confirm your town and exact project location directly with the business.</p>'
        facts='<section class="wrap profile-facts"><div class="eyebrow">THE DETAILS BEFORE THE CALL</div><h2>Make sure the fit is right.</h2>'+coverage+'<p><strong>Availability, charges and credentials:</strong> Confirm current details with the business. A recommendation or public source link is not a current inspection, license check or appointment offer.</p><p><strong>Your next step:</strong> Describe the work, ask whether it fits, and agree on scope and price directly. Use the source links on this profile to review the business’s own information.</p><a href="/book/">Search by service and town →</a></section>'
        target.write_text(target.read_text().replace('</main>',facts+'</main>',1))
    # Reuse existing pages and tools; no new account or contact requirement.
    target=out/'my-home/index.html';s=target.read_text().replace('Your list stores project categories and progress in this browser.','Your list stores project categories and your own progress updates in this browser.')
    note='<section class="home-journey"><h2>From a plan to a real conversation.</h2><ol><li><strong>Prepare.</strong> Save a project and use its questions or project sheet.</li><li><strong>Contact.</strong> Call, book with the business, or submit a request only where offered.</li><li><strong>Keep your next step.</strong> Record a reply, a time you confirmed, or that you need another option.</li></ol><p>Wazoozie does not read your calls or verify appointment status. Your updates do not send messages or book work.</p><a href="/book/">Find another local contact →</a></section>'
    target.write_text(s.replace('<div class="home-list-toolbar">',note+'<div class="home-list-toolbar">',1))
    privacy=out/'privacy/index.html';privacy.write_text(privacy.read_text().replace('</main>','<section class="wrap project-inline"><h2>Optional introduction feedback.</h2><p>If you choose Share this outcome with Wazoozie, we count the business identifier and your selected outcome in private monthly activity records. No name, account identifier, town, contact details or project text is included in that feedback. The existing contact-activity rate limit uses a rotating client hash. Feedback is self-reported, unverified and not published as a review or confirmed appointment. Saving or updating project progress does not send this feedback automatically.</p></section></main>',1))
    for target in out.rglob('*.html'):
        target.write_text(target.read_text().replace('</head>','<link rel="stylesheet" href="/assets/trust-followthrough.css"></head>',1))
