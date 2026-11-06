# Codebase tour

A map of the repository: what each top-level directory holds, where to look for a given kind of code, and the naming conventions to follow when you add files. Paths are relative to the repo root.

## Top level

```text
yuyu/
├── app/                  Next.js App Router: pages, layouts, Server Actions, route handlers
├── components/           UI grouped by product area; components/ui holds shared primitives
├── lib/                  Domain services, auth, permissions, validation, email, storage
│   ├── core/             Mutation cores shared by Server Actions and the mobile API
│   └── mobile/           Mobile API tokens, sessions, permissions, schemas, DTOs
├── prisma/               schema.prisma and ordered migrations
├── content/help/         In-app help centre: MDX articles, manifest.ts, screenshots.json
├── tests/                unit, integration, e2e, perf, help-screenshots, helpers
├── scripts/              Production checks, schema verify, backups, S3 migration, brand assets
├── charts/yuyu/          Helm chart and migration job
├── docs/                 Handbook, plus the mobile OpenAPI contract and fixtures
├── public/               Brand assets, images, help screenshots
├── types/                next-auth.d.ts (Auth.js type augmentation)
├── proxy.ts              Next.js 16 proxy: rate limits, CSP nonce
├── instrumentation.ts    Production env validation, ops alert forwarding, outbox worker start
├── next.config.ts        Standalone output, headers, MDX, Server Actions config
├── Dockerfile            Stages: deps → migrator → builder → runner
├── docker-compose.yml    Local PostgreSQL 16 only (development)
├── compose.staging.yml   Isolated staging stack, not a production topology
└── local.sh              macOS Homebrew helper (start | stop | restart | status)
```

## `app/`

| Path | Contents |
| --- | --- |
| `app/(auth)/` | `/login`, `/reset-password`, `/verify-email` |
| `app/[orgSlug]/` | Public organisation page, and under `[eventSlug]/` the event page, `schedule`, `sessions`, `speakers`, `feedback`, `projects`, `results`, `check-in` (PIN station), `team` (join link). `i/` holds series instances |
| `app/account/` | Profile, `registrations`, `organisations`, `security`, `teams`, `submissions` |
| `app/dashboard/` | Organisation dashboard: `[orgSlug]/` with `(overview)`, `event/[eventId]`, `members`, `series`, `settings`, plus `org/new` |
| `app/super-admin/` | Instance admin pages. Every `page.tsx` calls `await requireSuperAdminMfa()` |
| `app/super-admin-mfa/` | The TOTP step-up prompt |
| `app/ticket/`, `team/`, `submit/`, `attend/`, `crew/`, `join/` | Capability-link pages opened by bearer tokens |
| `app/embed/` | Framable public event card and RSVP |
| `app/help/` | Help centre routes rendering `content/help/` |
| `app/discover/`, `search/`, `about/`, `features/`, `privacy/`, `terms/` | Public marketing and discovery pages |
| `app/.well-known/` | `assetlinks.json` and `apple-app-site-association` for mobile app links |
| `app/actions/` | Server Action modules, one per product area |
| `app/api/` | Route handlers (below) |

### `app/api/` route families

| Prefix | Purpose |
| --- | --- |
| `api/auth/` | Auth.js handlers |
| `api/rsvp`, `api/feedback`, `api/search`, `api/help` | Public JSON endpoints and the help search index |
| `api/ticket/[token]/{download,status,events}` | Ticket download, check-in state, SSE stream |
| `api/check-in/station` | PIN door station operations |
| `api/exports/{account,events}` | Audited CSV and JSON exports |
| `api/reports/{event,instance}` | PDF reports |
| `api/uploads/[...key]` | Application-controlled asset delivery |
| `api/v1/` | [Machine API](/api/machine-api) |
| `api/mobile/v1/` | [Mobile API](/api/mobile-api) |
| `api/health`, `api/health/db` | Liveness, and readiness behind `HEALTHCHECK_SECRET` |
| `api/internal/outbox` | Scheduler trigger behind `CRON_SECRET` |
| `api/client-errors` | Browser crash reports (same-origin, `204`) |

## `lib/`

Business rules live here, not in components or actions.

