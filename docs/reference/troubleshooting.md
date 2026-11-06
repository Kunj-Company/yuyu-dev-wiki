# Troubleshooting

Known problems collected from the repo handbook, `AGENTS.md` and the code. Each entry gives the symptom, the cause and the fix. Quoted error messages are copied from the source.

## Local development

### Old CSS still shows after a style change

- **Symptom:** a Tailwind or CSS edit doesn't appear, even after a reload or a fresh `npm run build`.
- **Cause:** a stale `.next/cache` or Turbopack cache keeps serving old CSS (`AGENTS.md`).
- **Fix:** stop the server, delete the build output and verify with a clean build:

  ```bash
  rm -rf .next
  npm run build
  ```

### "Create account" works but sign-in fails

- **Symptom:** a new password account can't sign in, and the login form asks you to verify your email.
- **Cause:** password accounts need `User.emailVerified` (`lib/credentialsAuth.ts` returns `email_verification_required`). Without SMTP in development, the verification email goes to a mock that logs `[EMAIL MOCK] Verification email queued` and deliberately never prints the link.
- **Fix:** set `emailVerified` on your local user (see [Local setup → step 6](/start/local-setup#_6-create-your-first-account)), or point `SMTP_HOST`/`SMTP_PORT` at a local mail catcher and sign up again.

### `/super-admin` returns 404

- **Symptom:** the page is not found even though you're signed in.
- **Cause:** `requireSuperAdmin()` (`lib/permissions.ts`) calls `notFound()` unless `SUPER_ADMIN_EMAIL` is set, your email matches it (case-insensitive) and your email is verified. This hides the panel's existence.
- **Fix:** set `SUPER_ADMIN_EMAIL` in `.env`, restart `npm run dev`, and make sure the account is verified.

### `/super-admin` keeps redirecting to `/super-admin-mfa`

- **Symptom:** you never get past the step-up, or you're sent back after a while.
- **Cause:** `requireSuperAdminMfa()` needs `User.mfaEnabledAt` and a valid proof cookie bound to your user and `sessionVersion`. The proof lasts 10 minutes. Enrolling TOTP needs `MFA_ENCRYPTION_KEY`, otherwise `lib/mfa.ts` throws `MFA_ENCRYPTION_KEY must be valid base64 for a 32-byte key.`
- **Fix:** set `MFA_ENCRYPTION_KEY` (`openssl rand -base64 32`), enrol an authenticator at `/account/security`, then enter a fresh code at `/super-admin-mfa`. `AUTH_SECRET` must be at least 32 characters too, because it signs the proof.

### The app doesn't load properly on a phone or LAN address

- **Symptom:** the page half-loads on a LAN IP, or sign-in redirects to `localhost`.
- **Cause:** Next.js blocks dev assets for unknown hosts. `next.config.ts` allows only `127.0.0.1`, `*.trycloudflare.com` and hosts in `NEXT_DEV_ALLOWED_ORIGINS`. A fixed `AUTH_URL` also pins Auth.js to that host.
- **Fix:** add the LAN host to `NEXT_DEV_ALLOWED_ORIGINS`, and leave `AUTH_URL` and `NEXTAUTH_URL` unset for LAN or phone testing so Auth.js derives the host from the request (`.env.example`).

### Sent emails have no images or links

- **Symptom:** dashboard previews look right, but delivered emails are missing the cover, logo or event link.
- **Cause:** sent emails need an absolute `NEXT_PUBLIC_BASE_URL`. Without it, site-relative images and links are left out rather than sent as `localhost` links.
- **Fix:** set `NEXT_PUBLIC_BASE_URL` to an address recipients can reach, then restart. In production it's build-visible, so rebuild (see below).

### A webhook to a local receiver is refused

- **Symptom:** saving or delivering an organisation webhook to `http://localhost` or a private IP fails.
- **Cause:** every target is SSRF-checked at save and delivery time (`lib/webhooks/urlSafety.ts`).
- **Fix:** in development and tests only, set `WEBHOOKS_ALLOW_PRIVATE_TARGETS="1"`. A production server ignores it (outside CI test mode), and `npm run production:check` refuses it.

### Animations misbehave only in development

- **Symptom:** an animation stops halfway or runs twice under `npm run dev`.
- **Cause:** React's development double-invoked effects (mount, cleanup, mount).
- **Fix:** with `useAnimate`, don't use a one-shot "started" ref. Give each effect run its own local `current` flag, clear it in cleanup, and check it after every awaited step (`AGENTS.md`).

### An in-process singleton isn't shared

- **Symptom:** a Server Action emits an event that a route handler never receives, on the same process.
- **Cause:** Next.js can load a module more than once per process, for example in separate Server Action and route-handler bundles.
- **Fix:** keep the singleton on `globalThis` under a `Symbol.for(...)` key, as `lib/ticketCheckInEvents.ts` does for its emitter.

### Prisma model delegates are missing at runtime

- **Symptom:** a delegate such as `prisma.eventSeries` is undefined at runtime.
- **Cause:** Turbopack bundled `@prisma/client`.
- **Fix:** keep `serverExternalPackages: ["@prisma/client", "sharp"]` in `next.config.ts`.

### Public pages return 200 before a 404 or redirect

- **Symptom:** an unknown event page streams a 200, or the short-link 307 stops working.
- **Cause:** a root `app/loading.tsx`, or a dashboard `loading.tsx` above an access check, adds a Suspense boundary that streams before `notFound()` or `redirect()` run.
- **Fix:** don't add a root `app/loading.tsx`. Put loading screens below a layout that awaits its guard first. `tests/unit/dashboard-loading-boundaries.test.ts` checks this.

### `AGENTS.md` shows an unexpected diff

- **Symptom:** the `nextjs-agent-rules` block at the top of `AGENTS.md` reappears as a change.
- **Cause:** `next dev` writes and re-adds it.
- **Fix:** commit it with your work. Removing it only re-creates the change.

## Tests and CI

| Symptom | Cause | Fix |
| --- | --- | --- |
| `TEST_DATABASE_URL is required for PostgreSQL integration tests; point it only at a disposable database.` | `vitest.integration.config.mts` refuses to run without it | Create `yuyu_test`, migrate it and pass `TEST_DATABASE_URL` (see [Local setup → Verify](/start/local-setup#verify)) |
| Integration tests fail on missing tables or columns after a pull | The suite doesn't apply migrations itself | Re-run `DATABASE_URL=<test url> npm run db:deploy` on the test database |
| `Set HELP_SCREENS_DATABASE_URL to a disposable, migrated PostgreSQL database.` | `help:screenshots` seeds destructively | Point `HELP_SCREENS_DATABASE_URL` at a disposable, migrated database |
| `npm run test:e2e` tests an old build or the wrong code | Locally, Playwright reuses a server already listening on `127.0.0.1:3000` (`reuseExistingServer` is on outside CI) | Stop the other server, or set `PLAYWRIGHT_PORT` |
| `test:e2e:production` can't find the server or static assets | No standalone build | Run `npm run build` first. The script then runs `scripts/prepare-standalone.mjs` |
| `npx tsc --noEmit` fails in CI but not locally | CI runs `npx next typegen` first, so generated types differ | Run `npx next typegen && npx tsc --noEmit` |
| The Quality gate fails at `prisma migrate diff ... --exit-code` | The migrated database doesn't match `schema.prisma` (drift) | Create a migration for the schema change with `npm run db:migrate`. Don't hand-edit the schema without one |
| `npm run production:check` fails locally | It reads only the process environment and requires production values | Expected. Run it with the production environment exported |

## Production and deployment

### Live ticket tear-off is delayed by about 15 seconds

- **Symptom:** the ticket page updates only after a delay, not at the moment of check-in.
- **Cause:** a reverse proxy is buffering the `text/event-stream` response from `/api/ticket/:token/events`, so the client falls back to its 15-second status check.
- **Fix:** disable buffering for `/api/ticket/` (nginx: `proxy_buffering off`; the route also sends `X-Accel-Buffering: no`) and allow idle reads of at least 30 seconds. The stream pings every 25 seconds and closes after 10 minutes.

### Live check-in reaches only some tickets

- **Symptom:** with more than one replica, some ticket pages never update live.
- **Cause:** without a shared `REDIS_URL`, the in-process fallback only reaches viewers on the same instance.
- **Fix:** give every replica the same `REDIS_URL`. Production requires it anyway.

### Server Action forms fail after a deploy

- **Symptom:** submitting a form that was open before a deploy fails, or Server Actions fail on some replicas only.
- **Cause:** `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` differs between the build and the runtime, or between replicas, or was rotated. Rotating it invalidates outstanding Server Action forms.
- **Fix:** use one stable base64 key (16, 24 or 32 bytes) for the build (passed as a BuildKit secret) and every replica. Rotate only deliberately.

### Server Actions are rejected behind a CDN

- **Symptom:** Server Actions fail when a CDN or reverse proxy serves the app on another hostname.
- **Cause:** Server Actions are same-origin by default.
- **Fix:** list the trusted proxy or CDN hosts in `ALLOWED_ACTION_ORIGINS`. Leave it empty when browsers reach the app's own hostname.

### A changed `NEXT_PUBLIC_BASE_URL` has no effect

- **Symptom:** links still use the old address after changing the variable and restarting.
- **Cause:** `NEXT_PUBLIC_BASE_URL` is compiled into the image. It's the only build-visible setting.
- **Fix:** rebuild with `--build-arg NEXT_PUBLIC_BASE_URL=...` and redeploy. For a hostname change, also update `AUTH_URL`, the OAuth callback, DNS, TLS, CDN, scheduler and monitoring, and keep an HTTPS redirect from the old host.

### The production server refuses to start

`lib/env.ts` (`validateRuntimeEnvironment`, called from `instrumentation.ts`) throws on startup when `NODE_ENV=production`:

| Message | Fix |
| --- | --- |
| `Invalid production environment configuration: ...` | Supply every variable it names. See [Configuration](/reference/configuration) |
| `AUTH_URL and NEXT_PUBLIC_BASE_URL must be the same HTTPS origin in production.` | Set both to the same `https://` origin |
| `DATABASE_URL must require TLS using sslmode=require, verify-ca, or verify-full.` | Add `?sslmode=require` (or stricter) |
| `REDIS_URL must use TLS (rediss://) in production.` | Use a `rediss://` URL |
| `S3_ENDPOINT must use HTTPS in production.` | Use an HTTPS endpoint |
| `ALLOWED_EMBED_ORIGINS must contain exact HTTPS origins without paths.` | List bare origins such as `https://example.org` |

The bypass `CI=true` with `ALLOW_INSECURE_PRODUCTION_TESTS=1` exists for CI and staging tests only. Never set it on a real deployment.

### Rate-limited requests fail everywhere

- **Symptom:** in production, sign-ins, RSVPs and other rate-limited requests are all refused.
- **Cause:** Redis is unreachable, and production rate limiting fails closed (`lib/rateLimit.ts`).
- **Fix:** restore Redis. Don't add a memory fallback for production.

### Email, Google sign-in, alerts or MFA fail intermittently

- **Symptom:** behind a load balancer, some requests can't send email, sign in with Google, post alerts or verify TOTP.
- **Cause:** `MFA_ENCRYPTION_KEY` differs on some replicas or jobs, or was rotated. The server validates only the key's format, so it still starts and passes health checks.
- **Fix:** run the check with the exact runtime environment, then restore the original key everywhere:

  ```bash
  node --env-file=/secure/path/yuyu.env scripts/check-instance-secrets.mjs
  ```

  If the key is lost, set one new key everywhere, re-enter the SMTP password, Google secret and alert webhook in Super admin → Settings, and have users re-enrol MFA.

### Production email stays queued

- **Symptom:** `OutboxMessage` rows pile up and nothing is sent.
- **Cause:** no SMTP is configured in the panel or the environment, or SMTP has no credentials. Production refuses unauthenticated SMTP unless the private-relay option (or `SMTP_ALLOW_UNAUTHENTICATED=1`) is set, and it requires TLS 1.2+ with certificate verification.
- **Fix:** configure SMTP at `/super-admin/settings` and use **Send test email**. Saved panel SMTP replaces the `SMTP_*` environment as a whole.

### Gmail refuses logins mid-broadcast

- **Symptom:** sends fail with `EAUTH 454-4.7.0 Too many login attempts, please try again later`.
- **Cause:** every email opens its own SMTP connection and login. When the drain rate was raised, Gmail locked the account out (`docs/DECISIONS.md`, 2026-11-03).
- **Fix:** keep the drain at one batch of 20 per pass (`OUTBOX_DRAIN_BATCH`, `OUTBOX_DRAIN_MAX_BATCHES` in `lib/outboxWorker.ts`). Read the decision record before raising it.

### New email kinds fail with `PermanentOutboxError`

- **Symptom:** after an upgrade, some new emails are marked `FAILED`.
- **Cause:** the previous release's worker is still running and fails kinds it doesn't know.
- **Fix:** don't run old and new releases side by side. List each new kind in `OUTBOX_KINDS_ADDED_AFTER_1_0` (or its successor) so the new release requeues those rows once. See [Add an email](/guides/add-an-email).

### A migration stalls the site

- **Symptom:** during `npm run db:deploy`, reads and writes queue up and the site hangs.
- **Cause:** an `ALTER TABLE` waits for an ACCESS EXCLUSIVE lock behind a long transaction, and every new query queues behind it.
- **Fix:** follow the lock checklist in `docs/production-operations.md`: end long transactions first, add `options=-c%20lock_timeout%3D5s` to the migrator's `DATABASE_URL` only, and if a migration times out, run `npx prisma migrate resolve --rolled-back <migration_name>` and deploy again.

### Pages break behind Cloudflare

- **Symptom:** scripts are blocked by the CSP on pages that show email addresses.
- **Cause:** Cloudflare Email Address Obfuscation injects an unsigned script.
- **Fix:** disable Email Address Obfuscation for the application hostname. Yuyu also sends `Cache-Control: no-transform` on HTML.

### `npm run db:backup` fails against a local database

- **Symptom:** `Backup failed: DATABASE_URL must require TLS.`
- **Cause:** `scripts/db-backup-lib.mjs` accepts only `sslmode=require`, `verify-ca` or `verify-full`.
- **Fix:** it's an operator tool for TLS-backed databases. For a local copy, run `pg_dump` directly (for example through `docker compose exec postgres`).

## Further reading

- [docs/production-operations.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/production-operations.md)
- [docs/CONFIGURATION.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/CONFIGURATION.md)
- [docs/DECISIONS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DECISIONS.md)
- [docs/DEVELOPMENT.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DEVELOPMENT.md)
- [Configuration](/reference/configuration), [Deployment](/reference/deployment), [Realtime](/architecture/realtime), [Background jobs](/architecture/background-jobs)
