# Guided planning upgrade - November 9, 2026

Adds a local description builder to Ask Wazoozie. Visitors choose the project, answer up to three existing preparation questions and optionally choose timing, then explicitly add those details to their own question. No request is made by opening, filling or applying the prompts. Their existing text is preserved; overflow is rejected rather than silently truncated. Consent is cleared for review after applying details.

Both the no-model checklist and tailored output link to two relevant, curated Wazoozie resources. Every route is tested against built output. Links come from code, never model output. The same short curated context supplements the existing Llama prompt; it is identified as planning guidance, not verified facts about a home. No new model calls, tool-use loop, external retrieval service, new paid model or raised quota is added.

Urgent wording offers a call-first reminder without claiming same-day availability. Existing hazard handling, phone routes, consent, private note storage, request handoff and model-output bounds remain in force. Planning notes are not a diagnosis, price quotation or appointment.

The helper continues to use the fixed existing Llama model and daily guardrails. Particle-1, MiniMax M3.1 Flash and Muse Wonder have metered pricing according to the Cloudflare catalog and were not enabled. No credits, paid plan, gateway or external provider was purchased. The account dashboard could not be inspected because cloud-browser Google sign-in returned an error and local Chrome controls were unavailable; this source change uses the existing GitHub deployment.

Validation: 81-page production build; curated routes, builder preservation/overflow, consent reset, no-request checklist, call-first reminder, grounded context and unchanged single-model routing are covered. Full test results are recorded on the PR. No live customer inquiry, real booking or paid inference is submitted in tests. Live visual verification remains pending browser access.

Official model references checked November 9:
- https://developers.cloudflare.com/ai/models/particle/particle-1/
- https://developers.cloudflare.com/ai/models/minimax/m3.1-flash/
- https://developers.cloudflare.com/ai/models/meta/muse-wonder-1.0/
- https://developers.cloudflare.com/workers-ai/platform/pricing/

Middletown-specific implementation remains with Archie under the separate website-upgrades README; this release changes Wazoozie only. No automatic neighborhood-page generation, customer follow-up or estimate writing/sending is enabled.

## Search suggestions

The homepage and Book or Call search fields offer up to six service/problem/business suggestions after two typed characters. A small static catalog includes the existing 13 listed business names; there is no model, geocoder, external search or per-keystroke request. Service suggestions remain available if the catalog request fails.

Exact short terms take precedence over unrelated prefixes: car suggests auto repair, while carp finds carpentry. Keyboard arrows select, Enter applies an active suggestion, Escape/Tab/blur close the list, and touching an option fills the actual query. Choosing a suggestion never submits the form. On Book or Call it selects the corresponding category explicitly; other filters remain under visitor control. Native form submission still works without the script. Regression tests cover keyboard, pointer, category events, no implicit submit, safe labels and the car/carp boundary.
