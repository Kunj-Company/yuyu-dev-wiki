# Security checklist

Use this checklist when you review any PR, grouped by the area a change touches. Each item states the rule, why it exists, and what enforces it where something does. Many rules are enforced only by review, so read the diff against them. The full model is in `docs/SECURITY.md` and the "Security and tenancy rules" section of `AGENTS.md`.

## Tenancy and authorization

- [ ] **Every dashboard read and mutation resolves the organisation server-side and checks membership and role.** `Organisation` is the tenant boundary, and UI visibility is never authorization. Enforced by `requireOrgRole`, `requireOrgMembership` and `requireOrgDashboardAccess` in `lib/permissions.ts`, and the `guard*` helpers in `lib/dashboardGuards.ts`. Tested in `tests/e2e/dashboard-not-found.spec.ts`.
- [ ] **Event-scoped access goes through `canAccessEvent` / `canManageRegistrationsFor` (`lib/eventAccess.ts`).** A collaborator grant never implies another grant, and none reaches organisation-level operations (publish, short links, delete, clone, collaborators). Tested in `tests/integration/collaborator-permissions.db.test.ts` and `tests/e2e/collaborator-permissions.spec.ts`.
- [ ] **`JUDGE` satisfies no other `EventPermission` check.** A judge-only collaborator sees project content only. Tested in `tests/unit/judging-permissions.test.ts` and `tests/integration/judging.db.test.ts`.
- [ ] **A new dashboard control is driven by `eventCapabilities` / `seriesCapabilities` (`lib/eventDashboard/capabilities.ts`), and the server action re-checks access.** The capability object only mirrors server checks. Tested in `tests/unit/event-capabilities.test.ts` against `docs/PERMISSIONS.md`.
- [ ] **Refusals are real 404 or 307 statuses, never a streamed 200.** A new `loading.tsx` sits below a layout that already awaited the guard. Enforced by `tests/unit/dashboard-loading-boundaries.test.ts`.
- [ ] **Cross-tenant ids return not-found, not forbidden.** This avoids revealing whether the resource exists. Covered by the cross-organisation cases in most `*.db.test.ts` suites.

## Server Actions, cores and route handlers

- [ ] **Each mutation authenticates, authorizes, validates with Zod, rate limits where applicable, and audits, all before mutating.** Cores in `lib/core/` carry this for both Server Actions and the mobile API, so change behaviour there, not in one surface. Uses `isActionRateLimited` (`lib/actionRateLimit.ts`) and `recordAuditEvent` (`lib/audit.ts`).
- [ ] **Errors returned to the UI are safe.** No stack traces, SQL or internal ids.
- [ ] **Multi-record changes use a Prisma transaction, and database constraints are the final guard.** Capacity, waitlist and duplicate-RSVP checks race otherwise. Tested in `tests/integration/rsvpCapacity.db.test.ts`, `rsvp-lifecycle.db.test.ts`, `teams.db.test.ts` and `schema-invariants.db.test.ts`.
- [ ] **Publication writes `Event.status = PUBLISHED` and `EventPage.isPublished` together in one transaction.** Public pages, RSVP and short links require both. Tested in `tests/integration/publish-event.db.test.ts` and `tests/unit/event-publishing.test.ts`.
- [ ] **Public endpoints (RSVP, feedback, search, ticket status) have protection equivalent to Server Actions.** Those endpoints are unauthenticated. Tested in `tests/unit/rsvp-route.test.ts`, `feedback-route.test.ts`, `search-route.test.ts` and `ticket-check-in-routes.test.ts`.

## Super admin

- [ ] **Every `app/super-admin/**/page.tsx` calls `await requireSuperAdminMfa()` itself.** Layout checks do not re-run on client navigation. Enforced by `tests/unit/super-admin-page-guards.test.ts`.
- [ ] **Super-admin queries never select tokens, hashes, answers or message bodies, and lists are capped and parameterised.** The same guard test rejects `token: true` and `tokenHash: true`.
- [ ] **Instance secrets (SMTP password, Google secret, alert webhook URL) are write-only.** They never appear in props, logs or audit metadata, and are encrypted with the `MFA_ENCRYPTION_KEY`-derived key. Tested in `tests/unit/instance-admin-actions.test.ts` and `instance-config-secrets.test.ts`.
- [ ] **Unauthorized access fails as generic not-found.** This hides that the area exists.

