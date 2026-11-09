# Location matching and homeowner follow-through

Released work, November 9, 2026. Uses existing static pages, Worker intake and private storage. No new paid service, geocoder, model inference or external dependency.

## Visitor behavior

- The homepage search accepts an optional town and carries it to Book or Call. The directory keeps alphabetical order and shows a published coverage match or a prompt to confirm coverage. Unknown towns are not represented as exclusions.
- The optional published-coverage filter is disabled until a town is entered. It deliberately hides businesses with unknown coverage when selected; the result count explains that other businesses may still serve the town. Reset clears service, town, category and coverage filter.
- Coverage is maintained in coverage-config.mjs with its actual source-read date. Current evidence supports eight named Middletown towns from its live contact page, read November 9. This is published information, not a direct provider confirmation, guaranteed appointment or full coverage list. Other providers remain explicitly unconfirmed until evidence is recorded. Do not infer a service radius from an address or automatically advance the read date during builds.
- All 13 business profiles explain coverage and verification limits beside their existing source/recommendation paths. No new credential, rating, verified badge or claimed real-work photograph is manufactured.
- My Home and signed-in account projects now support waiting for a reply, having spoken, a time the homeowner confirmed, a business unable to help, and a deferred project. Labels and next-step text distinguish homeowner reports from business/API confirmations. Existing three-stage data remains valid; no database migration is required.
- A successful project-brief receipt offers an explicit save to My Home. Only intent and next step are retained on the device. No name, email, phone, request reference or brief content is copied. Existing later progress is preserved. Downloading the brief remains the way to keep its reference. Storage failure is reported without affecting the accepted submission.
- Optional outcome sharing requires a separate explicit click. It sends only provider, enumerated reported outcome and generic context to the existing private activity endpoint. It does not attach an account, town, request text or contact detail, contact the business, publish a review, or prove a booking. These are event counts, not unique people or verified conversions. Existing rate limits and retention apply. Privacy copy explains the distinction.
- The read-only public browser discovery tool accepts a town and optional published-coverage filter, returning matching evidence and unconfirmed status. No booking/write capability is introduced.

## Validation

Production build: 81 pages. HTML, IDs, metadata, local links, schema, contact and agent checks passed. All 151 Node tests passed. New tests cover location/unknown states, reset and category constraints, all profile evidence panels, strict input rendering, explicit receipt saving, unavailable storage, later-stage preservation, account validation, homeowner-confirmed wording, and voluntary outcome sharing with retry and bounded data. Existing account, private intake, consent, delivery, quotas and pricing tests pass.

Visual browser QA and real inbox/booking submissions were not available or performed. Verify published desktop/mobile appearance after deployment where browser access is available. No claim of Search Console indexing or improved conversion is made by this release.

## Evidence still to obtain

- Other businesses' published or directly approved town coverage and the exact source-read date.
- Business-approved original project photos and permission for their use. Existing illustrative pictures must not be relabeled as actual jobs.
- Actual source refreshes for phone, scope, credentials and availability. The coverage date applies only to coverage.
- Search Console live URL inspection, selected canonicals and indexing status through an authorized account. A research crawler failing to fetch the site is not proof that Google is blocked.
- An authorized owner-only way to review monthly activity totals, preserving the distinction between clicks, self-reports, accepted requests and confirmed outcomes. There is no public metrics endpoint.

These requirements remain evidence tasks, not fields to fill with guesses or reasons to buy another service.
