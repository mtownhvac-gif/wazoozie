# Local service discovery and contact update

This release improves existing pages instead of generating near-duplicate town pages. It does not claim rankings, indexing, calls, appointments or revenue.

## Changes

- A service-first homepage heading, primary home-services link and a prominent Middletown HVAC call/request/booking panel before the discovery tools. Pricing, games, auto, real estate and all existing destinations remain available.
- Direct homepage profile links for all six home-service businesses. Featured Middletown placement has an adjacent shared-owner disclosure.
- More descriptive local titles and descriptions for the home, directory, contact, Middletown profile and relevant HVAC pages.
- Heating/AC content with symptom descriptions, questions about diagnosis and visit charges, address confirmation, safe boundaries and a link to the published service source. Town mentions are context, not promises of address-level coverage.
- Final HTML and JSON-LD metadata synchronization after every render pass. Middletown Service providers use the existing HVACBusiness identity. Organization social links include the already-public Instagram and Facebook profiles. No fabricated ratings, credentials, street addresses, availability or service territory are added.
- Direct service-request links on the contact page and Middletown profile. Calls prompt the visitor to mention Wazoozie, allowing the office to verify actual attribution rather than infer it from a click.
- Standards language distinguishes consented Middletown email delivery from saving a brief and from email-app drafts for other contacts.
- Existing anonymous contact measurement now distinguishes `pricing_tool_click` for Middletown's two published pricing tools and counts selected service-site handoffs as `website_click`. It still sends only action, provider and page category, never the URL, its query, form values or a visitor identifier. The privacy page explains the expanded counts.

## Measurement

Search Console impressions/clicks, website link clicks, delivered requests, actual customer contact and booked work are separate events. Count a real service contact only after the office has evidence of an actual customer inquiry attributable to Wazoozie; exclude synthetic tests, owner QA and bot activity. Pricing-tool clicks are not tool completions. Booking-link clicks are not bookings. Direct phone calls still require the office's source question for attribution.

No new tracking cookies, analytics vendors, persistent credentials, subscriptions, paid promotion or recipient routes are introduced. Provider delivery availability continues to come from the existing capability endpoint and consent flow. Google and other search engines decide whether and when to recrawl, index or rank the pages.

## Validation

- Baseline production build and full check: 90 Node tests passed.
- Updated production build and full check: 96 Node tests passed, plus HTML/link/metadata/schema/contact/privacy/Markdown checks.
- New coverage verifies direct homepage contacts, all six business routes, booking attribution, ownership disclosure, safety and coverage boundaries, page identity consistency across all 73 public sitemap URLs, anonymous handoff classification and standards/delivery wording.
- Existing pricing, daily-play, accounts, intake, outbox and storage tests remain in the full suite.
- Browser visual inspection was unavailable during this change. Responsive rules are included, but mobile and desktop visual QA remain to be completed.

The deployment runs the existing GitHub-connected Cloudflare pipeline. Verify that the expected commit is published and its live HTML/assets match before reporting release success.
