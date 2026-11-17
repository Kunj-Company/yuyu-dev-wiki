# Operations runbook

Day-two tasks for a running Yuyu instance: backups and restores, the outbox scheduler, monitoring and alerts, secret rotation, upgrades and rollback, and first response to incidents. It draws on `docs/production-operations.md`, `docs/PRODUCTION_RELEASE.md` and the files in `scripts/`. The compact command tables are in [Deployment](/reference/deployment) and [Scripts](/reference/scripts). This page is the procedure view.

## Backups and restore

`npm run db:backup` and `npm run db:restore` run from a trusted checkout on an operations host. They are in neither container image. The host needs PostgreSQL `psql`, `pg_dump` and `pg_restore` clients compatible with your server.

### Back up

```bash
npm run db:backup
```

What it does (`scripts/db-backup.mjs`, `scripts/db-backup-lib.mjs`):

- Loads `.env` if it exists. Values already in the environment win, which is what you want in CI and production.
- Reads only `DATABASE_URL`, and refuses it unless it carries `sslmode=require`, `verify-ca` or `verify-full`.
- Queries the live database size and requires free space of that size plus 20% plus 256 MiB.
- Runs `pg_dump --format=custom --compress=9` and writes the archive and a SHA-256 metadata sidecar (`<name>.dump` and `<name>.dump.json`) to `backups/`. That directory is git-ignored. Keep it on encrypted storage.
- Keeps the newest seven complete archive and sidecar pairs and deletes older ones. Incomplete pairs are kept for investigation.
- Passes the password through a temporary owner-only password file, not command-line arguments.

To also copy the archive to a dedicated private backup bucket, pass all five S3 options. Do not save them in app settings or repository files:

```bash
npm run db:backup -- \
  --s3-bucket yuyu-production-backups \
  --s3-region region-name \
  --s3-endpoint https://s3.example.com \
  --s3-access-key-id short-lived-access-key \
  --s3-secret-access-key short-lived-secret \
  --s3-prefix yuyu-production
```

Add `--s3-force-path-style` only for providers that need it. Use short-lived, prefix-scoped credentials. Command-line secrets can leak through shell history or process listings.

The backup fields in Super admin, Settings are display-only. They neither run, retain nor restore backups. Keep real backup controls with your database provider and record successful backups and drills.

### Schedule it

The repository has no backup scheduler. Run `npm run db:backup` from your own cron, CI job or provider tooling, and copy results off the host. A managed provider's daily backups and point-in-time recovery are release requirements in addition to this.

### Restore

Restore is destructive. Read the guard rails first:

- Exactly one source: `--file <archive>` or `--s3-key <key>`.
- `--production` and `--confirm-database <name>` are both required, and the name must equal the target database name parsed from `DATABASE_URL`.
- It refuses a database whose name has a `dev` or `test` segment, and any `localhost`, `127.0.0.1` or `::1` host. Through a local proxy or SSH tunnel to the real server, add `--via-local-tunnel`. Development and test database names are still refused.
- It takes a local safety backup before touching data, then runs `pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error --single-transaction`, then `npm run db:status` and `npm run db:verify`.

```bash
npm run db:restore -- \
  --file backups/yuyu-backup-2026-08-30T00-00-00-000Z.dump \
  --production \
  --confirm-database yuyu
```

From the private bucket, replace `--file` with `--s3-key yuyu-production/<archive>.dump` and repeat the S3 options used for upload. The archive is downloaded temporarily, checksum-verified, restored and removed.

::: warning Restore into an empty database after an upgrade
`pg_restore --clean` runs in one transaction. It fails on a database that has newer tables depending on older ones. After a migration, restore into a new empty database (for example `yuyu_restore`), then point the app at it. Run `db:restore` from a checkout whose migrations match the backup. A newer checkout's follow-up `db:status` sees unapplied migrations and reports `Restore failed.`
:::

### Drill

Restore into a scratch database at least quarterly. Record the time taken and the data-loss window. Test point-in-time recovery with your provider every quarter as well.

## Outbox scheduler

Every app process runs an in-process worker once a minute. It sends queued email, delivers organisation webhooks, purges expired rows and records a heartbeat. See [Background jobs](/architecture/background-jobs) for the internals. Operationally:

- Run an **independent scheduler** as a recovery path. Call `POST /api/internal/outbox` every minute with `Authorization: Bearer $CRON_SECRET`.
- Give the HTTP call a timeout of at least 60 seconds.
- A wrong or missing bearer gets a plain 404. A failed run returns 500 with `{"ok":false,"error":"Scheduler run failed."}`. Success returns `{ ok, sent, failed, webhooks, purged }`.
- Each pass sends one batch of up to 20 emails, so each scheduler adds about 20 a minute. With the in-process worker and one external scheduler, expect about 40. This is deliberately slow: faster draining made Gmail and Google Workspace refuse SMTP logins (`454 4.7.0 Too many login attempts`). A 200-guest broadcast takes about 10 minutes. A 10,000-guest send takes hours.
- Transactional email (sign-in, verification, password reset, tickets, team and submission mail) is claimed before bulk kinds, so a large broadcast never delays a password reset.

