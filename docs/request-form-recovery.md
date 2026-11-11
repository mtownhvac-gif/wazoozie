# Project request accessibility and recovery

The optional `/start/` planner keeps phone and existing booking routes ahead of personal-data entry. This change does not alter providers, destinations, permissions, server storage, delivery behavior or tracking.

## Validation

- Persistent, specific errors appear beside fields, with `aria-invalid` and `aria-describedby` links. A focused error summary links to each field. Correcting a field removes its error without moving focus.
- Project description, trimmed name/town, phone digit count, ZIP and optional email checks match the existing server constraints. Consent remains explicit. Enter on a planning step cannot submit hidden contact fields.
- The coverage notice stays beside the state choice at the final step. Urgent work retains a direct-call reminder in the final review. The no-script fallback goes to the actual contact directory.

## Availability and uncertain requests

- The capability check stops after 12 seconds and offers a manual retry. Overlapping checks are suppressed. Invalid or unavailable capability responses leave direct contact usable and saving disabled.
- A changed sending option clears earlier consent and asks the visitor to review the current wording. Unknown provider keys are discarded.
- A submission stops waiting after 20 seconds, including a stalled response body. A timeout, network error, malformed response or server error is an *uncertain* outcome, not a claim that nothing was saved.
- The submitted data and reference remain in memory, unchanged, for an explicit “Retry the same request” action. Form editing and back controls are locked during an in-flight or uncertain save. Call, copy and download remain available. No automatic resend, new reference, browser storage or extra recipient is added.
- A definite 4xx rejection unlocks editing and displays the server’s error. A successful saved receipt cannot be submitted again. The existing server still owns validation, idempotency and delivery status.
- This is not a durable offline queue. Closing/reloading loses the in-memory request. Retries across a UTC month boundary are stopped because the existing server stores requests in monthly partitions. Server age/rate limits still apply. An accepted email request is not proof of inbox delivery, forwarding, a callback or a booked appointment.

The receipt’s portable brief now names Wazoozie Help review/forwarding, matching the existing central-inbox route rather than the retired direct-to-Middletown wording.

## Verification

Production build and complete repository checks run before publication. Synthetic tests cover all-field validation/correction, keyboard summary links, early Enter, late consent changes, malformed/failed/hung availability, duplicate clicks, slow save, exact-payload manual retry, late responses, definite rejection, uncertain server outcome, unchanged referral credit and accurate receipt wording. No live form, email, call or booking is used for testing.
