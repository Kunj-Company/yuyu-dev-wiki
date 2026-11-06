# Email and broadcasts

Every email Yuyu sends goes through the transactional outbox. A business change inserts an `OutboxMessage` row (usually in the same database transaction), and the background worker renders and sends it later, so no request ever waits on SMTP. On top of that sit two families of email: **transactional kinds** (verification, RSVP confirmations, invites, team and hackathon notices) that the system queues, and **broadcasts** that organisers write in the event dashboard's Emails tab, with starter templates, placeholders, five visual designs and autosaved drafts. This page covers rendering, the kinds and the broadcast pipeline. The worker loop, scheduler and retention are covered in [Background jobs](/architecture/background-jobs).

## Key files

| Path | Role |
| --- | --- |
| `lib/outbox.ts` | `enqueue*` helpers, payload parsers, `deliverOutboxBatch`, retry policy, `BULK_OUTBOX_KINDS`, `OUTBOX_KINDS_ADDED_AFTER_1_0` |
| `lib/outboxWorker.ts` | Scheduler pass: outbox drain, webhook delivery, retention |
| `lib/email/index.ts` | Senders and builders for each kind (`sendRSVPConfirmation`, `sendApprovalNotification`, `buildBroadcastEmail`, `sendEventBroadcast`, `buildAttendanceCheckEmail`…) |
| `lib/email/emailVerification.ts`, `lib/email/passwordReset.ts` | Auth emails |
| `lib/email/transporter.ts` | `getEmailTransport`: a fresh nodemailer transport per send, built from settings read at send time |
| `lib/email/brand.ts` | `emailBrandHeader` (hosted PNG lockup) |
| `lib/email/broadcastDesigns.ts` | `BROADCAST_DESIGNS`, `renderBroadcastDesign`, `inlineBroadcastStyles`, `safeEmailUrl`, `escapeHtml` |
| `lib/broadcastTemplate.ts` | Placeholders, starter templates, `renderBroadcastHtml`, `broadcastHtmlToText`, subject and body limits |
| `lib/eventBroadcast.ts` | Audience predicate, recipient de-duplication, `sanitizeBroadcastHtml`, broadcast URLs |
| `lib/broadcastDraftAutosave.ts` | Client-side `DraftAutosave` controller (1.5 s debounce) |
| `lib/core/broadcasts.ts` | Shared cores: count, preview, send, test, draft load, save and discard |
| `app/actions/broadcasts.ts` | Thin Server Action wrappers over the cores |
| `components/broadcasts/EventBroadcastPanel.tsx` | Emails tab UI, including the five-second undo |
| `lib/calendarInvite.ts` | `.ics` attachment for confirmations |
| `lib/hackathonEmails.ts` | Per-event opt-in gates for hackathon emails |

## How it works

### Message kinds

| Kind | Queued by | Capability-bearing | Bulk |
| --- | --- | --- | --- |
| `email-verification` | Sign-up and resend | yes | |
| `password-reset` | Forgot password | yes | |
| `rsvp-confirmation` | RSVP confirmed (carries an `.ics` invite) | yes | |
| `rsvp-status` | Approval, waitlist and other status changes | when the payload has `checkInToken` | |
| `event-invite` | Invite-only event invitations | | yes |
| `collaborator-invite` | Event collaborator invites | yes | |
| `event-broadcast` | Organiser broadcast, one row per recipient | | yes |
| `event-broadcast-test` | Broadcast test to the sender's own inbox | | |
| `team-created`, `team-member-added` | Team registration | yes | |
| `submission-link` | Hackathon submission link | yes | |
| `submission-received` | Hackathon receipt (opt-in per event) | | |
| `results-published` | Hackathon results (opt-in per event) | | yes |
| `attendance-check` | "Are you still coming?" | yes | yes |

- **Bulk kinds** (`BULK_OUTBOX_KINDS`) are claimed only after due transactional rows in each batch, so a large broadcast cannot delay someone's password reset.
- **Capability-bearing rows** (`containsCapability`) carry a token or link that grants access. They are deleted after delivery or terminal failure instead of being kept as `SENT` or `FAILED`.
- **Retries**: up to 8 attempts. The delay is `2^attempts` minutes, capped at 60 minutes, or at 8 minutes for `password-reset` and `email-verification`, because those links expire after an hour. Each message gets a stable `Message-ID` (`<yuyu-<id>@outbox.invalid>`), so a retry after an ambiguous SMTP failure can be de-duplicated by mail servers.
- Delivery-time checks drop rows that no longer apply. For example, an `event-broadcast` row is deleted without sending if the RSVP left the audience after queueing (`rsvpMatchesBroadcastAudience`).

