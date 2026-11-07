"""Public business details and homeowner routes for two additional local trades."""
import json

PARTNERS = {
    'hart': dict(slug='hart-builders', name='Hart Builders, Inc.', trade='Construction & remodeling', phone='215-350-5502', tel='+12153505502', email='quality@hartbuildersinc.com', web='https://www.hartbuildersinc.com/', featured=False, location='77 West Baltimore Pike, Media, PA 19063', source='https://www.hartbuildersinc.com/html/contact.html', short='HB', color='#76664e', cover='Room for<br>what comes next.', tags=['Doors & windows','Deck projects','Remodeling & additions'], image='window-framing', intro='A Media-based builder for door, window, deck, remodeling and addition inquiries. Discuss your project scope and address directly with the business.', body='<h2>Start with the space you want to change.</h2><p>Hart Builders, Inc. is listed at 77 West Baltimore Pike in Media. For doors, window replacement, decks, remodeling or additions, describe the space, what you want to achieve and where the property is located. Ask the business to confirm which projects it currently accepts.</p><h2>Bring the details you already have.</h2><ul><li>Existing plans or a description of the proposed work</li><li>Approximate size, access and property location</li><li>Your budget range and preferred timing</li><li>Questions about design, permits and trade coordination</li></ul><p>Agree on the complete written scope, schedule and payment terms directly. This listing does not confirm a particular project, credential inspection or appointment.</p>'),
    'rolledright': dict(slug='rolled-right-painting', name='Rolled Right Painting, LLC', trade='Painting & drywall repairs', phone='610-291-9552', tel='+16102919552', email='louislitwin618@gmail.com', web='https://rolledrightpainting.com/', featured=False, location='Aston, Pennsylvania · confirm project coverage', source='https://rolledrightpainting.com/services/', short='RR', color='#686d5b', cover='A fresh finish.<br>A room renewed.', tags=['Interior & exterior','Drywall repairs','Cabinet refinishing'], image='valley-colonial-home', intro='Interior and exterior painting, drywall repairs and cabinet refinishing from a Delaware County painting business. Confirm your scope and address directly.', body='<h2>A fresh start for the rooms you use every day.</h2><p>Rolled Right Painting lists residential and commercial painting, with interior and exterior work. Its published services also include drywall repairs, wallpaper removal and cabinet refinishing.</p><h2>Tell the team what needs a new finish.</h2><ul><li>Which rooms, walls, trim or exterior surfaces need attention</li><li>Approximate size and any damaged areas</li><li>Preparation, patching and furniture-protection needs</li><li>Finish preferences and preferred timing</li></ul><p>Ask for a written scope covering surface preparation, materials, coats, protection and cleanup. Confirm current address coverage and scheduling before arranging work.</p>'),
}


def expand(services, providers):
    providers['cooke']['intro'] = 'Smaller carpentry projects, trim, shelving and home repairs. Confirm job size, scope and availability directly with Cooke.'
    providers['cooke']['body'] += '<h2>Planning a larger project?</h2><p>For hanging doors, replacing windows, decks, remodeling or additions, start with <a href="/businesses/hart-builders/">Hart Builders</a>. Cooke is the contact for smaller carpentry and home-repair inquiries.</p>'
    for key, business in PARTNERS.items():
        p = dict(business)
        p['body'] += '<h2>Contact the business directly.</h2><p><a href="mailto:' + p['email'] + '">' + p['email'] + '</a></p><p><a href="' + p['source'] + '" target="_blank" rel="noopener">Published business contact and service information ↗</a></p>'
        providers[key] = p
    for slug, key, label, title, intro in (
        ('painting', 'rolledright', 'Painting & drywall', 'A fresh finish.<br>A home that feels like you.', 'Explore interior and exterior painting, drywall repairs and cabinet refinishing with Rolled Right Painting.'),
        ('construction-remodeling', 'hart', 'Construction & remodeling', 'More room.<br>New possibilities.', 'Discuss a construction, remodeling or addition project with Hart Builders in Media.'),
    ):
        p = providers[key]
        services[slug] = dict(label=label, key=slug, provider=key, eyebrow='MAKE YOUR NEXT PROJECT A CLEARER CONVERSATION.', title=title, desc=intro, intro=intro, sections=[('Get to know the business.', p['body'])], faqs=[('Does the listing confirm my project is accepted?', 'No. Contact the named business to confirm your exact address, project scope, timing and written terms.'), ('What should I prepare?', 'A short description, approximate dimensions, your town and preferred timing are useful starting points. Share photos or plans using the method the business requests.')])


