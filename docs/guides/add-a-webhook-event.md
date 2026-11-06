# Add a webhook event type

## Goal

Add a new organisation webhook event type (for example, a hypothetical `team.created`) so that organisation owners and admins can subscribe to it, and so that it is emitted with a strict, privacy-safe payload after the triggering transaction commits.

The pipeline: **commit point** calls `emitWebhookEvent` (`lib/webhooks/emit.ts`) → background build of the payload → one `WebhookDelivery` row per subscribed endpoint → the worker signs and delivers it (`lib/webhooks/delivery.ts`). See [Webhooks](/api/webhooks) for the receiver's view.

Real example to copy: `feedback.submitted`. It is emitted from `lib/feedback.ts`, built in `buildData` in `lib/webhooks/emit.ts`, and validated by `feedbackData` in `lib/webhooks/payloads.ts`.

## Before you start

- Read `docs/WEBHOOKS.md` and the webhook rules in `AGENTS.md`: owner/admin only, emit only after commit, payloads limited to strict DTOs (**no emails, answers or tokens**), and targets SSRF-checked.
- Decide what the payload contains. It should match the machine API's privacy line: ids, statuses, timestamps, the event title/slug and display names only.
- Webhook event types are plain strings. `WebhookEndpoint.eventTypes` is `String[]` and `WebhookDelivery.eventType` is text, so adding a type needs **no migration**. There is a database CHECK `WebhookEndpoint_event_types_bounded` (`cardinality("eventTypes") <= 16`), and there are 7 types today.

## Steps

### 1. Add the type and its label

`lib/webhooks/eventTypes.ts` is shared by the server and the settings UI, so it must stay free of server-only imports.

```ts
export const WEBHOOK_EVENT_TYPES = [
  "registration.created",
  "registration.status_changed",
  "checkin.created",
  "checkin.undone",
  "event.published",
  "event.cancelled",
  "feedback.submitted",
] as const;

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, { label: string; description: string }> = {
  // ...
  "feedback.submitted": { label: "Feedback submitted", description: "Someone submits the feedback form (no answers are sent)." },
};
```

Append your type to `WEBHOOK_EVENT_TYPES` and add its entry to `WEBHOOK_EVENT_LABELS`. TypeScript forces the label because the record is keyed by `WebhookEventType`. From there it flows automatically to:

- the subscription checkboxes in `components/webhooks/WebhookDialogs.tsx`
- the save validator in `app/actions/webhooks.ts`: `eventTypes: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1).max(WEBHOOK_EVENT_TYPES.length)`
- `isWebhookEventType`, which filters stored types when endpoints are read (`lib/webhooks/management.ts`)

### 2. Define the strict `data` schema

In `lib/webhooks/payloads.ts`, add a strict Zod object and register it in `webhookDataSchemas`. Reuse `webhookEventRefSchema` and `webhookRegistrationSchema` rather than inventing new shapes:

```ts
const feedbackData = z.object({
  event: webhookEventRefSchema,
  feedback: z.object({ id: z.string(), submittedAt: isoDate }).strict(),
}).strict();

export const webhookDataSchemas = {
  // ...
  "feedback.submitted": feedbackData,
  ping: pingData,
} as const;
```

`buildWebhookEnvelope` parses `data` against this schema, so an extra field throws instead of leaking. Build values with the pure mappers `webhookEventRef(...)` and `webhookRegistration(...)`. They copy allow-listed fields only, even when given a wider Prisma row.

### 3. Add the emission variant and payload builder

In `lib/webhooks/emit.ts`, extend the `WebhookEmission` union with the ids the builder needs, never the payload itself:

```ts
export type WebhookEmission =
  | { type: "registration.created"; rsvpId: string }
  // ...
  | { type: "feedback.submitted"; feedbackResponseId: string };
```

Then add a `case` to `buildData` that loads the row with a narrow `select`, returns `null` if it is gone, and returns `{ organisation, data }`:

