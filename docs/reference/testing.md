# Testing

Yuyu has three main automated layers (Vitest unit, Vitest against PostgreSQL, Playwright), plus two manual tools for performance measurement and help-centre screenshots. Run the narrowest layer while you work, then the full set before you open a PR. CI runs all three main layers.

## Test layers

| Layer | Tool | Config | Location | Command | Needs running |
| --- | --- | --- | --- | --- | --- |
| Unit | Vitest (`node` environment) | `vitest.config.mts` | `tests/unit/**/*.test.ts` | `npm run test:unit` (watch: `npm run test:unit:watch`) | Nothing |
| Coverage | Vitest + V8 | `vitest.coverage.config.mts` | Same unit files | `npm run test:coverage` | Nothing |
| Integration | Vitest | `vitest.integration.config.mts` | `tests/integration/*.db.test.ts` | `npm run test:integration` | A disposable, migrated PostgreSQL named in `TEST_DATABASE_URL` |
| E2E (dev) | Playwright, Chromium | `playwright.config.ts` | `tests/e2e/*.spec.ts` | `npm run test:e2e` | Migrated PostgreSQL in `DATABASE_URL`. The config starts or reuses `npm run dev` on `127.0.0.1:3000` |
| E2E (production) | Playwright, Chromium | `playwright.config.ts` | Same specs | `npm run build && npm run test:e2e:production` | As above, plus a full production environment (see [below](#e2e-in-production-mode)) |
| Performance | Vitest + scripts | `tests/perf/vitest.perf.config.mts` | `tests/perf/` | See `docs/PERFORMANCE.md` | A disposable seeded database in `PERF_DATABASE_URL` |
| Help screenshots | Playwright | `tests/help-screenshots/playwright.config.ts` | `tests/help-screenshots/` | `npm run help:screenshots` | `HELP_SCREENS_DATABASE_URL` (disposable, local) and `HELP_SCREENS_SEED=1` |

Every Vitest config aliases `@` to the repo root and `server-only` to `tests/helpers/server-only.ts`, an empty module. That lets tests import server modules directly.

::: tip Only one helper
`tests/helpers/` contains only that `server-only` stub. There is no shared fixture factory. Each test file seeds its own rows through Prisma with a random suffix, and removes them in `afterAll`.
:::

## Writing a unit test

Unit tests are plain Vitest files that import from `@/lib/...` or `@/app/...`. A complete example, `tests/unit/bearer-secret.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bearerSecretMatches } from "@/lib/bearerSecret";

describe("protected-route bearer matching", () => {
  const secret = "s".repeat(32);

  it("requires one exact bearer credential", () => {
    expect(bearerSecretMatches(`Bearer ${secret}`, secret)).toBe(true);
    expect(bearerSecretMatches(`bearer\t${secret}`, secret)).toBe(true);
    expect(bearerSecretMatches(secret, secret)).toBe(false);
    expect(bearerSecretMatches(`Basic ${secret}`, secret)).toBe(false);
    expect(bearerSecretMatches(`Bearer ${secret} extra`, secret)).toBe(false);
    expect(bearerSecretMatches("Bearer short", secret)).toBe(false);
    expect(bearerSecretMatches(null, secret)).toBe(false);
    expect(bearerSecretMatches(`Bearer ${secret}`, undefined)).toBe(false);
  });
});
```

Patterns you will see in existing unit tests:

- **Environment-dependent modules.** Use `vi.stubEnv(...)`, then `vi.resetModules()` and a dynamic `import()`, as `tests/unit/rate-limit-redis-outage.test.ts` does for `@/lib/rateLimit`. Call `vi.unstubAllEnvs()` in `afterEach`.
- **Server Actions.** Mock `@/lib/auth` and `@/lib/actionRateLimit` with `vi.mock` (more than 20 unit files mock `@/lib/auth`).
- **Never use real secrets or tokens.** Use obvious placeholders such as `"s".repeat(32)`.

## Writing an integration test

Integration tests call real Server Actions and cores against PostgreSQL. They mock only the session, rate limiting, cache revalidation and side channels. Excerpt from `tests/integration/publish-event.db.test.ts`:

```ts
const identity = vi.hoisted(() => ({ id: "" }));
vi.mock("@/lib/auth", () => ({ auth: async () => (identity.id ? { user: { id: identity.id } } : null) }));
vi.mock("@/lib/actionRateLimit", () => ({ isActionRateLimited: async () => false }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const webhooks = vi.hoisted(() => ({ emit: vi.fn() }));
vi.mock("@/lib/webhooks/emit", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/webhooks/emit")>()), emitWebhookEvent: webhooks.emit }));

import { prisma } from "@/lib/db";
import { publishEvent } from "@/app/actions/event";

const suffix = randomUUID().replace(/-/g, "");
```

The file then creates an organisation, users and memberships in `beforeAll`, using `suffix` in every slug and email. It switches the caller by setting `identity.id`, and deletes the organisation and users in `afterAll` before calling `prisma.$disconnect()`. Concurrency cases run the action several times inside `Promise.all` and then assert on stored rows and on `auditEvent` counts.

Conventions:

1. Name the file `tests/integration/<area>.db.test.ts`.
2. Make every unique value (slug, email) include a random suffix. Files run one at a time against a shared database, and they must not collide with earlier runs.
3. Clean up through the cascade root (usually `organisation`) plus the users you created.
4. Assert on database state, not only on the action's return value.

### Test database setup

`vitest.integration.config.mts` throws at startup if `TEST_DATABASE_URL` is unset. It then **overwrites `DATABASE_URL`** with that value, so no Prisma client in the run can reach your development database. Files run serially (`fileParallelism: false`) with a 20-second test timeout.

```bash
docker compose up -d
docker compose exec postgres createdb -U yuyu yuyu_test
DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run db:deploy
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration
```

::: danger Disposable databases only
Never point `TEST_DATABASE_URL` at `yuyu_dev`, staging or production. The suites create and delete rows and assume nothing else is writing to the database. The suite does not migrate the database itself, so re-run `db:deploy` after you pull new migrations.
:::

## E2E tests

- Specs seed and remove their own fixtures directly through Prisma (most create a `new PrismaClient()`) against `DATABASE_URL`, the same database the server under test uses. Locally that is your dev database, so test rows appear there while a run is in progress.
- Install the browser once: `npx playwright install chromium`.
- `PLAYWRIGHT_PORT` changes the port. `PLAYWRIGHT_SERVER_COMMAND` replaces the server command. Outside CI an already-running server is reused.
- In CI, `retries` is 2 and `test.only` fails the run (`forbidOnly`).
- Most story specs use `test.describe.configure({ mode: "serial" })`.

### E2E in production mode

`npm run test:e2e:production` runs `scripts/prepare-standalone.mjs`, which copies `public/` and `.next/static` into `.next/standalone`. It then sets `PLAYWRIGHT_PRODUCTION_SERVER=1`, so Playwright starts `node .next/standalone/server.js`. Run `npm run build` first.

The standalone server runs with `NODE_ENV=production`, so `validateRuntimeEnvironment()` (`lib/env.ts`, called from `instrumentation.ts`) applies. Locally, use the same variables as the `env:` block of `.github/workflows/quality.yml`. That includes `CI=true` with `ALLOW_INSECURE_PRODUCTION_TESTS=1`, which allows HTTP origins and non-TLS PostgreSQL and Redis. `webhooks.spec.ts` also needs `WEBHOOKS_ALLOW_PRIVATE_TARGETS=1`. CI sets `TRUSTED_PROXY_IP_HEADER=cf-connecting-ip` for this step so that each browser context gets its own client IP.

Use production mode for changes to security, headers, auth, tickets and public flows. Some assertions differ by mode: `teams.spec.ts` expects `no-store` only under production, because `next dev` sends its own `no-cache`.

## Guard tests (architecture rules)

These unit tests read source files or contracts and fail when a structural rule is broken. If one fails, fix the code. Don't loosen the test.

| Test (`tests/unit/`) | Rule it enforces |
| --- | --- |
| `super-admin-page-guards.test.ts` | Every `app/super-admin/**/page.tsx` contains `await requireSuperAdminMfa()` and never selects `token: true` / `tokenHash: true` |
| `dashboard-loading-boundaries.test.ts` | Pins every `loading.tsx` under `app/`, the guard its layout awaits (`lib/dashboardGuards.ts`) and the pages it wraps. A new boundary, or a page under one, fails until its access check sits above it |
| `mobile-api-contract.test.ts` | `docs/mobile-api-fixtures/*.json` validate against `docs/mobile-api.openapi.yaml`. The spec lists exactly the implemented `/api/mobile/v1` routes and methods, every `$ref` resolves, every operation has a default error, and every error code is documented |
| `frontend-boundaries.test.ts` | Bounded public and attendee collections (`take: ... + 1`, explicit selects), keyboard-named calendar controls, category-only production error logging, a same-origin static-only service worker |
| `migration-safety.test.ts` | Ordering contracts inside specific migration SQL files (backup before delete, backfill before `SET NOT NULL`, outbox rows normalised before the state CHECK) |
| `event-schedule-track-migration.test.ts` | The schedule-track migration seeds tracks from legacy locations |
| `super-admin-insights.test.ts` | `SECURITY_AUDIT_ACTIONS` (`lib/superAdminInsights.ts`) lists every audit action that a data-export `route.ts` records |
| `help-content.test.ts` | Help manifest slugs are unique and safe, the manifest matches the MDX files one to one, and every link, anchor and screenshot resolves |
| `event-capabilities.test.ts` | The dashboard permission matrix in `docs/PERMISSIONS.md` for every role and grant |
| `production-check-script.test.ts` | `scripts/check-production-env.mjs` behaviour, including refusing `WEBHOOKS_ALLOW_PRIVATE_TARGETS` |
| `proxy-headers.test.ts`, `next-config-headers.test.ts`, `robots.test.ts` | `no-store`, `no-referrer`, framing and crawler rules for capability pages |
| `mobile-dto.test.ts`, `team-dto.test.ts`, `judging-dto.test.ts`, `webhooks.test.ts` | Forbidden-field regressions: DTOs never expose emails, answers or tokens |
| `help-screens-guard.test.ts` | The screenshot seed runs only with `HELP_SCREENS_SEED=1`, outside production, against a local database |

`docs/TESTING.md` lists what every unit, integration and e2e suite covers.

## What CI runs

Two workflows run on every pull request and on pushes to `main`. Both use Node 20.

| Workflow | Job | Steps |
| --- | --- | --- |
| `.github/workflows/ci.yml` | `quality` | `npm ci`, `npx prisma validate`, `npm run lint`, `npx next typegen && npx tsc --noEmit`, `npm run test:unit`, `npm run build`, `npm audit --omit=dev --audit-level=high` |
| `.github/workflows/ci.yml` | `migration-integrity` | Postgres 16 service, then `npm run db:deploy`, `npm run db:verify` |
| `.github/workflows/quality.yml` (Quality gate) | `verify` | Postgres 16 and Redis 7 services, then `npm audit --omit=dev`, `db:deploy`, `db:verify`, a drift check (`prisma migrate diff ... --exit-code`), lint, typecheck, unit, coverage, integration, `production:check`, build, `docker build`, a standalone-container smoke test (`/api/health` and `require('sharp')`), then `test:e2e:production` |

`.github/workflows/publish-images.yml` runs only after a successful Quality gate on a push to `main` (see [Deployment](/reference/deployment)).

Coverage thresholds in `vitest.coverage.config.mts` are a ratchet (statements 43, branches 38, functions 49, lines 46). Raise them as coverage grows. Never lower them to make a change pass.

## Before you open a PR

```bash
npm run lint
npx next typegen && npx tsc --noEmit
npm run test:unit
TEST_DATABASE_URL=... npm run test:integration
npm run build
npm run test:e2e:production        # security, headers, auth, tickets, public flows
```

For schema or production-config changes, also run `npm run db:status`, `npm run db:verify` and `npm run production:check`. Write any test reports to `test-reports/`, which is git-ignored.

## Further reading

- [docs/TESTING.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/TESTING.md)
- [docs/PERFORMANCE.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/PERFORMANCE.md)
- [Workflow](/start/workflow) and [Local setup](/start/local-setup)
- [Mobile API](/api/mobile-api) for the contract test
- [Security checklist](/reference/security-checklist)
