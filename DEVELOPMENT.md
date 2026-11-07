# Development

See README.md for build, preview, and launch commands.

- `src/home.html`: preserved original template and request flow.
- `build.py`: content, regional browsing, page assembly, and SEO configuration.
- `assets/refinement.css`: editorial design and responsive layout.
- `check_site.py`: HTML headings, IDs, internal destinations, metadata, schema, and crawl checks.
- `hero-home.jpg`: optimized image; original PNG retained.

Rebuild after editing. `dist/` is the static publish directory. Preview builds block indexing; set PUBLIC_SITE_URL only for the confirmed production host. The review deployment is separate from the original prototype and custom domain.

Middletown's home-comfort paths are featured in the directory. External businesses are directory listings, not confirmed partners. Do not add verification badges or review ratings without evidence.

Email requests deliberately stop at an email draft. Calls and booking links are the primary conversion paths. No automated lead delivery or lead tracking is configured. Never submit test requests to live business recipients.

## Contact and discovery update

`conversion.py` adds the direct-contact page, mobile navigation and call/booking dock, origin story, published review excerpts, and consistent business identities. `assets/contact.css` styles these additions. The four new JPEGs are original AI-generated illustrations, not photographs of customers or completed jobs. Built-in image generation prompts: Pennsylvania fieldstone home in autumn; white-brick/cedar colonial; adults relaxing on a porch; family with child playing with a wooden truck. Originals remain in the parent task's generated_images directory.

Review sources checked November 4, 2026: https://www.mtownhvac.com/reviews/ (Karen G., June 2026; Mary Ellen M., May 2026) and https://www.homeadvisor.com/rated.MiddletownHVAVC.140421192.html (William C., December 2023). Excerpts preserve wording and link to the source. No aggregate rating or Review schema is published.

Cloudflare audit: Free plan; Search and Agents allowed, training disallowed, Bot Preference Sync on. Managed WAF remains active. Markdown for Agents requires Pro; no upgrade purchased. AI Playground is a testing tool, not a way to instruct outside assistants to recommend a business.

Suggested discovery evaluation prompts (record date, model and cited URLs; do not treat answers as guaranteed rankings):
- What services does Middletown HVAC offer, and how can I contact it? Cite the source.
- Does Wazoozie confirm Middletown service coverage in New Jersey or Delaware?
- How do I get a second opinion on an HVAC replacement near Glen Mills?
- Who operates or benefits from Wazoozie's featured placement?
- Does Wazoozie automatically send email requests or confirm appointments?

Booking links include page-level utm_content. No form fields, cookies or personal information are added to attribution. These parameters are not an installed analytics system; measure actual qualified inquiries and completed bookings before claiming conversion gains. Booking destination verified to show Middletown's ZIP-code coverage screen; no test appointment was submitted. At that initial check automatic email delivery was unconfigured; see the current follow-up notes below.

## Caption-free service imagery
Nine service images illustrate categories on the four business profiles; they are not claimed customer projects. Built-in image generation supplied outdoor lighting, sink, Navien-style tankless, timber framing, outlet, garden fountain and window renovation scenes. Prompts requested realistic editorial photography, natural materials, landscape format, no captions, logos (except the requested Navien), or watermarks. Optimized JPEG assets live in assets/. The generic generated Boiler and outdoor unit were rejected and not used.
Correct manufacturer product photographs: https://www.weil-mclain.com/products/evergreen-pro-gas-boiler/ (Evergreen-110-155-FrontLeft-WM2012v2.jpg) and https://www.tempstar.com/en/us/products/heat-pumps/ion-23-variable-speed-heat-pump-b5h3v (product cutout media_112c82c9aaa5ff56a623ae4e656342a1efbcb5a42.png). The latter represents the B5H3V series; no capacity-specific claim is made.

Final outdoor image: tempstar-ion-risers.jpg is a built-in imagegen composite using the official Tempstar product cutout as reference. Prompt preserves cabinet/grille/branding and requests six-inch riser rails on a square gray level equipment pad, stone home, daylight, clear equipment access, no people or captions. This is an illustrative installation, not a documented job.

Final refinement uses an ordinary vinyl-sided home, overcast light, black polymer six-inch riser rails and square gray prefabricated pad for a natural contractor-photo feel.