| Module(s) | Role |
| --- | --- |
| `lib/core/*` | Mutation cores: check-in, check-in lists, RSVP lifecycle/admin/cancel, teams, crew, judging, submissions, broadcasts, attendance check, programme, feedback settings, registration window, saved views, account profile and security |
| `auth.ts`, `authAdapter.ts`, `credentialsAuth.ts`, `googleSignIn.ts`, `mfa.ts`, `reauth.ts`, `superAdminMfa.ts` | Authentication |
| `permissions.ts`, `eventAccess.ts`, `dashboardGuards.ts`, `judgingAccess.ts` | Authorisation and guards |
| `validators.ts`, `passwordPolicy.ts` | Zod schemas for boundary input |
| `rsvpCore.ts`, `rsvpCapacity.ts`, `teamUnits.ts`, `registrationFields.ts`, `registrationCutoff.ts` | Registration engine |
| `checkInMutations.ts`, `ticketCheckInEvents.ts`, `checkInStation.ts`, `checkInLists.ts`, `offline-checkin.client.ts` | Check-in and realtime |
| `outbox.ts`, `outboxWorker.ts`, `email/*`, `broadcastTemplate.ts` | Email |
| `webhooks/*` | Emit, delivery, signature, secrets, URL safety, payloads |
| `api/v1/*` | Machine API credentials, scopes, handler, schemas |
| `mobile/*`, `mobileAuth.ts` | Mobile API |
| `eventDashboard/*` | Server-side loaders and the capability object for the event dashboard |
| `rateLimit.ts`, `redisOptions.ts` | Rate limiting (Redis, in-memory fallback in development) |
| `instanceSettings.ts`, `instanceConfigSecrets.ts`, `opsAlerts.ts`, `retention.ts`, `audit.ts`, `env.ts` | Operations and configuration |
| `storage/index.ts`, `imageValidation.ts`, `uploadUrl.ts` | Media |
| `timeZone.ts`, `recurrence.ts`, `sqlTimestamp.ts`, `format/*` | Dates. Build `Intl` formatters through `format/intlCache.ts` |
| `help/*` | Help-centre access and content lookup |
| `db.ts` | The shared Prisma client |

## `components/`

Grouped by product area (`account`, `checkin`, `event-dashboard`, `rsvp`, `super-admin`, `ticket`, `webhooks` and others). Two directories are shared:

- `components/ui/`: labelled primitives built on Radix (`button`, `dialog`, `field`, `select`, `tabs`, `table`, `menu`, `color-picker`, ...). Use these instead of raw elements. See [Frontend](/architecture/frontend).
- `components/brand/`: the dot-sign brand (`DotMark`, `DotLockup`, `DotFace`, `DotIcon`, `DotLoader`).

`components/event-dashboard/` has one folder per dashboard tab: `overview`, `guests`, `event-page`, `emails`, `check-in`, `feedback`, `analytics`, `settings`, `judging`, `crew`, `views`.

## `tests/`

| Path | Runner | Naming |
| --- | --- | --- |
| `tests/unit/` | `npm run test:unit` (Vitest) | `*.test.ts` |
| `tests/integration/` | `npm run test:integration` | `*.db.test.ts`, needs `TEST_DATABASE_URL` |
| `tests/e2e/` | `npm run test:e2e` (Playwright) | `*.spec.ts` |
| `tests/perf/` | Its own Vitest config, `vitest.perf.config.mts` | `*.perf.ts`, `*.mts` |
| `tests/help-screenshots/` | `npm run help:screenshots` | `capture.spec.ts` |
| `tests/helpers/` | | `server-only.ts` stub aliased in Vitest |

See [Testing](/reference/testing).

## Where do I find...

| Looking for | Start at |
| --- | --- |
| A dashboard page | `app/dashboard/[orgSlug]/...`, then its loader in `lib/eventDashboard/` |
| What a button does | Its Server Action in `app/actions/<area>.ts`, then the core in `lib/core/` |
| A public JSON endpoint | `app/api/<name>/route.ts` |
| A mobile endpoint | `app/api/mobile/v1/` routes, `lib/mobile/`, and `docs/mobile-api.openapi.yaml` |
| A database field or constraint | `prisma/schema.prisma`, then the migration that added it |
| Request headers, CSP, global rate limits | `proxy.ts` and `next.config.ts` |
| An email template | `lib/email/` and the kind in `lib/outbox.ts` |
| Who may do what on an event | `lib/eventDashboard/capabilities.ts` and `docs/PERMISSIONS.md` |
| User-facing docs for a feature | `content/help/<section>/` |

## Naming conventions

| Thing | Convention | Example |
| --- | --- | --- |
| Server Action modules | kebab-case in `app/actions/` | `rsvp-lifecycle.ts`, `checkin-lists.ts` |
| `lib` modules | camelCase | `rsvpCore.ts`, `ticketCheckInEvents.ts` |
| Browser-only `lib` modules | `.client.ts` suffix | `offline-checkin.client.ts`, `reportClientError.client.ts` |
| Product components | PascalCase `.tsx` | `components/brand/DotMark.tsx` |
| `components/ui` primitives | kebab-case | `color-picker.tsx` |
| Imports | `@/` alias for the repo root (`tsconfig.json` `paths`) | `@/lib/permissions` |
| Migrations | `prisma/migrations/<YYYYMMDDHHMMSS>_<snake_name>/` | `20261023000000_check_in_lists` |
| Branches | `feat/<short-name>`, `fix/<short-name>` | see [Workflow](/start/workflow) |
| Spelling | British, matching the domain | `Organisation`, `organiser`, `programme` |

Server-only modules start with `import "server-only";` (for example `lib/emailVerification.ts`). Client components add `"use client"` only when they need browser state, effects, handlers or browser APIs.

## Further reading

- [AGENTS.md → Repository map](https://github.com/twilighty-abhi/yuyu/blob/main/AGENTS.md)
- [docs/ARCHITECTURE.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/ARCHITECTURE.md)
- [docs/ROUTES.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/ROUTES.md)
- [Architecture overview](/architecture/overview), [Mutation cores](/architecture/mutation-cores), [Data model](/architecture/data-model)
