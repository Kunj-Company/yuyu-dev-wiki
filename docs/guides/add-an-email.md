# Add an email

## Goal

Add a new kind of email to the outbox. A request path enqueues an `OutboxMessage` row in the same transaction as the change that caused it. The worker (`lib/outboxWorker.ts`), or the `POST /api/internal/outbox` recovery path, sends it later. Request paths never wait for SMTP.

The worked example is `submission-received`, the opt-in receipt sent when a hackathon project is submitted:

| Piece | Where |
| --- | --- |
| Payload type, enqueue helper, payload guard, delivery branch | `lib/outbox.ts` |
| Renderer and sender | `sendSubmissionReceivedEmail` in `lib/email/index.ts` |
| Enqueue call site | `lib/core/judging.ts` (inside the submit transaction) |
| Per-event opt-in rule | `lib/hackathonEmails.ts` |
| Tests | `tests/unit/judging-outbox.test.ts`, `tests/unit/outbox.test.ts` |

## Before you start

- Read [Background jobs](/architecture/background-jobs) and [Email and broadcasts](/features/email-and-broadcasts).
- Decide three things now, because each one changes what you must add:
  1. **Does the payload carry a capability** (a raw token or a link that grants access)? If so, it must never be stored after delivery.
  2. **Is it bulk**, meaning an organiser sends it to a whole audience at once? Bulk kinds wait behind transactional ones.
  3. **Is it new since the release running in production?** Then the older worker will not recognise it during the overlap.
- Organiser-controlled hackathon emails are off by default per event, and attendance confirmation is sent only by an owner/admin. Never add an automatic send for either (`AGENTS.md`).

## Steps

### 1. Define the payload and enqueue helper in `lib/outbox.ts`

Keep the payload small: an address and ids, read fresh at send time. Names and titles are looked up during delivery so the email reflects current data.

```ts
/**
 * Hackathon submission confirmation to the person who submitted. Event and
 * project titles are read at send time; the message is dropped when the
 * submission is gone or no longer SUBMITTED.
 */
export type SubmissionReceivedPayload = { to: string; submissionId: string; recipientName?: string };

export async function enqueueSubmissionReceived(client: OutboxClient, payload: SubmissionReceivedPayload) {
  return client.outboxMessage.create({ data: { kind: "submission-received", payload: payload as Prisma.InputJsonValue } });
}
```

`OutboxClient` is `Prisma.TransactionClient | typeof prisma`, so callers pass their `tx`. For a fan-out, use `createMany`, as `enqueueResultsPublished` does, and return `{ count: 0 }` early for an empty list.

### 2. Write a strict payload guard

The worker re-validates every payload it reads. An invalid payload is a `PermanentOutboxError`, not a retry.

```ts
export function asSubmissionReceivedPayload(value: Prisma.JsonValue): SubmissionReceivedPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  if (
    !isEmail(payload.to) ||
    !isBoundedString(payload.submissionId, 64) ||
    (payload.recipientName !== undefined && !isBoundedString(payload.recipientName, 200))
  ) return null;
  return payload as SubmissionReceivedPayload;
}
```

Token fields get a shape check (`isSubmissionTokenShape`, `isAttendanceTokenShape`, `isTeamTokenShape`), and URLs go through `isSafeMessageUrl`.

### 3. Add the renderer and sender in `lib/email/index.ts`

Follow the existing senders. Escape every organiser- or user-supplied value with the module's `escapeHtml`, strip control characters from the subject with `headerText`, build absolute links from `getBaseUrl()` (which uses `NEXT_PUBLIC_BASE_URL`), and send a plain-text part too. Excerpt from `sendSubmissionReceivedEmail`:

```ts
const { transporter, from } = await getEmailTransport();
const eventUrl = `${getBaseUrl()}${params.eventPath}`;
const salutation = greeting(params.recipientName);
const subject = `Submission received · ${headerText(params.eventTitle)}`;
// ... html via teamEmailShell(subject, ...) and teamButton(eventUrl, "View the event")
if (!transporter) {
  console.log("[EMAIL MOCK] submission confirmation queued");
  return;
}
await transporter.sendMail({ messageId: params.messageId, from, to: params.to, subject, text, html });
```

Pass `messageId` through. The worker supplies a stable id so a retried message is the same message to the recipient's server. Never log the recipient address or a capability URL.

### 4. Add the delivery branch

In `deliverOutboxBatchWithCount`, add an `else if (message.kind === "...")` branch before the final `else { throw new PermanentOutboxError(); }`. Re-read the current state and **drop** the message (delete the claimed row and `continue`) when it no longer applies:

```ts
} else if (message.kind === "submission-received") {
  const payload = asSubmissionReceivedPayload(message.payload);
  if (!payload) throw new PermanentOutboxError();
  const submission = await prisma.submission.findUnique({ where: { id: payload.submissionId }, select: { /* … */ } });
  if (!submission || submission.status !== "SUBMITTED") {
    await prisma.outboxMessage.deleteMany({ where: { id: message.id, status: OutboxStatus.PROCESSING, lockedAt: claimTime } });
    continue;
  }
  await sendSubmissionReceivedEmail({ to: payload.to, /* … */ messageId: stableMessageId });
}
```

