# Wazoozie model workbench

URL: https://wazoozie.com/model-lab/

Unlisted and noindex, not password protected. No link is added to homeowner navigation, sitemap or public model-discovery content. Anyone knowing the URL can load the empty workbench. Results, ratings, notes and the token live only in the open page; no local/session storage, cookies, database writes or analytics are used by the lab. Export JSON to keep a comparison.

## Live tests

The server proxies exactly one request per selected model to the fixed Cloudflare account REST endpoint. The caller provides an existing Cloudflare token with Account → Workers AI → Read, scoped to this account. No shared server billing secret is deployed. Do not use a global API key or paste credentials into notes. Requests require same-origin JSON, an allowlisted model, a bounded question and explicit consent. Missing credentials fail closed. Third-party inference requires available Cloudflare Unified Billing credits. Do not assume a listing proves account entitlement.

Model IDs come from the account's model catalog: `google/gemini-4-argon`, `meta/muse-spark-open`, `meta/muse-wonder-1.0`, `openai/gpt-6.1-terra`. All use the same system instructions, current directory context and user question. The adapters must support non-streaming chat completions with `max_completion_tokens`. Unsupported formats, quotas and permissions are shown as errors, not answers. Maximum completion budget: 1,024 tokens per model. No automatic retries, cache is bypassed and gateway content logging is requested off. Provider retention/billing policies still apply. Browser cancellation cannot guarantee cancellation of upstream work or charges.

The token is sent in the Authorization header to the same-origin Worker, then Cloudflare. No credential is put in a URL, export, source, browser storage or database. Errors do not echo upstream response bodies. Keep Worker request-header/body logging disabled; never add logging of Authorization. A Cloudflare bearer token authenticates each run; loading the empty lab does not authorize model spending. Manual mode makes no requests and has no measured latency/usage.

Full-response time is reported from the proxy (or marked as unmeasured), not first-token time. Token counts appear only when the provider reports them; cost is unknown, never guessed. Scores are explicit reviewer ratings, not model-generated rankings. Exports distinguish requested and reported model identifiers, incomplete answers, errors and manual entries. This bench does not use tools, send leads, book work, change estimates or process real customer records.

Reference: https://developers.cloudflare.com/ai-gateway/usage/rest-api/ (authentication, model naming, chat completions and per-request headers).
