# Wazoozie — The Delaware Valley Edition

A premium homeowner marketplace introducing local businesses and directing qualified home-comfort inquiries to Middletown HVAC. Warm editorial design, clear business identities, and homeowner control over contact.

## Build and preview

Python 3.12+; no package installation required. Node is used only for JavaScript syntax checks.

```sh
python3 build.py
python3 check_site.py
node --check dist/assets/home.js
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Serve **dist/**, not the repository root. Builds are excluded from Git. `src/home.html` preserves Archie's original composition; `build.py` assembles the expanded site. `assets/refinement.css` contains visual refinements. The original PNG is retained; the site delivers the smaller JPEG.

## Current experience

- 22 generated pages covering home services, business profiles, homeowner guides, the Delaware Valley, and trust/privacy information.
- Heating and cooling is the initial directory selection. HVAC, Boiler, Water Heater, maintenance, and replacement paths connect to Middletown HVAC.
- Direct phone links and Middletown's existing Housecall Pro booking link. Outbound web/booking links include referral parameters, without form entries.
- Pennsylvania, New Jersey, and Delaware browsing. Coverage is confirmed per address; NJ and DE provider coverage is not confirmed.
- Ryan Dugan Electric LLC and Liberator Service Company are public directory listings. Participation still needs confirmation. No fabricated reviews or verification badges.
- Email requests remain **email drafts**, not automatic delivery. No Wazoozie lead database or lead tracking is configured. Never send test requests to real businesses.

## Search indexing and launch

Default builds are private-review builds: noindex, robots disallow, no sitemap. For an approved production origin:

```sh
PUBLIC_SITE_URL=https://wazoozie.com python3 build.py
python3 check_site.py
```

This adds canonicals, sitemap, social metadata, and crawl permission. It does not deploy, alter DNS, or grant public access. Confirm the origin before deploying. A private preview cannot generate search leads; search metadata does not guarantee traffic.

Preserve the existing wazoozie.com site and coordinate its public launch with the owner. GitHub pushes do not automatically update the earlier public prototype. Configure static hosting to build with `python3 build.py` and serve `dist/`.

## Operational requirements

Before labeling a provider verified, record current business identity, applicable registration/licensing, insurance, participation, and agreed coverage. Publish reviews only with evidence and permission. Automatic lead delivery requires a configured delivery service, private storage, spam protection, delivery monitoring, updated privacy text, and an end-to-end test using an operator-controlled recipient.

Use branches and pull requests. Never commit credentials, customer information, or internal costing.