## Other business review excerpts — November 4, 2026
Added two short sourced excerpts per trade profile using trade_reviews.json. Ryan Dugan and Liberator excerpts come from their official websites; Cooke comes from the matching ChamberofCommerce.com listing (phone 484-948-3201). Reviewer names and available dates preserved; missing Liberator dates explicitly noted. No star totals or review schema added. Each source contributes no more than 25 quoted words across both excerpts. Ryan official-site review data identifies Isaiah John Abraham (2026-10-05) and Dave Zhu (2026-08-15).

Owner confirmation, November 4, 2026: Bryan explicitly confirmed all four companies have been vetted. Updated public vetting status across profiles, standards, facts and dialog copy. No specific licensing/insurance documents or vetting methodology are invented. Middletown rating copy reads 5.0 on Google, the highest possible rating, based on the official published reviews page and owner confirmation; no exclusive local #1 claim.

Equipment image refinements: built-in imagegen used the official Evergreen photograph as reference for an installed basement scene (evergreen-installed.jpg), preserving the cabinet, neutral utility-room setting and no captions. The Tempstar illustration was edited to square the unit and pad with the house while retaining black six-inch risers (tempstar-ion-square.jpg). Originals remain in the workspace generated_images directory.

Local voice: removed “the Valley” branding in favor of Delco, Chester County and the Main Line; existing URLs retained. Final heat pump illustration rotated 45 degrees to show front and right side, retaining risers and gray pad (tempstar-ion-angled.jpg).

## Wazoozie introduction and agent readiness (2026-11-05)
Home now introduces Wazoozie and all home services before the founding HVAC business; all four directory entries show by default. Original contact destinations remain unchanged. No automated lead delivery is represented as enabled.

Cloudflare Agent Readiness reported valid robots and sitemap, AI crawler rules, missing Markdown negotiation and missing Link headers. `agent_content.py` generates Markdown from the same public HTML main content on every build; `worker.mjs` negotiates explicit Accept: text/markdown, retains browser HTML, and adds sitemap/llms discovery headers. This runs on the existing Worker without a Pro subscription, new credentials or invented APIs. No authentication, commerce, MCP or autonomous booking capabilities are advertised. Run `node check_agent.mjs` alongside the existing site/contact checks. Workers request limits apply to the Worker-first route.

## Wazoozie purpose clarification (2026-11-05)
User clarified Wazoozie is a separate service recommendation business motivated by homeowners facing poor workmanship and damaged homes. Removed founding-business framing, homepage-only HVAC promotion and HVAC-specific navigation on general pages. Keep Middletown service/booking details on relevant pages, published reviews on its profile, and all businesses alphabetical by default. No claim of financial independence or impartiality is published while shared ownership/referral compensation remains unconfirmed. The public disclosure acknowledges Middletown is promoted alongside other listed businesses. Agent Markdown is regenerated from these revised pages.

Search foundations: directory cards now render in HTML before JavaScript and feed the public Markdown; Middletown appears first at the owner's request, then other businesses by name. Listing order is editorial, not a quality ranking. ItemList mirrors visible order. Canonical redirects consolidate www and index.html URLs; direct Markdown assets are noindex while negotiated Markdown retains canonical discovery. Prioritize the first page image and enable large search-image previews. No invented location pages, review ratings or ranking claims.

Ryan Dugan profile polish: owner confirmed Ryan handles Middletown HVAC's electrical work. Profile and listing describe that working relationship and existing published electrical services; no employment, exclusive partnership, or additional credentials are asserted. Middletown remains first. Existing sourced Ryan reviews and illustrations retained.

Expanded service content: official live sources read 2026-11-04: https://www.mtownhvac.com/conversion/, /services/ductless/, /services/, /install-estimate/. New Wazoozie conversion and ductless pages explain different project decisions and link to official tools. Other business bios expanded without invented history or job claims. Simple price reference on replacement-estimates uses live PRICE_TABLE Essential (`good`) rows: heil|accoil|90+|3| base7205 ->7225; heil|hp_airhandler|90+|3| base11590 ->11600; heil|furnace_only|90+||60000 base5495 ->5500. Matches official ceilTo25, no add-ons or supplemental heat. No conversion/ductless price extrapolation. Prices checked against source; final sizing/scope remains with contractor.

