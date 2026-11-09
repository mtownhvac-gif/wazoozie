# Ask Wazoozie

Public URL: https://wazoozie.com/ask/

Three explicit tasks: shape a project, prepare first-call questions and clarify missing estimate details. Contextual entry points live on the homepage, project checklist, comparison tool, pricing guide, service pages and business profiles. Public copy uses “Ask Wazoozie”; it does not claim to be a human or a reviewed diagnosis.

## Model and cost boundary

The existing Worker receives an `AI` binding through wrangler.jsonc. It runs only `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, with structured output, a 700-token completion limit and a short bounded input. No third-party provider, paid gateway, secret, credit purchase or paid plan is configured. The account was verified on Workers Free before activation. Free-plan allowance exhaustion stops calls; do not upgrade the plan or enable paid fallback without the owner's separate approval. The owner lab shares the account's model allowance.

A Durable Object on the existing PROJECT_INBOX binding maintains atomic counters only: forty public helper attempts per UTC day across the site, five per rotating network hash, and a ten-second per-visitor cooldown. Failed attempts consume a slot; no retry loop is used. Hashes rotate daily and previous-day counters are removed on the next activity. This limits depletion of the shared allowance; it is not an exact neuron/cost meter. Prompts and answers are not written to server storage or logs by this feature.

## Trust and contact flow

Hazard wording returns fixed safety guidance before inference. Model output must be bounded JSON with summary, questions and preparation steps; links, phone directives and dollar/dollar-word pricing are rejected. Business contacts and request URLs come from the current catalog and the visitor's selected category, never model output. Suggestions are planning notes, not verified findings, availability, sizing, prices or booked work.

A visitor can share a contextual helper link containing only the selected category and mode; private questions and results are excluded. A visitor can copy notes or explicitly save up to three plans in local browser storage. Saved plans can be reopened or removed. Saving is not cross-device sync and does not notify a business. Choosing “Take my notes to a request” puts a bounded note in same-origin session storage for up to ten minutes; the matching request form consumes it once. The visitor reviews the form, supplies contact details and separately consents to actual saving/sharing. The helper never checks the submission consent box or submits a request automatically. Only the existing Middletown notification path sends via its configured automation; other provider limitations remain visible.

## Motion and privacy

Motion uses local CSS, with reduced-motion preferences respected. No paid video generation or new tracking is added. The public privacy page describes Cloudflare processing, local saving and rate-limit counters. No public model-branding banner or chatbot popup is added.

## Validation

Run `npm run build:production` and `npm run check`. Dedicated tests exercise bounded inputs, origin/consent validation, fixed hazard replies, output validation, catalog-only contacts, honest outages, atomic limits, explicit local saving/deletion and expiring request handoff. Live synthetic checks must confirm the actual deployment; mocks alone do not establish model quality.
