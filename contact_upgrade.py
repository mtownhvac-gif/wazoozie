"""Wazoozie contact desk and a private, portable before-you-call checklist."""
import shutil
from editorial import write_editorial_page

def add(out, origin, pages):
    root=out.parent
    for asset in ('contact-desk.css',):
        shutil.copy(root/'assets'/asset,out/'assets'/asset)
    desk='''<section class="wrap wz-desk"><div class="breadcrumb"><a href="/">Home</a><span>/</span>Contact Wazoozie</div><header><div class="eyebrow">A REAL PERSON. A CLEAR NEXT STEP.</div><h1>Hello, neighbor.</h1><p>A question about Wazoozie? A local business we should meet? Something on a listing that needs correcting? Send us a note.</p></header><div class="wz-desk-grid"><article class="wz-desk-address"><span>THE WAZOOZIE DESK</span><h2><a href="mailto:wazooziehelp@gmail.com">wazooziehelp@gmail.com</a></h2><p>Questions, feedback and local introductions.</p><a class="btn primary" href="mailto:wazooziehelp@gmail.com?subject=Hello%20Wazoozie">Write to Wazoozie →</a><p class="wz-small">This inbox is for Wazoozie questions. For service availability or urgent work, contact the business directly. Email does not book a visit.</p></article><article><span>NEED WORK DONE?</span><h2>Go straight to the right people.</h2><p>Choose the service, see the local business and use its published phone, booking link or available request option.</p><a class="btn outline" href="/book/">Find a business to contact →</a><a class="wz-text" href="/project-kit/">Get ready before you call →</a></article></div><div class="wz-contact-topics"><article><h3>Something needs correcting?</h3><p>Include the page link, business name and the detail that looks wrong. Please leave out payment information and private documents.</p><a href="mailto:wazooziehelp@gmail.com?subject=Listing%20correction">Report a listing detail →</a></article><article><h3>Know someone worth recommending?</h3><p>Tell us the business name, the kind of work and why you would call them again. An introduction does not automatically create a listing.</p><a href="/for-contractors/">Introduce a local business →</a></article><article><h3>Share a useful starting point.</h3><p>Send a neighbor the service page or planning tool that fits their project. They choose who to contact.</p><a href="/share-wazoozie/">Share Wazoozie →</a></article></div><aside class="wz-expectation"><strong>What happens next?</strong><p>Your email goes to the Wazoozie team for review. We do not promise a response time or an appointment. Businesses confirm their own coverage, pricing and scheduling.</p></aside></section>'''
    write_editorial_page(out,origin,pages,'/hello/','Contact Wazoozie | Questions & local introductions','Email wazooziehelp@gmail.com with Wazoozie questions, listing corrections or local business introductions. Contact listed businesses directly for service.',desk)
    for target in out.rglob('*.html'):
        s=target.read_text()
        if '<footer' not in s: continue
        if 'href="/hello/">Contact Wazoozie' not in s:
            s=s.replace('<a href="/privacy/">Privacy</a>','<a href="/hello/">Contact Wazoozie</a><a href="/project-kit/">Before you call</a><a href="/privacy/">Privacy</a>',1)
        if target==out/'index.html':
            band='''<section class="wrap wz-home-desk" aria-labelledby="wz-home-desk-title"><div><div class="eyebrow">MAKE THE FIRST CALL COUNT.</div><h2 id="wz-home-desk-title">A little prep. A clearer project.</h2><p>Know what to share, what to ask and who needs to approve the work.</p><a class="btn primary" href="/project-kit/">Get your project ready →</a></div><aside><span>THE WAZOOZIE DESK</span><h3>Need a hand finding your next step?</h3><p>Questions about the site, a listing detail or a local business we should meet?</p><a href="/hello/">Say hello to Wazoozie →</a></aside></section>'''
            s=s.replace('<section class="wrap explore-hub',band+'<section class="wrap explore-hub',1)
        if target==out/'explore/index.html':
            s=s.replace('<section class="wrap destination-shortcuts">','<section class="wrap destination-shortcuts"><a href="/project-kit/">Get your project ready · a portable call sheet →</a>',1)
        s=s.replace('</head>','<link rel="stylesheet" href="/assets/contact-desk.css"></head>',1)
        target.write_text(s)