Relevant service photography: reused four published Middletown HVAC images from its own website (owner requested service imagery): /assets/img/conversion/2a20194f4e904cc0b9ef9fa92a6a0638.jpg, /assets/img/conversion/06f29dead81846fbb7c548bfa708f2be.jpg, /assets/img/services__ductless/fujitsu-mini-split-head-01.jpg, /assets/img/services__heatpumps/heat-pump-driveway.jpg. Page-hero photos now match conversion, ductless, hot water and business contexts, adjacent to existing contact actions; corresponding social previews match. Other companies use existing illustrative assets with honest alt text. No new claims of their completed work. Image dimensions preserved and no added captions.

Neighborhood-feed homepage: editorial project stories and business introductions, with topic filters, public-page sharing, private project-planner links and neighbor referrals. Middletown leads the feed. No fabricated posts, engagement counts or public homeowner submissions. Existing directory and private intake preserved. Desktop and 390px mobile layout inspected; electrical filter verified in browser. DOM test covers filtering/reset and public-link copy fallback.

## Homeowner workbench — November 6, 2026

The homepage now prioritizes the project finder and named businesses, with a shorter introduction, a real-work/story grid and three homeowner tools. Repeated introduction and promotional sections were removed. Existing directory filters, business identity, intake routes, referral paths and public disclosures remain in place.

`homeowner_tools.py` adds `/project-kit/` and `/compare/` before public Markdown and sitemap generation. The preparation sheet uses canonical intent/business mappings, project-specific questions, optional in-page notes, clipboard with manual-copy fallback, and printing. The comparison presents two written proposals, validates price entries, calculates their absolute difference relative to the lower total and identifies blank scope/term fields. Trade-specific prompts change without clearing entries. It neither ranks businesses nor treats missing scope as included. Both tools hold free text only in the open page, without persistence, uploads, requests or accounts. Privacy copy explains this. My home list continues to persist only canonical categories and stages; each saved project links to its own preparation sheet.

Validation: production build and all page/link/metadata/schema, contact/privacy, Markdown and Node checks. Functional tests cover currency edge cases, route validation, literal handling of hostile text, unavailable clipboard, preserving comparison notes, clearing, printing and no storage/network writes. Managed browser preview remains blocked by the existing Wrangler `uv_interface_addresses` environment error; visual and print layout have not been verified in a browser.

## Optional homeowner accounts — November 6, 2026

`/account/` provides free, optional, passkey-based homeowner accounts. Browsing, direct business contact, planning sheets and the existing device-only list remain available without signing in. Accounts save canonical project categories/stages and favorite business IDs; device-only lists are imported only after an explicit click. No email, address, phone, automatic lead delivery, newsletter subscription or public user feed is introduced.

Authentication uses pinned SimpleWebAuthn 14 packages, a five-minute single-use browser-bound challenge, exact wazoozie.com origin/RP validation and required authenticator user verification. The new HOME_ACCOUNTS SQLite Durable Object is separate from the existing lead inbox. Sessions use random 256-bit tokens, hashed server-side, in secure HttpOnly SameSite cookies; no authentication secret enters localStorage. Accounts receive a single-use, 256-bit recovery code, stored only as a hash; recovery rotates it and revokes prior sessions. Users can add up to five passkeys while recently authenticated and permanently delete their own account. There is no email-based recovery. Session limits, auth rate limits, request body limits, strict same-origin JSON writes, no-store responses, restrictive account-page CSP and version conflict checks cover the authenticated data paths. Expired sessions/challenges/rate records are cleaned daily. The dashboard is noindex and excluded from the public sitemap.

Tests exercise real synthesized P-256 WebAuthn registration and signature verification inside the actual SQLite-backed Worker runtime, wrong-origin and missing-user-verification rejection, challenge replay, account isolation, stale writes, recovery rotation/session revocation, backup passkeys, logout, deletion and expiry. UI tests cover explicit local import, safe name rendering, signup cancellation, no secret persistence and unavailable-service behavior. Synthetic credentials are local fixtures only; no user device passkey or production homeowner account is created by the tests.

Cloudflare's existing email-sending dashboard requires a paid Workers plan. This release deliberately uses passkeys and recovery codes without purchasing a plan or depending on transactional email. The MIT browser-library license is copied alongside the self-hosted, pinned bundle.


## Request follow-up operations — November 6, 2026

