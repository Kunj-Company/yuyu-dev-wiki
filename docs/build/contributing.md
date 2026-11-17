# Contributing upstream

How to take work back to the Yuyu repository. The rules come from `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md` and `docs/DECISIONS.md`. This page tells you what is open to outsiders today, what a change must satisfy to be accepted, and where the detailed procedures live. For the daily commands and the CI job list, it links to [Development workflow](/start/workflow) rather than repeating them.

## What is open today

::: warning Outside pull requests are not accepted for now
`CONTRIBUTING.md` says: "Yuyu does not accept outside contributions for now; code changes come from the core team. The rest of this guide describes how the team works." Open an issue or a discussion first, and do not spend time on a large patch without agreement. The rules below are the bar for core-team changes, and they are what any future outside contribution would be held to.
:::

| You want to | Route |
| --- | --- |
| Report a bug | [Open an issue](https://github.com/twilighty-abhi/yuyu/issues/new). Say what you expected, what happened and the steps to repeat it. Include your browser or device and, for a self-hosted install, the Yuyu version |
| Suggest a feature or ask a question | Start a thread in [GitHub Discussions](https://github.com/twilighty-abhi/yuyu/discussions). Describe your community's problem before the solution |
| Report a security vulnerability | **Not** in a public issue. `CONTRIBUTING.md` says to use the team's private Mattermost channel for security issues and to allow time for a fix before disclosing. See [Security checklist](/reference/security-checklist) and `docs/SECURITY.md` |
| Change something Yuyu will not take | [Fork and customise](/build/fork-and-customise) |
| Fix the mobile apps | Their own repositories and rules. See [Android and iOS apps](/build/mobile-apps) |

## Product boundaries

Yuyu is for **free** events. `CONTRIBUTING.md` says contributions that add payments, ticket sales, ads or third-party trackers will not be accepted, and `AGENTS.md` repeats that Yuyu does not support paid events, ticketing revenue, payments or refunds. Self-hosting, privacy and accessibility are product features, not polish. Organiser logos, covers and accents are never restyled with Yuyu's brand.

## Before you write code

1. **Read `AGENTS.md` in full.** `CLAUDE.md` is a short pointer to it plus a fast orientation, and says the same. It covers the Next.js 16 rules, product boundaries, the security and tenancy rules, data and background work, verification and branching.
2. **Next.js 16 differs from older versions.** Before changing routing, caching, Server Actions, proxy behaviour, metadata or configuration, read the matching guide in `node_modules/next/dist/docs/`. `next dev` maintains the `nextjs-agent-rules` block at the top of `AGENTS.md`, so commit it with your work instead of removing it from a diff.
3. **Read the page in `docs/` for the area you are changing**, and `prisma/schema.prisma` for data details: `ARCHITECTURE.md`, `ROUTES.md`, `SECURITY.md`, `CONFIGURATION.md`, `production-operations.md`, `TESTING.md`, `TEAMS.md`, `HACKATHON.md` and `PRODUCTION_RELEASE.md`. The matching wiki pages are the [architecture](/architecture/overview) and [features](/features/events-and-websites) sections.
4. **Check `docs/DECISIONS.md`.** It records deliberate choices, including ones that undo earlier changes, so they are not reverted by accident. Newest first, each entry says what was decided, why, and what would have to change before revisiting it. The current entry, from 2026-11-03, fixes the outbox at one batch of 20 emails per pass after Gmail refused a burst of logins. If your change reverses a decision, say so in the pull request and add a new dated entry with the same four parts: decision, context, why this option, and not done yet.
5. **Do not read, print or commit `.env` values.** Use `.env.example` for names. If a credential leaks into a chat, commit or log, rotate it.

For a worked example of a complete change, see [Tutorial: add a feature end to end](/build/feature-tutorial).

## Branches and pull requests

Summarised from `AGENTS.md`, "Branching: one branch per feature, merged by pull request". The commands are in [Development workflow](/start/workflow).

| Rule | Detail |
| --- | --- |
| One branch per feature or fix | `feat/<short-name>` or `fix/<short-name>`, created from the latest `main`. Never commit a feature straight onto `main` |
| `main` is the only integration branch | It is also the branch deployed to production. `staging` exists but is not touched unless someone asks |
| Open a pull request into `main` | `gh pr create --base main`. Describe what changed and how you tested it |
| Merge with a merge commit | `gh pr merge --merge`. Never squash or rebase, so the feature stays visible in history |
| Merge only on green | The pull request's **CI** and **Quality gate** workflows must pass, after the full checks pass locally |
| With several open pull requests | Merge one at a time and update or re-test the others against the new `main` |
| Keep branches | Delete a merged branch only when asked |
| Other sessions edit the tree | Commit with explicit paths. Do not sweep in or revert other people's uncommitted files. Use a worktree per branch: `git worktree add ../yuyu-<short-name> -b feat/<short-name> origin/main` |

Recent history uses short prefixed subjects such as `feat(crew): ...`, `fix(outbox): ...`, `test(...)` and `docs: ...`. Match them. Keep each change focused and consistent with the surrounding code's style.

## Checks a change must pass

At minimum, `CONTRIBUTING.md` asks for `npm run lint`, `npx tsc --noEmit` and `npm run test:unit`. `AGENTS.md` and `docs/TESTING.md` ask for more as the risk grows.

| Change touches | Add |
| --- | --- |
| Authorisation, mutations, public routes, the APIs or deployment | The stronger checks: `npm run test:integration` against a disposable `TEST_DATABASE_URL`, and `npm run build` |
| Routing, auth or public flows | `npm run test:e2e` |
| Security, headers, auth, tickets or public flows | `npm run test:e2e:production` after a build |
| The schema | A reviewed Prisma migration (never `db:push` for anything deployable), `npm run db:status`, `npm run db:verify`, the lock checklist in `docs/production-operations.md`, and rollback notes in `docs/PRODUCTION_RELEASE.md` for new enum values |
| Production configuration | `npm run production:check` |
| UI | `docs/DESIGN.md`, light and dark mode, a 360px-wide screen |
| A help article | `npx vitest run tests/unit/help-content.test.ts` |

The integration suite needs `TEST_DATABASE_URL` pointing at a separate, disposable database, never your development database and never production. Report any check you did not run, and why. Write test, release and upgrade reports to `test-reports/`, which is git-ignored.

CI runs the same set and more (database drift, an image build with a smoke test, and the production end-to-end suite). The jobs are listed in [Development workflow](/start/workflow#what-ci-runs) and [CI/CD and image publishing](/deploy/ci-cd).

## Security checklist

Every change that touches data, mutations, public routes or configuration needs the review in [Security checklist](/reference/security-checklist). The rules most often at stake, from `AGENTS.md`:

- `Organisation` is the tenant boundary. Every dashboard read and mutation resolves the organisation on the server and checks the role. UI visibility is never authorisation.
- A Server Action needs authentication, authorisation, Zod validation, rate limiting where it applies and audit behaviour before it mutates. Public routes need equivalent protection.
- Change behaviour in `lib/core/`, not in one surface, because the Server Actions and the mobile API share those functions.
- Machine API clients resolve the tenant only from the credential, need explicit scopes and return minimal DTOs. Mobile sessions are user identities, and responses are strict DTOs.
- Webhooks are emitted only after the transaction commits, through `emitWebhookEvent`, with payloads limited to the strict DTOs and every target SSRF-checked.
- Ticket, certificate, invite, reset, MFA, scheduler and readiness values are bearer secrets and never go to logs, audit metadata or analytics.
- Email is queued in the outbox. A new bulk email kind is added to `BULK_OUTBOX_KINDS` in `lib/outbox.ts`, and a new kind is also listed in `OUTBOX_KINDS_ADDED_AFTER_1_0`, because the previous release fails unknown kinds permanently while both releases run.
- Every `app/super-admin/**/page.tsx` calls `await requireSuperAdminMfa()` itself. `tests/unit/super-admin-page-guards.test.ts` enforces it.
- Publication sets `Event.status = PUBLISHED` and `EventPage.isPublished` together in one transaction.
- Do not loosen CSP nonces, security headers, trusted proxy-IP handling, Server Action origins, Redis fail-closed behaviour or production TLS checks without a documented security and deployment change.

Smaller conventions that review will look for: Server Components by default, Zod validation at every boundary, UI-safe error messages, the project time-zone helpers for dates, `lib/sqlTimestamp.ts` for raw SQL timestamps, `lib/format/intlCache.ts` for formatters, singletons shared across Next.js bundles on `globalThis` under a `Symbol.for(...)` key, and animations that are restart-safe under React's double-invoked effects.

## Documentation is part of the change

- Update the `docs/` page for the area, and `CHANGELOG.md` for user-visible changes. The changelog format follows Keep a Changelog, and releases are not tagged.
- Update or add the help article in `content/help/` when user-visible behaviour changes. The help centre replaces the old PDF manual.
- For the machine or mobile API, change the spec, fixtures and tests together. See [Extend the APIs](/guides/extend-the-apis).
- Add a `docs/DECISIONS.md` entry when you make or reverse a deliberate choice.

## Further reading

- [Development workflow](/start/workflow), [Testing](/reference/testing) and [Scripts](/reference/scripts)
- [Security checklist](/reference/security-checklist)
- [Tutorial: add a feature end to end](/build/feature-tutorial)
- [CONTRIBUTING.md](https://github.com/twilighty-abhi/yuyu/blob/main/CONTRIBUTING.md)
- [AGENTS.md](https://github.com/twilighty-abhi/yuyu/blob/main/AGENTS.md)
- [docs/DECISIONS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DECISIONS.md)
