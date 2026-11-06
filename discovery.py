"""Project-specific search resources and an optional homeowner calendar reminder."""
import html
import shutil
from editorial import write_editorial_page

GUIDES = [
    ('painting-estimate-checklist', 'Painting Estimate Checklist: Preparation, Coats & Cleanup', 'Compare painting proposals by surfaces, preparation, repairs, materials, protection and cleanup before agreeing on the job.', 'painting', 'Painting & drywall', 'What is actually included in a painting estimate?', [
        ('Define the surfaces.', 'List each room or exterior surface. Identify walls, ceilings, doors, cabinets and trim separately. Ask whether closets, window areas and hard-to-reach sections are included.'),
        ('Make preparation visible.', 'Ask which patching, sanding, caulking and surface cleaning are included. Note existing damage in the scope and agree how additional repairs will be priced before work begins.'),
        ('Specify the finish.', 'Record the proposed product, finish and color-selection process. Ask how primer and finish coats will be determined for the existing surface, and what happens if the agreed finish needs additional work.'),
        ('Plan the occupied home.', 'Agree who moves furniture, protects floors, manages access and restores rooms. Ask how the business handles daily cleanup, leftover materials and a final walkthrough.')],
        ['Which surfaces and preparation steps are excluded?', 'How are repairs discovered during preparation approved and priced?', 'What material and labor terms are provided in writing?']),
    ('electrical-project-estimate', 'Electrical Project Estimate: Questions About Scope & Access', 'Prepare an electrical project inquiry with fixture details, locations, access questions and a clear written scope.', 'electrical', 'Electrical work', 'A clearer scope for your next electrical project.', [
        ('Describe the outcome, not a guessed fix.', 'List the rooms, fixtures or outlets involved and what you want to change. Describe what you observed and when. Let the electrician determine the cause and required work.'),
        ('Separate fixtures from installation.', 'Ask who supplies the fixtures and whether they are compatible with the intended use. Include counts, mounting locations and any controls or dimmers you want considered.'),
        ('Discuss access and restoration.', 'Ask whether access to walls or ceilings may be needed. Agree who handles patching, painting and moving belongings, and whether that restoration appears in this proposal or a separate one.'),
        ('Clarify project responsibilities.', 'Have the electrician explain any assessment, permit, inspection or utility coordination required for the proposed work. Confirm who arranges each item and what the price includes.')],
        ['What is included in the diagnostic visit or estimate?', 'Which supplied fixtures, access work and restoration are excluded?', 'How will additional findings change the written scope?']),
    ('prepare-for-plumbing-service', 'Prepare for a Plumbing Visit: Details That Help the First Call', 'Organize fixture details, symptoms, timing and access before discussing a plumbing or drain-service visit.', 'plumbing', 'Plumbing & drains', 'Make the first plumbing conversation more useful.', [
        ('Identify the affected fixtures.', 'Write down whether the concern involves one fixture or several. Describe the location, what changed and when it first happened. Include prior findings or invoices if available.'),
        ('Describe the pattern.', 'Explain whether the issue is constant or intermittent and what normal household use is affected. Photographs of visible conditions can help the business plan; an on-site assessment may still be necessary.'),
        ('Prepare normal access.', 'Tell the office about tight spaces, building access rules or other scheduling constraints. Ask what should be accessible for the visit. Avoid moving heavy equipment or opening concealed areas yourself.'),
        ('Ask how the visit is priced.', 'Confirm any diagnostic or dispatch charge, what the initial visit includes and how repairs are authorized. For replacement work, ask about materials, disposal, restoration and written warranty terms.')],
        ['What should I have ready before the visit?', 'What does the initial charge cover, and how is repair work approved?', 'If a second trade is needed, what must it complete and who arranges it?']),
    ('window-replacement-questions', 'Window Replacement Questions: Compare the Complete Scope', 'Compare window proposals by opening count, installation method, surrounding repairs, finishing and written terms.', 'windows', 'Windows & surrounding repairs', 'Compare the window and the work around it.', [
        ('Count and identify openings.', 'List the rooms and number of windows. Record the style you have and what you want to improve: operation, drafts, appearance or another concern. Ask the business to assess the cause rather than assuming every concern needs replacement.'),
        ('Understand the installation method.', 'Ask how the existing opening and surrounding materials will be evaluated. Have the proposal explain what will remain, what will be removed and how any concealed damage changes the scope.'),
        ('Include the finishing work.', 'Ask about interior trim, exterior finishing, wall repairs, painting, disposal and protecting occupied rooms. Identify work that another trade must price separately.'),
        ('Keep product and labor terms together.', 'Compare the proposed product details, installation scope and written warranty responsibilities. Confirm ordering, scheduling, payment milestones and the process for handling a damaged or incorrect product.')],
        ['Does this price cover every listed opening and its finishing work?', 'What happens if removal exposes damage?', 'Who handles follow-up for a product issue versus an installation issue?'])
]