```ts
case "feedback.submitted": {
  const response = await prisma.eventFeedbackResponse.findUnique({
    where: { id: emission.feedbackResponseId },
    select: { id: true, submittedAt: true, form: { select: { event: { select: eventRefSelect } } } },
  });
  if (!response) return null;
  const event = response.form.event;
  return {
    organisation: event.organisation,
    data: { event: webhookEventRef({ kind: "event", event }), feedback: { id: response.id, submittedAt: response.submittedAt.toISOString() } },
  };
}
```

The organisation comes from the loaded row, so a delivery can only go to endpoints of the organisation that owns the data. If the row may be deleted before the background build runs (as with a cancelled RSVP), pass a snapshot in the emission, as `registration.status_changed` does with `RsvpWebhookSnapshot`.

### 4. Emit at the commit point

Call `emitWebhookEvent` **after** the transaction has committed, and only on success. It returns immediately and never throws. From `lib/feedback.ts`:

```ts
const result = await prisma.$transaction(async (tx) => {
  // ...
  createdResponseId = created.id;
  return { ok: true, data: { certificateToken } };
});
if (result.ok && createdResponseId) emitWebhookEvent({ type: "feedback.submitted", feedbackResponseId: createdResponseId });
```

Emit from the shared core in `lib/core/` (or the domain helper in `lib/`) that every surface uses, so the dashboard, public routes and mobile API all raise the event. Never emit inside `$transaction`: a rollback would leave a delivery for a change that never happened.

### 5. Document it

- `docs/WEBHOOKS.md`: add a row to "Event types" (when it is sent) and to the `data` per type table in "Payloads".
- `content/help/developers/webhooks.mdx`: the help centre lists the event types for organisation admins.

### 6. Test

**Unit** (`tests/unit/webhooks.test.ts`):

- Add the type to the expected list in "documents a known set of event types".
- Add an envelope for the new type to "never serialises tokens, emails or answers in any envelope". That test checks the JSON for `checkInToken`, `@`, `answer`, `guestEmail`, `email`, `userId`, `secret` and similar.
- Add a case to "rejects any extra field through the strict schemas".

```ts
it("documents a known set of event types", () => {
  expect(WEBHOOK_EVENT_TYPES).toEqual([
    "registration.created",
    // ...
    "feedback.submitted",
  ]);
  expect(isWebhookEventType("ping")).toBe(false);
});
```

**Integration** (`tests/integration/webhooks.db.test.ts`): extend "queues events after RSVP create, approval, check-in, undo, publish, cancel and feedback". Trigger the real core, wait with `flushWebhookEmits()` (exported from `lib/webhooks/emit.ts`), then assert the delivery row's envelope and that it contains no token or email.

## Checklist

- [ ] Type added to `WEBHOOK_EVENT_TYPES` with a label and description
- [ ] Total stays at or below the `WebhookEndpoint_event_types_bounded` limit (16), or a migration raises it
- [ ] Strict `data` schema registered in `webhookDataSchemas`, built from the allow-list mappers
- [ ] `WebhookEmission` variant carries ids (plus a snapshot if the row may be deleted)
- [ ] `buildData` case uses a narrow `select` and takes the organisation from the loaded row
- [ ] `emitWebhookEvent` called after commit, on success only, from the shared core
- [ ] No emails, user ids, answers, or ticket/certificate/invite tokens in the payload
- [ ] `docs/WEBHOOKS.md` and `content/help/developers/webhooks.mdx` updated
- [ ] Unit forbidden-field and strictness tests extended; integration test asserts the delivery row

## Verify

```bash
npx vitest run tests/unit/webhooks.test.ts tests/unit/help-content.test.ts
npm run test:unit
npx next typegen && npx tsc --noEmit
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration
```

To watch a real delivery locally, point an endpoint at a receiver on your machine with `WEBHOOKS_ALLOW_PRIVATE_TARGETS=1` in `.env` (development and tests only; `npm run production:check` refuses it).