An example crontab entry. It is not shipped by the repository. Keep `CRON_SECRET` out of world-readable files:

```bash
# Example only
* * * * * curl --fail --silent --max-time 90 -X POST -H "Authorization: Bearer $CRON_SECRET" https://events.example.com/api/internal/outbox >/dev/null
```

Any scheduler works, for example a Kubernetes CronJob. The repository provides none.

### Check it is healthy

```sql
SELECT key, "lastSucceededAt", "lastSent", "lastFailed", "lastError" FROM "OperationalHeartbeat";
```

The `outbox-scheduler` row should advance about every 60 seconds. For permanently failed email in the last day:

```sql
SELECT kind, count(*) FROM "OutboxMessage"
WHERE status = 'FAILED' AND "lastError" LIKE '%PermanentOutboxError%' AND "createdAt" > now() - interval '1 day'
GROUP BY kind;
```

Super admin, Email shows the queue by kind. After an outage or an overlap during a rolling update, use **Retry failed email (last 7 days)** in Super admin, Operations. It requeues only failures from the last 7 days, so stale broadcasts are not resent. Retry delays are `2^attempts` minutes up to 60 (password-reset and email-verification messages are capped at 8 minutes), and a message fails terminally after 8 attempts or a permanent error.

Retention: sent and failed non-capability outbox rows are purged after `OUTBOX_RETENTION_DAYS` (default 30). Rows carrying tokens or links are deleted right after delivery, expiry or terminal failure.

## Monitoring and alerts

### Endpoints

| Endpoint | Auth | Use |
| --- | --- | --- |
| `GET /api/health` | None | Liveness. Dependency-free. Also the container `HEALTHCHECK` and the Helm startup and liveness probe |
| `GET /api/health/db` | `Authorization: Bearer $HEALTHCHECK_SECRET` | Readiness. Runs `SELECT 1`. 404 without the exact bearer |
| `POST /api/internal/outbox` | `Authorization: Bearer $CRON_SECRET` | Recovery trigger, see above |

Never put either bearer value in a URL or log. Redis is not covered by any built-in probe, so monitor it directly.

### What to alert on

From `docs/production-operations.md`:

- failed backups and failed migrations
- a stale outbox heartbeat
- pending or processing email queue growth, and outbox messages in `FAILED`
- unavailable Redis
- elevated 5xx rates
- database saturation

A provider's acceptance response is only SMTP handoff, not inbox placement. Watch bounces and delivery events with your email provider.

### The alerts webhook

Configure it in Super admin, Settings (needs a fresh TOTP step-up). It takes a Mattermost or Slack-compatible incoming-webhook URL, which must be `https:` in production and must not embed user info. The URL carries its own credential, so it is encrypted like the SMTP password and only its host is shown. Use **Send test message** after saving.

When enabled, each app process posts:

- uncaught server errors from page renders, route handlers, Server Actions and the proxy, with the route pattern rather than the request path
- every server `console.error` line, and `console.warn` lines when **Include warnings** is on
- Auth.js sign-in failures with their error type. Expected outcomes, such as a wrong password or an unverified email, are not alerts
- outbox email delivery failures with the SMTP error code, and failed scheduler runs
- browser crashes caught by the app's error boundaries, through `POST /api/client-errors`
- an *Instance started* note whenever a process boots, which marks deploys and restarts

Behaviour to know:

- Alert text is redacted before it leaves the instance: URLs and connection strings, email addresses, bearer values, `token=` parameters and long opaque strings.
- Identical alerts collapse for five minutes with a repeat count afterwards. Each process sends at most 30 alerts a minute.
- Delivery is best effort with a 5 second timeout and never fails the request that raised it.
- Each process re-reads the setting at most every 60 seconds, so a change reaches other replicas within a minute. With several replicas expect one *Instance started* note per replica.
- Every app process needs outbound HTTPS to the webhook host.

## Secret rotation

The server validates only the format of keys at startup. Plan every rotation with the effect in mind.

