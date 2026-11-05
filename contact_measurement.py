"""Private contact-action counts and real-work proof, without marketing cookies."""
import re
import shutil


def improve(out):
    root = out.parent
    shutil.copy(root / 'assets/contact-activity.js', out / 'assets/contact-activity.js')
    shutil.copy(root / 'activity-config.mjs', out / 'assets/activity-config.mjs')
    proof = '<section class="published-proof" aria-labelledby="published-work-title"><div class="eyebrow">PUBLISHED MIDDLETOWN HVAC WORK</div><h2 id="published-work-title">See the work.<br>Then start a conversation.</h2><div class="published-proof-grid"><figure><a href="/projects/"><img src="/assets/middletown-conversion-project.jpg" alt="Middletown HVAC technician at a published Bosch Heat Pump installation" width="1200" height="1600" loading="lazy"></a><figcaption>Heat Pump installation · <a href="https://www.mtownhvac.com/conversion/" target="_blank" rel="noopener">Published project source ↗</a></figcaption></figure><figure><a href="/projects/"><img src="/assets/middletown-tankless-project.jpg" alt="Published Middletown HVAC Navien tankless Water Heater installation with copper piping" width="1200" height="1600" loading="lazy"></a><figcaption>Tankless Water Heater · <a href="https://www.mtownhvac.com/conversion/" target="_blank" rel="noopener">Published project source ↗</a></figcaption></figure></div><p><a href="/projects/">Explore the project gallery →</a></p></section>'
    for target in out.rglob('*.html'):
        content = target.read_text()
        content = content.replace('</body>', '<script type="module" src="/assets/contact-activity.js"></script></body>')
        if '/businesses/' in str(target):
            content = re.sub(r'<figure class="(?:family-scene|porch-scene)".*?</figure>', '', content, flags=re.S)
        if target == out / 'businesses/middletown-hvac/index.html':
            content = content.replace('<section class="evidence-panel"', proof + '<section class="evidence-panel"', 1)
        if target == out / 'privacy/index.html':
            notice = '<h2>Contact-action counts.</h2><p>We count clicks on listed business phone, booking, office-email and selected website links, plus successfully saved briefs. Counts are grouped by day, business and page type. The counts contain no form entries, message bodies, full URLs or browsing histories. We use no analytics cookies or visitor IDs. Click counts do not confirm that a call connected, an email was sent, or an appointment was booked.</p><p>For abuse prevention, the host processes IP addresses and the application retains a daily rotating IP hash for up to about three days. Aggregate contact counts are kept for about 90 days with daily cleanup. Private project briefs are handled separately as described above.</p>'
            content = content.replace('<h2>Technical services.</h2>', notice + '<h2>Technical services.</h2>')
        target.write_text(content)
