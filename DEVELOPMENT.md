# Working on Wazoozie

This is the existing working marketplace prototype, not a new redesign.

## Files

- `index.html`: complete HTML, CSS, provider data, and browser JavaScript.
- `hero-home.png`: generated illustrative architectural hero image.
- `README.md`: shared concept and priorities.

## Run locally

No install or build is required. Open `index.html` in a browser, or run:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Current behavior

Search by service, view the three business profiles, and complete the request-review flow. Requests open a draft in the visitor's email application. Wazoozie does not automatically deliver or persist leads. Do not submit test requests to real businesses.

HVAC, boilers, and all water heaters route to Middletown HVAC. Electrical routes to Ryan Dugan Electric LLC. General plumbing routes to Liberator Service Company. Formal participation and coverage for external listings still need confirmation.

The site loads Google Fonts. No package manager, backend, analytics, or payment processor is configured.

## Hosting

The public prototype is https://wazoozie-local.middletown-h-3591.chatgpt.site/.
This GitHub repository is a collaboration copy and is not currently connected to automatic deployment. A GitHub commit does not update that hosted prototype.

For static hosting, serve the repository root with `index.html` and `hero-home.png` together. Preserve the existing wazoozie.com deployment and back it up before replacing it or changing DNS.

## Next tasks

1. Preserve the approved aesthetics.
2. Confirm provider coverage, contact details, and participation.
3. Implement reliable lead delivery, consent records, spam protection, and private lead tracking before promising automatic submission.
4. Review operating entity, affiliation wording, and privacy text against the actual business setup. Current source is the previous prototype, not newly approved legal copy.
5. Test phone and desktop layouts, routing, navigation, and real delivery with an operator-controlled test recipient.

Use separate branches and pull requests; coordinate who owns deployment. Never commit credentials, customer details, or internal costing.
