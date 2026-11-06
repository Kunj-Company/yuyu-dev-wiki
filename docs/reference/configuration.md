# Configuration

This page lists every environment variable in `.env.example`, in the `envSchema` of `lib/env.ts`, and in the test tooling. Copy `.env.example` to `.env` for local development. Production values come from a secrets manager, never from a committed file.

## How configuration is checked

| Check | Where | When | What it does |
| --- | --- | --- | --- |
| `envSchema` | `lib/env.ts` | Imported by server code | Zod format rules. `env` is a non-throwing `safeParse` used for display only |
| `validateRuntimeEnvironment()` | `lib/env.ts`, called from `instrumentation.ts` | Production server start (`NODE_ENV=production`) | Throws on missing required values, bad formats, non-HTTPS origins, missing DB TLS, a non-`rediss://` Redis, a non-HTTPS S3 endpoint, or bad embed origins |
| `npm run production:check` | `scripts/check-production-env.mjs` | Before deploying (CI runs it too) | The same required list plus key-length checks, SMTP credentials, the S3 key pair rule, and refusal of `WEBHOOKS_ALLOW_PRIVATE_TARGETS` |
| `node scripts/check-instance-secrets.mjs` | Script, also in the `migrator` image | Before or after a release | Confirms `MFA_ENCRYPTION_KEY` can decrypt the secrets saved in Super admin → Settings, without printing them |

**Blank values count as unset.** `environmentValues()` in `lib/env.ts` and `envValue()` in `lib/instanceSettings.ts` drop empty strings, so placeholders such as `SMTP_HOST=""` do not fail validation.

"Required" below means required in production by both `validateRuntimeEnvironment()` and `production:check`. In development, only `DATABASE_URL` and `AUTH_SECRET` are needed in practice.

## Core and authentication

| Variable | Production | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Required | None | PostgreSQL URL. Production requires `sslmode=require`, `verify-ca` or `verify-full` |
| `AUTH_SECRET` | Required | None | Auth.js signing and encryption secret, at least 32 characters |
| `AUTH_URL` | Required | Unset: Auth.js derives the host from the request (useful for LAN or phone development) | Canonical Auth.js origin. Must be HTTPS and the same origin as `NEXT_PUBLIC_BASE_URL` |
| `NEXT_PUBLIC_BASE_URL` | Required | None | Public origin for generated links and email images. **Build-visible**: changing it needs a rebuild. Without it, sent emails leave images out rather than linking to `localhost` |
| `SUPER_ADMIN_EMAIL` | Recommended | None | The only email allowed into `/super-admin`. Must be a valid email |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | No (legacy fallback) | None | Google OAuth client. Super admin → Settings overrides them. A saved client ID is never paired with an environment secret |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | None | Older aliases, read after the `AUTH_GOOGLE_*` names (`lib/instanceSettings.ts`) |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | No | None | Commented out in `.env.example`. Yuyu's code and `production:check` read only `AUTH_SECRET` and `AUTH_URL` |

## Application secrets

| Variable | Production | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Required | None | Base64 AES key (16, 24 or 32 decoded bytes). Passed to `docker build` as a BuildKit secret, and the same value is needed at runtime on every replica. Rotating it invalidates outstanding Server Action forms |
| `MFA_ENCRYPTION_KEY` | Required | None | Base64, exactly 32 decoded bytes. Encrypts TOTP seeds. Domain-separated subkeys encrypt the panel's SMTP password, Google client secret, alert webhook URL and organisation webhook signing secrets. Must be identical on every replica and job, and stable |
| `CRON_SECRET` | Required | None | Bearer secret for `POST /api/internal/outbox`, at least 32 characters |
| `HEALTHCHECK_SECRET` | Required | None | Bearer secret for `GET /api/health/db`, at least 32 characters |

Generate each one independently with `openssl rand -base64 32`.

