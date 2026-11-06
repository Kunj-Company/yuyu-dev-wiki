# Scripts

Every npm script in `package.json` and every file in `scripts/`, with when to use each. Run npm scripts from the repo root.

## npm scripts: development

| Script | Runs | Use it when |
| --- | --- | --- |
| `dev` | `prisma generate && next dev` | Daily development at `http://localhost:3000` |
| `build` | `prisma generate && next build` | Before a PR, and before `test:e2e:production`. Produces standalone output |
| `start` | `next start` | Rarely. Production images run `.next/standalone/server.js` instead |
| `lint` | `eslint` | Every change. The config is `eslint.config.mjs` (`eslint-config-next` core-web-vitals and typescript) |
| `postinstall` | `prisma generate` | Runs automatically after `npm install` / `npm ci` |
| `brand:generate` | `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/generate-brand-assets.ts` | After changing a brand SVG master in `public/brand/`. Needs Node 22.18 or newer. Commit the outputs |

The type check has no npm script: run `npx next typegen && npx tsc --noEmit`, as CI does.

## npm scripts: tests

| Script | Runs | Use it when |
| --- | --- | --- |
| `test` | `npm run test:unit` | Alias |
| `test:unit` | `vitest run` | Every change |
| `test:unit:watch` | `vitest` | While writing unit tests |
| `test:integration` | `vitest run --config vitest.integration.config.mts` | Domain, mutation and query changes. Requires `TEST_DATABASE_URL` pointing at a **disposable**, migrated database. Files run one at a time |
| `test:coverage` | `vitest run --config vitest.coverage.config.mts --coverage` | Before a PR, and in the Quality gate |
| `test:e2e` | `playwright test` | Routing, auth and public-flow changes. Starts `npm run dev` on `127.0.0.1:3000` (or `PLAYWRIGHT_PORT`) unless one is already running |
| `test:e2e:production` | `node scripts/prepare-standalone.mjs && PLAYWRIGHT_PRODUCTION_SERVER=1 playwright test` | Security, headers, auth, tickets and public flows. Run `npm run build` first. Serves `node .next/standalone/server.js` |
| `help:screenshots` | `playwright test -c tests/help-screenshots/playwright.config.ts` | Recapturing help-centre screenshots. Requires `HELP_SCREENS_DATABASE_URL` set to a disposable, migrated database: the seed deletes and recreates its demo data. CI never runs it |

Playwright specs seed their own fixtures through Prisma, so `DATABASE_URL` must point at a migrated database.

## npm scripts: database

| Script | Runs | Use it when |
| --- | --- | --- |
| `db:migrate` | `prisma migrate dev` | Creating or applying a development migration. Review the generated SQL before committing |
| `db:deploy` | `prisma migrate deploy` | Applying committed migrations: production release jobs, CI, and preparing a test database |
| `db:status` | `prisma migrate status` | Checking for pending or failed migrations |
| `db:verify` | `node scripts/verify-production-schema.mjs` | After migrating, to check the production schema contract (columns, constraints, indexes, triggers) |
| `db:push` | `prisma db push` | Throwaway prototyping only. **Never** for deployable changes, because it bypasses migration history |
| `db:studio` | `prisma studio` | Browsing or hand-editing local data |
| `db:backup` | `node --env-file-if-exists=.env scripts/db-backup.mjs` | Operator backups. `DATABASE_URL` must use `sslmode=require`, `verify-ca` or `verify-full` |
| `db:restore` | `node scripts/db-restore.mjs` | **Destructive** restore into a production database. Refuses development, test and localhost targets |

## npm scripts: operations

| Script | Runs | Use it when |
| --- | --- | --- |
| `production:check` | `node scripts/check-production-env.mjs` | Before deploying, with the production environment exported. Doesn't load `.env` |
| `storage:migrate` | `node scripts/migrate-assets-to-s3.mjs` | Moving legacy database-blob assets into S3 during a release |

## Files in `scripts/`