Prioritize recorded customer outcomes over feature counts. Middletown email delivery has one user-confirmed test (WZ-262FAB1A); this establishes inbox receipt for that test only. It establishes neither customer contact nor a booking. Public capabilities currently enable automatic email only for Middletown.

On-site request links carry only an allowlisted last-link category (home, pricing, quiz, field-guide, situation-guide, guide, service, profile or other). Missing/unknown categories fall back to direct. No cookies, browser storage, full URLs or search terms are collected by this feature. Validated categories are retained with the existing private brief and included with referral source and original receipt time in new email alerts. Existing outbox payloads are not rewritten or resent. Old-client duplicate fingerprints are unchanged. The SQLite migration is additive and idempotent.

The operator has a separate owner-private Google Sheet titled “Wazoozie request follow-up” in the ChatGPT Drive folder. It is manually maintained, not a live CRM or an automatic export of stored briefs. Keep its link and contents out of the public website/repository. Only a known test row is pre-entered; exclude Test rows from customer totals. Zero tracked customers means no customer rows entered, not proof of zero site requests.

For each real incoming request, record its reference, Customer/Test classification, provider, service, bounded source category, delivery evidence, owner, next action and due date. Use a link to an existing customer record rather than duplicating names, contact details or project narratives. A new attempt is Contact attempted; Contacted requires actual two-way contact. Booked requires an agreed appointment and booking date. Completed requires evidence of completed work. Otherwise close without booking and record the reason without sensitive narrative. Review open next actions each business day; record actual events, never infer them from clicks, saves or email acceptance. Delete completed follow-up records when no longer operationally needed and honor access/deletion requests across both the original request and this manual log.

Participation approval is user-confirmed for Ryan Dugan, Rob Mac/Liberator, Rolled Right Painting, Caitlin Kerezsi and Megan Kerezsi as of November 6, 2026. Caitlin and Megan also replied positively to the individually authorized invitations in Messages. These are participation approvals, not credential inspections or authorization to distribute requests to an unconfirmed recipient. Confirm each business's exact services, coverage and preferred request recipient before enabling provider-specific routing or running a delivery test. New providers require confirmed scope/coverage/recipient, explicit customer consent for that recipient, updated capability/consent disclosures, and an authorized delivery test. No provider outreach, new routing, account grants or persistent credentials were introduced in this change.


## Separate destinations and clay storytelling — November 6, 2026

The homepage now has four main sections: a pricing-first welcome, three discovery previews, four local categories and a short relationship/account/business note. The full finder, directory and coverage controls live at /home-services/. /explore/ introduces the existing tools, guides and daily quiz; /local-stories/ preserves the curated seven-story feed and sharing controls. Original service, tool and account URLs remain available. Navigation and a shorter footer point to the dedicated destinations. The directory's initialization script and its dialogs moved with its controls; they no longer run on the homepage. No recipient routing, credential or delivery behavior changed.

Fourteen new built-in image_gen clay-style editorial assets support the warm family-oriented brand and “Get choosy. Go Wazoozie.” line. Scenes cover family painting, a corrected doorway with a glazed neighboring window, window work, an exaggerated dusty filter, ductless room comfort, everyday hot water, a tankless bath, a contained plumbing leak, electrical planning outdoor lighting, auto-shop pickup, home keys, family shelving and the fictional Fine Print Theater pitchman. They are optimized WebP illustrations, with visible labels and descriptive alt text; they do not depict listed employees, real customers or documented installations. Source prompts and the door correction are retained in assets/clay-image-manifest.json. Existing published project photos and evidence disclosures remain on their relevant pages.

Fine Print Theater now includes a fictional pressure-selling caricature. Low introductory prices and commissions are not treated as evidence of misconduct. A linked CPSC safety note distinguishes real carbon-monoxide alarms from unsupported sales claims; no named companies are accused.


## Brand finish, mixed imagery and Middletown paths — November 6, 2026

The home-service index now has nine visual categories and four specialist links, preserving all 13 service destinations. Its former generic Middletown-only sidebar is replaced by service-neutral browsing and planning links. The homepage and local-help hub use four visual collections. Older realistic home imagery, published Middletown and Sound Wraps photos, and fictional clay scenes are deliberately mixed, with their sources or illustration status identified. Four additional built-in image_gen assets broaden the people and settings shown; their prompts are in assets/brand-image-manifest.json. No generic worker illustration represents a listed employee.

