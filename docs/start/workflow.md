# Workflow

How changes move from a branch to `main`: daily commands, branch and pull-request rules, the checks to run before a PR, and what CI enforces. The rules come from `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` and `.github/workflows/`.

::: tip Who can contribute
`CONTRIBUTING.md` says Yuyu doesn't accept outside pull requests for now: code changes come from the core team. Bug reports go to GitHub Issues and ideas to Discussions. Report security issues privately, never in a public issue.
:::

## Daily commands

```bash
npm run dev                 # prisma generate && next dev
npm run lint                # ESLint (eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit            # type check
npm run test:unit           # Vitest unit suites
npm run test:unit:watch     # Vitest in watch mode
npm run db:migrate          # create/apply a development migration
npm run db:studio           # Prisma Studio
```

All scripts are listed on [Scripts](/reference/scripts).

## Branching and pull requests

`main` is the only integration branch and the one deployed to production. `staging` exists but isn't touched unless someone asks. Never commit a feature straight onto `main`.

```mermaid
flowchart LR
  A["origin/main"] --> B["feat/short-name or fix/short-name"]
  B --> C["Local checks pass"]
  C --> D["gh pr create --base main"]
  D --> E["CI and Quality gate green"]
  E --> F["gh pr merge --merge"]
  F --> A
```

1. Branch from the latest `main`, one feature per branch:

   ```bash
   git fetch origin && git switch -c feat/<short-name> origin/main   # fix/<short-name> for a bug fix
   ```

2. When other sessions work in the same checkout, use a separate worktree per branch so branches don't switch under someone else's uncommitted work:

   ```bash
   git worktree add ../yuyu-<short-name> -b feat/<short-name> origin/main
   ```

3. Commit with **explicit paths**. Don't sweep in or revert other sessions' uncommitted files.
4. Push and open a PR into `main` with `gh pr create --base main`. Describe what changed and how you tested it.
5. Merge only when the PR's **CI** and **Quality gate** workflows are green, with a merge commit: `gh pr merge --merge`. Never squash or rebase, so the feature stays visible in history.
6. With several PRs open, merge one at a time and update or re-test the others against the new `main`.
7. Delete a merged branch only when asked.

::: tip The `AGENTS.md` header block
`next dev` writes and re-adds the `nextjs-agent-rules` block at the top of `AGENTS.md`. Removing it from a diff only re-creates the uncommitted change. Committing it with your work keeps the tree clean.
:::

## Checks before a pull request

Run the narrowest relevant checks while developing, then proportionate checks before handoff.

| Change touches | Run |
| --- | --- |
| Anything | `npm run lint`, `npx next typegen && npx tsc --noEmit`, `npm run test:unit` |
| Domain logic, mutations, queries | Add `npm run test:integration` against a disposable `TEST_DATABASE_URL` |
| Anything that ships | `npm run build`, `git diff --check` |
| Routing, auth, public flows | `npm run test:e2e` (development server) |
| Security, headers, auth, tickets, public flows | `npm run test:e2e:production` (standalone build, run after `npm run build`) |
| Schema | `npm run db:status`, `npm run db:verify`, the lock checklist in `docs/production-operations.md`, and new enum values recorded in the rollback notes of `docs/PRODUCTION_RELEASE.md` |
| Production configuration | `npm run production:check` |
| CSS or Tailwind | A clean build. A stale `.next/cache` can keep serving old CSS |
| A help-centre article | `npx vitest run tests/unit/help-content.test.ts` |

The full pre-PR sequence from `docs/DEVELOPMENT.md`:

```bash
npm run lint
npx tsc --noEmit
npm run test:coverage
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration
npm run build
git diff --check
```

`TEST_DATABASE_URL` must name a separate, disposable, migrated database, never `yuyu_dev` and never production. `vitest.integration.config.mts` refuses to start without it and replaces `DATABASE_URL` with it for the whole run. Report any checks you didn't run, and why.

