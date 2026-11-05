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

- 26 generated pages covering home services, business profiles, homeowner guides, the Delaware Valley, and trust/privacy information.
- Heating and cooling is the initial directory selection. HVAC, Boiler, Water Heater, maintenance, and replacement paths connect to Middletown HVAC.
- Direct phone links and Middletown's existing Housecall Pro booking link. Outbound web/booking links include referral parameters, without form entries.
- Pennsylvania, New Jersey, and Delaware browsing. Coverage is confirmed per address; NJ and DE provider coverage is not confirmed.
- Ryan Dugan Electric LLC, Liberator Service Company, and Cooke Carpentry & Construction, LLC are directory listings. Participation still needs confirmation. No fabricated reviews or verification badges.
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

## Private project briefs

`/start/` is the guided project form. `project-config.mjs` defines the permitted
service-to-business routing once, for both browser and server. `/projects/`
contains sourced photos of actual published Middletown HVAC work.

The production Worker entry is `entry.mjs`; its `PROJECT_INBOX` SQLite Durable
Object stores validated, consented briefs. The initial migration is
`project-inbox-v1`. Existing public assets, Markdown negotiation and domains are
preserved. Deploy with `npm run deploy` from an authenticated Cloudflare session.
The deploy command builds and runs the checks before changing production.

**Delivery is not automatic.** Saving does not notify a contractor, reserve a
visit or create a Housecall Pro customer. The confirmation says this explicitly
and offers the selected business's phone and, where available, booking link.
Do not change the receipt to “sent” until a delivery service is configured and
its acceptance is verified. Project-saving failure leaves direct contact usable.

Office review uses authenticated Cloudflare Data Studio: Durable Objects →
ProjectInbox namespace → Data Studio. Enter the object name
`middletown:YYYY-MM`, `ryan:YYYY-MM`, `liberator:YYYY-MM` or `cooke:YYYY-MM` for
the current UTC month. Review new requests with:

```sql
SELECT id, created_at, intent, name, phone, email, town, zip, state, details,
       timing, role, property, equipment, source
FROM project_briefs WHERE status = 'new' ORDER BY created_at DESC;
```

After reviewing a specific reference, update its status using an exact ID:

```sql
UPDATE project_briefs SET status = 'reviewed' WHERE id = 'exact-project-uuid';
```

There is no public endpoint to list or retrieve briefs. Records expire after
90 days through daily alarms. Daily salted hashes enforce a five-new-brief
limit per client per provider/month partition, plus a 200-new-brief daily cap
per partition. Honeypot, origin checks, strict validation and a 16 KiB body
limit provide basic abuse controls; they do not prevent all automated spam.
If abuse grows, add a verified challenge before relaxing these limits.

For an access/deletion request, locate the relevant records in Data Studio,
verify the requester, and remove only their matching records. Do not copy
customer information into source control, build assets, screenshots or logs.

Run `npm run build:production && npm run check`. Backend tests exercise actual
Cloudflare SQLite storage locally through Miniflare with synthetic data only,
including idempotency, rate limits, conflicts and retention. Browser QA should
use `npm run dev` or the managed preview; local preview storage stays local.
`INTAKE_LOCAL_PREVIEW` is set by the dev launcher only and must not be configured
as a production variable.

## Homeowner tools and evidence

`/help/` provides ten plain-language problem routes to the four listed businesses.
Routing is explicit in `assets/problem-config.mjs`, using shared intent IDs from
`project-config.mjs`. It is a trade guide, not a remote diagnosis. The page
collects no contact information. `/before-you-approve/` supplies a printable,
eight-point proposal conversation checklist; selections stay in the open page.

Business profiles distinguish published business/review sources from credential
and insurance documents not recorded in this directory. Editorial inclusion is
not a credential check, ranking or guarantee. No operating-history claims are
added. The evidence record date describes this profile revision only.

Project planning now offers direct contact before form entry. Reviewed briefs
can be copied, downloaded or, for Middletown HVAC, placed in a draft addressed
to its published office email. That uses the homeowner's email app; the homeowner
must review and send it. Wazoozie cannot verify delivery, and no draft is sent
automatically. Saving a private brief remains a separate, optional action.
Service-specific prompts help collect useful equipment, symptoms and scope.

Frontend interaction tests use a DOM environment with synthetic details and
mocked network requests; they do not contact businesses or open email clients.

## Private contact measurement

Contact-link clicks are counted by action (`call_click`, `booking_click`,
`email_draft_click`, `website_click`), business and page category. The public
`POST /api/contact-activity` endpoint accepts exactly those three enumerated
fields. It rejects extra fields, full URLs, names, email bodies and project text.
There are no visitor IDs, analytics cookies or public reporting endpoints.
Clicks indicate intent only; they do not establish connected calls, delivered
emails, booked appointments or completed jobs.

In authenticated Cloudflare Data Studio, open `activity:YYYY-MM` in the existing
ProjectInbox namespace. Review private counts with:

```sql
SELECT day, provider, context, action, count
FROM contact_counts ORDER BY day DESC, provider, action;
```

