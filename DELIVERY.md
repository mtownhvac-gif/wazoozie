# Inquiry delivery — staged implementation for issue 27

This branch implements the first HVAC inquiry path. It is disabled unless all
activation settings are supplied. Production email has not been tested or enabled.
Bryan confirmed service@mtownhvac.com as the first test and office-alert recipient.
Other contractor recipients have not been confirmed. No historical brief is queued.

## Activation prerequisites

Restore the existing authenticated Cloudflare deployment session. Verify a Wazoozie
sending domain in Resend and preserve existing mail DNS. Use Cloudflare secrets for
RESEND_API_KEY and RESEND_WEBHOOK_SECRET; never enter them in the browser or repo.
Set WAZOOZIE_FROM to a verified bare sender address, WAZOOZIE_OPERATOR_EMAIL to the
confirmed office address, MIDDLETOWN_INQUIRY_EMAIL to service@mtownhvac.com and
MIDDLETOWN_DELIVERY_CONFIRMED=1 only after confirming intake participation. Finally
set INQUIRY_DELIVERY_ENABLED=1. Until all settings exist, only save-only is shown.
No paid plan, account, sender or credential has been created by this work.

Configure the Resend webhook at /api/delivery-webhook for email.delivered,
email.bounced, email.failed and email.complained. Raw bodies are HMAC-verified with
Svix timestamps and duplicate event IDs. Send synthetic data only to the confirmed
operator-controlled inbox before enabling public sending. Verify the callback tag
shape against actual Resend events during that activation test.

## Behavior

The HVAC page offers a separate explicit send checkbox and action when configured.
A save-only action remains available. The new consent version is stored separately.
The same SQLite transaction stores the brief and recipient-specific email payloads.
Identical operator and provider inboxes receive one email, rather than duplicate alerts.
Alarms dispatch with stable Resend idempotency keys, bounded exponential retries,
15-second timeouts, and serialization per private object. After eight attempts or
23 hours since the first attempt, stop for manual review: do not risk a retry past
Resend's 24-hour deduplication window. Queued/accepted/delivered/failed are distinct;
none means read, acknowledged or booked. Failed is terminal even with late callbacks.
Early callbacks are retained and reconciled when provider acceptance is persisted.
Delivery records and events expire with the existing approximately 90-day cleanup.

## Office review and rollback

Use the existing authenticated Cloudflare Data Studio and provider/month inbox.
Inspect delivery_outbox (state, attempts, next_at, email_id, last_error) and
project_briefs; send_consent_version distinguishes explicit sends. These tables
contain private project data. There is no public lookup route. Review failed and
unacknowledged inquiries daily. Inspect Resend for bounce/quota/auth issues. Do not
manually resend an ambiguous inquiry until reconciling provider records; never change
recipients without permission. Pausing INQUIRY_DELIVERY_ENABLED stops alarm sends;
queued records remain private. Stop provider retries before rolling back code.

## Remaining issue-27 work / release gates

Real configured-provider and webhook end-to-end test and operator process validation
remain activation gates. Enabled send controls passed desktop and 390px browser QA
with a mocked local provider. No actual email was transmitted. Production
sender and credentials are unavailable in this environment. The general /start/
planner remains save-only. Contractor application office alerts, participation for
other providers, authenticated outcome tracking and unacknowledged-inquiry alerts
remain future work. Twilio is phase 2 and is not implemented or activated here.

References: https://resend.com/docs/api-reference/emails/send-email
https://resend.com/docs/dashboard/emails/idempotency-keys
https://resend.com/docs/webhooks/verify-webhooks-requests

Recovery schedules the alarm before committing new outbox records. Retry submits retain
the same reference and refresh delivery status. Expanded failure tests cover timeouts,
429 quota errors, concurrent-provider 409s, permanent errors, early and duplicate
callbacks, retention-before-dispatch and public-route send-consent enforcement.
