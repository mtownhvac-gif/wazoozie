"""Useful HVAC decision content and crawlable routes, without new doorway pages."""
import html

OPTIONS = (
    ('/services/heating-cooling/', 'Heating and AC repair', 'Start with the system and symptoms.'),
    ('/services/furnace-repair/', 'Furnace not heating', 'Safe first checks and what to tell the office.'),
    ('/services/second-opinion/', 'A second opinion on a major repair', 'Understand the diagnosis before comparing prices.'),
    ('/services/water-heaters/', 'Water heater and tankless help', 'Describe the hot-water problem and equipment.'),
)


def add(out):
    target = out / 'services/second-opinion/index.html'
    content = target.read_text()
    guidance = '''<section class="service-decision" aria-labelledby="second-opinion-evidence"><h2 id="second-opinion-evidence">A diagnosis to understand, not just another price.</h2><p>A second visit is most useful when it answers the question behind the recommendation. Is a particular component faulty? Is the proposed work addressing the symptom or its cause? Why is replacement being discussed now?</p><h3>Five questions for the assessment</h3><ol><li><strong>What finding supports the diagnosis?</strong> Ask the technician to explain the relevant inspection or test result in everyday language. A photograph or written finding can help you understand the issue; do not open equipment or attempt the test yourself.</li><li><strong>What would a repair resolve?</strong> Separate the immediate fault from other wear, comfort problems or recommended improvements. Ask what remains uncertain until work begins.</li><li><strong>Why compare replacement with repair?</strong> Discuss the condition, repair history, parts availability and complete cost of each practical option. Equipment age alone is not a diagnosis.</li><li><strong>Are the proposals for the same work?</strong> Compare equipment, labor, necessary supporting work and exclusions. Ask which findings could change the scope and how extra work would be approved.</li><li><strong>What is covered afterward?</strong> Ask for applicable parts and labor terms in writing, any conditions or exclusions, and who handles a problem after the job.</li></ol><h3>If the first company flagged unsafe equipment</h3><p>Do not restart equipment that was shut down or tagged unsafe while waiting for another opinion. Tell the office exactly what you were told. A second opinion is not permission to bypass a safety control. For a gas odor, carbon monoxide alarm or immediate danger, leave the building and call emergency services or the utility from a safe location.</p><h3>Leave with a usable next step</h3><p>Ask what was found, which options are practical, and what the next authorized step would cost. The assessment may support the original recommendation, identify a different option or require more investigation. It does not promise a cheaper repair or a particular outcome.</p><p><a href="/compare/">Compare the scope of two written estimates →</a> · <a href="/guides/compare-hvac-estimates/">Read the HVAC estimate checklist →</a></p><p class="service-content-source">These are Wazoozie’s homeowner preparation questions, not a diagnosis. Middletown’s <a href="https://www.mtownhvac.com/services/">published service information</a> describes its repair assessment and repair-versus-replacement considerations. Confirm the visit scope, current charge, address coverage and availability with the office.</p></section>'''
    marker = '<h2>Make the next decision a clearer one.</h2>'
    if marker not in content:
        raise ValueError('The second-opinion page changed; review the insertion point.')
    target.write_text(content.replace(marker, guidance + marker, 1))

    paths = ['/businesses/middletown-hvac/', '/services/heating-cooling/',
             '/services/furnace-repair/', '/services/second-opinion/']
    for path in paths:
        target = out / path.lstrip('/') / 'index.html'
        links = ''.join('<li><a href="'+url+'">'+html.escape(label)+'</a>: '+html.escape(description)+'</li>'
                        for url, label, description in OPTIONS if url != path)
        section = '<section class="wrap project-inline hvac-related" aria-labelledby="hvac-related-title"><h2 id="hvac-related-title">Choose the right HVAC conversation.</h2><p>Use the guide that matches your question, then confirm the visit with Middletown HVAC.</p><ul>'+links+'</ul><p>Based in Glen Mills. Confirm service coverage for your exact address; these links do not show live appointment availability.</p></section>'
        target.write_text(target.read_text().replace('</main>', section+'</main>', 1))
