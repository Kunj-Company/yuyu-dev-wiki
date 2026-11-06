# Mobile API

`/api/mobile/v1` is the user-authenticated REST API behind the Yuyu Android and iOS apps. Callers are ordinary Yuyu users, not machine clients. Their permissions are resolved exactly as on the website, and every mutation calls the same `lib/core/*` function as the matching Server Action, so tenancy, role checks, capacity transactions, rate limits, emails, webhooks and audit behave identically. The contract is pinned by an OpenAPI 3.1 spec, JSON fixtures and a contract test that fails on any drift.

## Key files

| Path | Role |
| --- | --- |
| `app/api/mobile/v1/**/route.ts` | Route handlers, one per path |
| `app/api/mobile/v1/[...path]/route.ts` | Catch-all returning the JSON `NOT_FOUND` envelope for unknown paths |
| `lib/mobile/route.ts` | `mobileRoute` (public or optional auth) and `authedMobileRoute` (bearer required, per-user limit) |
| `lib/mobile/eventRoute.ts` | `eventRoute`: an authed route scoped to one visible event, with an optional permission predicate |
| `lib/mobile/judging.ts` | `judgingRoute` for judge-only routes |
| `lib/mobile/http.ts` | Envelope (`mobileOk`, `mobileError`), error codes and statuses, `classifyActionError` |
| `lib/mobile/schemas.ts` | Strict Zod response schemas |
| `lib/mobile/dto.ts` | DTO builders and envelope schemas used by the contract test |
| `lib/mobile/tokens.ts` | Token prefixes, TTLs, hashing, shape checks |
| `lib/mobileAuth.ts` | `issueMobileSession`, `refreshMobileSession`, `requireMobileUser`, `optionalMobileUser`, `revokeMobileSession` |
| `lib/mobile/organiser.ts` | `resolveEventContext` and `EventPermissions` |
| `docs/mobile-api.openapi.yaml` | OpenAPI 3.1 contract |
| `docs/mobile-api-fixtures/*.json` | Example responses, validated by the contract test |
| `tests/unit/mobile-api-contract.test.ts` | Spec, fixtures, Zod schemas and routes must agree |

## Base URL and conventions

- Base URL: the instance origin (`NEXT_PUBLIC_BASE_URL`) plus `/api/mobile/v1`. The OpenAPI `servers` entry uses `{baseUrl}`, defaulting to `https://yuyu.example`.
- JSON in and out. Every response carries `Cache-Control: no-store`.
- Success envelope: `{ "ok": true, "data": ... }`.
- Failure envelope: `{ "ok": false, "error": { "code", "message", "fieldErrors"? } }`. `message` is the website's UI-safe text, so apps can show it as is.
- Timestamps are ISO-8601 UTC. Event times include an IANA `timezone`.
- Image and link URLs are absolute. Uploaded images are public derivatives served from `/api/uploads/...`.
- Never log or persist access tokens, refresh tokens, ticket tokens or station PINs.

## Authentication

| Token | Prefix | Lifetime | Notes |
| --- | --- | --- | --- |
| Access | `yma_` + 43 base64url characters | 15 minutes (`ACCESS_TOKEN_TTL_MS`) | Sent as `Authorization: Bearer yma_…` |
| Refresh | `ymr_` + 43 base64url characters | 60 days (`REFRESH_TOKEN_TTL_MS`) | Rotates on every refresh |

Sessions are `MobileSession` rows that store only SHA-256 digests of the tokens. Each session is bound to the user's `sessionVersion`. A password change or reset, enabling or disabling MFA, or "sign out everywhere" bumps it, which invalidates mobile and web sessions together.

```mermaid
sequenceDiagram
  participant App
  participant API as /api/mobile/v1
  participant DB as MobileSession
  App->>API: POST /auth/login with email, password, optional totp
  API->>DB: store digests and sessionVersion
  API-->>App: Session with yma_ and ymr_ tokens
  App->>API: Bearer yma_ on each request
  API-->>App: 401 UNAUTHENTICATED once expired
  App->>API: POST /auth/refresh with ymr_
  API->>DB: rotate both tokens
  API-->>App: new Session
```