Saved-brief counts are recorded transactionally in the relevant provider/month
object (`middletown:YYYY-MM`, etc.) as `brief_saved`, once per newly stored brief.
Retries do not increase the count. Read those counts in the corresponding object;
they are not copied into the activity object. This keeps capture authoritative
without making a successful save depend on an analytics call.

Contact counting is best effort. A blocking browser or network failure can
prevent a count; form saving and direct contact keep working independently.
The endpoint caps each daily IP hash at 100 counted clicks and each monthly
activity object at 20,000 counts per day. Raw IP addresses are never stored in
the tables. Daily cleanup removes old abuse keys and counts after their retention
periods; aggregate counts follow the existing approximately 90-day policy.
No new Cloudflare binding, external analytics provider or paid email feature is
required. Deployment uses the existing private SQLite namespace.

The problem guide now builds its first usable links from
`assets/problem-config.json`; JavaScript enhances that content rather than
creating the only route choices. The build generates the matching browser
module from this same source. New editorial pages include consistent title,
Open Graph, Twitter, organization and breadcrumb metadata.

## Whole-home project categories

The planner starts with ten unselected projects across repairs/finishing,
bigger home projects, and household systems. Doors, windows, painting/drywall,
carpentry, decks and remodeling/additions appear alongside HVAC, hot water,
electrical and plumbing work. Specialist HVAC options sit under one heating and
cooling choice; existing Boiler, maintenance, replacement and second-opinion links
still select the correct detail. Changing a project clears its previous consent.

Shared `PROJECT_GROUPS` and `INTENTS` drive the planner, homepage project links,
problem-guide fallback routing and intake validation. The builder reads this
configuration through Node rather than duplicating labels or routing in Python.
Cooke is a contact for discussing construction project scope; window, deck,
remodeling/addition and painting/drywall services require direct scope confirmation.
Painting/drywall capability is explicitly unconfirmed. These project categories
do not represent new verified credentials, additional contractors or guaranteed
availability. Existing four-business profiles are preserved.

## Contractor applications and future monetization

`/for-contractors/` accepts applications for listing consideration, sponsored
visibility interest and additional-area coverage interest. Application is free.
No checkout, subscription, automatic listing, lead guarantee or charge is created.
Any future paid placement must be labeled Sponsored and separately agreed in
writing; fees and billing remain unconfigured. Document checks and actual project
fit remain separate from paid promotion. Do not publish self-reported credentials
as verified, and obtain permission for submitted photos and review sources.

`POST /api/contractor-applications` validates consent and business information,
then stores it privately using the existing ProjectInbox namespace. There is no
public read/list endpoint. Data Studio object names are `applications:YYYY-MM`.
Office review is manual; automatic alerts are not configured. Review with:

```sql
SELECT id, created_at, status, business_name, contact_name, email, phone, website,
       town, state, coverage, services, registration, insurance, interest, notes
FROM contractor_applications WHERE status = 'awaiting_review'
ORDER BY created_at DESC;
```

Record review progress against exact IDs, without implying publication:

```sql
UPDATE contractor_applications SET status = 'reviewed' WHERE id = 'exact-uuid';
```

Application capture has idempotency, a three-new-applications daily client limit,
a 50-per-day monthly-object cap and approximately 90-day cleanup. The table's
`application_saved` count records new applications only. No application details
are written into public assets or returned in receipts. Retention/abuse-key
behavior follows the same private storage lifecycle as homeowner briefs.

### Water Heater photo sources

The Water Heater service page and Middletown profile pair two actual, publicly
published Middletown installation photographs. No generated installation image
is used as evidence of its work.

- `assets/middletown-tankless-project.jpg`: Navien installation, published at
  https://www.mtownhvac.com/conversion/.
- `assets/middletown-conventional-project.jpg`: Bradford White tank Water Heater
  beside a Heil Furnace, published at https://www.mtownhvac.com/services/tankless/
  (`/assets/img/services__tankless/furnace-water-heater-branded-plenum.jpg`).

`water_heater_presentation.py` supplies source-linked captions and direct project
planning links. Full equipment remains visible in responsive photo panels.

### Additional local business listings

`local_partners.py` adds Hart Builders, Inc. (77 West Baltimore Pike, Media;
215-350-5502; quality@hartbuildersinc.com) from its published contact page at
https://www.hartbuildersinc.com/html/contact.html, and Rolled Right Painting, LLC
(610-291-9552; louislitwin618@gmail.com) from
https://rolledrightpainting.com/services/ and https://rolledrightpainting.com/contact/.
Rolled Right's site lists different street addresses in its contact body and
footer; this directory uses the business name, phone, email and service
information without selecting an unconfirmed street address.

Painting requests select Rolled Right; remodeling/addition inquiries select
Hart. Both have source-linked profiles and service pages. Current scope,
address coverage, availability and documents must be confirmed directly.
These listings do not assert a credential inspection, customer review or
exclusive partnership. Saved project briefs retain the existing private,
not-automatically-delivered behavior.
