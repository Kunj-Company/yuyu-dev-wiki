# Integrate with APIs and webhooks

Practical recipes for the two integration surfaces meant for your own systems: the read-only [machine API](/api/machine-api) and signed [organisation webhooks](/api/webhooks). This page shows how to call and receive them, and links to the reference pages for field lists, limits and internals instead of repeating them. Snippets assume Node 20 or newer (built-in `fetch`) and run with `npx tsx`.

All snippets use placeholder hosts and secrets. `yuyu.example` stands for your instance's `NEXT_PUBLIC_BASE_URL`.

## Choose a pattern

| You need | Pattern |
| --- | --- |
| A nightly export or a report | Poll the machine API on a schedule |
| React within seconds when someone registers or checks in | A webhook receiver |
| A mirror that is always right | Webhooks for speed, plus a periodic machine API poll to correct drift |
| Email addresses, answers or tickets | Not available over either surface. Use the dashboard CSV export |

Both surfaces are tenant-bound: whatever you build sees one organisation only.

## Machine API

### 1. Create a client and a credential

An organisation **owner** opens `/dashboard/:orgSlug/settings/api`, creates an API client with a name and scopes, and copies the first credential. It is shown once. The action also needs a recent sign-in. Credentials look like `yuyu_v1_cr<32 hex>.<43 base64url characters>`. Keep it in a secrets manager and in an environment variable, never in a URL.

Pick the smallest scope set:

| You want | Scopes |
| --- | --- |
| Event metadata only | `events:read` |
| Rosters of confirmed participants | `participants:read` |
| Roster filtered by attendance, or `checkedInAt` | `participants:read` and `participants:attendance:read` |

`participants:attendance:read` alone grants nothing. A request that filters by `attendance=checked_in` or `not_checked_in`, or asks for `include=attendance`, without the scope gets `403 INSUFFICIENT_SCOPE`.

### 2. First request with curl

```bash
export YUYU_BASE_URL="https://yuyu.example"
export YUYU_API_TOKEN="yuyu_v1_cr0123456789abcdef0123456789abcdef.<secret>"

# Newest events first, five per page
curl -sS -H "Authorization: Bearer $YUYU_API_TOKEN" \
  "$YUYU_BASE_URL/api/v1/events?limit=5"

# One event, with response headers (note Cache-Control: no-store)
curl -sS -i -H "Authorization: Bearer $YUYU_API_TOKEN" \
  "$YUYU_BASE_URL/api/v1/events/$EVENT_ID"

# Only people who have checked in, with their check-in time
curl -sS -H "Authorization: Bearer $YUYU_API_TOKEN" \
  "$YUYU_BASE_URL/api/v1/events/$EVENT_ID/participants?attendance=checked_in&include=attendance&limit=100"
```

Walk every page of a roster in shell. The cursor is opaque and URL-safe, so pass it back unchanged:

```bash
cursor=""
while :; do
  page=$(curl -sS -H "Authorization: Bearer $YUYU_API_TOKEN" \
    "$YUYU_BASE_URL/api/v1/events/$EVENT_ID/participants?limit=100${cursor:+&cursor=$cursor}")
  echo "$page" | jq -c '.data[]'
  cursor=$(echo "$page" | jq -r '.pagination.nextCursor // empty')
  [ -z "$cursor" ] && break
done
```

### 3. A typed client in TypeScript