Write test, release and upgrade reports to `test-reports/` at the repository root. It's git-ignored and never committed.

### Other PR expectations

- UI changes follow `docs/DESIGN.md`. Check light and dark mode and a 360px-wide screen. Don't restyle organiser logos, covers or colours with Yuyu's brand.
- Database changes need a reviewed Prisma migration. Inspect the generated SQL for indexes, nullability, backfills, constraints and cascades. See [Change the schema](/guides/change-the-schema).
- Keep the matching `content/help/` article and `docs/` page accurate when behaviour changes.

## What CI runs

Two workflows run on every pull request and on pushes to `main`. A third publishes images after a green Quality gate on `main`.

### `ci.yml` (workflow "CI")

| Job | Steps |
| --- | --- |
| `quality` (Node 20, no database) | `npm ci` → `npx prisma validate` → `npm run lint` → `npx next typegen && npx tsc --noEmit` → `npm run test:unit` → `npm run build` → `npm audit --omit=dev --audit-level=high` |
| `migration-integrity` (Postgres 16 service) | `npm ci` → `npm run db:deploy` → `npm run db:verify` |

### `quality.yml` (workflow "Quality gate")

Runs with Postgres 16 and Redis 7 services and a CI-only environment (placeholder secrets, `SMTP_SERVICE=test`, `ALLOW_INSECURE_PRODUCTION_TESTS=1`). In order:

1. `npm ci`, `npm audit --omit=dev`
2. `npm run db:deploy`, `npm run db:verify`
3. `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code`. The migrated database must match `schema.prisma` exactly, with no drift
4. `npm run lint`, `npx next typegen && npx tsc --noEmit`
5. `npm run test:unit`, `npm run test:coverage`, `npm run test:integration`
6. `npm run production:check`, `npm run build`
7. `docker build` of the image, then a smoke test: the container must answer `GET /api/health`, and `sharp` must load inside it
8. `npx playwright install --with-deps chromium`, then `npm run test:e2e:production` with `TRUSTED_PROXY_IP_HEADER=cf-connecting-ip` (each browser context gets its own client IP, so per-IP limits don't couple tests) and `WEBHOOKS_ALLOW_PRIVATE_TARGETS=1`

### `publish-images.yml` (workflow "Publish Docker Hub images")

Triggered by a successful Quality gate run from a push to `main` in this repository, never from a PR or fork. It validates its settings, then builds and pushes the `migrator` and `runner` targets for `linux/amd64` and `linux/arm64`, tagged `sha-<commit>-<run id>-<attempt>`. See [Deployment](/reference/deployment).

## Reproducing a CI failure locally

| CI step | Local equivalent |
| --- | --- |
| `prisma validate` | `npx prisma validate` (needs `DATABASE_URL` set, even though it doesn't connect) |
| Schema drift | `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code` against a freshly migrated disposable database |
| Type check | `npx next typegen && npx tsc --noEmit`. Run `typegen` first, as CI does, so Next.js's generated types are current |
| `production:check` | Reads only the process environment (it doesn't load `.env`) and requires production values such as HTTPS `AUTH_URL` and `rediss://` Redis. CI passes because it exports every required variable plus `ALLOW_INSECURE_PRODUCTION_TESTS=1`, and GitHub Actions sets `CI=true` |
| e2e production | `npm run build && npm run test:e2e:production` with a migrated `DATABASE_URL`. Every browser spec seeds its own fixtures through Prisma |

## Further reading

- [AGENTS.md → Verification and Branching](https://github.com/twilighty-abhi/yuyu/blob/main/AGENTS.md)
- [docs/DEVELOPMENT.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DEVELOPMENT.md)
- [docs/TESTING.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/TESTING.md)
- [docs/PRODUCTION_RELEASE.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/PRODUCTION_RELEASE.md)
- [Testing](/reference/testing), [Scripts](/reference/scripts), [Security checklist](/reference/security-checklist)
