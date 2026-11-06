# Local setup

**Goal:** go from a fresh clone to a running Yuyu at `http://localhost:3000` with a signed-in user, an organisation, and super-admin access.

## Before you start

| Need | Notes |
| --- | --- |
| Node.js 20 or newer | CI uses Node 20. Node 22.18 or newer is needed only for `npm run brand:generate` and the perf seed, which run TypeScript files directly |
| npm | The repo ships `package-lock.json`. CI uses `npm ci` |
| Docker with Compose | `docker-compose.yml` provides PostgreSQL only |
| `openssl` | For generating local secrets |
| An authenticator app | Only for super-admin access (TOTP) |

Redis, SMTP and S3 are optional for local development:

| Service | Without it, locally |
| --- | --- |
| Redis | Rate limiting uses a process-local in-memory fallback, and live ticket check-in uses an in-process emitter shared through `globalThis`. Both work on a single dev server |
| SMTP | Emails are "sent" to a mock that logs a line such as `[EMAIL MOCK] Verification email queued` and never prints links |
| S3 | Uploaded assets stay in PostgreSQL as database blobs (`Asset.fileData`) |

::: tip
`local.sh` in the repo root is a macOS helper that starts a Homebrew PostgreSQL and runs `npx prisma db push`. The documented path below uses Docker and migrations. Prefer it, because `db:push` skips the migration history that production uses.
:::

## Steps

### 1. Clone and install

```bash
git clone https://github.com/twilighty-abhi/yuyu.git
cd yuyu
npm install            # postinstall runs `prisma generate`
```

### 2. Start PostgreSQL

```bash
docker compose up -d
docker compose ps      # wait until postgres is "healthy"
```

The Compose service runs `postgres:16-alpine` on port `5432` with user `yuyu`, password `yuyu_dev` and database `yuyu_dev`, stored in the `yuyu_pgdata` volume. These values already match `DATABASE_URL` in `.env.example`.

### 3. Create `.env`

```bash
cp .env.example .env
```

`.env` is git-ignored (`.env*` except the two example files). Never commit it.

Set these for local development:

| Variable | Local value | Why |
| --- | --- | --- |
| `DATABASE_URL` | Keep the `.env.example` value | Points at the Compose database |
| `AUTH_SECRET` | `openssl rand -base64 32` | Auth.js signing. The super-admin MFA proof also requires it to be at least 32 characters |
| `MFA_ENCRYPTION_KEY` | `openssl rand -base64 32` | Must decode to exactly 32 bytes. Needed to enrol TOTP, which super-admin access requires |
| `SUPER_ADMIN_EMAIL` | The email you'll sign up with | Only this verified email can open `/super-admin` |

Optional, but useful:

| Variable | When to set it |
| --- | --- |
| `AUTH_URL`, `NEXT_PUBLIC_BASE_URL` | Set both to `http://localhost:3000` for localhost-only work. Leave both unset for LAN or phone testing so Auth.js derives the host from the request. Sent emails need an absolute `NEXT_PUBLIC_BASE_URL` for links and images |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | `openssl rand -base64 32`. Not required in development, but required in production |
| `CRON_SECRET`, `HEALTHCHECK_SECRET` | `openssl rand -base64 32`. Only needed if you want to call `POST /api/internal/outbox` or `GET /api/health/db` locally |
| `REDIS_URL` | Point at a Redis you run yourself (the commented example is `redis://localhost:6379`). Compose doesn't start one |
| `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Point at a local mail catcher to read real emails. In development, SMTP without credentials is accepted |
| `NEXT_DEV_ALLOWED_ORIGINS` | Comma-separated LAN hosts allowed to load dev assets. `127.0.0.1` and `*.trycloudflare.com` are always allowed (`next.config.ts`) |
| `S3_*` | Only when you work on storage. See [Storage and media](/features/storage-and-media) |

Generate every secret independently:

```bash
openssl rand -base64 32
```

The full list is on [Configuration](/reference/configuration).

### 4. Apply migrations

```bash
npm run db:migrate     # prisma migrate dev
```

This applies every migration in `prisma/migrations/` to `yuyu_dev` and regenerates the Prisma client. Use `npm run db:status` to confirm nothing is pending.

### 5. Run the app

```bash
npm run dev            # prisma generate && next dev
```

Open `http://localhost:3000`. `instrumentation.ts` also starts the in-process outbox worker, so queued emails are processed once a minute.

