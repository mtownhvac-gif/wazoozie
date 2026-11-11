# Search discovery and service-page improvements

## Public build checks, November 11, 2026

The local production build has 82 unique sitemap URLs. All are reachable from
the homepage through HTML links, have unique titles and descriptions, and
exclude account, workbench, error and API routes. The read-only live search
check passed for the sitemap, robots directives and eight priority public pages.
The live site also serves a www-to-apex redirect.

These checks do not establish search-engine indexing or ranking. Use the
owner's Google Search Console and Bing Webmaster Tools accounts to evaluate
actual crawler decisions. Dashboard-specific analytics are not published in
this repository.

## Changes

- Add practical second-opinion questions about diagnostic evidence, the fault
  versus other wear, repair/replacement scope and written coverage terms. Keep
  unsafe equipment off, preserve emergency guidance and promise no cheaper
  outcome or changed diagnosis.
- Add crawlable links among existing heating, furnace, second-opinion and
  water-heater guides from the Middletown profile and relevant HVAC pages. No
  new location clones, doorway pages, ratings, guarantees or business identities.
- Require explicitly selected changed pages for normal IndexNow notifications.
  A full sitemap submission remains possible with deliberate `--all`. Verify
  selected live page HTML before sending, and reject internal/noncanonical URLs.
- Add a read-only live search check suitable for deployment verification. It
  checks sitemap freshness, robots permissions and key live canonical pages.
- Run Python submission tests in the standard check command. Add regression
  tests for internal-route exclusion, scope selection, failed-page refusal,
  unique metadata and HTML-link reachability of every public sitemap page.

## Release checks and follow-up

Build and run `npm run check`. After deployment run
`npm run check:live-search -- --expected-dir dist`, then submit only the changed
public URLs with `npm run notify:search -- --url URL` (repeat as needed).
A deliberate Bing sitemap refresh and one Google indexing request for the
updated key HVAC pages can aid discovery; neither guarantees inclusion. Review
actual impressions, clicks and indexed status later rather than submitting the
same unchanged URLs repeatedly.

Do not send fabricated reviews, add false LocalBusiness locations or use
Google's restricted Indexing API for ordinary service pages. Keep Wazoozie's
business relationship disclosure and the visitor's choice of provider intact.

References:
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://www.indexnow.org/documentation.html
- https://www.mtownhvac.com/services/
