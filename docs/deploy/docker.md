# Docker on a single host

This is the supported way to run Yuyu without Kubernetes: two images, one environment file, a reverse proxy in front, and managed PostgreSQL, Redis, S3 and SMTP behind. The compact reference is [Deployment](/reference/deployment). This page is the step-by-step version. Read [Choose a deployment path](/deploy/overview) first if you have not.

::: warning No production Compose file
The repository provides no production `docker compose` stack. Every command below uses `docker run` against images you build or pull. `compose.staging.yml` is for [staging](/deploy/staging) only.
:::

## Before you start

You need:

- Docker with BuildKit on the build machine, and Docker on the host.
- A trusted checkout of the commit you are deploying. You use it for the preflight check and for `db:backup` and `db:restore`, which are not in either image.
- PostgreSQL client tools (`psql`, `pg_dump`, `pg_restore`) compatible with your server, for backups.
- One canonical HTTPS hostname, for example `https://events.example.com`, with DNS and a [reverse proxy](/deploy/reverse-proxy) ready.
- PostgreSQL, Redis, a private S3 bucket and SMTP. See the [overview](/deploy/overview#services-you-must-provide).

## 1. Get the images

You have two options.

**Pull from a registry** that the [publish workflow](/deploy/ci-cd) pushed to. Use the immutable `sha-...` tag, or the digest from the job summary:

```bash
export YUYU_VERSION=sha-COMMIT-RUNID-ATTEMPT   # example value, copy yours from the job summary

docker pull registry.example.com/yuyu-migrator:${YUYU_VERSION}
docker pull registry.example.com/yuyu:${YUYU_VERSION}
```

**Build from source.** Build both targets from the same reviewed commit and give them the same tag:

```bash
export YUYU_VERSION=1.0.0
export NEXT_PUBLIC_BASE_URL=https://events.example.com
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # new instance only

docker build --target migrator \
  --tag registry.example.com/yuyu-migrator:${YUYU_VERSION} .

docker build --target runner \
  --secret id=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY \
  --build-arg NEXT_PUBLIC_BASE_URL="$NEXT_PUBLIC_BASE_URL" \
  --tag registry.example.com/yuyu:${YUYU_VERSION} .
```

Rules:

- The `runner` build fails without the BuildKit secret (`required=true`). The key is consumed while Next.js compiles Server Actions.
- `NEXT_PUBLIC_BASE_URL` is the only build-visible setting. Changing the hostname means a rebuild. SMTP, Google sign-in and alerts live in the database and never need one.
- For an existing instance, reuse its existing Server Actions key. Generating a new one invalidates outstanding Server Action forms. Do not share the key between independent Yuyu instances.
- Never deploy `latest`. Push immutable tags to a private registry.

## 2. Write the environment file

Keep the file outside the repository and readable only by its owner:

```bash
umask 077
touch /secure/path/yuyu.env
```

A skeleton, using the variable names from `docs/CONFIGURATION.md`. This is an example. Replace every placeholder:

```dotenv
# Example only. Docker's --env-file keeps quotes literally, so write values without quotes.
DATABASE_URL=postgresql://yuyu:PASSWORD@db.example.com:5432/yuyu?sslmode=require
REDIS_URL=rediss://:PASSWORD@redis.example.com:6379

AUTH_URL=https://events.example.com
NEXT_PUBLIC_BASE_URL=https://events.example.com
SUPER_ADMIN_EMAIL=you@example.com

AUTH_SECRET=<at least 32 characters>
CRON_SECRET=<at least 32 characters>
HEALTHCHECK_SECRET=<at least 32 characters>
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<same value as the build>
MFA_ENCRYPTION_KEY=<base64, 32 bytes>

TRUSTED_PROXY_IP_HEADER=x-real-ip

S3_BUCKET=yuyu-production
S3_REGION=region-name
# S3_ENDPOINT=https://s3.example.com
# S3_ACCESS_KEY_ID=...
# S3_SECRET_ACCESS_KEY=...
# S3_FORCE_PATH_STYLE=1

# Optional fallback for bootstrap and disaster recovery. Ignored once SMTP is saved in the panel.
# EMAIL_FROM=Yuyu Events <noreply@events.example.com>
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASSWORD=...
```

The preflight requires these twelve variables: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_BASE_URL`, `REDIS_URL`, `CRON_SECRET`, `HEALTHCHECK_SECRET`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, `MFA_ENCRYPTION_KEY`, `TRUSTED_PROXY_IP_HEADER`, `S3_BUCKET` and `S3_REGION`. `TRUSTED_PROXY_IP_HEADER` must be one of `cf-connecting-ip`, `x-forwarded-for` or `x-real-ip`, and it must match what your proxy overwrites. See [Reverse proxy and TLS](/deploy/reverse-proxy).

Key points:

| Rule | Why |
| --- | --- |
| `AUTH_URL` and `NEXT_PUBLIC_BASE_URL` are the same HTTPS origin | Startup and the preflight reject a mismatch |
| `MFA_ENCRYPTION_KEY` is identical for the app and every migrator or one-off container, and stable across releases | It decrypts TOTP seeds and the panel's SMTP, Google and alert secrets. A different key still starts and passes health checks, then fails at use |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` equals the build's value | Server Actions break otherwise |
| Remove `CI`, `ALLOW_INSECURE_PRODUCTION_TESTS` and `WEBHOOKS_ALLOW_PRIVATE_TARGETS` | They are for CI and staging. The preflight refuses the last one |

Blank values are treated as unset. Never print the file in logs or shell traces.

## 3. Run the preflight

From the trusted checkout:

```bash
node --env-file=/secure/path/yuyu.env scripts/check-production-env.mjs
```

It prints `Production environment preflight passed.` or the first failure. It checks secret lengths, key shapes, the HTTPS origins, `sslmode`, `rediss://`, an HTTPS `S3_ENDPOINT`, paired S3 keys and the proxy header value. It cannot see the database.

## 4. Back up, then migrate

On a new empty database there is nothing to back up. For an upgrade, take and verify a backup first ([Operations](/deploy/operations#backups-and-restore)).

```bash
docker run --rm \
  --env-file /secure/path/yuyu.env \
  registry.example.com/yuyu-migrator:${YUYU_VERSION}

docker run --rm \
  --env-file /secure/path/yuyu.env \
  registry.example.com/yuyu-migrator:${YUYU_VERSION} \
  node scripts/verify-production-schema.mjs
```

The migrator's default command is `npx prisma migrate deploy`. The second command checks the schema contract. For an upgrade, also run the instance-secret check, which fails if `MFA_ENCRYPTION_KEY` cannot decrypt what the panel saved:

```bash
docker run --rm \
  --env-file /secure/path/yuyu.env \
  registry.example.com/yuyu-migrator:${YUYU_VERSION} \
  node scripts/check-instance-secrets.mjs
```

A migration that waits on a table lock can stall the site. Release notes for some versions call for a lock timeout on the migrator's `DATABASE_URL` only. See [Upgrades](#upgrade-an-existing-installation) and [Operations](/deploy/operations#upgrades-and-rollback).

## 5. Start the application

With the proxy on the host, bind to loopback only:

```bash
docker run -d \
  --name yuyu \
  --restart unless-stopped \
  --env-file /secure/path/yuyu.env \
  --publish 127.0.0.1:3000:3000 \
  registry.example.com/yuyu:${YUYU_VERSION}
```

If the proxy is another container, put both on a private Docker network instead of publishing a port. Do not publish PostgreSQL, Redis or storage administration ports to the internet. Docker's default bridge network allows the outbound access the app needs. Check any host firewall or egress proxy.

The image runs as the non-root user `nextjs` (uid 1001), has no `.env` files, and includes `font-dejavu`, which Sharp needs to render tickets and certificates.

## 6. Health checks

| Check | Command | Expect |
| --- | --- | --- |
| Liveness, local | `curl --fail http://127.0.0.1:3000/api/health` | 200 and `{"ok":true,...}` |
| Liveness, public | `curl --fail https://events.example.com/api/health` | 200 |
| Readiness | `curl --fail -H "Authorization: Bearer $HEALTHCHECK_SECRET" http://127.0.0.1:3000/api/health/db` | 200. Runs `SELECT 1` |
| Container health | <code v-pre>docker inspect --format '{{.State.Health.Status}}' yuyu</code> | `healthy` |

`/api/health` is dependency-free. `/api/health/db` answers 404 without the exact bearer value, so an unauthenticated probe cannot tell it exists. Pass the secret in the header, never in a URL. The image's own `HEALTHCHECK` calls `/api/health` every 30 s with a 20 s start period.

Then confirm the outbox worker is alive. After about a minute the heartbeat row advances:

```sql
SELECT key, "lastSucceededAt", "lastSent", "lastFailed", "lastError" FROM "OperationalHeartbeat";
```

Look at the `outbox-scheduler` row.

## 7. First sign-in and panel setup

1. Sign in with the `SUPER_ADMIN_EMAIL` account and enrol authenticator MFA. The super-admin area needs a fresh TOTP step-up and is unavailable until MFA is enrolled.
2. Open `/super-admin/settings`. Save SMTP, optionally Google sign-in, and optionally the alerts webhook. If Google is enabled, register `https://events.example.com/api/auth/callback/google` with Google.
3. Use **Send test email** (and **Send test message** for the webhook). Do this before accepting registrations.
4. Keep an environment SMTP fallback in your secrets store for disaster recovery. It applies only while the panel has no SMTP saved.
5. Add the scheduler and monitoring from [Operations](/deploy/operations#outbox-scheduler).

## Upgrade an existing installation

Use this order for every release:

1. Complete the [production checklist](/deploy/production-checklist) items that apply. Read the release notes in `docs/production-operations.md` and the changelog for migration and overlap warnings.
2. Take and verify a backup. Record the running image tag.
3. Pull the new `yuyu` and `yuyu-migrator` images.
4. Run the new migrator once, then `verify-production-schema.mjs` and `check-instance-secrets.mjs` in the same image and environment.
5. Replace the application container:

   ```bash
   docker stop yuyu
   docker rename yuyu yuyu-previous

   docker run -d \
     --name yuyu \
     --restart unless-stopped \
     --env-file /secure/path/yuyu.env \
     --publish 127.0.0.1:3000:3000 \
     registry.example.com/yuyu:${YUYU_VERSION}
   ```

6. Verify liveness, readiness, the outbox heartbeat, a test email, Redis health and the error rate.
7. Remove `yuyu-previous` only when the new release is healthy.

Stopping the old container before starting the new one gives a short outage but means the two releases never run side by side. That matters when a release's notes forbid overlap: the older release's outbox worker marks email kinds it does not know as `FAILED`.

### Roll back the container

```bash
docker stop yuyu
docker rename yuyu yuyu-failed
docker rename yuyu-previous yuyu
docker start yuyu
```

This reverts the code only. Migrations are not reversed. Rolling back the image is safe only while the database holds nothing the old release cannot read. Otherwise restore the pre-upgrade backup. See [Operations](/deploy/operations#upgrades-and-rollback).

## Limits of the images

| Missing from the image | Where to run it instead |
| --- | --- |
| Prisma CLI and `db:*` scripts in the `runner` image | The `migrator` image, or a trusted checkout |
| `npm run storage:migrate`, `db:backup`, `db:restore` (in neither image) | A trusted checkout or operations host. `storage:migrate` is only needed while legacy database-backed assets exist |
| `scripts/check-production-env.mjs` (in neither image) | A trusted checkout |

An image-only installer and a bundled production Compose stack are noted in the repository as future work, not current features.

## Further reading

- [Reverse proxy and TLS](/deploy/reverse-proxy), [Operations runbook](/deploy/operations), [Production checklist](/deploy/production-checklist)
- [Deployment](/reference/deployment), [Configuration](/reference/configuration), [Scripts](/reference/scripts)
- [docs/DEPLOYMENT_DOCKER.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DEPLOYMENT_DOCKER.md)