### SMTP transport

`getEmailTransport()` reads the instance settings (`getEmailSettings` in `lib/instanceSettings.ts`) on **every** send and deliberately keeps no module-level cache. A change saved in Super admin → Settings therefore applies on the next send on every replica. Saved panel SMTP replaces the `SMTP_*` environment values as a whole. In production:

- With no host or service configured, it throws `EmailTransportUnavailableError`. In development it returns `transporter: null` and senders log `[EMAIL MOCK]`.
- TLS 1.2+ with certificate verification is required, except in the CI-only mode `CI=true` with `ALLOW_INSECURE_PRODUCTION_TESTS=1`.
- Unauthenticated SMTP is refused unless `smtpAllowUnauthenticated` is set for a private relay.
- Transports set `disableFileAccess` and `disableUrlAccess`, with timeouts of 30 s for connection and greeting and 60 s for the socket.

One SMTP login per message is why the worker drains 20 emails per pass. Larger batches triggered Gmail's "Too many login attempts".

### Broadcast pipeline

```mermaid
sequenceDiagram
  participant UI as Emails tab
  participant Core as lib/core/broadcasts.ts
  participant DB as PostgreSQL
  participant W as Outbox worker
  UI->>Core: saveEventBroadcastDraft, debounced 1.5 s
  Core->>DB: upsert EventBroadcastDraft for user and event
  UI->>Core: sendEventBroadcast after the 5 s undo window
  Core->>Core: rate limit, validate, sanitizeBroadcastHtml
  Core->>DB: one transaction creates EventBroadcast and outbox rows and deletes the draft
  Core->>DB: audit EVENT_BROADCAST_QUEUED
  W->>DB: claim event-broadcast rows
  W->>W: re-check audience, render placeholders per recipient, apply design
  W->>W: send via SMTP
```

1. **Audience.** Any combination of RSVP statuses, plus `BroadcastAttendanceFilter` (`ANY`, `CHECKED_IN`, `NOT_CHECKED_IN`). `broadcastRecipientWhere` builds the predicate. `resolveBroadcastRecipients` keeps one recipient per email address, preferring the confirmed registration so the email carries a ticket link.
2. **Content.** The editor produces HTML. `sanitizeBroadcastHtml` reduces it to `p, br, strong, em, s, u, h2, h3, ul, ol, li, blockquote, a` (with `href` and class `cta` only) and `http`, `https` and `mailto` links. Link placeholders survive sanitising through a sentinel URL. The subject is capped at 150 characters (`BROADCAST_SUBJECT_MAX`) and the body at 20,000 (`BROADCAST_BODY_MAX`).
3. **Placeholders** (`BROADCAST_PLACEHOLDERS`): `{{name}}`, `{{event}}`, `{{eventDate}}`, `{{location}}`, `{{eventUrl}}`, `{{ticketLink}}`, `{{feedbackUrl}}`, `{{scheduleUrl}}` and `{{organisation}}`. Only the four URL placeholders may be used as link targets (`BROADCAST_URL_PLACEHOLDERS`). Values are HTML-escaped when rendered (`renderBroadcastHtml`). `{{ticketLink}}` is the recipient's own ticket for confirmed registrations, otherwise the event page.
4. **Send.** `sendEventBroadcastForUser` checks the `broadcast` rate limit (10 per hour), validates the input, requires an organisation owner or admin (`canManageEvents`), then in one transaction resolves recipients, creates the `EventBroadcast` row, enqueues one `event-broadcast` row per recipient and deletes the sender's draft. The stored body is the sanitised template. Placeholders are rendered per recipient at delivery time.
5. **Designs** (`lib/email/broadcastDesigns.ts`): `classic` (default), `minimal`, `accent`, `photo` and `letter`. A design changes only the frame and inline styles. Organiser-supplied values are escaped, and image and link URLs pass through `safeEmailUrl` (absolute `http`/`https` only).
6. **Absolute URLs.** Recipients need `NEXT_PUBLIC_BASE_URL`. Without it, site-relative images are dropped rather than linked to `localhost`. The dashboard preview passes `imageBaseUrl: ""` so images load relative to the page.
7. **Test send.** `sendEventBroadcastTestForUser` queues `event-broadcast-test` to the sender's own inbox, and refuses if that address is unverified, with a `[Test]` subject prefix. It has its own bucket, `broadcastTest` (20 per hour), so testing never blocks the real send.
8. **Drafts.** `EventBroadcastDraft` holds one private draft per organiser and event (subject, body, design, statuses, attendance, `templateId`). Saves use the `broadcastDraft` bucket (60 per minute). A teammate's draft is never visible.

