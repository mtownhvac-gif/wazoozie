"""Private contractor applications and clear, non-billing participation options."""
import html
import json
import shutil
import re
import subprocess
from editorial import write_editorial_page


def add(out,origin,pages):
    root=out.parent
    trades=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {CONTRACTOR_TRADES} from './contractor-config.mjs'; process.stdout.write(JSON.stringify(CONTRACTOR_TRADES));"],cwd=root,text=True))
    choices=''.join('<label><input type="checkbox" name="services" value="'+key+'"><span>'+html.escape(label)+'</span></label>' for key,label in trades.items())
    body=(root/'templates/contractors.html').read_text().replace('{{TRADE_CHECKBOXES}}',choices)
    write_editorial_page(out,origin,pages,'/for-contractors/','For local businesses | Listing applications','Apply for Wazoozie listing consideration or express interest in sponsored visibility. Applications are reviewed, not automatically published. No charge to apply.',body)
    for name in ('contractors.js','contractors.css'):
        shutil.copy(root/'assets'/name,out/'assets'/name)
    shutil.copy(root/'contractor-config.mjs',out/'assets/contractor-config.mjs')
    for target in out.rglob('*.html'):
        content=target.read_text()
        content=content.replace('href="/#partners"','href="/for-contractors/"')
        content=content.replace('href="#partners"','href="/for-contractors/"')
        if target==out/'index.html':
            content=content.replace('<button class="btn outline" id="applyProvider">Introduce your business ↗</button>', '<a class="btn outline" id="applyProvider" href="/for-contractors/">Introduce your business ↗</a>')
            content=re.sub(r'<dialog\b[^>]*id="partnerDialog"[^>]*>.*?</dialog>', '', content, flags=re.S)
        content=content.replace('<nav aria-label="Mobile navigation">','<nav aria-label="Mobile navigation"><a href="/for-contractors/">For local businesses</a>')
        if target==out/'for-contractors/index.html':
            content=content.replace('</head>','<link rel="stylesheet" href="/assets/contractors.css"></head>')
        if target==out/'privacy/index.html':
            notice='<h2>Business applications.</h2><p>When a business applies, Wazoozie privately stores its submitted contact details, service areas, service selections, website, self-reported registration and insurance information, participation interest, notes and consent record on Cloudflare for about 90 days with daily cleanup. The operator reviews applications manually and may contact the applicant about the application and selected interest. Submission does not publish a profile, verify credentials, start a subscription or authorize a charge. Application details are not publicly searchable. Request access or deletion through the contact below.</p>'
            content=content.replace('<h2>Technical services.</h2>',notice+'<h2>Technical services.</h2>')
        target.write_text(content)
    home_script=out/'assets/home.js'
    script=home_script.read_text()
    script=re.sub(r'^function partnerOpen\(\).*?$', '', script, flags=re.M)
    home_script.write_text(script)
    with (out/'llms.txt').open('a') as file:
        file.write('\n## Local businesses\n\n'+origin+'/for-contractors/ accepts private applications for listing consideration and sponsored-visibility interest. Applying is free; there is no automatic publication, payment collection or guaranteed lead volume. Paid placement requires separate written terms and must be labeled Sponsored.\n')