Refresh reuse: if a refresh succeeded but the response was lost, retrying with the previous refresh token within 30 seconds (`REFRESH_REUSE_GRACE_MS`) gets a plain `UNAUTHENTICATED` without revoking anything. Presenting a rotated-away refresh token after that window revokes the whole session and is audited as `MOBILE_REFRESH_TOKEN_REUSED`. Client rule: on `401`, refresh once, then sign out.

Sign-in sources:

- `POST /auth/login` uses the same credential verifier as web sign-in (`lib/credentialsAuth.ts`). `totp` accepts an authenticator code or a recovery code. A bad credential or malformed body gets `INVALID_REQUEST` with "Email or password is incorrect.". `MFA_REQUIRED` is returned only after a correct password.
- `POST /auth/google` takes `{ idToken }`. The token's signature is checked against Google's JWKS, along with the issuer, expiry, an `aud` that is the web client id or one of `GOOGLE_MOBILE_CLIENT_IDS` (with an `azp` check), and `email_verified`.

Session fixture (`docs/mobile-api-fixtures/session.json`):

```json
{
  "ok": true,
  "data": {
    "accessToken": "yma_EXAMPLEaccessTokenEXAMPLEaccessTokenEXAMPL",
    "accessTokenExpiresAt": "2030-05-01T09:15:00.000Z",
    "refreshToken": "ymr_EXAMPLErefreshTokenEXAMPLErefreshTokenEXAM",
    "refreshTokenExpiresAt": "2030-06-30T09:00:00.000Z",
    "user": {
      "id": "cluser0000000000000000001",
      "name": "Ada Organiser",
      "email": "ada@example.test",
      "imageUrl": "https://yuyu.example/api/uploads/users/cluser0000000000000000001/profile-images/avatar.webp",
      "emailVerified": true,
      "mfaEnabled": false
    }
  }
}
```

## Endpoints

Paths are relative to `/api/mobile/v1`. `…` stands for `/orgs/:orgSlug/events/:eventId`. "Auth" means `authedMobileRoute`. "Optional" means a valid bearer identifies the attendee, while an invalid one is `401`. Permission names refer to `EventPermissions`. Every mutation is re-checked by the shared core.

### Auth and me

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | none | Email, password and optional TOTP, returns a `Session` |
| `POST` | `/auth/google` | none | Google ID token, returns a `Session` |
| `POST` | `/auth/refresh` | none | Rotate tokens, returns a `Session` |
| `POST` | `/auth/logout` | Auth | Revoke this session |
| `POST` | `/auth/logout-all` | Auth | Bump `sessionVersion`, signing out all web and mobile sessions |
| `GET` | `/auth/config` | none | Instance name, Google config, sign-up enabled, base URL |
| `GET` | `/me` | Auth | User, organisations, collaborations, judging events |
| `PATCH` | `/me` | Auth | Update the display name |
| `GET` | `/me/registrations` | Auth | Upcoming, past and certificates (first 50 of each) |
| `GET` | `/me/registrations/:rsvpId/team` | Auth | The caller's team for one of their own RSVPs |
| `POST` | `/me/registrations/:rsvpId/cancel` | Auth | Cancel one of the caller's own RSVPs |

