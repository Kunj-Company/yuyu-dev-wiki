# Organisation webhooks

Organisation owners and admins can register HTTPS endpoints that receive a signed `POST` shortly after something happens in their organisation: a registration, a status change, a check-in, a publish or cancellation, or a feedback submission. Delivery is asynchronous and durable. The request path only inserts queue rows after its transaction commits, and the existing outbox worker sends them with retries. This page is for integrators who build a receiver and for contributors who change the emitter.

## Key files

| Path | Role |
| --- | --- |
| `lib/webhooks/eventTypes.ts` | `WEBHOOK_EVENT_TYPES`, labels, `MAX_WEBHOOK_ENDPOINTS_PER_ORGANISATION` (10). Client-safe |
| `lib/webhooks/payloads.ts` | Strict Zod DTOs for the envelope and every `data` shape |
| `lib/webhooks/emit.ts` | `emitWebhookEvent` (fire and forget), `enqueueWebhookEvent`, `enqueueWebhookPing`, `newWebhookEventId` |
| `lib/webhooks/delivery.ts` | Claim, sign, POST, retry, auto-disable (`deliverWebhookBatch`, `deliverWebhookNow`) |
| `lib/webhooks/signature.ts` | `generateWebhookSecret`, `computeWebhookSignature`, `verifyWebhookSignature` |
| `lib/webhooks/secrets.ts` | AES-256-GCM encryption of signing secrets |
| `lib/webhooks/urlSafety.ts` | SSRF rules, DNS resolution and the pinned `lookup` |
| `lib/webhooks/management.ts` | Read models for the settings UI |
| `app/actions/webhooks.ts` | Server Actions: create, update, delete, rotate, enable, test, redeliver |
| `lib/outboxWorker.ts` | Calls `deliverWebhookBatch()` on every scheduler pass |
| `prisma/schema.prisma` | `WebhookEndpoint`, `WebhookDelivery`, `WebhookDeliveryStatus` |

## Managing endpoints

Endpoints are managed at **Settings → Webhooks** (`/dashboard/:orgSlug/settings/webhooks`). Only organisation `OWNER` and `ADMIN` roles qualify (`canManageWebhooks`). Members and event collaborators never do, whatever grants they hold.

| Property | Rule |
| --- | --- |
| Endpoints per organisation | Up to 10 |
| Fields | URL, optional description (up to 200 characters), subscribed event types, enabled switch |
| Signing secret | `whsec_` followed by 32 random bytes in base64url (`/^whsec_[A-Za-z0-9_-]{43}$/`). Shown once on create and on each rotation |
| Rotation | Takes effect immediately. The next request is signed with the new secret |
| Send test | Queues a `ping` and delivers it straight away |
| Redeliver | Resends a delivery with the same event id |
| History | The endpoint page lists the last 50 deliveries. Rows older than 30 days are purged |
| Rate limits | `webhookManage` 30 per minute (changes), `webhookTest` 20 per hour (test sends and redeliveries) |

Changes are audited as `WEBHOOK_ENDPOINT_CREATED`, `WEBHOOK_ENDPOINT_UPDATED`, `WEBHOOK_SECRET_ROTATED`, `WEBHOOK_ENDPOINT_ENABLED`, `WEBHOOK_ENDPOINT_DISABLED`, `WEBHOOK_ENDPOINT_DELETED` and `WEBHOOK_ENDPOINT_AUTO_DISABLED`. Audit metadata records the host only, never the path, query or secret.

## Event types

| Type | Sent when |
| --- | --- |
| `registration.created` | Someone registers (confirmed, waitlisted or pending approval), or an organiser adds a guest |
| `registration.status_changed` | Approve, decline (`REJECTED`), re-accept, waitlist promotion (manual or automatic), attendee cancellation (`CANCELLED`), organiser removal (`REMOVED`), or **Undo**. Whole-team changes send one event per member |
| `checkin.created` | An entrance check-in (desk, scan, door station, offline sync or mobile app) |
| `checkin.undone` | An entrance check-in is undone |
| `event.published` | A standalone event goes live |
| `event.cancelled` | A standalone event's status is set to cancelled |
| `feedback.submitted` | Someone submits the event's feedback form |
| `ping` | **Send test** only. Always delivered to the endpoint under test and cannot be subscribed to |