| Secret | Where it lives | Rotation effect and steps |
| --- | --- | --- |
| `AUTH_SECRET` | Runtime env | Rotate through the secrets manager and restart all app processes. The repository does not document the effect on existing sessions, so rehearse it on staging |
| `CRON_SECRET` | Runtime env and your scheduler | Update the secret and the scheduler's header together, then restart all app processes. Until both match, the scheduler gets 404s and only the in-process worker runs |
| `HEALTHCHECK_SECRET` | Runtime env and monitors | Update the secret, restart all processes, then update monitors. On Helm the readiness probe reads it from the container environment, so restart all pods together |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Build-time secret and runtime env | A new key needs a new image build and the same value at runtime. Rotating it invalidates outstanding Server Action forms. Schedule it for a quiet period |
| `MFA_ENCRYPTION_KEY` | Runtime env, every replica and job | See below. The repository has no re-encryption tool |
| S3 keys, database credentials, SMTP environment fallback | Runtime env | Update the secrets manager and restart. Rehearse revocation |
| Panel SMTP password, Google client secret, alert webhook | Database, encrypted | Re-enter in Super admin, Settings. Takes effect on the next send or sign-in with no restart |

After rotating any environment secret on Kubernetes, restart every pod together (`kubectl rollout restart`), because `envFrom` is read only at pod start. On Docker, recreate the container.

### MFA_ENCRYPTION_KEY

This key encrypts TOTP seeds directly. A domain-separated subkey encrypts the panel's SMTP password, Google client secret and alert webhook URL, and another encrypts organisation webhook signing secrets.

A replica with a different key still starts and passes health checks. It does not crash-loop. But on that replica every use of a value encrypted with the original key fails: outbox delivery, Google sign-in, alerts and TOTP checks, including the super-admin step-up you need to fix settings. Behind a load balancer this looks intermittent.

Detect it, using exactly the environment the app receives:

```bash
node --env-file=/secure/path/yuyu.env scripts/check-instance-secrets.mjs
```

On Docker, run it in the migrator image. On Helm, set `migration.checkInstanceSecrets=true`. The script reports which stored values it cannot decrypt, never prints values or user identifiers, and exits non-zero on failure.

Fix a mismatch by putting the original key back on every replica and job. If the original key is lost:

1. Set one new key everywhere.
2. Re-enter the SMTP password, Google client secret and alert webhook in Super admin, Settings.
3. Have enrolled users re-enrol MFA. Their recovery codes are hashed, not encrypted, and still work.

A deliberate rotation is the same situation, because nothing in `scripts/` or `lib/` re-encrypts stored seeds. Rotating the key without re-encrypting prevents enrolled users from validating TOTP codes. Plan it as a lost-key recovery, keep the old key until users have re-enrolled, and run the check script afterwards. This is an inference from the absence of a tool, not a documented procedure.

If an SMTP environment fallback is kept in the secrets store, email can resume while the panel is being repaired. It applies only while the panel has no SMTP saved.

### Revoking sessions

Users can revoke sessions at `/account/security`. Incrementing a user's `sessionVersion` invalidates every web and mobile session for that user. Password change or reset and MFA changes do this automatically.

## Upgrades and rollback

