"""Promote the owner-authorized, manually verified Middletown referral credit."""
def add(out):
    promo = '''<section class="wrap play-promo" aria-labelledby="referral-promo-title"><div><p class="eyebrow">A GOOD WORD GOES A LITTLE FURTHER.</p><h2 id="referral-promo-title">Refer a friend. Earn $25 toward service.</h2><p>Introduce a new customer to Middletown HVAC through Wazoozie. After their first qualifying job is completed, paid and verified by the office, you earn a $25 Middletown HVAC service credit.</p><p>Middletown HVAC only. <a href="/neighbors/#reward-terms">Offer terms →</a></p></div><a class="btn primary" href="/neighbors/">Refer a friend →</a></section>'''
    home=out/'index.html'
    home.write_text(home.read_text().replace('<section class="wrap play-promo"', promo+'<section class="wrap play-promo"',1))
    for path in ('play/index.html','good-call-club/index.html','businesses/middletown-hvac/index.html'):
        target=out/path
        target.write_text(target.read_text().replace('</main>','<section class="wrap project-inline"><h2>Good help is worth sharing.</h2><p>Know a friend who needs Middletown HVAC? You could earn a $25 service credit after their first qualifying paid job is verified by the office. <a href="/neighbors/">Share with a friend →</a></p></section></main>',1))
    with (out/'llms.txt').open('a') as f:
        f.write('\n## Middletown HVAC referral credit\n\n/neighbors/: see /neighbors/#reward-terms for the $25 Middletown HVAC service-credit offer effective November 8, 2026. A different new-customer household must tell the office the referrer’s name or give their optional referral link before booking. Personal links are valid for 90 days. Credit is earned only after the first qualifying job is completed, paid and manually verified by the office. One credit per new household and one credit per future invoice. No cash payout, other-provider participation or automatic rewards balance. Sharing or saving alone earns nothing.\n')
