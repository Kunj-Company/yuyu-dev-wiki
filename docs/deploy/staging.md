# Staging environment

`compose.staging.yml` and `.env.staging.example` define a disposable staging stack: the application and every backing service run on one VM under Docker Compose. The maintainers use it to rehearse releases on a real hostname before production. It is a test rig, not a production topology.

::: warning Never use staging settings for real data
The staging template sets `CI=true` and `ALLOW_INSECURE_PRODUCTION_TESTS=1`. Together these switch off the production transport checks. Do not copy them, or the Compose file, into a production deployment. There is no production Compose stack in the repository. See [Docker on a single host](/deploy/docker) or [Kubernetes with Helm](/deploy/kubernetes).
:::

## What the stack contains

| Service | Image or target | Exposure |
| --- | --- | --- |
| `postgres` | `postgres:16-alpine`, database `yuyu_staging`, user `yuyu` | No host port |
| `redis` | `redis:7-alpine`, append-only, password required | No host port |
| `minio` | `minio/minio:latest` | No host port |
| `minio-init` | `minio/mc:latest`. Creates the bucket named by `S3_BUCKET` and sets it private (`mc anonymous set none`) | One-shot |
| `mailpit` | `axllent/mailpit:latest` | UI on `127.0.0.1:8025` |
| `migrate` | Built from the `migrator` target. Reads `.env.staging` | One-shot |
| `app` | Built from the `runner` target. Reads `.env.staging` | `127.0.0.1:3001` mapped to container port 3000 |

`app` waits for `migrate` to complete successfully, for `postgres` and `redis` to be healthy, and for `minio-init` to complete. `migrate` and `app` share `.env.staging`, so they use the same `MFA_ENCRYPTION_KEY`. Compose volumes: `postgres_data`, `redis_data`, `minio_data`.

Unlike production, staging builds the images on the VM from a checkout. `app` takes `NEXT_PUBLIC_BASE_URL` as a build argument and the Server Actions key as a BuildKit secret, both from `.env.staging`.

Nginx is not part of the stack. It runs directly on the host as the TLS reverse proxy and forwards to `127.0.0.1:3001`. The maintainers' nginx block is reproduced and explained in [Reverse proxy and TLS](/deploy/reverse-proxy).

## Env file

```bash
cd /opt/yuyu-staging/app          # the maintainers' server layout
cp .env.staging.example .env.staging
chmod 600 .env.staging
```

The template lists these groups of values:

| Group | Variables |
| --- | --- |
| Database | `DATABASE_URL`, `POSTGRES_PASSWORD` |
| Redis | `REDIS_URL`, `REDIS_PASSWORD` |
| URLs | `AUTH_URL`, `NEXT_PUBLIC_BASE_URL` |
| Secrets | `AUTH_SECRET`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, `MFA_ENCRYPTION_KEY`, `CRON_SECRET`, `HEALTHCHECK_SECRET` |
| Proxy | `TRUSTED_PROXY_IP_HEADER` (`x-forwarded-for` in the template), `ALLOWED_ACTION_ORIGINS` (empty) |
| Storage | `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (`http://minio:9000`), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` |
| Email | `EMAIL_FROM`, `SMTP_HOST` (`mailpit`), `SMTP_PORT` (`1025`), `SMTP_SECURE`, `SMTP_ALLOW_UNAUTHENTICATED` |
| Google | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (empty) |
| Insecure exceptions | `CI`, `ALLOW_INSECURE_PRODUCTION_TESTS` |

Rules:

- `POSTGRES_PASSWORD` must equal the password inside `DATABASE_URL`. `REDIS_PASSWORD` must equal the password inside `REDIS_URL`.
- Generate the five secrets as described in [Configuration](/reference/configuration). `AUTH_SECRET`, `CRON_SECRET` and `HEALTHCHECK_SECRET` need 32 or more characters. The two encryption keys are base64 (`openssl rand -base64 32`).
- Keep `MFA_ENCRYPTION_KEY` when you recreate the file. It decrypts the SMTP password, Google client secret and alert webhook saved in Super admin, Settings.
- `AUTH_URL` and `NEXT_PUBLIC_BASE_URL` are still HTTPS in the template. Only the transport to the backing services is insecure.
- The template sets `NODE_ENV=production`, so the app runs its production code paths.

## Run it

Start infrastructure, initialise the bucket, migrate, build and start the app:

```bash
docker compose --env-file .env.staging -f compose.staging.yml up -d postgres redis minio mailpit
docker compose --env-file .env.staging -f compose.staging.yml up minio-init
docker compose --env-file .env.staging -f compose.staging.yml run --rm migrate
docker compose --env-file .env.staging -f compose.staging.yml build app
docker compose --env-file .env.staging -f compose.staging.yml up -d app
docker compose --env-file .env.staging -f compose.staging.yml ps
```