| File | What it does | Invoked by |
| --- | --- | --- |
| `check-production-env.mjs` | Preflight for production config. Requires `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_BASE_URL`, `REDIS_URL`, `CRON_SECRET`, `HEALTHCHECK_SECRET`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, `MFA_ENCRYPTION_KEY`, `TRUSTED_PROXY_IP_HEADER`, `S3_BUCKET`, `S3_REGION`. Checks secret lengths (32+ characters), AES key shapes, SMTP credentials unless `SMTP_ALLOW_UNAUTHENTICATED=1`, paired S3 keys, the proxy header value, the same HTTPS origin for `AUTH_URL` and `NEXT_PUBLIC_BASE_URL`, `sslmode` on the database URL, `rediss://` and an HTTPS S3 endpoint. Refuses `WEBHOOKS_ALLOW_PRIVATE_TARGETS`. Doesn't require SMTP or Google settings, which can live in the database | `npm run production:check` |
| `check-instance-secrets.mjs` | Confirms that `MFA_ENCRYPTION_KEY` can decrypt the secrets already stored in the database (panel SMTP password, Google client secret, alert webhook URL, enrolled TOTP seeds). Never prints values or user identifiers. Exits non-zero on failure | `node --env-file=/secure/path/yuyu.env scripts/check-instance-secrets.mjs`, the `migrator` image, or the Helm migration job with `migration.checkInstanceSecrets=true` |
| `verify-production-schema.mjs` | Queries `information_schema` and the catalogues to verify required tables, columns, constraints, indexes and triggers | `npm run db:verify`, CI, `db:restore` |
| `db-backup-lib.mjs` | Shared backup and restore library: option parsing, TLS-only `DATABASE_URL` check, free-space headroom, `pg_dump`/`pg_restore` through a temporary password file, SHA-256 metadata sidecar, optional S3 upload and download. Keeps the newest seven archive pairs in the git-ignored `backups/` | Imported by the two scripts below |
| `db-backup.mjs` | Creates a compressed custom-format archive. Add `--s3-bucket`, `--s3-region`, `--s3-endpoint`, `--s3-access-key-id`, `--s3-secret-access-key` (optionally `--s3-prefix`, `--s3-force-path-style`) to copy it to a dedicated private bucket | `npm run db:backup` |
| `db-restore.mjs` | Restores from exactly one of `--file` or `--s3-key`. Requires `--production` and `--confirm-database <name>`. Add `--via-local-tunnel` when reaching production through a local proxy or SSH tunnel. Takes a pre-restore safety backup, then runs `db:status` and `db:verify` | `npm run db:restore -- ...` |
| `migrate-assets-to-s3.mjs` | Moves `Asset` rows with `provider: "database"` and `fileData` into S3 in batches of 25, then sets `provider: "s3"` and clears `fileData`. Requires `S3_BUCKET` and `S3_REGION` | `npm run storage:migrate` |
| `prepare-standalone.mjs` | Copies `public/` and `.next/static` into `.next/standalone/` so the standalone server can serve them | `npm run test:e2e:production` |
| `generate-brand-assets.ts` | Rasterises the dot-sign SVG masters in `public/brand/` into the PNG and ICO files for browsers, PWAs, social cards and email | `npm run brand:generate` |

Prerequisites for `db:backup` and `db:restore`: PostgreSQL `psql`, `pg_dump` and `pg_restore` clients compatible with the server. Full procedures, including restore examples, are in `docs/production-operations.md`.

## Other runnable files

| File | Purpose |
| --- | --- |
| `local.sh` | macOS helper: `./local.sh` with `start`, `stop`, `restart` or `status`. Starts Homebrew PostgreSQL, runs `npm install` if needed, `npx prisma generate`, `npx prisma db push`, then `npm run dev`. Prefer the Docker and `db:migrate` path in [Local setup](/start/local-setup) |
| `tests/perf/seed-large-event.mts` | Fills an empty database whose name contains `load` or `perf` with a large hackathon and 20 smaller events: `PERF_DATABASE_URL=... node tests/perf/seed-large-event.mts`. See `docs/PERFORMANCE.md` |

## Further reading

- [docs/DEVELOPMENT.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DEVELOPMENT.md)
- [docs/TESTING.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/TESTING.md)
- [docs/production-operations.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/production-operations.md)
- [Workflow](/start/workflow), [Testing](/reference/testing), [Deployment](/reference/deployment)
