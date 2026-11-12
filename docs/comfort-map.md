# The Comfort Map

## Purpose

Give a homeowner a useful way to describe uneven comfort before a heating and cooling conversation. The room-by-time board starts blank. It creates a readable visit brief, with fixed editorial questions and the existing Middletown HVAC call, booking and profile destinations.

This is an observation tool, not a diagnosis, measurement, load calculation, repair recommendation, quote or confirmation of technician availability. There is no comfort score, AI service or claim of global novelty. No lead or conversion improvement has been measured.

## Behavior

- Up to six named rooms, optional floor, and morning/afternoon/evening observations: not observed, too cool, feels okay or too warm.
- Context distinguishes remembered patterns from a single observation day. An old date is not included when the remembered-pattern setting is chosen.
- Summaries count selected entries and describe contrasts; missing entries stay unknown. “Feels okay” never certifies equipment condition or safety.
- Notes and room names use text rendering. A known hazard phrase reveals the shared safety guidance, which is also available before any entry. This phrase matching is not an emergency detector and cannot establish safety.
- Copy, plain-text download and printing are explicit actions. Fallback copy remains available if clipboard or download support fails. Print output contains the full current brief, including long notes, rather than clipped textarea controls.
- Clearing requires a separate confirmation. A late failed clipboard attempt cannot restore erased notes. Removing a room preserves the remaining room entries and moves focus to the adjacent name field.
- All new controls have labels, visible focus and explicit button types. The colored map cells also have symbols and accessible text. Phone layouts stack the three observations into readable rows.

## Privacy and contact boundaries

The feature keeps entries only in memory in the open page. It does not read or write cookies, localStorage, sessionStorage or IndexedDB, make a model call, submit a form, fetch data, import URL data, or add entries to a link. Copies/downloads/printouts include the visitor’s own entries. Refreshing clears them; browser history may retain an open-page state, so the page does not promise that every navigation immediately erases it.

Existing shared page scripts are retained. Existing explicit call/booking click measurement may POST the canonical action, provider and page-context category. It does not contain map observations or notes. Ordinary page/asset requests still reach the website host; this is not a claim of no network traffic.

The booking URL is the existing BOOKING configuration plus `utm_content=comfort-map`. It has no homeowner-derived query values. The page says that entries are not sent with contact links, to confirm coverage/availability/visit charges, that opening booking does not make an appointment, and that Middletown placement is editorial. No recipient routing, intake, delivery, authentication, storage or payment code is changed.

## Build integration and source

- New files: `comfort_map.py`, `assets/comfort-map.mjs`, `assets/comfort-map.css`, this note and focused tests.
- `build.py` adds two integration lines before The Second Invoice and Before It Disappears, and before final optimization/Markdown/sitemap generation. This insertion avoids the shared financing/search insertion point in PR67/69.
- The new generator appends links to Explore, heating/cooling, second opinion and the Middletown profile. It adds its own privacy paragraph. It does not edit the generators that PR67/68/69 change.
- No homepage panel is added: the existing homepage already has several discovery tools. The map is placed where homeowners are thinking about heating/cooling or exploring tools.
- Conversation prompts use ENERGY STAR quality-installation guidance, read November 11, 2026: https://www.energystar.gov/saveathome/heating-cooling/hvac-quality-installation. The page explicitly distinguishes general guidance from professional assessment and disclaims source endorsement.

## Verification and release

Run `npm run build:production`, `npm run check`, and `git diff --check`. The standalone build produces 84 pages and passes the site/contact/agent checks and all 200 Node tests. A throwaway local integration with PR67/68/69 builds 85 pages and passes 220 Node tests plus the 13 Python checks. The earlier PR67/69 insertion conflict was resolved only in that throwaway checkout by retaining both financing and search calls; this Comfort Map change then merged without conflict. The focused suite covers 23 cases, including 64 combinations of the three observations, invalid state, no persistence/network from the feature, safe literal text, explicit exports, blocked APIs, asynchronous clear/copy, focus, accessible symbols, privacy, unchanged contact destinations and print isolation on other pages.

Managed preview was attempted with the standard `sites-preview start` command. Wrangler exited before starting with `uv_interface_addresses returned Unknown system error 1`. The preview daemon reports stopped and was cleaned up. No alternate browser infrastructure or permission workaround was used. Desktop/mobile visual inspection and real browser print layout remain unverified and are release checks.

This work is isolated from current main `392e4d1fed6029120f03a1ce6fb253f6a283f862`. Keep PR67, PR68, PR69, the separate routing patch and the unpublished Then & Now artifact unchanged. Recheck main and merge compatibility before release. Do not represent this feature as live until coordinated deployment and live route verification succeed.