def add(out, origin, pages):
    e = html.escape
    cards = []
    for slug, title, description, intent, category, heading, sections, questions in GUIDES:
        path = '/guides/' + slug + '/'
        cards.append(f'<article><h3><a href="{path}">{e(category)}</a></h3><p>{e(description)}</p><a href="{path}">Get the questions →</a></article>')
        body = '<div class="wrap growth-page"><div class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/guides/">Homeowner guides</a></div><div class="growth-intro"><div class="eyebrow">KNOW WHAT TO ASK BEFORE YOU HIRE</div><h1>' + e(heading) + '</h1></div><p>' + e(description) + '</p><p>This is a conversation checklist, not a diagnosis, price estimate or specification. Ask the business to assess your home and confirm coverage and scope.</p><div class="growth-grid">'
        body += ''.join('<section><h2>'+e(label)+'</h2><p>'+e(copy)+'</p></section>' for label,copy in sections)
        body += '</div><h2>Bring these three questions.</h2><ol>'+''.join('<li>'+e(q)+'</li>' for q in questions)+'</ol><p><button type="button" class="btn outline" data-growth-print>Print this conversation checklist</button></p><aside class="growth-callout"><h2>Put the questions to a local business.</h2><p>See the named business for this project and decide how you want to make contact. Confirm your address, project fit and any visit charge directly.</p><a class="btn primary" href="/start/?intent='+intent+'">Plan this project →</a> <a href="/project-kit/?intent='+intent+'">Prepare a conversation sheet →</a></aside><p><a href="/compare/">Compare two written proposals →</a> · <a href="/home-care-reminder/">Make a reminder to revisit your project →</a></p></div>'
        write_editorial_page(out,origin,pages,path,title,description,body)
        target=out/path.strip('/')/'index.html'
        target.write_text(target.read_text().replace('</head>','<link rel="stylesheet" href="/assets/growth.css"></head>').replace('</body>','<script type="module" src="/assets/growth.js"></script></body>'))
    body='''<div class="wrap growth-page"><div class="breadcrumb"><a href="/">Home</a><span>/</span>Home-care reminder</div><div class="growth-intro"><div class="eyebrow">A SMALL NUDGE FOR A FUTURE YOU</div><h1>Make room for your next home project.</h1></div><p>Choose a topic and a day. Download a calendar file to review and import into your own calendar. It includes a link back to the relevant Wazoozie tool. No email, phone or account is needed.</p><form id="care-reminder" class="growth-calculator"><label>What would you like to revisit?<select name="topic"><option value="checklist">My seasonal home checklist</option><option value="painting">A painting project</option><option value="electrical">An electrical project</option><option value="plumbing">A plumbing project</option><option value="windows">A window project</option><option value="comfort">Heating & cooling planning</option><option value="budget">My project budget</option></select></label><label>Choose your reminder date<input type="date" name="date" required></label><button class="btn primary" type="submit">Download my calendar reminder</button><p id="care-status" role="status" aria-live="polite">This prepares one all-day calendar entry. Review the file and your calendar’s reminder settings when importing it.</p></form><p>The date is your choice, not a recommended maintenance interval. Follow equipment instructions and your professional’s advice. Nothing is added to a calendar until you import the file; this tool does not email you or book a visit.</p><noscript><p>The calendar download needs JavaScript. You can manually add a reminder linking to <a href="/seasonal-home-checklist/">your seasonal checklist</a>.</p></noscript><p><a href="/home-tips/">Browse home tips →</a> · <a href="/start/">Ready now? Start a project →</a></p></div>'''
    write_editorial_page(out,origin,pages,'/home-care-reminder/','Home-Care Calendar Reminder | A Free Project Planning Tool','Make a one-time calendar reminder to revisit a home project or seasonal checklist. No account or email needed.',body)
    target=out/'home-care-reminder/index.html'
    target.write_text(target.read_text().replace('</head>','<link rel="stylesheet" href="/assets/growth.css"></head>').replace('</body>','<script type="module" src="/assets/care-reminder.js"></script></body>'))
    shutil.copy(out.parent/'assets/care-reminder.js',out/'assets/care-reminder.js')
    catalog='<section class="wrap growth-discovery" aria-labelledby="project-questions-title"><div><div class="eyebrow">BEFORE YOU SAY YES TO THE JOB</div><h2 id="project-questions-title">A better question.<br>A clearer estimate.</h2><p>Pick the project you’re planning. Keep the scope, responsibilities and next steps clear.</p><a href="/home-care-reminder/">Make a home-care calendar reminder →</a></div><div class="growth-guide-links">'+''.join(cards)+'</div></section>'
    for path in ('index.html','guides/index.html','home-tips/index.html'):
        target=out/path
        content=target.read_text().replace('</main>',catalog+'</main>',1)
        target.write_text(content)
    mapping={'painting':'painting-estimate-checklist','electrical':'electrical-project-estimate','plumbing':'prepare-for-plumbing-service','construction-remodeling':'window-replacement-questions'}
    for service,slug in mapping.items():
        target=out/'services'/service/'index.html'
        content=target.read_text().replace('</main>','<aside class="wrap project-inline"><h2>Know what to ask before you hire.</h2><p><a href="/guides/'+slug+'/">Read the project conversation checklist →</a></p></aside></main>',1)
        target.write_text(content)