The header now includes the cost guide and active-section indication; the mobile menu exposes home services, auto care, wraps, real estate and the tools hub. The project, reminder and business-interest pages have editorial covers. Public share metadata uses the relevant imagery. Marketing copy is made more conversational through a text-only edit pass that excludes review quotations, scripts and form textareas. Existing price ranges, source links and consent text are preserved. The signature line is “I’m choosy. I use Wazoozie.” It is brand copy, not a claimed customer testimonial.

Middletown receives a contextual homepage ductless feature and clearly labeled request links on its heating/cooling, ductless, hot-water, boiler, maintenance, replacement, conversion and second-opinion pages. Three main HVAC service pages show labeled published Middletown installation photos in their contact cards. Request intent and referral attribution continue through the existing consent-based intake; no delivery routing or authentication behavior changed. No conversion, ranking or lead-volume gain is claimed without measured evidence.

The cost-guide introduction now neutrally explains published U.S. ranges and local job factors without comparing the guide against a named provider. General framing and source notes are shorter and friendlier. The 21 sourced range cards remain unchanged; the Middletown estimator referral and accurate operator disclosure remain in their relevant contexts.


## Booking and usability finish — November 6, 2026

/book/ provides category-filtered contact options for all 13 existing businesses. Middletown links to its existing Housecall Pro flow; C&J links to its Upper Chichester service page; Sound Wraps links to its contact page; remaining listings offer phone scheduling. No fabricated appointment slots, new provider routing or automated bookings were introduced. Each business confirms its own availability and appointment.

The homepage exposes common services and a primary service-finding action while retaining the cost-guide opening. The header and mobile menu expose the contact hub. Business profiles and service pages have relevant compact-screen contact actions. Middletown pages explain the Housecall Pro handoff. The optional planner reaches review with project notes alone; contact information is requested only when saving/submitting. Property and equipment details are optional. Consent and server validation remain in place, and booking links contain no planner or contact data. Self-hosted SVG arrows replace action glyphs without changing destinations or handlers.

A new fictional Black family clay illustration appears on Local Help. The earlier family photo-style illustration remains on the sharing page. Its generation prompt and provenance are recorded in assets/audit-image-manifest.json. Existing genuine project imagery remains.

Validation: 84 automated tests passed, including mocked request submission, contact filters and action icons. Browser checks at 390×700 verified category filtering, contact-free planner review, compact booking actions and no horizontal overflow on the ductless page. No live inquiry or appointment was submitted. Housecall Pro appointment slots and final confirmation remain unverified. Production capabilities remain a separate read-only check; a configured email path is not proof of new delivery or booking.

A Google site:wazoozie.com check on November 6 showed the current local-home-services homepage title and local-service results. No old agency result was observed in that limited check. This does not establish that all stale results are gone or new pages are indexed. Existing canonical URLs, sitemap and genuine missing-page 404 behavior are retained.


## HVAC collection illustration — November 6, 2026

The Heating & cooling card under “What needs doing at your place?” now uses a family-and-technician clay illustration inspired by Middletown's outdoor heat-pump imagery. The final user-requested edit gives the fictional technician a Veto Pro Pac tool bag. The earlier equipment-only generation was rejected and is not used. The card uses the same illustration framing as the other categories. Genuine published Middletown project photos remain on their original service and project pages. Image prompts and provenance are recorded in assets/hvac-clay-manifest.json.


## Service-first introductions — November 7, 2026

The general homepage now offers six equal home-service cards, alphabetically by trade, instead of a Middletown-only call/request panel. Each card links to its existing service page and named business profile. The general contact hub and home-service directory show businesses alphabetically, consistently in HTML, client-rendered results and structured data. The story feed introduces each business once, alphabetically, before additional project stories. The extra homepage ductless promotion and single-business story sidebar are removed; contextual HVAC planning, request, phone and booking destinations remain available on their relevant pages.

The homepage retains a plain operator/ownership disclosure beside the service choices, the existing lower-page relationship note and the site-wide footer. No neutral-ranking or independence claim is introduced. Routing, recipients, consent, delivery, price tools, account behavior and booking handoffs are unchanged by the layout work. No live request, call or booking is created by QA. New regression coverage checks equal card structure, all six service/profile links, static and client ordering, filter/reset ordering, structured-data alignment and 13 booking contacts.