### Public

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/public/discover?cursor=&limit=` | none | Listed upcoming events, `limit` 1 to 50 (default 20) |
| `GET` | `/public/search?q=` | none | Same predicate and 48-result cap as `GET /api/search` |
| `GET` | `/public/short/:code` | none | Resolve a short link to `{ orgSlug, eventSlug }` |
| `GET` | `/public/events/:orgSlug/:eventSlug` | Optional | Public event, registration form, programme, speakers |
| `GET` | `/public/events/:orgSlug/:eventSlug/feedback` | none | Open feedback form definition |
| `POST` | `/rsvp` | Optional | Register (same service and limits as `POST /api/rsvp`). Always solo on team events |

### Organiser

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| `GET` | `/orgs/:orgSlug/events?filter=upcoming\|past\|all` | Member or collaborator | Events with `counts` and `myPermissions` (up to 200) |
| `GET` | `…` | Visible event | Event detail, counts, permissions |
| `GET` | `…/guests` | `manageRegistrations` or `checkIn` | Paged guest list (`limit` 1 to 100, default 50) |
| `POST` | `…/guests` | Registration managers (core) | Add a guest manually, returns `201` |
| `GET` | `…/guests/:rsvpId` | `manageRegistrations` or `checkIn` | Guest with answers |
| `DELETE` | `…/guests/:rsvpId` | Registration managers (core) | Remove, returns `{ undoId }` (five-minute undo) |
| `POST` | `…/guests/restore` | Registration managers (core) | Undo a removal |
| `POST` | `…/guests/:rsvpId/approve`, `/reject`, `/promote`, `/reaccept` | Registration managers (core) | Status changes. A team member is refused with `TEAM_MEMBER` |
| `GET` | `…/teams` | `canManageRegistrationsFor` | Paged teams with counts |
| `POST` | `…/teams/:teamId/approve`, `/reject`, `/promote` | `canManageRegistrationsFor` | Whole-team status change |
| `POST` | `…/check-in/preview` | `CHECK_IN` (core) | Look up a ticket or RSVP without committing |
| `POST` | `…/check-in` | `CHECK_IN` (core) | Check in by `rawInput` or `rsvpId`. `NEEDS_FORCE` allows an override |
| `POST` | `…/check-in/undo` | `CHECK_IN` (core) | Undo a check-in |
| `GET` | `…/check-in/lookup?q=` | `CHECK_IN` (core) | Name, email or team search (up to 12 rows) |
| `GET` | `…/check-in/stats` | `checkIn` | Confirmed, checked in, ten most recent |
| `GET` | `…/check-in/roster` | `CHECK_IN` (core) | Offline roster including ticket tokens |
| `POST` | `…/check-in/sync` | `CHECK_IN` (core) | Upload 1 to 500 offline check-ins |
| `GET` | `…/broadcasts/meta` | `sendEmails` | Templates, designs, placeholders, last 20 sends |
| `POST` | `…/broadcasts/count`, `/preview`, `/test` | Admin (core) | Audience count, rendered preview, test to own inbox |
| `POST` | `…/broadcasts` | Admin (core) | Queue a broadcast, returns `201` |
| `GET` | `…/schedule` | Any organiser of the event | Programme with delays and effective times |
| `POST` | `…/schedule/sessions/:sessionId/delay` | `PUBLISH_AND_SCHEDULE` or admin | Set a delay of 0 to 1440 minutes |
| `POST` | `…/feedback/state` | Admin (core) | Open or close the feedback form |
| `POST` | `…/registration/state` | Admin (core) | Close or reopen sign-ups |

"Registration managers (core)" means the shared RSVP cores decide, using `canManageRegistrationsFor` (organisation owner or admin, or the event's `MANAGE_REGISTRATIONS` grant). The `manageRegistrations` flag returned to the app stays admin-only in this contract version, so the app hides those controls from grant holders. "Admin (core)" means the core requires an organisation owner or admin.

### Judging

All judging routes use `judgingRoute` (`resolveJudgeContext`: organisation owner or admin, or the event's `JUDGE` grant). An event without submissions switched on is `NOT_FOUND`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `…/judging/submissions?filter=&q=&cursor=` | Projects this judge may score, 25 per page |
| `GET` | `…/judging/next` | Server-picked next project |
| `GET` | `…/judging/criteria` | Rubric and judging status |
| `GET` | `…/judging/submissions/:submissionId` | Detail with the caller's own scores only |
| `PUT` | `…/judging/submissions/:submissionId/scores` | Save draft scores and comment |
| `POST` | `…/judging/submissions/:submissionId/review` | Submit the review |

These existing web endpoints are reused unchanged and keep their own response formats: `GET /api/ticket/:token/status`, `GET /api/ticket/:token/events` (SSE), `POST /api/feedback`, `GET /api/feedback/certificate/:token` and `POST /api/check-in/station`.

### Example: guest list

`GET …/guests` (`docs/mobile-api-fixtures/guests.json`):

```json
{
  "ok": true,
  "data": {
    "guests": [
      { "rsvpId": "clrsvp000000000000000011", "displayName": "Grace Guest", "email": "grace@example.test", "status": "CONFIRMED", "checkedInAt": "2030-05-10T17:04:00.000Z", "registeredAt": "2030-04-10T10:00:00.000Z", "isGuest": true, "teamName": "Byte Club" },
      { "rsvpId": "clrsvp000000000000000012", "displayName": "Linus Member", "email": "linus@example.test", "status": "PENDING_APPROVAL", "checkedInAt": null, "registeredAt": "2030-04-09T10:00:00.000Z", "isGuest": false }
    ],
    "nextCursor": "eyJ2IjoxLCJ0aW1lc3RhbXAiOiIyMDMwLTA0LTA5VDEwOjAwOjAwLjAwMFoiLCJpZCI6ImNscnN2cDAwMDAwMDAwMDAwMDAwMDEyIn0"
  }
}
```

### Example: check-in

```http
POST /api/mobile/v1/orgs/acme/events/clevent0001/check-in HTTP/1.1
Authorization: Bearer yma_…
Content-Type: application/json

