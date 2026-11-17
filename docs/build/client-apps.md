# Build a client app

How to write a new client for the [mobile API](/api/mobile-api): a native app, a desktop tool or a kiosk that signs people in and acts as them. The API is the same one the Android and iOS apps use. This page is the client developer's view: the sign-in and token flow, the endpoints to start with, the error model, offline behaviour, and how to use the OpenAPI file and fixtures to generate and test code. For the endpoint tables and server internals, see [Mobile API](/api/mobile-api).

If you only need to read events or rosters for one organisation from a server, you want the [machine API](/api/machine-api) instead. See [Ways to build on Yuyu](/build/overview).

## The contract

| File in the Yuyu repository | Use |
| --- | --- |
| `docs/mobile-api.openapi.yaml` | OpenAPI 3.1. Authoritative for paths, bodies and response schemas. `info.version` is `1.0.0` and the server is `{baseUrl}` |
| `docs/mobile-api-fixtures/*.json` | One example response per shape, all with the real envelope |
| `docs/MOBILE_API.md` | Prose companion: per-endpoint behaviour, refusals, app links |
| `tests/unit/mobile-api-contract.test.ts` | Fails if the spec, fixtures, server schemas and routes disagree, so the spec and fixtures are a reliable source of truth |

Every response is JSON with `Cache-Control: no-store`. Success is `{ "ok": true, "data": ... }`. Failure is `{ "ok": false, "error": { "code", "message", "fieldErrors"? } }`. Timestamps are ISO-8601 UTC, event times carry an IANA `timezone`, and image and link URLs are absolute.

Closed objects: spec schemas set `additionalProperties: false`, because the server never returns more than it documents. The API's compatibility rule is that changes inside v1 are additive, so **decode leniently in production and strictly in tests**. A client that rejects unknown fields at runtime breaks the first time the server adds one.

## Point the client at an instance

There is no central Yuyu service. Each instance is self-hosted, and the user types its address. Normalise it (add `https://` when missing) and call the public configuration endpoint before showing a sign-in screen:

```bash
curl -sS https://yuyu.example/api/mobile/v1/auth/config
```

```json
{ "ok": true, "data": { "instanceName": "Yuyu", "googleSignIn": { "enabled": true, "webClientId": "123.apps.googleusercontent.com" }, "signupEnabled": true, "baseUrl": "https://yuyu.example" } }
```

(Values are illustrative. The fields are the `AuthConfig` schema.) Use `googleSignIn.enabled` to decide whether to show the Google button, and `signupEnabled` to decide whether to offer account creation. The mobile API has no registration endpoint, so a new account is created on the website. `instanceName` is hard-coded to `"Yuyu"` in `app/api/mobile/v1/auth/config/route.ts`, so do not treat it as a reliable display name for a fork.

Both official apps accept plain `http` only for local development hosts and require HTTPS for everything else. Do the same. See [Android and iOS apps](/build/mobile-apps).

## Sign-in and tokens

| Token | Format | Lifetime | Where it goes |
| --- | --- | --- | --- |
| Access | `yma_` plus 43 base64url characters | 15 minutes | `Authorization: Bearer yma_...` on every authenticated request |
| Refresh | `ymr_` plus 43 base64url characters | 60 days, rotated on every use | Only in the body of `POST /auth/refresh` |

The server stores only SHA-256 digests. Treat both tokens as secrets: keep them in the platform's secure store (Keychain on iOS, an encrypted store on Android), never in logs, analytics or plain preferences.

### Password sign-in

```bash
curl -sS -X POST https://yuyu.example/api/mobile/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "ada@example.org", "password": "...", "deviceName": "Kiosk 1" }'
```

Body fields (from the OpenAPI file): `email` (max 254), `password` (max 128), optional `totp` (an authenticator code or a recovery code, max 32), optional `deviceName` (max 120) and optional `platform`, whose only allowed values are `android` and `ios`. A client that is neither should omit `platform`. The response is a `Session`: `accessToken`, `accessTokenExpiresAt`, `refreshToken`, `refreshTokenExpiresAt` and a `user` (`id`, `name`, `email`, `imageUrl`, `emailVerified`, `mfaEnabled`). See `docs/mobile-api-fixtures/session.json`.

Sign-in errors to handle:

