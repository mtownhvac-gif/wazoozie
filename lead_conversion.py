"""A direct request path and visible evidence before the browsing tools."""
from pathlib import Path
import re
from editorial import write_editorial_page


def add(out, public, pages):
    body = '''<section class="wrap request-intro"><span class="eyebrow">LOCAL HELP · DELCO &amp; THE MAIN LINE</span><h1>What can we help you with?</h1><p>Tell us what needs doing. See who handles it before you send.</p></section>
<div class="wrap request-layout"><section class="request-card" aria-labelledby="request-heading"><h2 id="request-heading">Request local help</h2><noscript><p>This form needs JavaScript. <a href="/book/">Call a business directly</a> or email <a href="mailto:wazooziehelp@gmail.com">wazooziehelp@gmail.com</a>.</p></noscript>
<form id="quickRequest"><div class="request-field"><label for="request-service">What do you need?</label><select id="request-service" name="intent" required><option value="">Choose a service</option></select></div>
<div id="request-business" class="request-business" aria-live="polite"><p>Choose a service to see the business and its phone number.</p></div>
<div class="request-fields"><div><label for="request-name">Your name</label><input id="request-name" name="name" autocomplete="name" maxlength="100" minlength="2" required></div><div><label for="request-phone">Phone</label><input id="request-phone" name="phone" type="tel" autocomplete="tel" maxlength="35" required></div><div><label for="request-town">Town</label><input id="request-town" name="town" autocomplete="address-level2" maxlength="100" minlength="2" required></div><div><label for="request-zip">ZIP code</label><input id="request-zip" name="zip" inputmode="numeric" autocomplete="postal-code" pattern="[0-9]{5}" maxlength="5" required></div></div>
<div class="request-fields"><div><label for="request-state">State</label><select id="request-state" name="state"><option value="PA">Pennsylvania</option><option value="NJ">New Jersey</option><option value="DE">Delaware</option></select></div><div><label for="request-timing">When do you need help?</label><select id="request-timing" name="timing" required><option value="">Choose timing</option><option>This week</option><option>Planning ahead</option><option>Urgent</option></select></div></div>
<p id="request-coverage" class="request-note">The business confirms coverage for your address before scheduling.</p><p id="request-urgent" class="request-warning" hidden>Need help urgently? Call the business to check availability. This form is not emergency dispatch. For an immediate danger, call 911.</p>
<div class="request-field"><label for="request-details">What’s going on?</label><textarea id="request-details" name="details" rows="4" minlength="15" maxlength="2500" placeholder="A few details about the problem or the work you have in mind." required></textarea></div>
<details class="request-optional"><summary>Add email or property details (optional)</summary><div class="request-field"><label for="request-email">Email</label><input id="request-email" name="email" type="email" autocomplete="email" maxlength="180"></div><div class="request-fields"><div><label for="request-role">Your connection to the property</label><select id="request-role" name="role"><option value="Other">Prefer not to say</option><option>Homeowner</option><option>Landlord / manager</option><option>Tenant</option></select></div><div><label for="request-property">Property type</label><select id="request-property" name="property"><option value="Other">Not specified</option><option>House</option><option>Condo / apartment</option><option>Rental property</option></select></div></div></details>
<div class="request-honeypot" aria-hidden="true"><label for="request-company">Leave this empty</label><input id="request-company" name="company" tabindex="-1" autocomplete="off"></div>
<label class="request-consent"><input name="consent" type="checkbox" required><span id="request-permission">I agree to Wazoozie saving these details and emailing them to wazooziehelp@gmail.com for review and forwarding to the business shown above.</span></label>
<p class="request-note"><a href="/privacy/">Privacy details</a>. Submitting does not book an appointment.</p><p id="request-status" role="status">Checking request availability…</p><p id="request-error" role="alert" hidden></p><button class="btn primary" id="request-send" type="submit" disabled>Send request →</button> <button id="request-recheck" class="btn outline" type="button" hidden>Check availability again</button>
</form><section id="request-receipt" tabindex="-1" aria-labelledby="receipt-heading" hidden><h2 id="receipt-heading">Your request is saved.</h2><p id="request-reference"></p><p id="request-delivery"></p><p>No appointment has been booked. Call the business if you need help soon.</p><div id="receipt-contact"></div><a href="/">Back to Wazoozie →</a></section></section>
<aside class="request-aside"><h2>Know who you’re contacting.</h2><ol><li><strong>Choose the work.</strong> We show the business that handles it.</li><li><strong>Send your details.</strong> Wazoozie Help reviews and forwards your request.</li><li><strong>Confirm the visit.</strong> Agree on coverage, timing and any charges with the business.</li></ol><p>Free to request help. No Wazoozie account needed.</p><a href="/book/">Rather call directly? See all contacts →</a><figure><img src="/assets/middletown-tankless-project.jpg" width="1000" height="750" alt="Actual Navien tankless Water Heater installation published by Middletown HVAC" loading="lazy"><figcaption>Actual work · Middletown HVAC<br><a href="/projects/">See the project photos and sources →</a></figcaption></figure><p class="request-note">Each business sets its own prices and confirms availability. <a href="/how-we-choose/">How businesses are listed</a>.</p></aside></div>'''
    # Use the existing published vetting page, never create an unsupported trust claim.
    body = body.replace('/how-we-choose/', '/our-standards/')
    write_editorial_page(out, public, pages, '/request/', 'Request local home services in Delco & the Main Line', 'Request heating, cooling, plumbing, electrical, painting or home repair help. See the business before sending. No Wazoozie account needed.', body)
    page = out/'request/index.html'
    page.write_text(page.read_text().replace('</body>', '<script type="module" src="/assets/quick-request.js"></script></body>'))
    home = out/'index.html'
    content = home.read_text()
    content = re.sub(r'<a class="grand-primary" href="/home-services/">.*?</a>', '<a class="grand-primary" href="/request/?entry=home">Request local help <span aria-hidden="true">↗</span></a>', content, count=1)
    content = content.replace('Trusted local businesses for your home, your car and your next move. Chosen for the quality of their work and the people behind them.', 'Tell us what needs doing. Meet the local business that handles it, see their work and get in touch. No account needed.')
    content = content.replace('<a href="/explore/">Tools, guides &amp; a little fun →</a>', '<a href="/book/">Prefer to call? See all contacts →</a>', 1)
    proof = '''<section class="wrap local-proof" aria-labelledby="local-proof-title"><div class="local-proof-heading"><div><span class="eyebrow">ACTUAL WORK. NAMED BUSINESSES.</span><h2 id="local-proof-title">See the work before you call.</h2><p>These are published Middletown HVAC installations. Explore the photos, then ask about your own project.</p></div><a href="/projects/">More work &amp; photo sources →</a></div><div class="local-proof-grid"><a href="/request/?intent=water&amp;entry=home"><figure><img src="/assets/middletown-tankless-project.jpg" width="1000" height="750" alt="Published Middletown HVAC Navien tankless Water Heater installation" loading="lazy"><figcaption><span>Middletown HVAC</span><strong>Tankless &amp; hot water</strong><span>Ask about your project →</span></figcaption></figure></a><a href="/request/?intent=replacement&amp;entry=home"><figure><img src="/assets/middletown-ductless-project.jpg" width="1000" height="750" alt="Published Middletown HVAC ductless installation above a bedroom doorway" loading="lazy"><figcaption><span>Middletown HVAC</span><strong>Heating, cooling &amp; ductless</strong><span>Ask about your project →</span></figcaption></figure></a><article class="local-proof-contact"><span class="eyebrow">YOUR NEXT STEP</span><h3>One request.<br>A business you can name.</h3><p>Choose your service and see who will receive your details. You can also call any listed business directly.</p><a class="btn primary" href="/request/?entry=home">Request help →</a><a href="/local-help/">Meet the businesses →</a><a href="/pricing-guide/">Check planning prices →</a></article></div></section>'''
    # Put evidence before the directory and planning tools.
    marker = '<section class="wrap service-direct"'
    if marker not in content:
        raise ValueError('Homepage proof insertion point missing')
    content = content.replace(marker, proof + marker, 1)
    home.write_text(content)
    # Shared, consistent contact CTA; accounts remain available in the menu.
    for page in out.rglob('*.html'):
        text = page.read_text()
        text = text.replace('<a class="btn primary" href="/book/">Book or call <span aria-hidden="true">↗</span></a>', '<a class="btn primary" href="/request/">Request help <span aria-hidden="true">↗</span></a>')
        text = text.replace('<a class="account-top-link" href="/account/">Log in / Sign up</a>', '<a class="account-top-link" href="/request/">Request help</a>')
        text = text.replace('<a class="btn primary" href="/book/">Book or call</a>', '<a class="btn primary" href="/request/">Request help</a>')
        text = text.replace('<nav aria-label="Mobile navigation">', '<nav aria-label="Mobile navigation"><a href="/request/">Request local help</a>', 1)
        if '/services/' in '/' + str(page.relative_to(out)):
            match = re.search(r'/start/\?intent=([a-z]+)', text)
            if match:
                intent = match.group(1)
                text = text.replace('<main id="main">', f'<main id="main"><div class="wrap request-service-bar"><span>Ready to talk about your project?</span><a href="/request/?intent={intent}&amp;entry=service">Request help →</a></div>', 1)
        text = text.replace('<link rel="stylesheet"', '<link rel="stylesheet" href="/assets/lead-conversion.css"><link rel="stylesheet"', 1)
        page.write_text(text)
    assets = Path(__file__).parent/'assets'
    for name in ['quick-request.js', 'lead-conversion.css']:
        (out/'assets'/name).write_text((assets/name).read_text())