`event.*` covers standalone events only. Series status changes are not sent. Registration and check-in events do cover series occurrences (see `kind` below).

## Request format

```http
POST /your/path HTTP/1.1
content-type: application/json
user-agent: Yuyu-Webhooks/1
x-yuyu-event-id: evt_3f1c0a9b7d2e4f6a8b9c0d1e2f3a4b5c
x-yuyu-event-type: registration.created
x-yuyu-signature: t=1792656000,v1=<64 lowercase hex characters>
```

The event id is `evt_` plus 16 random bytes in hex (`newWebhookEventId`). Every body is one envelope (`webhookEnvelopeSchema`):

```json
{
  "id": "evt_3f1c0a9b7d2e4f6a8b9c0d1e2f3a4b5c",
  "type": "registration.created",
  "createdAt": "2026-10-22T10:00:00.000Z",
  "organisation": { "id": "cmorg123", "slug": "acme" },
  "data": {}
}
```

### Payload shapes

The `event` reference (`webhookEventRefSchema`):

```json
{
  "kind": "event",
  "id": "cmevent123",
  "occurrenceId": null,
  "title": "Community Meetup",
  "slug": "community-meetup",
  "startDateTime": "2026-11-05T17:00:00.000Z",
  "endDateTime": "2026-11-05T19:00:00.000Z",
  "timezone": "Europe/London"
}
```

For a series occurrence, `kind` is `series_occurrence`, `id` is the series id, `occurrenceId` is the occurrence id, and the times are the occurrence's.

The `registration` object (`webhookRegistrationSchema`). `displayName` falls back to `Participant`:

```json
{ "id": "cmrsvp123", "status": "CONFIRMED", "displayName": "Ada Lovelace", "registeredAt": "2026-10-22T10:00:00.000Z", "checkedInAt": null }
```

`status` is one of `CONFIRMED`, `WAITLISTED`, `PENDING_APPROVAL`, `REJECTED`, `CANCELLED` (cancelled by the attendee, so the row no longer exists) or `REMOVED` (removed by an organiser).

| Type | `data` |
| --- | --- |
| `registration.created` | `{ event, registration }` |
| `registration.status_changed` | `{ event, registration, previousStatus }`. `previousStatus` may be `null` |
| `checkin.created` | `{ event, registration, checkedInAt }` |
| `checkin.undone` | `{ event, registration, undoneAt }` |
| `event.published`, `event.cancelled` | `{ event: { ...event, status }, previousStatus }`. Statuses are `DRAFT`, `PUBLISHED`, `HIDDEN`, `CANCELLED`. `previousStatus` is `null` for an event created in that state |
| `feedback.submitted` | `{ event, feedback: { id, submittedAt } }` |
| `ping` | `{ endpointId, message }` |

::: warning Privacy line
Payloads never contain email addresses or other contact details, user ids, registration or feedback answers, or ticket, check-in, certificate or invitation links and tokens. Look contact details up in Yuyu (for example the attendee CSV) when you need them. `tests/unit/webhooks.test.ts` fails if such a field could appear.
:::

## Verifying signatures

The scheme, from `lib/webhooks/signature.ts` and `deliverClaimed` in `lib/webhooks/delivery.ts`:

- Header: `x-yuyu-signature: t=<unix seconds>,v1=<hex>`.
- `<hex>` is HMAC-SHA256 over the UTF-8 string `` `${t}.${rawBody}` ``, keyed with the **full** endpoint secret including the `whsec_` prefix (as UTF-8), hex-encoded.
- `t` is the send time of that attempt, so it changes on every retry. The body (and `id`) does not.
- The reference verifier rejects timestamps more than 300 seconds from now, in either direction.

The signer, as it runs on the server:

```ts
export function computeWebhookSignature(secret: string, timestamp: number, body: string) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
}

export function webhookSignatureHeader(secret: string, timestamp: number, body: string) {
  return `t=${timestamp},v1=${computeWebhookSignature(secret, timestamp, body)}`;
}
```

A receiver in Node and TypeScript. The verifier is a port of `verifyWebhookSignature`. The Express wiring is illustrative.