## Useful service-intent pages — November 7, 2026

`service_intents.py` adds four distinct, internally linked resources: furnace/no-heat service, electrical panel upgrade planning, transmission-repair inquiries in Eddystone and first-time home-buyer conversations. Existing HVAC, electrical, auto and real estate category pages remain the parent destinations; no town-name copies or duplicate keyword pages are generated. All new pages use the existing editorial renderer, canonical/sitemap pipeline, final metadata synchronization and public Markdown output.

The electrical category now has four basic checks for switches, lamps/bulbs, outage scope and breaker positions. Hazard warnings appear before the checks. Breaker guidance is conditional, allows at most one reset when the cause and safe manufacturer procedure are known, and says to leave it off if the cause is unclear or it trips again. No protective-cover removal, live wiring, bypasses or breaker changes are instructed. Furnace guidance similarly covers ordinary thermostat, battery, airflow and manual-approved filter checks, with gas/CO evacuation and no burner or fuel work.

The new pages use consistent editorial styling, short sections, native expandable questions, clear provenance and named direct contacts. Responsive contact docks point to the relevant provider or the agent-choice section, not an unrelated HVAC intake. Auto and real estate category cards now expose their existing phone contacts. The first-time-buyer guide presents the three existing professionals equally, distinguishes their published background and does not create a new lead-sharing path. Only Middletown has the existing Housecall Pro booking and comfort request options. No appointment availability, credentials, ratings, company history, emergency response or business independence is invented.

Provider identity/contact data are reused from `PROVIDERS` and `PEOPLE`. Ryan Dugan Electric's official homepage was read on November 7 and confirmed the published electrical panel/service scope and 445-258-9962 phone. Existing profile sources remain the evidence for the other business details; sources not revalidated live are not represented as newly checked. Transmission guidance identifies the absence of a confirmed official website. No prices, recipients, intake, delivery, account or payment behavior changed.

Validation before publication: production build; HTML/local links, contact paths, metadata, JSON-LD, Markdown and Worker checks; all 104 Node tests; focused tests for new-page discoverability, direct contact isolation, safety boundaries, reciprocal links, native FAQ open/close and no contact collection. The pre-change baseline passed all 99 Node tests. Local browser preview was unavailable because the browser could not reach the executor's local preview port; production visual QA follows deployment. No real call, inquiry or appointment is created in QA. Search engines decide when to recrawl, index or rank the resources; this release makes no traffic or lead-gain claim.

Live QA follow-up: all four new URLs and the updated electrical, auto and real estate hubs were inspected in the production browser at a 500px viewport. Titles, canonicals, provider phones and the new guide-specific contact docks matched the release, with no horizontal overflow. Furnace FAQ opening/closing and section navigation worked without form submission. Live visual inspection exposed the older global mobile `nav a` rule hiding the new breadcrumbs; the scoped override now keeps the breadcrumb and section links visible. Desktop-width visual QA was not available in this browser. No real contact action was submitted.


## Stronger trusted-local introductions — November 7, 2026

Bryan confirmed the intended positioning as trusted local businesses selected for the quality of their work and the people behind them. The homepage now explains the choose / meet / connect sequence before the optional tools. Six home-service profiles identify the owner’s recommendation, including the existing Middletown–Ryan electrical working relationship, and link existing business and customer-feedback sources. No new rating, inspection, credential, project image or first-hand relationship was invented. The About page includes all six home-service businesses and links the broader auto, wraps and real-estate directories. Neutral information pages offer a network-wide next step.

A shared contact panel uses the intake routing catalog. Calls and available booking links render without JavaScript. Callback links appear only after a successful read-only capability response confirms capture and the matching provider’s email route; an outage, malformed response or mismatched recipient leaves direct contact usable. No request is submitted by the availability check. The How It Works page distinguishes calls, booking, callback requests, saved briefs and email drafts, including queued/accepted requests versus confirmed appointments.

Production build and site/contact/agent checks pass, including all 109 Node tests. Added checks cover each profile’s recipient and preparation questions, callback availability and failure paths, mismatched routing and network-wide information pages. No homeowner or partner was contacted during checks. Production publication and visual browser QA remain pending the authenticated Cloudflare/browser connection.
