"""A useful first decision on the homepage, with ordinary links as fallback."""
import shutil
import re

CHOICES = [
    ('comfort', 'Heating or cooling', '01'),
    ('water', 'Hot water', '02'),
    ('plumbing', 'Leaks or drains', '03'),
    ('electrical', 'Electrical work', '04'),
    ('painting', 'Painting or drywall', '05'),
    ('carpentry', 'Small home repairs', '06'),
    ('windows', 'Doors or windows', '07'),
    ('decks', 'Decks or remodeling', '08'),
]

def add(out):
    choices = ''.join(f'<a class="project-finder-choice" href="/request/?intent={key}&amp;entry=home" data-project-choice="{key}"><span aria-hidden="true">{number}</span>{label}<span class="project-finder-arrow" aria-hidden="true">↗</span></a>' for key,label,number in CHOICES)
    body = '''<section class="wrap project-finder" aria-labelledby="project-finder-title"><header><div><span class="eyebrow">LET’S GET SOMETHING DONE</span><h2 id="project-finder-title">What’s on your list?</h2><p>A problem to solve or a project to plan. Start here.</p></div><a href="/book/">All local contacts →</a></header><div class="project-finder-layout"><div class="project-finder-choices" aria-label="Choose your project">'''+choices+'''</div><section class="project-finder-result" id="project-finder-result" aria-labelledby="project-finder-result-title"><div class="project-finder-empty"><span class="project-finder-mark" aria-hidden="true">↗</span><h3 id="project-finder-result-title">A name. A number.<br>A place to start.</h3><p>Choose the work to see who handles it and what to have ready.</p><a href="/local-help/">Or browse the businesses →</a></div></section></div><p class="project-finder-more">For the rest of life: <a href="/auto-mechanics/">Auto care</a><a href="/vehicle-wraps/">Vehicle wraps</a><a href="/real-estate-agents/">Buying or selling</a></p><p class="project-finder-announcement" id="project-finder-announcement" role="status"></p></section>'''
    home=out/'index.html'
    content=home.read_text()
    existing=re.search(r'<section class="wrap service-direct".*?</section>',content,re.S)
    if not existing: raise ValueError('Project finder placement missing')
    next_steps=re.search(r'<nav class="service-next-steps".*?</nav>',existing.group(),re.S)
    if not next_steps: raise ValueError('Existing planning links missing')
    body=body.replace('<p class="project-finder-more">','<p>No Wazoozie account needed. Each business confirms its coverage, pricing and availability with you.</p>'+next_steps.group()+'<p class="project-finder-more">',1)
    content=content[:existing.start()]+body+content[existing.end():]
    content=content.replace('</head>','<link rel="stylesheet" href="/assets/project-finder.css"></head>',1)
    content=content.replace('</body>','<script type="module" src="/assets/project-finder.js"></script></body>',1)
    home.write_text(content)
    for name in ['project-finder.js','project-finder.css']:
        shutil.copy(out.parent/'assets'/name,out/'assets'/name)