### 6. Create your first account

1. Go to `/login` and choose **Create account**. New sign-ups are allowed by default (`InstanceSetting.allowNewUserSignups` defaults to `true`). Passwords need 12 to 128 characters and at most 72 UTF-8 bytes (`lib/passwordPolicy.ts`).
2. Password accounts must verify their email before they can sign in (`lib/credentialsAuth.ts` returns `email_verification_required`). Without SMTP the verification email goes to the mock and the link is never printed, so mark the account verified in the database:

   ```bash
   docker compose exec postgres psql -U yuyu -d yuyu_dev \
     -c "UPDATE \"User\" SET \"emailVerified\" = now() WHERE email = 'you@example.com';"
   ```

   Or open `npm run db:studio`, find your row in `User` and set `emailVerified`. If you configured a mail catcher in step 3, click the link in the email instead.
3. Sign in at `/login`.

### 7. Create data

The repo has no general-purpose seed script, so create data through the UI:

1. `/dashboard/org/new`: create an organisation. Any signed-in user can, and the creator becomes its owner.
2. `/dashboard/<orgSlug>`: create an event, then use **Publish event** on its Overview tab. That sets `Event.status` and releases `EventPage.isPublished` together.
3. Open the public page at `/<orgSlug>/<eventSlug>` and register. In another browser profile, sign up a second user to test guest flows.

::: tip Large data sets
`tests/perf/seed-large-event.mts` fills an empty, disposable database (its name must contain `load` or `perf`) with one large hackathon and 20 smaller events. It's meant for query measurement. See `docs/PERFORMANCE.md`.
:::

### 8. Become super admin

1. Make sure `SUPER_ADMIN_EMAIL` in `.env` matches your account's email and `MFA_ENCRYPTION_KEY` is set. Restart `npm run dev` after editing `.env`.
2. Go to `/account/security`, choose **Set up authenticator** and enrol TOTP with your authenticator app.
3. Open `/super-admin`. You'll be redirected to `/super-admin-mfa` for a fresh TOTP code. The proof cookie lasts 10 minutes (`SUPER_ADMIN_MFA_MAX_AGE_SECONDS`).
4. Optionally configure SMTP or Google SSO at `/super-admin/settings`. Saved settings override the `SMTP_*` and `AUTH_GOOGLE_*` environment fallbacks and apply on the next send or sign-in.

If `/super-admin` returns a 404, the signed-in email isn't verified or doesn't match `SUPER_ADMIN_EMAIL`. That's deliberate: `requireSuperAdmin()` answers with `notFound()` so the panel's existence isn't revealed.

## Checklist

- [ ] `docker compose ps` shows `postgres` healthy
- [ ] `.env` has independent values for `AUTH_SECRET` and `MFA_ENCRYPTION_KEY`, plus `SUPER_ADMIN_EMAIL`
- [ ] `npm run db:status` reports no pending migrations
- [ ] You can sign in, create an organisation and publish an event
- [ ] `/super-admin` opens after the TOTP step-up

## Verify

```bash
curl -s http://localhost:3000/api/health      # dependency-free liveness
npm run db:status
npm run lint && npx tsc --noEmit && npm run test:unit
```

To run the integration suites, create a separate disposable database. Never use `yuyu_dev`:

```bash
docker compose exec postgres createdb -U yuyu yuyu_test
DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run db:deploy
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration
```

Re-run the `db:deploy` line after pulling new migrations. See [Testing](/reference/testing).

## Further reading

- [docs/DEVELOPMENT.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DEVELOPMENT.md)
- [docs/CONFIGURATION.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/CONFIGURATION.md)
- [docs/TESTING.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/TESTING.md)
- [Workflow](/start/workflow), [Troubleshooting](/reference/troubleshooting), [Auth and sessions](/architecture/auth-and-sessions)
