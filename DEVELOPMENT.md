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

Booking links include page-level utm_content. No form fields, cookies or personal information are added to attribution. These parameters are not an installed analytics system; measure actual qualified inquiries and completed bookings before claiming conversion gains. Booking destination verified to show Middletown's ZIP-code coverage screen; no test appointment was submitted. Automatic email delivery remains unconfigured.

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
