# Production readiness checklist

A consolidated go-live checklist for a self-hosted Yuyu instance. It merges `docs/PRODUCTION_RELEASE.md`, `docs/SECURITY.md` and what `scripts/check-production-env.mjs` enforces. The repository's rule is that a release is not done until every item is complete and recorded in the deployment change. Tick them off in your change record, not on this page.

::: warning What the preflight does and does not prove
`npm run production:check` validates the environment only. It cannot see the database, the proxy, the bucket or your backups. Everything under [Infrastructure](#infrastructure) and [Verify after deploy](#verify-after-deploy) is on you. This checklist is also not a substitute for an external security review. `docs/SECURITY.md` says so itself.
:::

Item sources are noted so you can check them. The PR-review checklist in [Security checklist](/reference/security-checklist) is a different document, for code reviewers.

## Infrastructure

- [ ] PostgreSQL with TLS, encryption at rest, daily backups, point-in-time recovery and a documented restore drill
- [ ] Redis on `rediss://`. The app fails closed for security-sensitive traffic when Redis is down
- [ ] A private S3-compatible bucket. Workload or IAM role preferred. Endpoint (if custom) is HTTPS
- [ ] A transactional email provider with a verified sending domain, SPF, DKIM, DMARC, bounce handling and alerting
- [ ] TLS termination and a WAF or CDN in front of the app. The container port is private
- [ ] The proxy overwrites the trusted client-IP header and nothing can reach the origin directly ([Reverse proxy and TLS](/deploy/reverse-proxy))
- [ ] The proxy does not buffer `/api/ticket/:token/events` and allows idle reads of at least 30 s. Request-body limit is at least 6 MB
- [ ] Outbound access from every app process: PostgreSQL, Redis, storage, SMTP (typically 465 or 587), alert webhook (HTTPS 443), organisation webhook receivers (443 and 8443), and Google endpoints if Google sign-in is used
- [ ] If Cloudflare proxies the app, Email Address Obfuscation is off for the hostname
- [ ] Centralised, PII-scrubbed logs, error reporting, uptime checks and alerts for database, Redis, outbox, mail and backup failures
- [ ] A dedicated private bucket for backups (separate from the asset bucket), with encryption at rest and a narrowly scoped credential

## Environment and secrets

Checked by `scripts/check-production-env.mjs`. Run `node --env-file=/secure/path/yuyu.env scripts/check-production-env.mjs` and require `Production environment preflight passed.`

- [ ] All twelve required variables are set: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_BASE_URL`, `REDIS_URL`, `CRON_SECRET`, `HEALTHCHECK_SECRET`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, `MFA_ENCRYPTION_KEY`, `TRUSTED_PROXY_IP_HEADER`, `S3_BUCKET`, `S3_REGION`
- [ ] `AUTH_SECRET`, `CRON_SECRET` and `HEALTHCHECK_SECRET` are each at least 32 characters
- [ ] `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is valid base64 of 16, 24 or 32 bytes, and equals the value the image was built with
- [ ] `MFA_ENCRYPTION_KEY` is valid base64 of exactly 32 bytes, identical on every replica and job, and stable across releases
- [ ] `AUTH_URL` and `NEXT_PUBLIC_BASE_URL` are the same HTTPS origin
- [ ] `DATABASE_URL` has `sslmode=require`, `verify-ca` or `verify-full`
- [ ] `REDIS_URL` starts with `rediss://`
- [ ] `S3_ENDPOINT`, if set, is `https://`. `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are both set or both absent
- [ ] `TRUSTED_PROXY_IP_HEADER` is one of `cf-connecting-ip`, `x-forwarded-for`, `x-real-ip`, and is the header your edge really overwrites
- [ ] If an environment SMTP fallback exists, it has `SMTP_USER` and `SMTP_PASSWORD`, or `SMTP_ALLOW_UNAUTHENTICATED=1` is set deliberately for a private relay
- [ ] `CI`, `ALLOW_INSECURE_PRODUCTION_TESTS` and `WEBHOOKS_ALLOW_PRIVATE_TARGETS` are not set
- [ ] Secrets come from a secrets manager or an owner-only file. They are not in logs, shell traces or deployment records
- [ ] `SUPER_ADMIN_EMAIL` is set (recommended in `docs/CONFIGURATION.md`)
- [ ] `ALLOWED_ACTION_ORIGINS` is empty unless a trusted CDN or proxy uses a different host for Server Actions. `ALLOWED_EMBED_ORIGINS` lists only exact HTTPS origins you want to permit
- [ ] If the mobile apps ship: `GOOGLE_MOBILE_CLIENT_IDS`, `ANDROID_APP_SHA256_CERT_FINGERPRINTS` and `APPLE_APP_IDS` are set, and `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` respond correctly
- [ ] If Google sign-in is enabled: `https://<your host>/api/auth/callback/google` is registered with Google

## Build and images

- [ ] The commit's Quality gate run is green ([CI/CD](/deploy/ci-cd))
- [ ] Both images (`runner` and `migrator`) were built from the same commit with the same immutable tag. Nothing deploys `latest`
- [ ] The application image was built with `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` as a BuildKit secret and `NEXT_PUBLIC_BASE_URL` set to the production origin
- [ ] Image repositories are private
- [ ] If publishing from Docker Hub: `DOCKERHUB_USERNAME`, `DOCKERHUB_NAMESPACE`, `NEXT_PUBLIC_BASE_URL`, `DOCKERHUB_TOKEN` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` are set. Otherwise build from source

## Database and migrations

- [ ] Pending migrations are reviewed. Release notes and the changelog are read for lock and overlap warnings
- [ ] A backup exists, was verified, and was copied off the host. The running image tag and the backup file name are recorded
- [ ] Long transactions are ended before migrating (the `pg_stat_activity` query in [Operations](/deploy/operations#upgrades-and-rollback))
- [ ] The migrator ran once, with a lock timeout on its own `DATABASE_URL` when the release notes call for it
- [ ] `node scripts/verify-production-schema.mjs` (or `npm run db:verify`) passes
- [ ] `node scripts/check-instance-secrets.mjs` passes with the production environment
- [ ] `npm run storage:migrate` was run if legacy database-backed assets remain
- [ ] The app runs with a least-privileged database role. Migrations use a migration role

## Staging rehearsal

For a first release, or any release the notes flag as risky ([Staging environment](/deploy/staging)):

- [ ] `npm ci`, `npm run production:check`, `npm run db:deploy`, `npm run db:verify`, `npm run storage:migrate`, `npm run lint`, `npx tsc --noEmit`, `npm run test:coverage` and `npm run build` ran against staging
- [ ] Auth, organisation permissions, RSVP capacity, duplicate RSVP, upload rejection, email delivery and offline check-in sync were exercised
- [ ] A draft event was published from the Overview checklist, and its public page, RSVP and short link work at once
- [ ] An open ticket tears on check-in through the production-shaped proxy, without waiting for the 15 s status check

## Deploy

- [ ] Quiet window chosen. Exports, PDF reports and large sends avoided
- [ ] If the release notes forbid old and new running together, the old container was stopped first (Docker) or the strategy is `Recreate` (Helm)
- [ ] The app was replaced with the new immutable image. On Helm the migration hook ran green
- [ ] A rollback owner is named, and the rollback path (image only, or restore) is decided ([Operations](/deploy/operations#upgrades-and-rollback))

## Verify after deploy

- [ ] `GET /api/health` returns 200 locally and through the public HTTPS origin
- [ ] `GET /api/health/db` with `Authorization: Bearer $HEALTHCHECK_SECRET` returns 200. The readiness probe or monitor uses it
- [ ] The `outbox-scheduler` row in `OperationalHeartbeat` advances about every 60 s
- [ ] An independent scheduler calls `POST /api/internal/outbox` every minute with `Authorization: Bearer $CRON_SECRET` and a timeout of at least 60 s
- [ ] No new permanently failed email: `OutboxMessage` has no fresh `FAILED` rows with `PermanentOutboxError`
- [ ] **Send test email** in Super admin, Settings succeeds. **Send test message** succeeds if an alert webhook is configured
- [ ] An *Instance started* note arrived at the alert webhook, and alert delivery is confirmed
- [ ] Redis health and the error rate are normal
- [ ] Smoke tests pass: `/help`, one published event page, one old ticket, one short link, a check-in, and a machine API v1 call
- [ ] The release, backup point, migration version and rollback owner are recorded

## First-time admin setup

- [ ] The super-admin account has enrolled authenticator MFA. Super-admin access requires a fresh TOTP step-up and is blocked until MFA is enrolled
- [ ] SMTP is saved in Super admin, Settings, and an environment SMTP fallback is kept in the secrets store for disaster recovery
- [ ] Optional: Google sign-in saved in the panel. Optional: alerts webhook saved and tested
- [ ] High-risk organisers are required to enable authenticator MFA at `/account/security`. Google-based users are covered by your organisation's Google MFA policy

## Operating controls

- [ ] Privacy, cookie, acceptable-use, retention and incident-response policies are published
- [ ] Organiser data-export approvals, account export and delete handling, retention periods and a subprocessor register are defined
- [ ] A security-contact address is published, and breach notification responsibilities are documented for each region you serve
- [ ] Restore drills, access reviews, dependency scans, load tests and security tests are scheduled. Point-in-time recovery is tested every quarter with the recovery time and data-loss window recorded
- [ ] Alerts exist for failed backups, failed migrations, a stale outbox heartbeat, queue growth, outbox messages in `FAILED`, unavailable Redis, elevated 5xx rates and database saturation
- [ ] Rotation of `AUTH_SECRET`, `CRON_SECRET`, OAuth, SMTP and database credentials through the secrets manager has been rehearsed ([Operations](/deploy/operations#secret-rotation))
- [ ] An independent security review is booked before processing sensitive or regulated data

## Hostname change

Only when replacing an existing hostname, do all of these in one deployment:

- [ ] `AUTH_URL` and `NEXT_PUBLIC_BASE_URL` updated, and the application rebuilt
- [ ] Google OAuth callback and origin updated
- [ ] DNS, TLS, CDN or WAF, scheduler and monitoring targets updated
- [ ] An HTTPS redirect from the old host stays in place so shared event, ticket, certificate and invitation links keep working. Users may need to sign in again, because cookies are host-specific

## Known boundaries to accept or mitigate

These come from `docs/SECURITY.md`. Decide on each:

- [ ] Certificate eligibility proves knowledge of the confirmed attendee email, not control of that inbox
- [ ] Google OAuth accounts do not use the app's sign-in TOTP challenge. They must still enrol application TOTP before entering the super-admin panel
- [ ] Automated test coverage is broad but low in percentage. Do not make a high-assurance claim without more authorisation and mutation-path tests
- [ ] A wrong `TRUSTED_PROXY_IP_HEADER` throttles all users together

## Further reading

- [Overview](/deploy/overview), [Docker on a single host](/deploy/docker), [Kubernetes with Helm](/deploy/kubernetes), [Operations runbook](/deploy/operations)
- [Configuration](/reference/configuration), [Security checklist](/reference/security-checklist), [Deployment](/reference/deployment)
- [docs/PRODUCTION_RELEASE.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/PRODUCTION_RELEASE.md), [docs/SECURITY.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/SECURITY.md)
