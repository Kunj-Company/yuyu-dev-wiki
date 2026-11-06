# Machine API

`/api/v1` is Yuyu's tenant-bound, machine-to-machine REST API. Every API client belongs to exactly one organisation, holds explicit scopes, and authenticates with a bearer credential. The current contract is read-only: standalone events and a minimal confirmed-participant roster. It is an application contract with explicit DTOs, not a generic database API. For user-authenticated access (the mobile apps), see [Mobile API](/api/mobile-api). For push notifications, see [Webhooks](/api/webhooks).

## Key files

| Path | Role |
| --- | --- |
| `app/api/v1/events/route.ts` | `GET /api/v1/events` |
| `app/api/v1/events/[eventId]/route.ts` | `GET /api/v1/events/:eventId` |
| `app/api/v1/events/[eventId]/participants/route.ts` | `GET /api/v1/events/:eventId/participants` |
| `lib/api/v1/handler.ts` | `handleMachineApiRequest`: authenticate, check scope, rate limit, then run the operation |
| `lib/api/v1/credentialSecret.ts` | Token format, generation, parsing, SHA-256 digest |
| `lib/api/v1/credentials.ts` | `authenticateApiCredential`, throttled `touchApiCredential` |
| `lib/api/v1/scopes.ts` | `API_SCOPES` |
| `lib/api/v1/schemas.ts` | Strict query schemas and response DTOs |
| `lib/api/v1/events.ts` | Tenant-scoped queries and keyset pagination |
| `lib/api/v1/pagination.ts` | Opaque cursor encode and decode |
| `lib/api/v1/errors.ts` | `apiError` and the error codes |
| `lib/apiMonitor.ts` | `withApiMonitoring`, which turns an unhandled exception on `/api/v1/` into `INTERNAL_ERROR` |
| `app/actions/api-clients.ts` | Owner-only Server Actions for clients, scopes and credentials |

## Base URL and conventions

- Base URL: the instance origin plus `/api/v1`, for example `https://yuyu.example/api/v1`.
- JSON responses. Every response, including errors, carries `Cache-Control: no-store`.
- Timestamps are ISO-8601 UTC strings. Event times come with an IANA `timezone`.
- Unknown query parameters are rejected with `400 INVALID_REQUEST`, because the query schemas are `.strict()`. This also means a caller-supplied organisation id is refused, not ignored.

## Authentication

### Getting a credential

1. An organisation **owner** opens `/dashboard/:orgSlug/settings/api`. The Server Actions use `canManageMembers` and also require a recent sign-in (`hasRecentAuthentication`).
2. Create a client with a name, scopes and a first credential (optionally with an expiry in the future). The raw token is shown **once**.
3. Only the SHA-256 digest of the secret part is stored (`ApiCredential.secretHash`).

Token format (`lib/api/v1/credentialSecret.ts`):

```text
yuyu_v1_<credentialId>.<secret>
```

`credentialId` is `cr` followed by 32 hex characters. `secret` is 32 random bytes in base64url (43 characters). The parser accepts only `/^yuyu_v1_([a-z0-9]+)\.([A-Za-z0-9_-]{43})$/`.

### Header

```http
GET /api/v1/events HTTP/1.1
Host: yuyu.example
Authorization: Bearer yuyu_v1_cr0123456789abcdef0123456789abcdef.<43-character secret>
```

The scheme name is case-insensitive. Invalid, unknown, expired, revoked and disabled credentials all get the same `401 INVALID_CREDENTIAL` with `WWW-Authenticate: Bearer realm="Yuyu API"`.

### Rotation

Rotation needs no downtime. Create a second credential on the same client, deploy it to the consumer, verify it, then revoke the old one. Disabling the client (`ApiClientStatus.DISABLED`) rejects all of its credentials immediately. Store credentials in a secrets manager, never in URLs, source control, logs or analytics.

Client creation, scope changes, credential creation and revocation, and enable or disable are audited (`API_CLIENT_CREATED`, `API_CLIENT_SCOPES_CHANGED`, `API_CREDENTIAL_CREATED`, `API_CREDENTIAL_REVOKED`, `API_CLIENT_DISABLED`, `API_CLIENT_ENABLED`), without secrets. Individual reads are not audited. They update `lastUsedAt` at most once an hour.

