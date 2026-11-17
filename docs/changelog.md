# Changelog

This page summarises the Yuyu changelog for developers: what changed in each release, which migrations and settings came with it, and what to do when you upgrade. It is a digest, not a copy. The full, authoritative text is [`CHANGELOG.md` in the Yuyu repository](https://github.com/twilighty-abhi/yuyu/blob/main/CHANGELOG.md), which follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Yuyu releases are **named by date**, not by version number: `package.json` stays at `0.1.0` and releases are not yet tagged in git. This wiki was verified against Yuyu commit `b223291` (2026-11-03). Anything newer in the upstream changelog is not reflected here.

::: tip Reading the entries
Bullets link to the wiki page that explains the area. Migration names are exact; the full list with lock notes is in [Operations](/deploy/operations).
:::

## Yuyu releases

### Unreleased: production release 2026-10-27

The first production deploy since 1.0.0 (production `bf7a04d`, 2026-10-21): the latest `main` after the release-gate fixes in #27 and #29, about 125 commits and **13 migrations** (`20261022000000_event_broadcast_drafts` to `20261029000000_event_crew`). Read the upgrade notes below, and the upstream runbook `docs/PRODUCTION_RELEASE.md`, section *Upgrading from production `bf7a04d`*, before deploying.

::: warning Operational upgrade notes
- **Back up first** with `npm run db:backup` and record the running image. The 13 migrations only move forward; an image-only rollback is safe only until a `JUDGE` grant, a `CREW` page section or other new-feature data has been written.
- **Do not overlap old and new releases.** The old outbox worker permanently fails the new email kinds. Stop the old app before the new one serves traffic (Helm: `--set updateStrategy.type=Recreate`). The new release requeues, once, such emails that failed in the last 7 days.
- **Migrate in a quiet window with a lock timeout.** `20261026000000_large_event_indexes` blocks writes to `RSVP`, `Team`, `Submission` and `EventInvite` while it builds (about 2 s per million registrations). Six migrations take a brief ACCESS EXCLUSIVE lock on `Event`, two on `RSVP`.
- **Remove `WEBHOOKS_ALLOW_PRIVATE_TARGETS`** from any production environment.
:::

#### Added

- **Event crew**: crew tickets that never count against capacity, a crew sign-up link at `/crew/:token`, an optional public Crew section. See [Crew](/features/crew).
- **Attendance confirmation** ("Are you still coming?"): manual sends only, guest form at `/attend/:token`, optional release of the place on a No. Outbox kind `attendance-check`. See [Registration and RSVP](/features/registration-and-rsvp) and [Background jobs](/architecture/background-jobs).
- **Share attendance link**: owners and admins copy one guest's link instead of emailing it. No schema change.
- **Team registration** for one-off events: `registrationMode`, `teamMinSize`, `teamMaxSize`, `soloPolicy`; capacity counts units; leaders manage teams from `/team/:token`. See [Teams](/features/teams).
- **Hackathon submissions, judging and results**: new Judging tab, weighted rubric, `JUDGE` co-organiser permission, public results and project gallery. See [Hackathon judging](/features/hackathon-judging).
- **Score normalisation, Score next project, automatic judge assignment and a Progress view**, stored in `Event.scoreNormalization` and `Event.reviewsPerProject` (1 to 20).
- **Custom check-in lists** beyond venue entry (for example swag or lunch), with a per-list CSV column. Standalone events only. See [Tickets and check-in](/features/tickets-and-check-in).
- **Re-accept a declined registration**, on the Guests list and through the mobile API `…/guests/:rsvpId/reaccept`. Audit action `RSVP_REACCEPTED`.
- **Saved email drafts** in the Emails tab (`EventBroadcastDraft`). See [Email and broadcasts](/features/email-and-broadcasts).
- **Organisation webhooks**: up to 10 endpoints, signed with `x-yuyu-signature`, SSRF-restricted targets, retries from the existing outbox worker, auto-disable after 20 consecutive failures. See [Webhooks](/api/webhooks).
- **Saved views and filtered CSV exports** for Guests, Teams and Judging lists, with new `GET /api/exports/events/:eventId/teams` and filter support on the attendee and judging exports.
- **Public gallery** search, sort (`?sort=`) and an Award winners filter.
- **In-app help centre at `/help`**: 68 articles in 14 sections written as MDX in `content/help/`; it replaces the PDF user manual.
- **Mobile API additions**: Teams routes, judging workspace, `judging` list on `GET /me`, organiser schedule with speakers. All additive. See [Mobile API](/api/mobile-api).
- **Large-event performance**: six keyset indexes (`20261026000000_large_event_indexes`), aggregated judging reads, streamed CSV exports.

New migrations in this release, all additive unless noted:

| Migration | Purpose |
| --- | --- |
| `20261022000000_event_broadcast_drafts` | Saved email drafts |
| `20261023000000_check_in_lists` | Custom check-in lists |
| `20261023010000_org_webhooks` | Organisation webhooks |
| `20261024000000_team_registration` | Team registration |
| `20261024010000_hackathon_judging` | Judging, `JUDGE` permission |
| `20261024020000_judging_results_announced` | Nullable `Event.resultsAnnouncedAt`, so re-publishing results never emails anyone twice |
| `20261025000000_judging_ops` | Score normalisation, review target |
| `20261025010000_saved_views` | Saved views |
| `20261026000000_large_event_indexes` | Six composite indexes (blocks writes while it builds) |
| `20261027000000_drop_orphan_event_session_type` | Drops the unused `EventSessionType` enum |
| `20261028000000_attendance_confirmation` | Attendance confirmation |
| `20261028010000_hackathon_email_toggles` | Two opt-in email switches, default false |
| `20261029000000_event_crew` | Event crew |

See [Data model](/architecture/data-model) and [Change the schema](/guides/change-the-schema).

#### Changed

- **Hackathon emails are opt-in and off by default**, on existing events too: **Email entrants when results are published** and **Email a receipt when a project is submitted**. **Send results email now** sends later. Registration and capability emails are unchanged.
- **Guests · People chip counts are event-wide** rather than narrowing with search and filters.
- **Large lists are paged on the server** (guests, teams, check-ins, invites, judging, gallery at 24 per page); the old 250, 200 and 100-row caps are gone.
- **Team events**: single-member approve, reject and promote are refused (act on the whole team); team mode is fixed once an event has registrations; `POST /api/mobile/v1/rsvp` returns `TEAM_REQUIRED` (409) for team-only events.
- **Crew never count against capacity**, including the mobile `capacityUsed`. The machine API roster still lists them.
- **Dashboard refusals are real 404s and 307s**, and `/help` caching is tightened.
- **Webhook delivery runs in the existing in-process outbox pass**: no new process or cron job.
- Team and `MANAGE_REGISTRATIONS` permission rules aligned. See [Permissions](/architecture/permissions).

#### Fixed

- **Gmail login limit during broadcasts**: the outbox is back to 20 emails per scheduler pass, with transactional email claimed before bulk sends. Large sends take longer.
- **Large-event dashboard memory**: `Intl.DateTimeFormat` objects are cached (`lib/format/intlCache.ts`); a 15,000-registration dashboard opens in about 0.3 s instead of 2 to 8 s.
- **Non-UTC databases**: raw SQL now passes explicit UTC timestamps (`lib/sqlTimestamp.ts`), fixing reminder and webhook retry times.
- **New events start at the chosen timezone's time**: offset-less date-times are now read in the payload's `timezone`. Events created earlier keep their stored time, so check any created on a server whose clock differs from the event timezone.
- **Co-organiser permissions**: `MANAGE_INVITATIONS` and `MANAGE_REGISTRATIONS` are now enforced server-side as the dashboard already implied; owner and admin controls are hidden from collaborators. Matrix in upstream `docs/PERMISSIONS.md`.
- **Schema drift**: `prisma migrate diff` is now empty and the Quality gate checks it.
- **Mobile API contract**: the OpenAPI file validates with JSON Schema 2020-12 tools; unknown paths under `/api/mobile/v1` return the JSON `NOT_FOUND` envelope.
- New events' public pages show their sections; concurrent publishes emit one `event.published` webhook; successful MFA sign-ins no longer raise ops alerts; plus a set of small accessibility and wording fixes.

#### Security

- **Capability links** (attendance, submission, team, crew) are 256-bit tokens stored as SHA-256 digests, `noindex`, `no-referrer` and `private, no-store`.
- **`JUDGE` never satisfies another permission check**; judges never see entrant emails, answers or tickets.
- **Signed-in and capability-link pages are never cached**: dashboard, account, super-admin, `/login`, `/join/*`, `/reset-password` and `/verify-email` send `private, no-cache, no-store`.
- **Webhook targets are SSRF-restricted** (public `https` on 443/8443, every resolved address checked, no redirects). `WEBHOOKS_ALLOW_PRIVATE_TARGETS` is ignored in production unless both `CI=true` and `ALLOW_INSECURE_PRODUCTION_TESTS=1` are set, and `npm run production:check` refuses it.
- **The rate limiter answers at once while Redis is down** (500 ms command deadline) instead of stalling for 1 to 30 seconds.
- **Dependency advisories patched**: `next` 16.4.2, `zod` 4.6.7, `nodemailer` 10.2.1.

#### Upgrade notes

1. Back up, and plan the rollback limits (see the warning above).
2. `npm run db:deploy` applies the 13 migrations: well under a second at production's size, about 3.3 s at one million registrations.
3. Stop the old release before the new one serves traffic.
4. **Configuration**: no new required environment variables and no new cron job. Keep `TRUSTED_PROXY_IP_HEADER` matching the real proxy and `NEXT_PUBLIC_BASE_URL` on `https` (capability emails are refused for an `http` base URL in production). App processes need outbound HTTPS (443/8443) to webhook receivers. See [Configuration](/reference/configuration) and [Reverse proxy](/deploy/reverse-proxy).
5. Tell organisers that hackathon results and receipt emails are off by default, that team mode cannot be switched on once an event has registrations, that attendance confirmation is manual, and that large sends take a while to drain.
6. The Docker Hub publish workflow needs the `DOCKERHUB_USERNAME` and `DOCKERHUB_NAMESPACE` variables and the `DOCKERHUB_TOKEN` secret; until they exist, build the image from source. See [CI/CD](/deploy/ci-cd).

For the deploy procedure itself see [Production checklist](/deploy/production-checklist), [Operations](/deploy/operations) and [Kubernetes](/deploy/kubernetes).

### 1.0.0: 2026-10-21

The V1 release: everything the `v1-design-overhaul` integration branch added on top of production `main`.

#### Added

- **V1 design system**: Tailwind CSS 4, Radix primitives, `--yy-*` tokens for light and dark mode, self-hosted fonts and the dot-sign brand. See [Design tokens](/design/tokens) and [Brand](/design/brand).
- **Redesigned screens** across the workspace, public pages, account and super-admin areas; the event dashboard regrouped into eight tabs with `?tab=` and `?sub=` deep links.
- **Publishing section**, `listedPublicly` for approval-required events, registration question settings and "show only if" logic. See [Events and websites](/features/events-and-websites).
- **Broadcast designs** (Classic, Minimal, Accent band, Photo header, Letter), a mandatory review step and a five-second undo.
- **Certificate builder** with up to 20 layers, and **badge printing** rebuilt with templates and stock presets. See [Feedback, certificates, reports](/features/feedback-certificates-reports).
- **Event short links** at `/{7-character code}`.
- **Account area**: Profile, Registrations, Organisations, Security, and a personal JSON export at `GET /api/exports/account`.
- **Live ticket tear** over Server-Sent Events (`GET /api/ticket/:token/events`) with Redis pub/sub. See [Realtime](/architecture/realtime).
- **Mobile API v1** (`/api/mobile/v1`) with hashed, rotating session tokens, an OpenAPI 3.1 contract and app-link files. Server Action logic moved into shared `lib/core/*`. See [Mobile API](/api/mobile-api) and [Mutation cores](/architecture/mutation-cores).
- **Operational alerts webhook** (Mattermost or Slack-compatible), **Send test email**, and `scripts/check-instance-secrets.mjs`. See [Super admin](/features/super-admin).
- New optional settings `GOOGLE_MOBILE_CLIENT_IDS`, `ANDROID_APP_SHA256_CERT_FINGERPRINTS` and `APPLE_APP_IDS`.
- **8 migrations**: `20261015000000_registration_question_settings`, `20261016000000_event_listed_publicly`, `20261017000000_broadcast_design`, `20261018000000_rsvp_user_index`, `20261019000000_event_short_code`, `20261020000000_mobile_sessions`, `20261021000000_ops_alert_webhook`, `20261021010000_realign_event_publication`.

#### Changed

- The interface follows the operating system colour mode when none is saved.
- **Saved SMTP replaces the `SMTP_*` environment as a whole**; panel settings are read from PostgreSQL on every send and sign-in. Blank environment values count as unset.
- Event dashboard tabs go from eleven to eight; old `?tab=details|registration|invites` links still work.
- API access moves to Organisation settings; deleting an organisation needs its exact name typed.
- Server Actions became thin wrappers over `lib/core/*`.
- Broadcast test sends use their own `broadcastTest` rate-limit bucket (20 an hour).

#### Fixed

- **Publish event** now sets the event Live and releases its page in one transaction; before, such events stayed 404. The `20261021010000_realign_event_publication` data migration repairs existing ones.
- Missing pages return a real HTTP 404 instead of a streamed 200.
- WebP dimension parsing, broadcast test-send links, and unreadable Google secrets no longer break pages.

#### Security

- Short links never reveal a hidden event's slug; mobile sessions store only SHA-256 digests and revoke on refresh-token reuse.
- Every super-admin page calls `requireSuperAdminMfa()` itself, enforced by a unit test.
- The personal data export is own-data only, allow-listed, rate limited (5 an hour) and audited.
- Alert webhook URL is write-only and encrypted; alert text is redacted. See [Auth and sessions](/architecture/auth-and-sessions).
- The staging Nginx example overwrites `X-Forwarded-For` instead of appending to it.

#### Removed

- MUI, Emotion and `date-fns`, Plausible analytics, the old icon and asset URLs, and the legacy dashboard components.

::: warning Upgrade notes for 1.0.0
- Run `npm run db:deploy` (or the Helm migration Job) before rolling out the image. `20261018000000_rsvp_user_index` briefly blocks RSVP writes while it builds, so use a quiet window on large installations.
- Before deploying run `node scripts/check-instance-secrets.mjs`; afterwards use **Send test email**. Re-enter the SMTP user and app password in the panel if a saved host relied on environment credentials.
- Configure the reverse proxy not to buffer `/api/ticket/:token/events` and to allow idle reads of at least 30 seconds (Nginx `proxy_buffering off`). See [Reverse proxy](/deploy/reverse-proxy).
- Missing pages now return 404, and the removed icon URLs 404: check monitors and crawlers.
- Keep `NEXT_PUBLIC_BASE_URL` on the public HTTPS address so emails carry images and links.
:::

### 0.2.0: 2026-04-22

Phase 2. Later releases to production `main` before 1.0.0 were not recorded upstream.

- **Added**: role-based access utilities, the organisation dashboard and event management panel, attendee management (search, approve, reject, promote), member management and organisation invites, `HIDDEN` status, the four privacy types, the RSVP status lifecycle, the shared RSVP core behind `POST /api/rsvp`, rate limiting, Discover and search, event and series invites, recurring series (RRULE), per-RSVP check-in tokens, the ticket page and the check-in station.
- **Changed**: email magic link replaced by an email and password Credentials provider alongside Google OAuth (JWT sessions); full events now waitlist new RSVPs instead of blocking them.
- **Removed**: the `nodemailer` dependency and the magic-link stub.

### 0.1.0: 2026-04-20

The Phase 1 foundation: Next.js 16 App Router, PostgreSQL with Prisma 6, Auth.js v5, the core domain models (`User`, `Organisation`, `Membership`, `Event`, `RSVP`), public organisation and event pages, an RSVP action with capacity checks, and Zod validation. Email delivery was a development stub. Recurring events, waitlists, invite-only flows, approvals, ticketing and analytics were out of scope.

## Changes to this wiki

Notable changes to this wiki itself, newest first. `git log` in the wiki repository is authoritative.

| Date | Commit | Change |
| --- | --- | --- |
| 2026-11-17 | `e33895d` | Fixed inaccuracies found by checking every page against the Yuyu source |
| 2026-11-17 | `196ff25` | Added the design system, deploy and build sections, the component library, search and the version card |
| 2026-11-06 | `f71125a` | Wrote the README for running, editing and hosting the wiki |
| 2026-11-06 | `e2985c7` | Added CI deployment to GitHub Pages |
| 2026-11-06 | `54e1adc` | Added reference pages |
| 2026-11-06 | `f5fc702` | Added how-to guides for common changes |
| 2026-11-06 | `e7e2251` | Added machine API, mobile API and webhook pages |
| 2026-11-06 | `e7c2ded` | Added feature module pages |
| 2026-11-06 | `a56c5dc` | Added architecture pages |
| 2026-11-06 | `620a399` | Added get-started pages |
| 2026-11-06 | `69d075a` | Scaffolded the VitePress project |