## Authentication and sessions

- [ ] **Sensitive account operations require recent authentication (`lib/reauth.ts`), bump `sessionVersion`, and are audited.** Old web and mobile sessions must die together. Tested in `tests/unit/security-actions.test.ts`, `tests/integration/auth-hardening.db.test.ts` and `mfa-recovery.db.test.ts`.
- [ ] **Credential checks keep equal-work bcrypt and the per-account and per-IP limits.** This prevents account enumeration and brute force. See `lib/credentialsAuth.ts` and `tests/unit/auth-actions.test.ts`.
- [ ] **Mobile tokens are stored only as SHA-256 digests, refresh tokens rotate, and reuse revokes the session.** Tested in `tests/unit/mobile-tokens.test.ts`, `mobile-auth.test.ts` and `tests/integration/mobile-api.db.test.ts`.
- [ ] **Login return paths reject external URLs, backslashes and control characters.** This prevents open redirects. Tested in `tests/e2e/auth.spec.ts`.

## Secrets, tokens and capability links

- [ ] **Ticket, certificate, invite, reset, MFA, team, submission, attendance, crew, scheduler and readiness values never appear in logs, audit metadata, URLs in diagnostics, analytics or tests.** They are bearer credentials. Tested in `tests/unit/email-log-safety.test.ts` and `redact-sensitive-text.test.ts`.
- [ ] **New capability tokens are high-entropy, shape-checked before lookup, and stored hashed unless an organiser must re-display them.** Malformed tokens get a real 404. Tested in `tests/unit/team-token.test.ts` and `attendance-check.test.ts`.
- [ ] **Capability pages send `noindex`, `Referrer-Policy: no-referrer` and `no-store`, and `robots.txt` disallows them.** This keeps tokens out of caches, referrers and search results. Tested in `tests/unit/proxy-headers.test.ts`, `next-config-headers.test.ts` and `robots.test.ts`.
- [ ] **Bearer secrets are compared with `bearerSecretMatches` (`lib/bearerSecret.ts`), and failures are generic.** Tested in `tests/unit/bearer-secret.test.ts` and `operations-routes.test.ts`.
- [ ] **No `.env` values in the diff, and examples use `.env.example` placeholders.** Rotate any credential that has been exposed.

## Data exposure

- [ ] **API and browser responses use explicit selects and strict DTOs.** These carry no emails, answers, user ids or other people's tokens. Tested in `tests/unit/api-contracts.test.ts`, `mobile-dto.test.ts`, `team-dto.test.ts`, `judging-dto.test.ts` and `event-client-dto.test.ts`.
- [ ] **Machine API resolves the tenant only from the credential and requires an explicit scope.** Tested in `tests/unit/api-contracts.test.ts` (caller-supplied organisation ids are rejected) and `tests/integration/api-v1.db.test.ts`.
- [ ] **Mobile API changes keep the OpenAPI spec and fixtures in step.** Enforced by `tests/unit/mobile-api-contract.test.ts`.
- [ ] **Exports are owner/admin (or the exact grant), `private, no-store`, audited with filter names only, and formula-neutralised (`escapeCsvCell` in `lib/csv.ts`).** A new export action is also added to `SECURITY_AUDIT_ACTIONS`. Tested in `tests/unit/csv.test.ts` and `super-admin-insights.test.ts`.
- [ ] **Anonymous feedback stays anonymous.** Tested in `tests/integration/feedback.db.test.ts`.

## Realtime check-in