The same cores back the mobile endpoints under `…/broadcasts` (see [Mobile API](/api/mobile-api)). Mobile sends do not clear the dashboard draft, because only the web action passes `clearDraft: true`.

## Invariants

- **Never send SMTP from a request path.** Always enqueue an outbox row, inside the business transaction where possible. The request returns once the row is committed.
- **New audience-wide kinds go in `BULK_OUTBOX_KINDS`**, so they cannot starve transactional mail.
- **Kinds added after 1.0 go in `OUTBOX_KINDS_ADDED_AFTER_1_0`.** During a rolling upgrade a 1.0 worker fails unknown kinds permanently, and the new release requeues those rows once.
- **Capability-bearing kinds must be listed in `containsCapability`**, so their tokens are deleted after delivery and never retained as history.
- **Store templates, render late.** `EventBroadcast.body` is sanitised HTML with placeholders. Rendering happens per recipient in the worker, and the audience is re-checked at that point.
- **Escape everything organiser-supplied.** Use `escapeHtml` and `escapeBroadcastHtml`, and pass URLs through `safeEmailUrl`.
- **Hackathon result and receipt emails are opt-in per event**, enforced where rows are queued (`lib/hackathonEmails.ts`). Attendance-confirmation emails are sent only when an owner or admin asks. Never add an automatic send for either.
- **Failures persist only a normalised error class** (`describeOperationalError`), never message content or addresses.

## Making changes

- **Add a transactional kind.** Follow [Add an email](/guides/add-an-email): add a payload type, an `enqueue*` helper and an `as*Payload` parser in `lib/outbox.ts`, a sender in `lib/email/index.ts`, and a branch in `deliverOutboxBatch`. Then decide on `BULK_OUTBOX_KINDS`, `containsCapability` and `OUTBOX_KINDS_ADDED_AFTER_1_0`, and add tests in `tests/unit/outbox.test.ts` and `tests/unit/email-construction.test.ts`.
- **Add a placeholder.** Add it to `BROADCAST_PLACEHOLDERS` and `BroadcastVariables` in `lib/broadcastTemplate.ts`. If it is a URL, also add it to `BROADCAST_URL_PLACEHOLDERS` and the `HREF_PLACEHOLDER` and `HREF_SENTINEL` patterns in `lib/eventBroadcast.ts`. Then fill it in `broadcastVariablesFor` and `sampleBroadcastVariables`.
- **Add a design.** Add an entry to `BROADCAST_DESIGNS`, implement its frame in `renderBroadcastDesign`, and extend `tests/unit/broadcast-designs.test.ts`. Input validation (`broadcastDesignSchema` in `lib/validators.ts`) is derived from `BROADCAST_DESIGN_IDS`, but the mobile contract lists the ids explicitly, so update `docs/mobile-api.openapi.yaml` too.
- **Add a starter template.** Append to `BROADCAST_STARTER_TEMPLATES` in `lib/broadcastTemplate.ts`.

## Testing

| File | Covers |
| --- | --- |
| `tests/unit/outbox.test.ts`, `outbox-worker.test.ts` | Claim order, retries, capability deletion, worker pass |
| `tests/unit/email-construction.test.ts`, `email-log-safety.test.ts`, `email-transporter.test.ts`, `nodemailer-security.test.ts` | Rendering, log redaction, TLS and auth rules |
| `tests/unit/broadcast-template.test.ts`, `broadcast-designs.test.ts`, `event-broadcast.test.ts` | Placeholders, sanitising, designs, audience |
| `tests/unit/broadcast-actions.test.ts`, `broadcast-draft-autosave.test.ts` | Cores and the autosave controller |
| `tests/unit/calendar-invite.test.ts`, `hackathon-emails.test.ts` | `.ics` output, opt-in gates |
| `tests/integration/broadcast-drafts.db.test.ts`, `hackathon-email-toggles.db.test.ts` | Draft persistence, gated queueing |
| `tests/e2e/broadcast-drafts.spec.ts` | Emails tab end to end |

```bash
npx vitest run tests/unit/outbox.test.ts tests/unit/broadcast-template.test.ts tests/unit/event-broadcast.test.ts
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration -- tests/integration/broadcast-drafts.db.test.ts
```

## Further reading

- [docs/FEATURES.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/FEATURES.md)
- [docs/DECISIONS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DECISIONS.md)
- [docs/production-operations.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/production-operations.md)
- [Background jobs](/architecture/background-jobs)
- [Add an email](/guides/add-an-email)
- [Super admin](/features/super-admin) covers SMTP settings, test email and retrying failed email
