# Project request email

The private Worker secret MIDDLETOWN_ZAPIER_WEBHOOK points to a dedicated two-step Wazoozie Zap: Catch Hook then Email by Zapier to service@mtownhvac.com. Never commit the URL. Existing HVAC automation stays separate.

Only Middletown supports Submit request initially. The review identifies the chosen business, and required consent authorizes saving and sharing. Other providers remain save-only. No old briefs are emailed retroactively. No SMS or marketing signup is triggered.

Saving and enqueueing are one SQLite transaction. Webhook transport failures retry with exponential backoff (ten attempts / 48 hours). Duplicate references with identical content reuse the outbox. Homeowner values are HTML escaped. An ambiguous timeout may still cause a duplicate email: Catch Hook does not guarantee idempotency, so the reference appears in the email for office deduplication.

The automation_accepted status means Zapier accepted the webhook, not that an email arrived or an appointment was booked. Pending and failed receipts retain a phone fallback. Downstream email failures must be checked in Zapier task history. Email by Zapier documents plan-dependent limits: 5/day Free/Trial; 10/hour Pro or Team. This is an initial low-volume alert path. A transactional sender and delivery callback are needed before marketplace scale.

Outbox records expire with briefs after about 90 days. Zapier retains task data separately under its account policies. The privacy page discloses the processor and recipient. Passkey accounts do not subscribe anyone to email.