::: danger MFA key mismatch does not crash
A replica with a different `MFA_ENCRYPTION_KEY` starts and passes health checks. On that replica, though, email, Google sign-in, alerts and TOTP all fail, which looks intermittent behind a load balancer. Run `node scripts/check-instance-secrets.mjs`, or set `migration.checkInstanceSecrets=true` in Helm.
:::

## Redis and request trust

| Variable | Production | Default | Purpose |
| --- | --- | --- | --- |
| `REDIS_URL` | Required (`rediss://`) | Unset in development: in-process fallback | Distributed rate limits and pub/sub for live ticket check-in across replicas. Production traffic fails closed when Redis is unavailable |
| `TRUSTED_PROXY_IP_HEADER` | Required | None in code (`.env.example` sets `cf-connecting-ip`). Unset: every client IP is `"unknown"` | One of `cf-connecting-ip`, `x-forwarded-for` (first entry) or `x-real-ip`. The edge must overwrite it |
| `ALLOWED_ACTION_ORIGINS` | Optional | Blank: same-origin Server Actions only | Comma-separated trusted CDN or proxy hosts allowed to invoke Server Actions (`next.config.ts`) |
| `ALLOWED_EMBED_ORIGINS` | Optional | Blank: cross-site embedding disabled | Comma-separated exact HTTPS origins, without paths, that may frame `/embed/...` (`proxy.ts`) |
| `NEXT_DEV_ALLOWED_ORIGINS` | Development only | `127.0.0.1` and `*.trycloudflare.com` are always allowed | Extra LAN hosts allowed to request dev assets |

Rate-limit bucket sizes live in code (`lib/rateLimit.ts`), not in the environment.

## Email and outbox

These are legacy fallbacks. SMTP saved in Super admin → Settings **replaces every `SMTP_*` value as a whole**. No single field falls back to the environment.

| Variable | Production | Default | Purpose |
| --- | --- | --- | --- |
| `EMAIL_FROM` | No | `Yuyu Events <noreply@localhost>` (`DEFAULT_EMAIL_FROM`) | Sender. Precedence: saved value, then `EMAIL_FROM`, then the default |
| `SMTP_SERVICE` | No | None | Nodemailer well-known service name (for example `gmail`), used instead of host and port |
| `SMTP_HOST` | No | None | Custom SMTP host |
| `SMTP_PORT` | No | `587`, or `465` when `SMTP_SECURE=true` | SMTP port, 1 to 65535 |
| `SMTP_SECURE` | No | `false` | `true` or `false` |
| `SMTP_USER` / `SMTP_PASSWORD` | Needed when a service or host is set | None | `production:check` requires both unless `SMTP_ALLOW_UNAUTHENTICATED=1` |
| `SMTP_ALLOW_UNAUTHENTICATED` | No | `0` | `1` only for an intentionally unauthenticated private relay |
| `OUTBOX_RETENTION_DAYS` | No | `30` (1 to 365) | Days before sent or failed non-capability outbox rows are purged (`lib/retention.ts`) |

Neither the startup check nor `production:check` requires email settings. Until SMTP exists in the panel or the environment, production email stays queued.

## Object storage

| Variable | Production | Default | Purpose |
| --- | --- | --- | --- |
| `S3_BUCKET` | Required | None | Private bucket |
| `S3_REGION` | Required | None | Bucket region |
| `S3_ENDPOINT` | Provider-dependent | None (AWS) | Custom endpoint for R2, MinIO and similar. Must be HTTPS in production |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Both or neither | None | Leave both unset to use an IAM or workload role. Setting only one fails the startup check |
| `S3_FORCE_PATH_STYLE` | Optional | `0` | `1` for providers that need path-style addressing |

## Backup posture (display only)

| Variable | Production | Default | Purpose |
| --- | --- | --- | --- |
| `BACKUP_PROVIDER` | No (legacy fallback) | None | Displayed provider name, at most 80 characters |
| `BACKUP_LAST_SUCCESS_AT` | No (legacy fallback) | None | ISO 8601 datetime of the last successful backup |
| `BACKUP_RETENTION_DAYS` | No (legacy fallback) | None in code (`.env.example` sets `30`) | Displayed retention, 1 to 3650 |

