# Project request email

The private Worker secret MIDDLETOWN_ZAPIER_WEBHOOK points to a dedicated two-step Wazoozie Zap: Catch Hook then Email by Zapier to the configured Wazoozie Help inbox. The recipient is configured in the published Zap, not in the Worker payload. Verify it there before testing; repository contact links do not prove the alert destination. Never commit the webhook URL. Existing HVAC automation stays separate.

Requests identify the homeowner's selected business and go to Wazoozie Help for manual review and forwarding. Capability advertising covers the current business catalog when the webhook is configured; it does not establish contractor participation or inbox delivery. No old briefs are emailed retroactively. No SMS or marketing signup is triggered.

Saving and enqueueing are one SQLite transaction. Both project briefs and business applications arm a prompt durable alarm before returning from storage, so interruption before the initial delivery RPC cannot leave an alert waiting for daily cleanup. Webhook transport failures retry with exponential backoff (ten attempts / 48 hours). Duplicate references with identical content reuse the outbox. Homeowner values are HTML escaped. An ambiguous timeout may still cause a duplicate email: Catch Hook does not guarantee idempotency, so the reference appears in the email for office deduplication.

The automation_accepted status means Zapier accepted the webhook, not that an email arrived or an appointment was booked. Pending and failed receipts retain a phone fallback. Downstream email failures must be checked in Zapier task history. Email by Zapier documents plan-dependent limits: 5/day Free/Trial; 10/hour Pro or Team. This is an initial low-volume alert path. A transactional sender and delivery callback are needed before marketplace scale.

Outbox records expire with briefs after about 90 days. Zapier retains task data separately under its account policies. The privacy page discloses the processor and recipient. Passkey accounts do not subscribe anyone to email.

## Office reconciliation

Perry owns this check on Muse. Use the existing private follow-up tracker. Keep homeowner details in the authorized inbox and tracker.

1. Find the saved reference in the Wazoozie Help inbox and match it to the Zapier task. The full Worker reference is a UUID. The email body shows the short WZ reference. Record the exact reference and time, the selected business, and the inbox or failed task receipt. A webhook success by itself leaves this step open.
2. Compare the selected business to the alert before forwarding under the current authorization. Heating, cooling, Boilers, Water Heaters, replacements, maintenance and HVAC second opinions route to Middletown HVAC. Painting routes to Rolled Right Painting, electrical to Ryan Dugan Electric, plumbing to Liberator Service Company, and carpentry to Cooke Carpentry & Construction. Contractor applications stay with Wazoozie Help for review. Maintain any provider contact holds.
3. Record the actual forward receipt or the reason the request is held. Deduplicate by full reference when available. If delivery failed or the intended business is unclear, keep the item open with an owner. Check the original Zapier task and selected business before any authorized replay.
4. For the first check, locate the existing test WZ-1D3822E0. Verify the Email by Zapier action and recipient for that exact task. Use the existing test receipt before proposing any new live tests. Keep it out of customer totals.

The live health check requires all configured businesses to be advertised and reports any missing route. The offline suite verifies each project type reaches its own business record and names that business in the office alert. The actual inbox receipt and authorized forwarding receipt close the remaining steps.