{ "rawInput": "<QR payload, ticket URL or typed code>", "force": false }
```

The body must contain exactly one of `rawInput` and `rsvpId`. Check-in by `rawInput` is recorded with source `mobile-scan`, and by `rsvpId` with `mobile-manual`. Both commit through `commitCheckInProjection`, so the live ticket updates exactly as for web check-ins. The preview response (`check-in-preview.json`) shows the override gate:

```json
{
  "ok": true,
  "data": {
    "rsvpId": "clrsvp000000000000000013",
    "displayName": "Wait Listed",
    "email": "wait@example.test",
    "status": "WAITLISTED",
    "alreadyCheckedIn": false,
    "checkedInAt": null,
    "checkInDetails": [{ "label": "T-shirt size", "value": "M" }],
    "registrationDetails": [{ "label": "T-shirt size", "value": "M" }, { "label": "Company", "value": "Example Ltd" }],
    "teamName": "Byte Club",
    "gate": { "ok": false, "reason": "Guest is on the waitlist — use “Override” to check in at the door.", "needsForce": true }
  }
}
```

## Errors

From `MOBILE_ERROR_STATUS` in `lib/mobile/http.ts`:

| Code | Status | Meaning |
| --- | --- | --- |
| `INVALID_REQUEST` | 400 | Validation failure, possibly with `fieldErrors` |
| `UNAUTHENTICATED` | 401 | Missing, expired, revoked or version-stale token. Sets `WWW-Authenticate: Bearer realm="Yuyu mobile"` |
| `MFA_REQUIRED` | 401 | Sign-in only |
| `EMAIL_VERIFICATION_REQUIRED` | 403 | Sign-in only |
| `FORBIDDEN` | 403 | Visible event, missing permission |
| `NOT_FOUND` | 404 | Unknown path, or anything outside what the caller can see (including other organisations) |
| `NOT_VISIBLE` | 404 | A project this judge may not score. Treat it like `NOT_FOUND` |
| `CONFLICT` | 409 | State conflict (default for unclassified core refusals) |
| `NEEDS_FORCE` | 409 | Check-in override available. Retry with `force: true` |
| `TEAM_REQUIRED` | 409 | `POST /rsvp` on a teams-only event |
| `TEAM_MEMBER` | 409 | Individual change on a team member |
| `TEAM_INCOMPLETE` | 409 | Team below minimum size |
| `CAPACITY_FULL` | 409 | No free unit |
| `JUDGING_CLOSED` | 409 | Judging not `OPEN` |
| `INCOMPLETE_SCORES` | 409 | Review submitted before every criterion is scored |
| `RATE_LIMITED` | 429 | With `Retry-After` (60 by default) |
| `INTERNAL_ERROR` | 500 | Unexpected exception, logged by category only |

```json
{ "ok": false, "error": { "code": "INVALID_REQUEST", "message": "Invalid input.", "fieldErrors": { "name": ["Name is required"] } } }
```

Core functions return UI-safe messages. `classifyActionError` maps them to codes, passing explicit codes (`TEAM_*`, `CAPACITY_FULL`, judging codes) through unchanged. Older apps see newer codes as unknown codes with the usual HTTP status.

## Rate limits and pagination

| Layer | Limit |
| --- | --- |
| Proxy `global` (per IP) | 300 per minute on all `/api` routes, returned in the mobile envelope |
| Proxy `auth` (per IP) | 10 per minute on `POST /auth/login` and `POST /auth/google` |
| `mobileAuth` (per IP) | 30 per minute on `POST /auth/refresh` |
| `mobileApi` (per user) | 300 authenticated requests per minute, keyed by a hash of the user id |
| Operation buckets | Each core keeps its website limit (`checkin`, `rsvp`, `broadcast`, `search`, `action`…) |

Collections that return `nextCursor` use opaque cursors. Send the value back unchanged, and treat `null` as the end of the collection. `/me/registrations` returns only the first page of each section.

## Contract and tests

The OpenAPI file, the fixtures, the server Zod schemas and the route tree must agree. `tests/unit/mobile-api-contract.test.ts` checks that:

- every fixture file is listed and validates against both its OpenAPI component (with Ajv, JSON Schema 2020-12) and the matching Zod envelope from `lib/mobile/dto.ts`
- every `$ref` resolves and every operation has a default error response
- the spec documents **exactly** the implemented routes and methods. It walks `app/api/mobile/v1` and reads `export const GET|POST|PATCH|PUT|DELETE`, skipping the catch-all
- every mobile error code is documented

| File | Covers |
| --- | --- |
| `tests/unit/mobile-api-contract.test.ts` | Contract drift |
| `tests/unit/mobile-tokens.test.ts`, `mobile-auth.test.ts` | Token hashing, rotation, reuse revocation, Google ID tokens |
| `tests/unit/mobile-http.test.ts`, `mobile-catch-all.test.ts` | Envelope, code mapping, JSON 404 |
| `tests/unit/mobile-dto.test.ts`, `mobile-teams-judging-dto.test.ts` | Forbidden-field regressions in DTOs |
| `tests/unit/mobile-app-links.test.ts` | `assetlinks.json` and `apple-app-site-association` |
| `tests/integration/mobile-api.db.test.ts`, `mobile-teams-judging.db.test.ts` | Sign-in, refresh, cross-tenant `NOT_FOUND`, `CHECK_IN`-only collaborators, ticket-token ownership |

```bash
npx vitest run tests/unit/mobile-api-contract.test.ts tests/unit/mobile-*.test.ts
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration -- tests/integration/mobile-api.db.test.ts
```

## Invariants

- **Every mutation goes through the shared core.** Never reimplement a rule in a mobile route. Call the `lib/core/*` function the Server Action uses. See [Mutation cores](/architecture/mutation-cores).
- **Invisible means `NOT_FOUND`.** `eventRoute` returns `NOT_FOUND` for events the caller cannot see on the dashboard, and `FORBIDDEN` only for a visible event without the permission.
- **Responses are strict DTOs.** Build responses through `lib/mobile/dto.ts` and `lib/mobile/schemas.ts`. Never return hashes, MFA material or other people's ticket tokens. Ticket tokens go only to their owner and, through the roster, to `CHECK_IN` holders.
- **Spec, fixtures and routes change together.** The contract test fails otherwise.
- **Changes are additive within v1.** Add optional fields and new codes rather than changing existing ones, because older apps stay in the wild.

## Making changes

To add an endpoint, follow [Extend the APIs](/guides/extend-the-apis):

1. Write or reuse the core function in `lib/core/`.
2. Add the response schema to `lib/mobile/schemas.ts` and a DTO builder to `lib/mobile/dto.ts`.
3. Create the route under `app/api/mobile/v1/` using `mobileRoute`, `authedMobileRoute`, `eventRoute` or `judgingRoute`. Parse bodies with `parseJsonBody` and map failures with `mobileActionError`.
4. Add the path and component to `docs/mobile-api.openapi.yaml`, add a fixture to `docs/mobile-api-fixtures/`, and register it in the `fixtures` list in the contract test.
5. Update `docs/MOBILE_API.md` and run the contract test.

## Further reading

- [docs/MOBILE_API.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/MOBILE_API.md), including app links (`/.well-known/assetlinks.json`, `/.well-known/apple-app-site-association`)
- [OpenAPI spec](https://github.com/twilighty-abhi/yuyu/blob/main/docs/mobile-api.openapi.yaml)
- [Auth and sessions](/architecture/auth-and-sessions)
- [Permissions](/architecture/permissions)
- [Tickets and check-in](/features/tickets-and-check-in)
- [Hackathon judging](/features/hackathon-judging)