Every write to the claimed row is conditioned on `status: PROCESSING` and `lockedAt: claimTime`, so two workers never both finish the same message.

### 5. Register the kind in the lists that apply

All of these live in `lib/outbox.ts`:

| List | Add the kind when | Effect |
| --- | --- | --- |
| `containsCapability` | The payload carries a raw token or capability link | Row is deleted after delivery or terminal failure instead of being kept as `SENT`/`FAILED` |
| `BULK_OUTBOX_KINDS` | An organiser sends it to a whole audience | Claimed only after every due transactional message |
| `OUTBOX_KINDS_ADDED_AFTER_1_0` (or its successor) | The kind is new since the release currently in production | The new release requeues rows the old worker failed as unknown, once |

```ts
export const BULK_OUTBOX_KINDS: readonly string[] = ["event-broadcast", "attendance-check", "results-published", "event-invite"];

export const OUTBOX_KINDS_ADDED_AFTER_1_0: readonly string[] = ["team-created", "team-member-added", "submission-received", "submission-link", "results-published", "attendance-check"];
```

Why the last list matters: during a rolling update or an image rollback, the previous release's worker can claim the new kind, doesn't recognise it, and marks it `FAILED` with `PermanentOutboxError`. `requeueKindsRejectedByOlderRelease` returns such rows to `PENDING` once (only rows with `attempts: 1` from the last 7 days). Also add the kind to the "do not run old and new side by side" list in `docs/production-operations.md`.

### 6. Enqueue inside the transaction

Enqueue in the same transaction as the state change, so the email exists exactly when the change does. Gate opt-in emails on the server, under the same lock. From `lib/core/judging.ts`:

```ts
// The receipt is opt-in per event (lib/hackathonEmails.ts); read under
// the Event lock, so it can't race a settings change.
const receiptQueued = Boolean(mode === "submit" && !wasSubmitted && entrant.submitter.email && shouldQueueSubmissionReceipt(event));
if (receiptQueued && entrant.submitter.email) {
  await enqueueSubmissionReceived(tx, {
    to: entrant.submitter.email,
    submissionId: saved.id,
    ...(entrant.submitter.name ? { recipientName: entrant.submitter.name.slice(0, 200) } : {}),
  });
}
```

### 7. Test

In a unit suite modelled on `tests/unit/judging-outbox.test.ts`, mock `@/lib/db`, `@/lib/email` and `@/lib/opsAlerts`, then cover:

- the guard accepts good payloads and rejects bad addresses, missing ids and oversized names
- the enqueue helper writes the documented `kind`
- delivery sends and marks the row `SENT` (or deletes it, for capability kinds)
- delivery drops the message when the target state no longer applies

```ts
it("drops a confirmation for a withdrawn or deleted submission", async () => {
  mocks.findMany.mockResolvedValue([message("submission-received", { to: "a@example.test", submissionId: "sub_1" })]);
  mocks.submissionFind.mockResolvedValue({ status: SubmissionStatus.WITHDRAWN, /* … */ });
  await expect(deliverOutboxBatch()).resolves.toEqual({ sent: 0, failed: 0 });
```

If you extended `OUTBOX_KINDS_ADDED_AFTER_1_0`, update the expectation in `tests/unit/outbox.test.ts` ("returns new-kind emails an older release failed as unknown to the queue, once"). `tests/unit/email-construction.test.ts` is where escaping tests for rendered emails live.

## Checklist

- [ ] Payload holds ids and an address; display data is read at send time
- [ ] `asXPayload` guard with bounded strings and token-shape checks
- [ ] Sender escapes values, cleans the subject, uses absolute links, sends text and HTML, passes `messageId`
- [ ] Delivery branch drops messages whose target state has changed
- [ ] Capability payloads added to `containsCapability`
- [ ] Audience-wide sends added to `BULK_OUTBOX_KINDS`
- [ ] New kinds added to `OUTBOX_KINDS_ADDED_AFTER_1_0` (or its successor) and to the upgrade notes in `docs/production-operations.md`
- [ ] Enqueued inside the transaction; opt-in gates enforced on the server
- [ ] Unit tests for the guard, enqueue, delivery and drop paths
- [ ] Help article updated if organisers can see or control the email

## Verify

```bash
npx vitest run tests/unit/outbox.test.ts tests/unit/judging-outbox.test.ts tests/unit/email-construction.test.ts
npm run test:unit
npx next typegen && npx tsc --noEmit
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration
```

To see a real message locally, configure SMTP to point at a local mail catcher (`docs/DEVELOPMENT.md`). Outside production, with no SMTP service or host configured, `getEmailTransport` returns no transporter and the senders log `[EMAIL MOCK] ...` and return. In production that case throws `EmailTransportUnavailableError` (`lib/email/transporter.ts`).