| Code | Status | What to do |
| --- | --- | --- |
| `INVALID_REQUEST` | 400 | Show "Email or password is incorrect." (the server's message). It does not say which part was wrong |
| `MFA_REQUIRED` | 401 | Returned only after a correct password. Ask for the TOTP code and send the same request again with `totp` |
| `EMAIL_VERIFICATION_REQUIRED` | 403 | The person must verify their email on the website first |
| `RATE_LIMITED` | 429 | Sign-in is limited to 10 requests per minute per IP. Honour `Retry-After` |

### Google sign-in

1. Read `GET /auth/config`. Show the button only when `googleSignIn.enabled` is true.
2. Ask Google's sign-in SDK for an **ID token** whose audience is `googleSignIn.webClientId`.
3. `POST /auth/google` with `{ "idToken": "...", "deviceName"?, "platform"? }`. The response is a `Session`.

The server verifies the signature against Google's keys, the issuer, expiry and `email_verified`, and checks the audience: the web client id, or one of the ids in `GOOGLE_MOBILE_CLIENT_IDS`. When that variable is set, a token issued for the web client id must also name one of the listed ids in `azp`. For your own client this means the instance operator has to add your Google OAuth client id to `GOOGLE_MOBILE_CLIENT_IDS` if it is set, and the Google Cloud project must contain a client for your app. A `403` means Google sign-in is not configured, account creation is disabled, or linking was refused. The Android README describes the operator side in "Setting up a Yuyu server for the app".

### Refresh, rotation and sign-out

When any request returns `401 UNAUTHENTICATED`, refresh once, retry the request once, and sign out only if the refresh itself is rejected.

```bash
curl -sS -X POST https://yuyu.example/api/mobile/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{ "refreshToken": "ymr_..." }'
```

Rules that come from the server:

- **Refresh tokens rotate.** Save the new `Session` before doing anything else.
- **Refresh in one place at a time.** Replaying the previous refresh token within 30 seconds of a rotation (for example after a lost response) returns a plain `401` and revokes nothing. Replaying a rotated-away token after that window **revokes the whole session**. Share one in-flight refresh between parallel requests.
- **Only a definite rejection signs the user out.** Both official clients treat only a `401` from `/auth/refresh` as the end of the session. Offline errors, timeouts, `429` and `5xx` keep the session and surface as errors.
- `UNAUTHENTICATED` covers a missing, expired, revoked or version-stale token. It cannot be told apart, by design.
- Refresh is limited to 30 requests per minute per IP, and authenticated traffic to 300 per minute per user.

### Device sessions

Each sign-in creates a `MobileSession` row on the server holding the digests, `deviceName`, `platform` (informational only), timestamps and revocation state. What a client can do with it:

| Call | Effect |
| --- | --- |
| `POST /auth/logout` | Revokes this device's session |
| `POST /auth/logout-all` | Bumps the user's `sessionVersion`, signing out every web and mobile session. It can return `429` |

There is no endpoint that lists or revokes other individual devices. A password change or reset, enabling or disabling MFA, and "sign out everywhere" also bump `sessionVersion`, so any of them ends your session with `UNAUTHENTICATED`. Send a useful `deviceName` so that support staff can recognise it. See [Auth and sessions](/architecture/auth-and-sessions).

### A client with single-flight refresh

A minimal TypeScript client (Node 20 or a browser) showing the envelope handling and the refresh rule. Replace the in-memory store with secure storage.

```ts
type Session = { accessToken: string; accessTokenExpiresAt: string; refreshToken: string; refreshTokenExpiresAt: string; user: { id: string; name: string | null; email: string } };
type Envelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
type Store = { load(): Session | null; save(session: Session | null): void };

export class MobileApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly fieldErrors?: Record<string, string[]>, readonly retryAfter?: number) { super(message); }
}

export class YuyuClient {
  private refreshing: Promise<Session> | null = null;
  constructor(private origin: string, private store: Store) {}

  async call<T>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}, retried = false): Promise<T> {
    const session = this.store.load();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.auth !== false && session) headers.Authorization = `Bearer ${session.accessToken}`;
    const res = await fetch(new URL(`/api/mobile/v1${path}`, this.origin), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
    const json = (await res.json()) as Envelope<T>;
    if (json.ok) return json.data;
    if (res.status === 401 && json.error.code === "UNAUTHENTICATED" && opts.auth !== false && session && !retried) {
      await this.refresh();
      return this.call<T>(path, opts, true);
    }
    const retryAfter = Number(res.headers.get("retry-after")) || undefined;
    throw new MobileApiError(res.status, json.error.code, json.error.message, json.error.fieldErrors, retryAfter);
  }

  async signIn(email: string, password: string, totp?: string): Promise<Session> {
    const session = await this.call<Session>("/auth/login", { method: "POST", auth: false, body: { email, password, totp, deviceName: "My client" } });
    this.store.save(session);
    return session;
  }

  private refresh(): Promise<Session> {
    this.refreshing ??= this.doRefresh().finally(() => { this.refreshing = null; });
    return this.refreshing;
  }

  private async doRefresh(): Promise<Session> {
    const current = this.store.load();
    if (!current) throw new MobileApiError(401, "UNAUTHENTICATED", "Signed out");
    try {
      const next = await this.call<Session>("/auth/refresh", { method: "POST", auth: false, body: { refreshToken: current.refreshToken } });
      this.store.save(next); // persist the rotated tokens first
      return next;
    } catch (error) {
      if (error instanceof MobileApiError && error.status === 401) this.store.save(null); // definite rejection: sign out
      throw error;
    }
  }
}
```

## Key endpoints for a first client

Paths are relative to `/api/mobile/v1`. The complete list with permissions is in [Mobile API](/api/mobile-api#endpoints).

| Job | Calls |
| --- | --- |
| Sign in | `GET /auth/config`, `POST /auth/login` or `/auth/google`, `POST /auth/refresh`, `POST /auth/logout` |
| Who am I | `GET /me` returns the user, organisations with roles, event collaborations with their permissions, and judging events. `PATCH /me` changes the display name |
| Browse events | `GET /public/discover?limit=&cursor=` (limit 1 to 50), `GET /public/search?q=`, `GET /public/short/:code`, `GET /public/events/:orgSlug/:eventSlug` (an optional bearer personalises it) |
| Register | `POST /rsvp` (optional bearer). Always solo on team events |
| My tickets | `GET /me/registrations` (first 50 upcoming, past and certificates), `POST /me/registrations/:rsvpId/cancel` |
| Live ticket | `GET /api/ticket/:token/status` and the server-sent events stream `GET /api/ticket/:token/events`. These are existing web routes with bare JSON bodies, not the envelope |
| Organiser | `GET /orgs/:orgSlug/events`, then guests, check-in, schedule and broadcast routes under `/orgs/:orgSlug/events/:eventId/...`. What a person may do is in `myPermissions` |
| Judging | The `judging/*` routes under the event, for judges |

Fixtures for these shapes: `session.json`, `me.json`, `registrations.json`, `public-event.json`, `org-events.json`, `org-event-detail.json`, `guests.json`, `check-in-preview.json`, `schedule.json`, `broadcasts-meta.json`, `registration-state.json` and the team and judging files.

::: tip Permissions only hide controls
`myPermissions` and `EventPermissions` tell a client which buttons to show. The server re-checks every mutation. Handle `FORBIDDEN` (a visible event without the permission) and `NOT_FOUND` (anything outside what the caller can see, including other organisations) gracefully, and never treat a hidden control as security.
:::

## Error model

The status and `error.code` come from `MOBILE_ERROR_STATUS` in `lib/mobile/http.ts`. The full table is in [Mobile API](/api/mobile-api#errors). Client rules:

| Situation | Behaviour |
| --- | --- |
| Any failure | Show `error.message`. It is the website's UI-safe text |
| `INVALID_REQUEST` with `fieldErrors` | Map each key to its form field |
| `UNAUTHENTICATED` | Refresh once, retry once, then sign out |
| `NOT_FOUND`, `NOT_VISIBLE` | Treat as "no longer available". Never reveal whether it exists |
| `NEEDS_FORCE` | Show the reason, and retry the same check-in with `force: true` only after an explicit override |
| `CONFLICT`, `CAPACITY_FULL`, `TEAM_*`, `JUDGING_CLOSED`, `INCOMPLETE_SCORES` | State conflicts. Refresh the screen's data |
| `RATE_LIMITED` | Wait for `Retry-After` (60 seconds by default) |
| An unknown code | Fall back to the HTTP status. New codes are added within v1, and older clients see them as unknown |
| Bad JSON from a proxy or a `5xx` without an envelope | Treat as a network error, not as a session end |

Unknown paths under `/api/mobile/v1` return a JSON `NOT_FOUND` envelope, so a path typo does not look like a network failure.

## Offline and idempotency

The mobile API has no `Idempotency-Key` header, and creation calls are not generically retry-safe. Design around that:

- **Reads can be cached.** Responses are `no-store` for shared caches, so the cache is your client's own. The Android app, for example, caches the signed-in user's own tickets in Room.
- **Check-in is the offline workflow.** `GET /orgs/:orgSlug/events/:eventId/check-in/roster` (for people with `CHECK_IN`) returns confirmed, waitlisted and pending guests with their ticket tokens. Store it encrypted, and delete it after the event. Queue scans while offline and upload them with `POST .../check-in/sync`: 1 to 500 entries of `{ rsvpId, checkedInAt, force?, clientMutationId? }`.
- **What sync guarantees.** The server checks each entry. `syncedIds` were recorded, `alreadyCheckedInIds` were already checked in (so retrying a batch after a lost response is safe), and `failed` carries a per-entry `error`. A repeated `rsvpId` inside one batch fails. A `checkedInAt` outside the window from 24 hours before the start to the earlier of five minutes from now and one hour after the end also fails. `clientMutationId` (8 to 128 characters) is validated and accepted, but the observable idempotency comes from the check-in state, not from that id.
- **Everything else.** Registration, approvals and similar calls are protected by server rules (duplicate-registration protection, status checks, capacity transactions), not by a request key. After an ambiguous failure, read the resource before you repeat a write.
- **Do not put tokens in logs.** Access and refresh tokens, ticket tokens and station PINs must never be logged or persisted unencrypted.

## Generate and test with the spec and fixtures

### Generate types or a client

OpenAPI 3.1 uses JSON Schema 2020-12 (for example `type: [string, "null"]`), and generator support for 3.1 varies, so pick a tool that supports it and review the output. For example, with `openapi-typescript`:

```bash
npx openapi-typescript docs/mobile-api.openapi.yaml -o mobile-api.d.ts
```

The spec describes envelopes as separate `...Response` schemas with `ok` as a constant, so generated types already contain the `{ ok: true, data }` shape. Wrap the error branch yourself with the `ErrorEnvelope` schema.

### Check your decoders against the fixtures

Both official clients copy the fixtures into their tests and decode each one strictly, so a server change fails the client build. The iOS repository does it with `scripts/sync-contract.sh` and `ContractTests`, and Android with `FixtureContractTest`. You can do the same in any language. In TypeScript, validate the fixtures against the spec with a standard validator, exactly as the server's contract test does:

```ts
// contract.test.ts (vitest): npm i -D ajv ajv-formats js-yaml
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { load } from "js-yaml";
import { expect, it } from "vitest";

const spec = load(readFileSync("docs/mobile-api.openapi.yaml", "utf8")) as { components: object };
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema({ $id: "openapi", components: spec.components });

it("session.json matches SessionResponse", () => {
  const value = JSON.parse(readFileSync("docs/mobile-api-fixtures/session.json", "utf8"));
  const check = ajv.compile({ $ref: "openapi#/components/schemas/SessionResponse" });
  expect(check(value) ? [] : check.errors).toEqual([]);
});
```

Then decode each fixture with your own models and assert the fields you use. To run against a live server, follow the Yuyu [local setup](/start/local-setup), or the iOS repository's `dev-server` stack, which starts Yuyu with PostgreSQL, Redis, MinIO and Mailpit and seeds demo accounts. See [Android and iOS apps](/build/mobile-apps).

### Keep your copy current

Copy `docs/mobile-api.openapi.yaml` and `docs/mobile-api-fixtures/` from the Yuyu repository when you upgrade. The existing app repositories show why: their copies lag the server (the Android fixtures lack the team and judging files, for example). The version of the contract you build against is whatever your target instance runs, so keep the decoders lenient.

## Links into the app

If your client opens Yuyu links, the server serves `GET /.well-known/assetlinks.json` (package `com.twilighty.yuyu`, from `ANDROID_APP_SHA256_CERT_FINGERPRINTS`) and `GET /.well-known/apple-app-site-association` (from `APPLE_APP_IDS`, form `TEAMID.bundle.id`). Both are empty until configured. The paths to claim are `/ticket/*`, `/*/*/feedback` and `/*/*`. Event short links are deliberately not claimed. A fork with its own apps changes the package and bundle id in those variables. See `docs/MOBILE_API.md`, "App links".

## Checklist

- [ ] The instance address is normalised, `https` is enforced outside local development, and `/auth/config` is read first
- [ ] Tokens are stored only in secure storage and never logged
- [ ] One in-flight refresh at a time, and the rotated tokens are saved before anything else
- [ ] Only a rejected `/auth/refresh` signs the user out
- [ ] `error.message` is shown, `fieldErrors` mapped, and unknown codes fall back to the status
- [ ] Production decoders ignore unknown fields. Tests decode every fixture strictly
- [ ] Offline check-in uses the roster and `check-in/sync`, and handles `alreadyCheckedInIds` and `failed`
- [ ] No permission decisions are made only on the client

## Further reading

- [Mobile API](/api/mobile-api) and [Auth and sessions](/architecture/auth-and-sessions)
- [Android and iOS apps](/build/mobile-apps)
- [Extend the APIs](/guides/extend-the-apis) if the client needs an endpoint that does not exist
- [docs/MOBILE_API.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/MOBILE_API.md)
- [docs/mobile-api.openapi.yaml](https://github.com/twilighty-abhi/yuyu/blob/main/docs/mobile-api.openapi.yaml)
