# Search relevance and contact preparation

The contact finder previously searched raw substrings, so `car` returned Cooke Carpentry. Short terms now require complete normalized words. Prefix matching starts at four characters, preserving `carp`, `cook` and `electric`. Existing plain-language problem matching, direct contact routes, categories, alphabetical ordering, query links and reset behavior remain intact.

The read-only browser discovery tool follows the same word boundary rule. Generic home-category aliases no longer add every trade to every listing: a plumbing search must match the business's actual name or listed services.

Each contact result now offers three category-appropriate questions, an explicit route to the profile's recommendation and sources, and an email draft to report outdated information. Matched results explain the basis of the match. No business is presented as independently verified, available, booked or rated by the search. No new reviews or credential claims were added. Nothing is automatically emailed or submitted.

Validation: 81-page production build; HTML, link, schema, contact and discovery checks; all 146 Node tests. Regression coverage reproduces `car`, rejects the carpentry false positive, preserves relevant service/business prefixes, tests category constraints and reset, and checks all 13 preparation/source panels. No paid service, model call, tracking change or credential is introduced. Visual browser QA was unavailable in this session.