```ts
import crypto from "node:crypto";
import express from "express";

export function verifyYuyuSignature(secret: string, header: string | undefined, rawBody: string, toleranceSeconds = 300): boolean {
  const parts = Object.fromEntries(
    (header ?? "").split(",").map((part) => {
      const i = part.indexOf("=");
      return i > 0 ? [part.slice(0, i).trim(), part.slice(i + 1).trim()] : ["", ""];
    }),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!Number.isInteger(timestamp) || typeof signature !== "string" || !/^[0-9a-f]{64}$/.test(signature)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > toleranceSeconds) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

const app = express();
app.post("/yuyu-webhooks", express.raw({ type: "application/json" }), (req, res) => {
  const raw = (req.body as Buffer).toString("utf8"); // verify the raw bytes, before JSON.parse
  if (!verifyYuyuSignature(process.env.YUYU_WEBHOOK_SECRET!, req.get("x-yuyu-signature"), raw)) return res.sendStatus(400);
  const event = JSON.parse(raw) as { id: string; type: string; data: unknown };
  res.sendStatus(204); // answer within 10 seconds, then work asynchronously
  // queue(event): de-duplicate on event.id
});
```

Receiver rules:

- Verify against the raw body. Re-serialised JSON will not match.
- De-duplicate on `id` (also in `x-yuyu-event-id`). Retries and **Redeliver** reuse it.
- Deliveries can arrive out of order and, rarely, more than once. Order by `createdAt` and the resource's own timestamps.
- Reply with any `2xx` within 10 seconds.

## Delivery, retries and auto-disable

```mermaid
flowchart LR
  E["emitWebhookEvent"] --> Q[("WebhookDelivery PENDING")]
  Q -->|"claim up to 25, SKIP LOCKED"| S["SSRF re-check and pinned DNS"]
  S --> H["HTTPS POST, 10 s timeout"]
  H -->|"2xx"| OK["SUCCEEDED, reset failure counter"]
  H -->|"other"| R["PENDING with backoff"]
  R -->|"8th failure"| F["FAILED, Redeliver to retry"]
  R -->|"20 consecutive failures"| AD["Endpoint auto-disabled"]
```

| Setting | Value | Source |
| --- | --- | --- |
| Request timeout | 10 s | `WEBHOOK_TIMEOUT_MS` |
| Body cap | 256 KB | `WEBHOOK_MAX_PAYLOAD_BYTES` |
| Redirects | Not followed. A `3xx` is a failure ("Redirect not followed") | `deliverClaimed` |
| Attempts | 8 | `WEBHOOK_MAX_ATTEMPTS` |
| Backoff after attempt n | 1 min, 5 min, 30 min, 1 h, 3 h, 6 h, 12 h, each with ±20% jitter | `WEBHOOK_RETRY_DELAYS_MS`, `webhookRetryDelayMs` |
| Auto-disable | After 20 consecutive failed attempts across the endpoint. Any success resets the counter | `WEBHOOK_AUTO_DISABLE_AFTER` |
| Batch per pass | 25 rows, 5 concurrently | `BATCH_SIZE`, `CONCURRENCY` |
| Stale lease | A `PROCESSING` row locked for more than 5 minutes goes back to `PENDING` | `STALE_LEASE_MS` |
| Stored error | Short redacted summary, at most 300 characters. The response excerpt is redacted to 120 characters | `describeWebhookFailure`, `redactAlertText` |
| Retention | 30 days | `WEBHOOK_DELIVERY_RETENTION_DAYS` |

When an endpoint is auto-disabled, its queued deliveries are marked failed and nothing is emailed. The state shows in Settings. To recover, fix the receiver, use **Send test**, then **Enable** (which resets the counter) and redeliver what you need. A secret that the current `MFA_ENCRYPTION_KEY` cannot decrypt fails the delivery permanently with "Signing secret unreadable", but does not count against the endpoint. Rotate the secret to fix it.

## SSRF rules (`lib/webhooks/urlSafety.ts`)

Webhook URLs are entered by tenant admins, so Yuyu only sends to the public internet. The checks run when the URL is saved **and again before every delivery**.