## Scopes

| Scope | Grants |
| --- | --- |
| `events:read` | Standalone event metadata for the client's organisation, in every status (draft, published, hidden, cancelled) |
| `participants:read` | The minimal confirmed-participant roster of one of the organisation's events |
| `participants:attendance:read` | Together with `participants:read`: `attendance=checked_in` or `not_checked_in`, and `include=attendance` (adds `checkedInAt`) |

`participants:attendance:read` does not grant roster access by itself. Filtering by attendance discloses who has checked in, so it needs the scope even when no timestamp is returned (`requestsParticipantAttendance`).

## Endpoints

Built from `app/api/v1/**/route.ts`. All are `GET`.

| Method | Path | Scope | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/events?limit=&cursor=` | `events:read` | List the organisation's standalone events, newest created first |
| `GET` | `/api/v1/events/:eventId` | `events:read` | Read one event. Missing and cross-organisation ids get the same `404` |
| `GET` | `/api/v1/events/:eventId/participants?limit=&cursor=&attendance=&include=` | `participants:read` (plus `participants:attendance:read` for attendance) | List confirmed participants, newest first |

Participants query parameters (`participantCollectionQuerySchema`):

| Parameter | Values | Default |
| --- | --- | --- |
| `limit` | 1 to 100 | 50 |
| `cursor` | Opaque string from `pagination.nextCursor`, up to 1024 characters | none |
| `attendance` | `all`, `checked_in`, `not_checked_in` | `all` |
| `include` | `attendance` | none |

Only `CONFIRMED` RSVPs on standalone events are returned. Crew tickets are confirmed registrations, so they appear. Team membership is not exposed.

### Response examples

Field lists are derived from `eventDtoSchema` and `participantDtoSchema` in `lib/api/v1/schemas.ts`. The values are illustrative.

`GET /api/v1/events/:eventId`:

```json
{
  "data": {
    "id": "cmevent123",
    "title": "Community Meetup",
    "slug": "community-meetup",
    "description": "",
    "tags": ["meetup"],
    "coverImageUrl": null,
    "startDateTime": "2030-01-01T17:00:00.000Z",
    "endDateTime": "2030-01-01T19:00:00.000Z",
    "timezone": "Europe/London",
    "location": "Town Hall",
    "mapLinkUrl": null,
    "isOnline": false,
    "capacity": 120,
    "status": "PUBLISHED",
    "privacyType": "PUBLIC",
    "createdAt": "2029-12-01T09:00:00.000Z"
  }
}
```

`status` is `DRAFT`, `PUBLISHED`, `HIDDEN` or `CANCELLED`. `privacyType` is `PUBLIC`, `HIDDEN_LINK`, `APPROVAL_REQUIRED` or `INVITE_ONLY`. `GET /api/v1/events` returns `{ "data": [Event], "pagination": { "nextCursor": "…" | null } }`.

`GET /api/v1/events/:eventId/participants?include=attendance` (from `docs/API.md`):

```json
{
  "data": [
    {
      "id": "example-rsvp-id",
      "displayName": "Participant name",
      "registeredAt": "2030-01-01T10:00:00.000Z",
      "checkedInAt": "2030-01-01T10:15:00.000Z"
    }
  ],
  "pagination": { "nextCursor": null }
}
```

`checkedInAt` is present only with `include=attendance`. `displayName` is the account name, else the guest name, else `Participant`. Participant data never includes email, user ids, registration answers, invitation data, feedback linkage, or ticket, check-in or certificate tokens.

## Pagination

Collections use opaque keyset cursors over `(createdAt desc, id desc)`. Send `nextCursor` back unchanged as `cursor`. `null` means the collection is complete. A malformed cursor is `400 INVALID_REQUEST`. Internally the cursor is base64url JSON `{ v: 1, timestamp, id }`. Do not build or parse it in clients, because the format may change.

## Errors

Every error has one shape:

```json
{ "error": { "code": "RESOURCE_NOT_FOUND", "message": "The requested resource was not found." } }
```

| Code | Status | When |
| --- | --- | --- |
| `INVALID_REQUEST` | 400 | Bad or unknown query parameter, bad id, malformed cursor |
| `INVALID_CREDENTIAL` | 401 | Missing, malformed, unknown, expired, revoked or disabled credential |
| `INSUFFICIENT_SCOPE` | 403 | The client lacks the route's scope, or the attendance scope |
| `RESOURCE_NOT_FOUND` | 404 | Unknown id, or an id belonging to another organisation |
| `RATE_LIMITED` | 429 | With `Retry-After: 60` |
| `INTERNAL_ERROR` | 500 | Unhandled exception (`withApiMonitoring`) |

## Rate limits

| Layer | Limit | Key |
| --- | --- | --- |
| Proxy `global` bucket (`proxy.ts`) | 300 requests per minute | Client IP. Returns the `/api/v1` error shape |
| `apiRead` bucket (`handleMachineApiRequest`) | 600 requests per minute | A hash of the **API client** id, so extra credentials on one client do not multiply capacity |

The limiter is Redis-backed. In production it fails closed when Redis is unavailable.

## Invariants

- **The organisation comes from the credential only.** Every query includes `organisationId` from `ApiAuthContext` in its `where` clause (`findEventRecord`, `listApiParticipants`). Cross-tenant ids return the same `404` as missing ids.
- **Explicit selects and strict DTOs.** Prisma rows are never serialised directly. Every response passes through a `.strict()` Zod schema, so an accidental field fails loudly (`tests/unit/api-contracts.test.ts`).
- **Credentials are stored as digests and compared in constant time** (`crypto.timingSafeEqual` in `authenticateApiCredential`).
- **Usage tracking must not affect authentication.** `touchApiCredential` runs in `after()`, and its errors are swallowed.
- **Attendance is disclosure.** Any attendance filter or field requires `participants:attendance:read`.
- **Operational endpoints are separate.** `/api/health/db` and `/api/internal/outbox` use their own bearer secrets, not API credentials.

Out of scope for v1: recurring series and occurrences, the RSVP workflow, contact data, registration answers, feedback, and any writes.

## Making changes

To add an endpoint, follow [Extend the APIs](/guides/extend-the-apis). In outline:

1. If the endpoint needs a new capability, add a scope to `API_SCOPES` in `lib/api/v1/scopes.ts`. The settings UI and `apiScopeSchema` pick it up.
2. Add a strict query schema and response DTO to `lib/api/v1/schemas.ts`.
3. Add a tenant-scoped query with an explicit `select` to `lib/api/v1/events.ts` (or a sibling module).
4. Create `app/api/v1/.../route.ts`. Wrap it in `withApiMonitoring("<METHOD> /api/v1/...", ...)` and `handleMachineApiRequest(request, "<scope>", ...)`, and return `NextResponse.json(..., { headers: { "Cache-Control": "no-store" } })`.
5. Add DTO tests to `tests/unit/api-contracts.test.ts`, a tenant-isolation case to `tests/integration/api-v1.db.test.ts`, and update `docs/API.md`.

## Testing

| File | Covers |
| --- | --- |
| `tests/unit/api-handler.test.ts` | Generic 401, exact scope checks, client-derived rate subject across rotation |
| `tests/unit/api-credentials.test.ts` | Token generation and authentication |
| `tests/unit/api-contracts.test.ts` | Cursors, strict DTOs, rejected organisation ids, attendance rules |
| `tests/unit/api-client-actions.test.ts` | Owner-only Server Actions |
| `tests/integration/api-v1.db.test.ts` | Tenant isolation, pagination, confirmed-only roster, digests, rotation, revocation and expiry |
| `tests/e2e/api-v1.spec.ts` | End to end against a running server |

```bash
npx vitest run tests/unit/api-handler.test.ts tests/unit/api-credentials.test.ts tests/unit/api-contracts.test.ts
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration -- tests/integration/api-v1.db.test.ts
```

## Further reading

- [docs/API.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/API.md)
- [docs/SECURITY.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/SECURITY.md)
- [Permissions](/architecture/permissions)
- [Webhooks](/api/webhooks)
- [Extend the APIs](/guides/extend-the-apis)