- [ ] **Check-in publishes only through `commitCheckInProjection` (`lib/checkInMutations.ts`).** Channels are keyed by RSVP id, never the ticket token, and a publish failure never fails a check-in. Tested in `tests/unit/ticket-check-in-publish.test.ts` and `ticket-check-in-events.test.ts`.
- [ ] **Cross-bundle singletons live on `globalThis` under `Symbol.for(...)`.** Module scope is duplicated between bundles. See `lib/ticketCheckInEvents.ts`.

## Webhooks and outbound requests

- [ ] **Webhooks are emitted only after commit, through `emitWebhookEvent` (`lib/webhooks/emit.ts`).** Payloads stay strict DTOs.
- [ ] **Every webhook target is SSRF-checked at save time and at delivery time, with the pinned lookup (`lib/webhooks/urlSafety.ts`).** Tested in `tests/unit/webhooks.test.ts` and `tests/integration/webhooks.db.test.ts`.
- [ ] **`WEBHOOKS_ALLOW_PRIVATE_TARGETS` is never relied on outside development and tests.** Tested in `tests/unit/production-check-script.test.ts`.
- [ ] **Operational alerts go through `lib/opsAlerts.ts` redaction, and `POST /api/client-errors` stays same-origin, size-capped, rate limited and returns `204`.** Tested in `tests/unit/ops-alerts.test.ts` and `tests/integration/ops-alerts.db.test.ts`.

## Uploads, storage and email

- [ ] **Images go through validation, decode/resize, metadata stripping and WebP re-encoding, then the app-controlled delivery route.** The bucket stays private. Tested in `tests/unit/image-validation.test.ts`, `upload-route.test.ts` and `storage-key.test.ts`.
- [ ] **Email is queued in `OutboxMessage`, and request paths never wait for SMTP.** A new kind goes in `BULK_OUTBOX_KINDS` if sent to a whole audience, and in `OUTBOX_KINDS_ADDED_AFTER_1_0` (`lib/outbox.ts`). Tested in `tests/unit/outbox.test.ts` and `outbox-worker.test.ts`.
- [ ] **Organiser values in email designs are escaped, and URLs are limited to absolute http(s) (`safeHttpUrl` in `lib/safeHttpUrl.ts`).** Tested in `tests/unit/broadcast-designs.test.ts` and `safe-http-url.test.ts`.
- [ ] **Hackathon emails and attendance confirmation are never sent automatically.** Tested in `tests/integration/attendance-check.db.test.ts` and `hackathon-email-toggles.db.test.ts`.

## Headers, proxy and configuration

- [ ] **CSP nonces (`proxy.ts`), security headers (`next.config.ts`), trusted proxy-IP handling, Server Action origins, Redis fail-closed and production TLS checks are not loosened without a documented security change.** Tested in `tests/unit/proxy-headers.test.ts`, `rate-limit-redis-outage.test.ts` and `env.test.ts`.
- [ ] **`/api/health` stays dependency-free, and `/api/health/db` and `/api/internal/outbox` stay bearer-protected.** Tested in `tests/unit/operations-routes.test.ts`.
- [ ] **A new required env var is added to `lib/env.ts`, `scripts/check-production-env.mjs`, `.env.example` and the docs.** See [Add config](/guides/add-config).

## Database and migrations

- [ ] **Migrations are additive, and the locks they take are reviewed.** New enum values are recorded in the rollback notes. See `docs/production-operations.md`, plus `tests/unit/migration-safety.test.ts` and the CI drift check.
- [ ] **Raw SQL timestamps use `lib/sqlTimestamp.ts`.** The database TimeZone must not shift them. Tested in `tests/integration/raw-sql-timezone.db.test.ts`.
- [ ] **Audit triggers and constraints are preserved.** Enforced by `npm run db:verify` (`scripts/verify-production-schema.mjs`).

## Further reading

- [docs/SECURITY.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/SECURITY.md), [docs/PERMISSIONS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/PERMISSIONS.md), [docs/AUTH_REVIEW.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/AUTH_REVIEW.md) (historical)
- [Permissions](/architecture/permissions), [Auth and sessions](/architecture/auth-and-sessions), [Mutation cores](/architecture/mutation-cores), [Webhooks](/api/webhooks)
- [Testing](/reference/testing)
