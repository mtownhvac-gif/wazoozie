# Project request email

The private Worker secret MIDDLETOWN_ZAPIER_WEBHOOK points to a dedicated two-step Wazoozie Zap: Catch Hook then Email by Zapier to the configured Wazoozie Help inbox. The recipient is configured in the published Zap, not in the Worker payload. Verify it there before testing; repository contact links do not prove the alert destination. Never commit the webhook URL. Existing HVAC automation stays separate.

Requests identify the homeowner's selected business and go to Wazoozie Help for manual review and forwarding. Capability advertising covers the current business catalog when the webhook is configured; it does not establish contractor participation or inbox delivery. No old briefs are emailed retroactively. No SMS or marketing signup is triggered.

Saving and enqueueing are one SQLite transaction. Both project briefs and business applications arm a prompt durable alarm before returning from storage, so interruption before the initial delivery RPC cannot leave an alert waiting for daily cleanup. Webhook transport failures retry with exponential backoff (ten attempts / 48 hours). Duplicate references with identical content reuse the outbox. Homeowner values are HTML escaped. An ambiguous timeout may still cause a duplicate email: Catch Hook does not guarantee idempotency, so the reference appears in the email for office deduplication.

The automation_accepted status means Zapier accepted the webhook, not that an email arrived or an appointment was booked. Pending and failed receipts retain a phone fallback. Downstream email failures must be checked in Zapier task history. Email by Zapier documents plan-dependent limits: 5/day Free/Trial; 10/hour Pro or Team. This is an initial low-volume alert path. A transactional sender and delivery callback are needed before marketplace scale.

Outbox records expire with briefs after about 90 days. Zapier retains task data separately under its account policies. The privacy page discloses the processor and recipient. Passkey accounts do not subscribe anyone to email.