Types follow `eventDtoSchema` and `participantDtoSchema` in `lib/api/v1/schemas.ts`, as listed in [Machine API](/api/machine-api#response-examples). The client retries `429` after the `Retry-After` header and retries server errors with backoff. It never retries `4xx` other than `429`, because those will not change.

```ts
// yuyu-client.ts
const BASE_URL = process.env.YUYU_BASE_URL ?? "https://yuyu.example";
const TOKEN = process.env.YUYU_API_TOKEN ?? "";

export type YuyuEvent = {
  id: string; title: string; slug: string; description: string; tags: string[];
  coverImageUrl: string | null; startDateTime: string; endDateTime: string; timezone: string;
  location: string; mapLinkUrl: string | null; isOnline: boolean; capacity: number | null;
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "CANCELLED";
  privacyType: "PUBLIC" | "HIDDEN_LINK" | "APPROVAL_REQUIRED" | "INVITE_ONLY";
  createdAt: string;
};
export type YuyuParticipant = {
  id: string; displayName: string; registeredAt: string; checkedInAt?: string | null;
};
type Page<T> = { data: T[]; pagination: { nextCursor: string | null } };

export class YuyuApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(`${status} ${code}: ${message}`);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`/api/v1${path}`, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } });
    if (res.ok) return (await res.json()) as T;
    const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < 3) {
      const wait = res.status === 429 ? Number(res.headers.get("retry-after") ?? 60) * 1000 : 1000 * 2 ** attempt;
      await sleep(wait);
      continue;
    }
    throw new YuyuApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message ?? res.statusText);
  }
}

async function* paginate<T>(path: string, params: Record<string, string | number | undefined> = {}): AsyncGenerator<T> {
  let cursor: string | null = null;
  do {
    const page: Page<T> = await request<Page<T>>(path, { ...params, limit: 100, cursor: cursor ?? undefined });
    yield* page.data;
    cursor = page.pagination.nextCursor;
  } while (cursor);
}

export const listEvents = () => paginate<YuyuEvent>("/events");
export const getEvent = (id: string) => request<{ data: YuyuEvent }>(`/events/${encodeURIComponent(id)}`).then((r) => r.data);
export const listParticipants = (eventId: string, opts: { attendance?: "all" | "checked_in" | "not_checked_in"; includeAttendance?: boolean } = {}) =>
  paginate<YuyuParticipant>(`/events/${encodeURIComponent(eventId)}/participants`, {
    attendance: opts.attendance,
    include: opts.includeAttendance ? "attendance" : undefined,
  });

// Run directly: YUYU_API_TOKEN=... npx tsx yuyu-client.ts
async function main() {
  for await (const event of listEvents()) {
    if (event.status !== "PUBLISHED") continue;
    let confirmed = 0;
    let checkedIn = 0;
    for await (const person of listParticipants(event.id, { includeAttendance: true })) {
      confirmed++;
      if (person.checkedInAt) checkedIn++;
    }
    console.log(`${event.title}: ${checkedIn} of ${confirmed} checked in`);
  }
}

if (process.argv[1]?.endsWith("yuyu-client.ts")) {
  main().catch((error) => { console.error(error); process.exit(1); });
}
```

The `include=attendance` call needs both participant scopes. Drop `includeAttendance` if your client only has `participants:read`.

### Limits and behaviours to design for

| Topic | What the source says |
| --- | --- |
| Authentication errors | Missing, malformed, unknown, expired, revoked and disabled credentials all return the same `401 INVALID_CREDENTIAL`. You cannot tell them apart, so check expiry and revocation in the dashboard |
| Scope errors | `403 INSUFFICIENT_SCOPE`. Add the scope to the client. A credential does not need replacing when scopes change, because scopes belong to the client |
| Not found | A missing event and another organisation's event both return `404 RESOURCE_NOT_FOUND` |
| Strict queries | Unknown query parameters, including a caller-supplied organisation id, return `400 INVALID_REQUEST`. Send only `limit`, `cursor`, `attendance` and `include` |
| Page size | `limit` 1 to 100, default 50 |
| Rate limit | 300 requests per minute per IP at the proxy, and 600 per minute per API client, keyed by the client, so extra credentials on one client do not add capacity. A `429` carries `Retry-After: 60`. There are no `X-RateLimit-*` headers |
| Caching | Every response is `Cache-Control: no-store`. Cache on your side if you poll often |
| Idempotency | The API is read-only, so every request is safe to repeat. There is no `Idempotency-Key` header because there is nothing to deduplicate |
| Ordering | Newest created first, by `(createdAt desc, id desc)`. New registrations during a walk can appear on a page you already read, so deduplicate on `id` when you merge pages |

### Rotating a credential

1. In **Settings → API access**, create a second credential on the same client.
2. Deploy it to your consumer and confirm it works.
3. Revoke the old credential.

Disabling the client rejects every credential of that client at once. Rotation, scope changes and client changes are audited, but individual reads are not. See [Machine API](/api/machine-api#rotation).

## Webhooks

### 1. Register an endpoint

An organisation owner or admin opens **Settings → Webhooks** (`/dashboard/:orgSlug/settings/webhooks`), adds a URL, picks event types and copies the `whsec_` signing secret, shown once. Use **Send test** to deliver a `ping` immediately and see your receiver's response.

Receiver requirements from the source:

- `https://` on port 443 or 8443 only, with a public host name. No credentials in the URL, no IP literals, no `localhost`, `.local` or `.internal`. Redirects are not followed, so a `3xx` is a failure.
- Reply with a `2xx` within **10 seconds**. Do slow work after you respond.
- Expect at most 256 KB per body, retries up to 8 attempts over about a day, and a switch-off after 20 consecutive failed attempts. Return `2xx` for event types you do not handle, because other statuses count as failures against the endpoint.
- Plan for duplicates and out-of-order delivery. The envelope `id` is stable across retries and **Redeliver**.

For local development, set `WEBHOOKS_ALLOW_PRIVATE_TARGETS=1` on your **development** Yuyu to allow `http://` and loopback receivers on any port. A production server ignores it, and `npm run production:check` fails if it is set. Never set it on a deployed instance. Otherwise expose your receiver through an HTTPS tunnel on 443.

### 2. A receiver with signature verification

The signature is `t=<unix seconds>,v1=<hex>`, an HMAC-SHA256 of `<t>.<raw body>` keyed with the full secret including `whsec_`. Verify the **raw** bytes before parsing JSON, compare in constant time, and reject old timestamps. This receiver uses only Node's standard library.

```ts
// receiver.ts: YUYU_WEBHOOK_SECRET=whsec_... npx tsx receiver.ts
import crypto from "node:crypto";
import http from "node:http";

const SECRET = process.env.YUYU_WEBHOOK_SECRET ?? "";
const MAX_BODY = 256 * 1024; // Yuyu caps request bodies at 256 KB

type Envelope = {
  id: string;
  type: string;
  createdAt: string;
  organisation: { id: string; slug: string };
  data: Record<string, unknown>;
};

export function verifyYuyuSignature(secret: string, header: string | undefined, rawBody: Buffer, toleranceSeconds = 300): boolean {
  const parts = Object.fromEntries(
    String(header ?? "").split(",").map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
    }),
  );
  const timestamp = Number(parts.t);
  if (!Number.isInteger(timestamp) || !/^[0-9a-f]{64}$/.test(parts.v1 ?? "")) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(parts.v1, "hex"));
}

// In memory for the example. In production use a unique key in your database.
const seen = new Set<string>();

function handle(event: Envelope) {
  switch (event.type) {
    case "registration.created":
    case "registration.status_changed":
    case "checkin.created":
      console.log(event.type, event.organisation.slug, JSON.stringify(event.data));
      break;
    default:
      console.log("ignored", event.type); // still answer 2xx
  }
}

http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/yuyu-webhooks") return void res.writeHead(404).end();
  const chunks: Buffer[] = [];
  let size = 0;
  req.on("data", (chunk: Buffer) => {
    size += chunk.length;
    if (size > MAX_BODY) { res.writeHead(413).end(); req.destroy(); return; }
    chunks.push(chunk);
  });
  req.on("end", () => {
    const raw = Buffer.concat(chunks);
    if (!verifyYuyuSignature(SECRET, req.headers["x-yuyu-signature"] as string | undefined, raw)) {
      return void res.writeHead(400).end();
    }
    const event = JSON.parse(raw.toString("utf8")) as Envelope;
    res.writeHead(204).end(); // acknowledge first, then work
    if (seen.has(event.id)) return;
    seen.add(event.id);
    handle(event);
  });
}).listen(3000, () => console.log("listening on :3000/yuyu-webhooks"));
```

`lib/webhooks/signature.ts` holds Yuyu's own verifier, tested against a fixed vector in `tests/unit/webhooks.test.ts`. The JavaScript version in `docs/WEBHOOKS.md` is equivalent.

### 3. Test the receiver without Yuyu

This script signs a payload the way Yuyu does and posts it to your local receiver. The envelope and header names are from `docs/WEBHOOKS.md`. The data is a made-up example that follows the documented `registration.created` shape.

```ts
// send-test.ts: YUYU_WEBHOOK_SECRET=whsec_... npx tsx send-test.ts
import crypto from "node:crypto";

const secret = process.env.YUYU_WEBHOOK_SECRET ?? "whsec_test";
const id = `evt_${crypto.randomBytes(16).toString("hex")}`;
const body = JSON.stringify({
  id,
  type: "registration.created",
  createdAt: new Date().toISOString(),
  organisation: { id: "cmorg123", slug: "acme" },
  data: {
    event: { kind: "event", id: "cmevent123", occurrenceId: null, title: "Community Meetup", slug: "community-meetup",
             startDateTime: "2030-01-01T17:00:00.000Z", endDateTime: "2030-01-01T19:00:00.000Z", timezone: "Europe/London" },
    registration: { id: "cmrsvp123", status: "CONFIRMED", displayName: "Ada Lovelace", registeredAt: "2030-01-01T10:00:00.000Z", checkedInAt: null },
  },
});
const t = Math.floor(Date.now() / 1000);
const v1 = crypto.createHmac("sha256", secret).update(`${t}.${body}`, "utf8").digest("hex");

fetch("http://localhost:3000/yuyu-webhooks", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "user-agent": "Yuyu-Webhooks/1",
    "x-yuyu-event-id": id,
    "x-yuyu-event-type": "registration.created",
    "x-yuyu-signature": `t=${t},v1=${v1}`,
  },
  body,
}).then((res) => console.log(res.status)); // 204
```

Run it twice with the same `id` by hand to confirm your de-duplication, and change one character of the body after signing to confirm you reject it.

### Payloads and event types

The seven types (`registration.created`, `registration.status_changed`, `checkin.created`, `checkin.undone`, `event.published`, `event.cancelled`, `feedback.submitted`) and the `ping` test, with every `data` shape, are in [Webhooks](/api/webhooks). Points that matter when you integrate:

- Payloads never carry email addresses, user ids, answers or ticket links. `registration.id` is the registration (RSVP) id. It is the same value as the machine API participant `id`, so you can join the two.
- The machine API returns only confirmed registrations on standalone events. Webhooks cover more: any registration status, and series occurrences (`event.kind` of `series_occurrence`).
- Event types and payloads are fixed. You cannot filter by event or add fields. To add a type, see [Add a webhook event](/guides/add-a-webhook-event).

## Keeping both in step

A webhook receiver can miss events: it can be down for longer than the retry window, or the endpoint can be switched off after 20 consecutive failures (the dashboard shows **Auto-disabled**, and nothing is emailed). A robust mirror therefore:

1. Applies webhook events as they arrive, deduplicating on the envelope `id`.
2. Runs a scheduled walk of `GET /api/v1/events/:eventId/participants` for events that matter, and corrects differences. Use `include=attendance` if you track check-ins.
3. Monitors endpoint health in **Settings → Webhooks**, and after fixing the receiver uses **Send test**, **Enable** and **Redeliver**.

## Further reading

- [Machine API](/api/machine-api) and [Webhooks](/api/webhooks)
- [Extend the APIs](/guides/extend-the-apis) and [Add a webhook event](/guides/add-a-webhook-event)
- [Ways to build on Yuyu](/build/overview)
- [docs/API.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/API.md)
- [docs/WEBHOOKS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/WEBHOOKS.md)