Starting `app` runs `migrate` first anyway. Running it explicitly shows the output.

Check the result. Both calls should return HTTP 200:

```bash
curl -I http://127.0.0.1:3001/api/health
curl -I https://events.dev.idliapps.com/api/health   # the maintainers' staging host; use yours
```

Check that the key still decrypts the saved panel secrets:

```bash
docker compose --env-file .env.staging -f compose.staging.yml run --rm migrate node scripts/check-instance-secrets.mjs
```

Mailpit's UI is bound to loopback. Reach it through an SSH tunnel.

### Redeploy

Back up first (see the note below), then:

```bash
cd /opt/yuyu-staging/app
git pull --ff-only
docker compose --env-file .env.staging -f compose.staging.yml build app migrate
docker compose --env-file .env.staging -f compose.staging.yml run --rm migrate
docker compose --env-file .env.staging -f compose.staging.yml up -d app
docker compose --env-file .env.staging -f compose.staging.yml ps
```

::: warning db:backup refuses the staging database URL
The documentation says to take a database backup before migrating, but `npm run db:backup` requires `sslmode=require`, `verify-ca` or `verify-full` in `DATABASE_URL`, and the staging URL has none. Use plain PostgreSQL tooling against the `postgres` container instead, for example `docker compose --env-file .env.staging -f compose.staging.yml exec postgres pg_dump -U yuyu -Fc yuyu_staging > staging.dump`. That command is an example, not a repository script.
:::

## The insecure CI exceptions

`CI=true` together with `ALLOW_INSECURE_PRODUCTION_TESTS=1` is the only combination that unlocks them. Neither variable alone has an effect. With both set, a production build accepts:

| Normally required in production | Allowed under the exceptions |
| --- | --- |
| `https` for `AUTH_URL` and `NEXT_PUBLIC_BASE_URL` | `http` origins (the origins must still match) |
| `sslmode=require` or stronger on `DATABASE_URL` | Non-TLS PostgreSQL |
| `rediss://` for `REDIS_URL` | Plain `redis://`, and a controlled in-memory Redis fallback |
| HTTPS `S3_ENDPOINT` | `http://minio:9000` |
| SMTP over TLS 1.2+ with certificate verification | Mailpit on plain port 1025 |
| `WEBHOOKS_ALLOW_PRIVATE_TARGETS` unset | Honoured by the production build, so webhooks can target local `http` receivers |

The Quality gate's container smoke test and production browser tests use the same two variables. See [CI/CD](/deploy/ci-cd).

### Why this is not production

- Database, cache and storage traffic is unencrypted. It is safe only because it stays on the VM's private Docker network.
- The in-memory Redis fallback does not fail closed. Production deliberately rejects security-sensitive traffic when Redis is down, and multi-replica rate limits would not be shared.
- Mail goes to Mailpit unless you save an external relay in the panel. Mailpit accepts everything and delivers nothing.
- `minio/minio:latest`, `mailpit:latest` and `minio/mc:latest` are unpinned tags.
- Everything, including data, lives on one VM with no managed backups, no point-in-time recovery and no restore drill. `db:backup` and `db:restore` do not work against it as configured.
- With `WEBHOOKS_ALLOW_PRIVATE_TARGETS` honoured, the organisation webhook SSRF protections that production enforces are relaxed.

`npm run production:check` also refuses `WEBHOOKS_ALLOW_PRIVATE_TARGETS` outside this exception mode, and the Helm chart and production guides tell you to remove `CI` and `ALLOW_INSECURE_PRODUCTION_TESTS` before going live.

### Email and alerts in staging

The `EMAIL_FROM` and `SMTP_*` values point at Mailpit and are only a fallback. Once SMTP is saved in Super admin, Settings, they are ignored entirely. Clear the panel's SMTP to return to Mailpit. Panel changes apply on the next send or sign-in with no restart. The app container sends email from its in-process outbox worker and posts alerts straight to the webhook, so the VM needs outbound HTTPS, plus outbound SMTP for a real relay. To test real delivery, save an external TLS relay in the panel.

## Using staging to rehearse a release

Staging is the place to run the production steps that need a throwaway database: `db:deploy`, `db:verify`, `storage:migrate`, and exercising auth, permissions, RSVP capacity, upload rejection, email delivery and offline check-in sync. See the [Production checklist](/deploy/production-checklist). Staging can also verify the ticket tear through your proxy. See [Reverse proxy and TLS](/deploy/reverse-proxy#verify).

## Further reading

- [Production checklist](/deploy/production-checklist), [Reverse proxy and TLS](/deploy/reverse-proxy), [CI/CD](/deploy/ci-cd)
- [Deployment](/reference/deployment#compose-files), [Configuration](/reference/configuration)
- [docs/DEPLOYMENT_STAGING.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DEPLOYMENT_STAGING.md)