- `https://` only, on port 443 or 8443 (`WEBHOOK_ALLOWED_PORTS`). URLs up to 2048 characters.
- No user name or password in the URL. A `#fragment` is dropped.
- Refused host names: `localhost`, `*.localhost`, `*.local`, `*.internal`, `*.home.arpa`, `*.localdomain` and single-label names. IP literals in any form are refused, including decimal, hex, octal, IPv6 and IPv4-mapped IPv6.
- Every resolved address must be public unicast (`isBlockedWebhookAddress`). Blocked IPv4 ranges include `0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16` (including the metadata service), `172.16/12`, `192.168/16`, the documentation and benchmarking ranges, multicast and reserved. In IPv6, anything outside `2000::/3` is blocked, along with `2001::/23`, documentation prefixes, and IPv4-mapped, NAT64 (`64:ff9b::/96`) and 6to4 (`2002::/16`) forms of a blocked IPv4 address. If **any** resolved address is blocked, the host is refused.
- The request connects only to the address that was just vetted (`pinnedLookup` on Node's `http`/`https` client). This defeats DNS rebinding. TLS still verifies the certificate against the host name.

`WEBHOOKS_ALLOW_PRIVATE_TARGETS=1` allows `http://` and private or loopback receivers on any port in development and tests (`webhookPrivateTargetsAllowed`). Credentials in the URL are still refused. A production server ignores the flag unless `CI=true` and `ALLOW_INSECURE_PRODUCTION_TESTS=1` are both set, and `npm run production:check` fails when it is set.

## Invariants

- **Emit only after commit.** Call `emitWebhookEvent` after the transaction that made the change has committed. It never throws and never blocks the caller. Emitting inside the transaction could announce a change that then rolls back.
- **One delivery per endpoint and event.** `@@unique([endpointId, eventId])` on `WebhookDelivery` makes enqueueing idempotent and gives receivers a stable id.
- **Payloads are strict DTOs.** Build `data` only through `lib/webhooks/payloads.ts`. The schemas are `.strict()`, so an extra field fails at build time rather than leaking.
- **Never log or audit the URL path, query or secret.** The URL path can itself be a credential. Errors keep only a redacted summary.
- **The secret is only stored encrypted.** AES-256-GCM, with a key derived from `MFA_ENCRYPTION_KEY` by HKDF using the label `yuyu-org-webhook-signing-secret-v1`. This keeps the ciphertext from being interchangeable with MFA seeds or instance settings.
- **Re-check the target at send time.** Saving a URL is not enough, because DNS can change.
- **Claims are leased.** Rows are claimed with `FOR UPDATE SKIP LOCKED` and finished only while the lease matches (`leaseWhere`), so replicas never send the same attempt twice.

## Making changes

To add an event type, follow [Add a webhook event](/guides/add-a-webhook-event). In outline:

1. Add the type to `WEBHOOK_EVENT_TYPES` and `WEBHOOK_EVENT_LABELS` in `lib/webhooks/eventTypes.ts`.
2. Add a strict `data` schema to `webhookDataSchemas` in `lib/webhooks/payloads.ts`, using no contact data and no tokens.
3. Extend `WebhookEmission` and the payload builder in `lib/webhooks/emit.ts`.
4. Call `emitWebhookEvent` after commit at each commit point. Current callers include `lib/rsvpCore.ts`, `lib/rsvpCapacity.ts`, `lib/teamUnits.ts`, `lib/checkInMutations.ts`, `lib/feedback.ts`, `lib/core/rsvpLifecycle.ts`, `lib/core/rsvpAdmin.ts`, `lib/core/rsvpCancel.ts`, `lib/core/crew.ts` and `app/actions/event.ts`.
5. Add privacy and shape assertions to `tests/unit/webhooks.test.ts` and an emission case to `tests/integration/webhooks.db.test.ts`. Update `docs/WEBHOOKS.md`.

## Testing

| File | Covers |
| --- | --- |
| `tests/unit/webhooks.test.ts` | Signature vector, verifier, SSRF parser and address blocking, payload privacy, backoff |
| `tests/integration/webhooks.db.test.ts` | Enqueue after commit, claim and lease, retries, auto-disable |
| `tests/e2e/webhooks.spec.ts` | Settings UI end to end |

```bash
npx vitest run tests/unit/webhooks.test.ts
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration -- tests/integration/webhooks.db.test.ts
npx playwright test tests/e2e/webhooks.spec.ts
```

## Further reading

- [docs/WEBHOOKS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/WEBHOOKS.md)
- [Background jobs](/architecture/background-jobs) covers the worker that drives delivery
- [Machine API](/api/machine-api) uses the same participant and event DTO privacy line
- [Add a webhook event](/guides/add-a-webhook-event)
- [Security checklist](/reference/security-checklist)