def extend_home_script(script, providers):
    data = {}
    for key in PARTNERS:
        p = providers[key]
        data[key] = {**{k:p[k] for k in ('name','short','trade','location','phone','tel','email','web','source','tags','cover','color','featured')}, 'bio':p['intro'], 'hours':'Contact the business for current availability'}
    script = script.replace("let selectedProvider='middletown';", 'Object.assign(providers,' + json.dumps(data) + ');\nlet selectedProvider=\'middletown\';', 1)
    script = script.replace("cooke:'cooke-carpentry-construction'", "cooke:'cooke-carpentry-construction',hart:'hart-builders',rolledright:'rolled-right-painting'")
    script = script.replace("['middletown','ryan','liberator','cooke']", "Object.keys(providers).sort((a,b)=>providers[a].name.localeCompare(providers[b].name))")
    script = script.replace("s==='handyman'?'cooke':'middletown'", "s==='handyman'?'cooke':s==='painting'?'rolledright':s==='construction-remodeling'?'hart':'middletown'")
    script = script.replace("'electrical','handyman']", "'electrical','handyman','painting','construction-remodeling']")
    script = script.replace("all:'All services'", "painting:'Painting & drywall', 'construction-remodeling':'Construction & remodeling',all:'All services'")
    # Each new card opens the shared planner with that business selected.
    return script


def finish(out):
    import re
    home = out / 'index.html'
    content = home.read_text()
    content = content.replace('<option value="handyman">', '<option value="painting">Painting &amp; drywall</option><option value="construction-remodeling">Construction &amp; remodeling</option><option value="handyman">', 1)
    home.write_text(content)
    facts = '<h2>Painting and construction.</h2><p><a href="/businesses/rolled-right-painting/">Rolled Right Painting, LLC</a>: painting and drywall repair inquiries; 610-291-9552; <a href="https://rolledrightpainting.com/">official website</a>. <a href="/businesses/hart-builders/">Hart Builders, Inc.</a>: construction and remodeling inquiries; 215-350-5502; 77 West Baltimore Pike, Media, PA 19063; <a href="https://www.hartbuildersinc.com/html/contact.html">published business contact</a>. Confirm project scope and coverage directly. Registration and insurance documents have not been recorded.</p>'
    f = out / 'facts/index.html'
    f.write_text(f.read_text().replace('<h2>Coverage.</h2>',facts+'<h2>Coverage.</h2>'))
    for f in out.rglob('*.html'):
        content = f.read_text().replace('All four businesses', 'Listed businesses').replace('all four businesses', 'listed businesses')
        f.write_text(content)
    llms = out / 'llms.txt'
    llms.write_text(llms.read_text().replace('All four', 'Listed').replace('all four', 'listed'))
    with llms.open('a') as f:
        f.write('\n## Additional local businesses\n\nRolled Right Painting, LLC: interior/exterior painting and drywall repairs; 610-291-9552; louislitwin618@gmail.com; https://rolledrightpainting.com/; profile /businesses/rolled-right-painting/. Hart Builders, Inc.: construction/remodeling inquiries; 77 West Baltimore Pike, Media, PA 19063; 215-350-5502; quality@hartbuildersinc.com; https://www.hartbuildersinc.com/; profile /businesses/hart-builders/. Confirm scope and address coverage with each business. No credential inspection is recorded.\n')