The step order is in [Docker on a single host](/deploy/docker#upgrade-an-existing-installation) and [Kubernetes with Helm](/deploy/kubernetes#upgrade). This section covers what can go wrong.

### Before migrating

1. Read the release notes in `docs/production-operations.md` ("Recent schema migrations" and the lock checklist) and the changelog.
2. Take and verify a backup. Copy the `.dump` and its `.dump.json` sidecar off the host and note the file name. Record the running image tag. Keep the backup until the new release has run for a while. It is the full rollback path.
3. For a long-running instance, check hand-made schema drift read-only, from a checkout of the running release:

   ```bash
   npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
   ```

   Known, expected differences are listed per release in `docs/production-operations.md`. Resolve anything else before upgrading.
4. Pick a quiet window. Avoid exports, PDF reports and large sends.

### Locks

Prisma applies each migration in one transaction with no lock timeout. Migrations that alter `Event` or `RSVP` wait for an ACCESS EXCLUSIVE lock, and while they wait, reads and writes of that table from the running pods queue behind them. Before migrating, end long transactions:

```sql
SELECT pid, now() - xact_start AS age, left(query, 80)
FROM pg_stat_activity
WHERE datname = current_database() AND xact_start IS NOT NULL
ORDER BY xact_start;
```

Run the migrator with a lock timeout on **the migrator's** `DATABASE_URL` only, for example by appending `&options=-c%20lock_timeout%3D5s` (`?options=` if the URL has no query string). The Helm chart cannot give the Job a different URL. See the warning in [Kubernetes with Helm](/deploy/kubernetes#migration-hook).

If a migration fails with `lock timeout`, it rolled back as a whole. Find and end the blocker, mark the migration, and run again:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
npm run db:deploy
```

To find a blocker: `SELECT pid, pg_blocking_pids(pid), left(query, 80) FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;` then `SELECT pg_terminate_backend(<pid>);`. Never kill a running migration job. That leaves a failed migration to resolve. On a large instance the release notes may also suggest pre-building indexes with `CREATE INDEX CONCURRENTLY`. A failed concurrent build leaves an `INVALID` index. Drop it and run it again.

### Old and new side by side

An older release's outbox worker marks email kinds it does not know as `FAILED` with `PermanentOutboxError`. For releases that introduce new kinds, do not run the two together: stop the old Docker container before the new one serves traffic, or use `Recreate` on Helm. As a safety net the new release requeues such rows once, if created in the last 7 days. Afterwards check Super admin, Email for `FAILED` rows of the new kinds and use **Retry failed email (last 7 days)**.

### Rollback paths

Migrations cannot be reversed in place. A failed migration is not a rollback case. It rolled back atomically, so fix the cause and rerun it.

**Image-only rollback** is safe only while the database holds no data the old release cannot read. This is release-specific. For the release that added teams, judging, attendance confirmation and crew, the old Prisma client cannot read a `CREW` page section or a `JUDGE` grant. Check first:

```sql
SELECT count(*) FROM "EventPageSection" WHERE type = 'CREW';
SELECT count(*) FROM "EventCollaborator" WHERE 'JUDGE' = ANY(permissions);
```

When both are 0, run the recorded previous image. Expect the old release to ignore the new data (it counts crew against capacity and treats team events as individual events), and its outbox worker to fail queued email of the new kinds. Read the release notes for the equivalent check on other releases.

**Restore the backup** once data the old release cannot read exists. This discards everything written since the backup:

1. Stop the application.
2. Create a new empty database (name without a `dev` or `test` segment).
3. From a checkout matching the backup's schema, with `DATABASE_URL` pointing at it, run `npm run db:restore -- --file backups/<name>.dump --production --confirm-database <dbname>`.
4. Point the app at the restored database and start the previous image.

The repository's rehearsal restored a small production-shaped database in 1.4 s. If a restore is not acceptable, the release notes give a minimal cleanup that removes the unreadable values (deleting the `CREW` sections and `JUDGE` grants) at the cost of losing crew pages and judge access. See `docs/PRODUCTION_RELEASE.md`.

## Incident basics

| Symptom | First checks |
| --- | --- |
| Site down | `GET /api/health` locally. If 200, the proxy or DNS. If not, container or pod logs and restarts |
| Pods not ready, health is fine | `/api/health/db` with the bearer. Then PostgreSQL reachability, credentials and TLS settings |
| Email not sending | `OperationalHeartbeat` and `FAILED` rows. **Send test email**. SMTP saved in the panel, or fallback present. Egress on 465 or 587. Run `check-instance-secrets.mjs` |
| Intermittent email, Google or TOTP failures | `MFA_ENCRYPTION_KEY` differs between replicas or jobs. Run the check script and restart all pods together |
| Many users throttled or sign-in fails site-wide | `TRUSTED_PROXY_IP_HEADER` names a header the edge does not set, so everyone shares one IP bucket. See [Reverse proxy and TLS](/deploy/reverse-proxy#trusted-proxy-ip-header) |
| Tickets do not tear on check-in | Proxy is buffering `/api/ticket/:token/events`, or Redis is unreachable between replicas |
| Security-sensitive requests rejected | Redis is unavailable. Production fails closed |
| Alerts silent | Webhook saved and tested, egress to the webhook host on 443. Settings re-read at most every 60 s |
| Webhook deliveries failing | Egress on 443 and 8443. Endpoints switch off after 20 consecutive failures. User actions are unaffected |
| Migration stuck or failed | Lock section above. Do not kill the job |

More known problems and fixes: [Troubleshooting](/reference/troubleshooting).

Housekeeping the repository expects:

- Keep an incident log, publish a security-contact address and document breach-notification responsibilities per region.
- Never put passwords, reset tokens, ticket tokens, full registration answers or email addresses in logs or audit metadata. Rotate any credential that was exposed.
- Define retention for expired verification tokens, old offline rosters, unused assets and guest registration data. The scheduler purges operational rows only. It never deletes business or audit data.
- Users can export their own data from `/account/registrations`. Fulfil other access, correction and deletion requests through audited administrator workflows.

## Further reading

- [Production checklist](/deploy/production-checklist), [Docker on a single host](/deploy/docker), [Kubernetes with Helm](/deploy/kubernetes)
- [Background jobs](/architecture/background-jobs), [Configuration](/reference/configuration), [Scripts](/reference/scripts), [Troubleshooting](/reference/troubleshooting)
- [docs/production-operations.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/production-operations.md), [docs/PRODUCTION_RELEASE.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/PRODUCTION_RELEASE.md)
