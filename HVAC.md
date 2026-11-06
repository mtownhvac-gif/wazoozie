# HVAC-first path

`/hvac/` offers a short service and project-ZIP step, then direct call and booking
links for the named business, Middletown HVAC. A ZIP is not a coverage lookup.
The homepage adds this entry without replacing the neighborhood feed or directory.
Wazoozie's relationship to Middletown is disclosed before the optional request.

## Optional private request

The visitor supplies a name, one phone number or email, project details and timing.
Saving requires separate consent. `POST /api/hvac-requests` validates the fixed
HVAC intents and writes into the existing private ProjectInbox store. No new
binding, migration, account, credential or delivery integration is needed.

The API never accepts a different provider. Unasked town, state, property,
equipment and role fields are empty, not inferred from the ZIP. There is no
public read/list endpoint. Receipts contain the reference and saved/not-sent
status, never the submitted contact details. Existing same-origin, bounded JSON,
honeypot, request-age, idempotency, daily limits and roughly 90-day retention apply.

**A save does not notify Middletown, schedule a visit or dispatch a technician.**
The operator must review saved records through the existing authorized private
workflow. The page also prepares an email preview, but the visitor opens and
sends it in their own email app. Nothing is emailed automatically. Direct phone
and booking remain available if saving fails or JavaScript is unavailable.

## Measurement and limits

Successful new saves use the aggregate `brief_saved / middletown / hvac` count.
Direct-contact actions use the `hvac` page context. No ZIP, name, contact detail,
project text or email body is included in these event counts. Duplicate saves
do not increment the count. Click counts are not connected calls, sent emails,
qualified leads or booked jobs. Booking outcomes require a separate authorized
operational review; there is no automatic HCP outcome integration in this change.

Plain HVAC intent links now use `/hvac/`; existing referral-bearing links retain
the original planner and attribution behavior. Other trades keep their existing
routes. Public posts and account functionality are outside this change.

## Verify and release

```sh
npm ci
npm run build:production
CLOUDFLARE_CF_FETCH_ENABLED=false npm run check
```

The tests use synthetic data and local storage. Do not submit test requests to
the live business. Before release, visually check desktop and mobile: homepage
entry, all five services, ZIP validation, back navigation, direct links, optional
request, privacy consent, outage/retry, save receipts and email preview/copy.
Calls, booking and email should be inspected without placing calls, making
appointments or sending messages.

Deploy through the existing authenticated Cloudflare workflow after checking
current main and preserving concurrent changes. `npm run deploy` rebuilds and
checks the site before `wrangler deploy --keep-vars`. Retain existing bindings
and secrets. Verify `/hvac/`, homepage entry, privacy notice and capabilities
after publication. Do not claim this is live based only on a successful build
or a pull request.