These values never run, retain or restore backups. Any backup field saved in the panel replaces all three. Operational alerts have no environment variable: you configure them only in the panel.

## Mobile apps

| Variable | Production | Default | Purpose |
| --- | --- | --- | --- |
| `GOOGLE_MOBILE_CLIENT_IDS` | Optional | None | Comma-separated Google client IDs accepted as the ID-token audience for mobile Google sign-in |
| `ANDROID_APP_SHA256_CERT_FINGERPRINTS` | Optional | Unset: `[]` | Fingerprints published in `/.well-known/assetlinks.json` |
| `APPLE_APP_IDS` | Optional | Unset: empty details | `TEAMID.bundle.id` values published in `/.well-known/apple-app-site-association` |

## Test-only switches

| Variable | Production | Default | Purpose |
| --- | --- | --- | --- |
| `ALLOW_INSECURE_PRODUCTION_TESTS` | **Never** | Unset | Takes effect only together with `CI=true`. Permits HTTP origins, non-TLS PostgreSQL, Redis and S3, the in-memory Redis fallback, and `WEBHOOKS_ALLOW_PRIVATE_TARGETS` in a production build |
| `CI` | **Never** in a deployment | Unset | Set by CI. Combined with the switch above, it enables the test mode |
| `WEBHOOKS_ALLOW_PRIVATE_TARGETS` | **Never** | Unset | `1` lets organisation webhooks reach `http://` and private or loopback receivers. Ignored by a production server outside CI test mode, and refused by `production:check` |

## Test and tooling variables

These are not in `.env.example`. Test configs and scripts read them.

| Variable | Read by | Purpose |
| --- | --- | --- |
| `TEST_DATABASE_URL` | `vitest.integration.config.mts` | Disposable database for integration tests. Required, and it replaces `DATABASE_URL` for the run |
| `PLAYWRIGHT_PORT` | `playwright.config.ts` | E2E server port (default `3000`) |
| `PLAYWRIGHT_PRODUCTION_SERVER` | `playwright.config.ts` | `1` runs the standalone server (set by `test:e2e:production`) |
| `PLAYWRIGHT_SERVER_COMMAND` | `playwright.config.ts` | Overrides the server command |
| `HELP_SCREENS_DATABASE_URL`, `HELP_SCREENS_SEED`, `HELP_SCREENS_PORT` | `tests/help-screenshots/` | Disposable local database, explicit opt-in (`1`), port (default `3124`) |
| `PERF_DATABASE_URL`, `PERF_OUT`, `PERF_GOLDEN_WRITE`, `PERF_GOLDEN_CHECK`, `PERF_BASE_URL`, `PERF_SERVER_PID`, `PERF_RUNS` | `tests/perf/` | Large-event measurement (see `docs/PERFORMANCE.md`) |

## Changing configuration safely

- **Build-visible values.** `NEXT_PUBLIC_BASE_URL` is compiled into the image. Change it only with a rebuild.
- **Domain change.** Update `AUTH_URL` and `NEXT_PUBLIC_BASE_URL` together, along with the OAuth callback (`<origin>/api/auth/callback/google`), DNS, TLS, CDN, scheduler and monitors. Keep an HTTPS redirect from the old host.
- **Panel versus environment.** Values saved in Super admin → Settings (SMTP, Google SSO, backup posture, alerts) are read from PostgreSQL on each send or sign-in, so they need no restart.
- **Adding a variable.** See [Add config](/guides/add-config).

## Further reading

- [docs/CONFIGURATION.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/CONFIGURATION.md)
- [docs/production-operations.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/production-operations.md)
- [Deployment](/reference/deployment), [Security checklist](/reference/security-checklist), [Super admin](/features/super-admin)
