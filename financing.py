"""Optional external financing; no application fields or credit decision on Wazoozie."""
import shutil
from editorial import write_editorial_page

ACORN_URL = 'https://www.acornfinance.com/borrowers/'
MIDDLETOWN_ACORN_URL = 'https://www.acornfinance.com/pre-qualify/?d=4970K&amp;utm_medium=web_pre_qual_link_copy_welcome'


def add(out, origin, pages):
    shutil.copy(out.parent / 'assets/financing.css', out / 'assets/financing.css')
    body = '''<div class="wrap financing-page"><p class="eyebrow">PAYING FOR THE PROJECT</p><h1>Know the full price.<br>Then check your options.</h1><p class="financing-lede">Wondering whether you could qualify for financing? You can check prequalified offers directly with Acorn Finance.</p><section class="financing-card"><div><p class="eyebrow">OPTIONAL / ACORN FINANCE</p><h2>See if you prequalify.</h2><p>Acorn is a marketplace of lenders. Its initial prequalification uses a soft credit check with no impact to your credit score. Prequalification is not a guaranteed approval or an offer from Wazoozie.</p><p><a class="btn primary" href="'''+ACORN_URL+'''" target="_blank" rel="noopener noreferrer">Check options at Acorn Finance ↗</a></p><p class="financing-note">Opens Acorn Finance in a new tab. You enter any application information there, not on Wazoozie. A lender may make a hard credit inquiry if you proceed. Eligibility, approval, rates, fees and terms depend on the lender.</p></div><aside><h3>Before choosing an offer</h3><ul><li>Get the project’s full cash price and written scope.</li><li>Compare APR, fees, repayment term and total of payments.</li><li>Check whether a fee reduces the funds you actually receive.</li><li>Choose a payment you can afford without relying on an advertised rate.</li></ul></aside></section><section class="financing-help"><h2>Planning heating, cooling or hot water?</h2><p>Middletown HVAC also publishes its own Acorn Finance link. Use that route when exploring financing for a Middletown project.</p><a href="'''+MIDDLETOWN_ACORN_URL+'''" target="_blank" rel="noopener noreferrer">Middletown’s Acorn prequalification link ↗</a><p class="financing-note">Source: <a href="https://www.mtownhvac.com/pricing/" target="_blank" rel="noopener noreferrer">Middletown’s pricing page</a>. This does not book a visit, accept a proposal or guarantee financing.</p></section><section class="financing-help"><h2>You can keep planning without financing.</h2><p>Financing is optional. Wazoozie does not make loans, approve credit or collect your loan application. Review <a href="https://www.acornfinance.com/borrowers/" target="_blank" rel="noopener noreferrer">Acorn’s current disclosures</a> before submitting information there.</p><p><a href="/pricing-guide/">Review the cost guide →</a> <a href="/second-invoice/">Prepare your scope questions →</a> <a href="/home-services/">Find home-service businesses →</a></p></section></div>'''
    write_editorial_page(out, origin, pages, '/financing/', 'Project Financing | Check Acorn Finance Options', 'Explore optional Acorn Finance prequalification and compare total project and borrowing costs. Approval and terms depend on the lender.', body)
    full_card = '''<section class="wrap financing-promo" aria-label="Optional project financing"><div><span class="eyebrow">PLANNING THE COST</span><h2>Want to check financing?</h2><p>See if you prequalify through Acorn Finance. Initial soft credit check; final approval and terms depend on the lender.</p></div><a class="btn primary" href="/financing/">Explore financing options →</a></section>'''
    for path in ('index.html', 'second-invoice/index.html', 'pricing-guide/index.html', 'project-kit/index.html', 'businesses/middletown-hvac/index.html'):
        p = out / path
        if p.exists():
            text = p.read_text()
            if path == 'second-invoice/index.html':
                text = text.replace('<div class="ripple-privacy">', '<aside class="financing-inline"><h3>Need to spread out the project cost?</h3><p>Check optional Acorn Finance prequalification separately from this checklist. Approval and terms depend on the lender.</p><a href="/financing/">See financing options →</a></aside><div class="ripple-privacy">', 1)
            elif path == 'index.html':
                text = text.replace('</main>', full_card + '</main>', 1)
            else:
                text = text.replace('</main>', full_card + '</main>', 1)
            p.write_text(text)
    for p in out.rglob('*.html'):
        text = p.read_text()
        if 'financing-' in text:
            text = text.replace('</head>', '<link rel="stylesheet" href="/assets/financing.css"></head>', 1)
        text = text.replace('<a href="/pricing-guide/">The pricing guide</a>', '<a href="/pricing-guide/">The pricing guide</a><a href="/financing/">Financing options</a>', 1)
        p.write_text(text)
