# Glossary

Domain and codebase terms you will meet in Yuyu, with the model, enum or file where each one lives. Where the UI name differs from the code name, both are given.

## Tenancy and people

| Term | Meaning | In code |
| --- | --- | --- |
| **Organisation** | The tenant. Owns events, series, assets, API clients and webhooks. Every dashboard check starts here | `Organisation` |
| **Membership** | A user's role in an organisation: `OWNER`, `ADMIN` or `MEMBER` | `Membership`, `MembershipRole` |
| **Collaborator / co-organiser** | A user with exact grants on one event or one series, without organisation-level rights | `EventCollaborator` |
| **Grant** | One `EventPermission` value: `EDIT_DETAILS`, `MANAGE_REGISTRATIONS`, `MANAGE_INVITATIONS`, `CHECK_IN`, `PUBLISH_AND_SCHEDULE`, `JUDGE`. A grant never implies another | `EventPermission` |
| **Judge-only** | A collaborator whose only grant is `JUDGE`. Sees only the judging workspace | `lib/eventAccess.ts` |
| **Capabilities object** | Server-computed flags that decide which dashboard controls show. Visibility only: actions re-check | `eventCapabilities`, `seriesCapabilities` in `lib/eventDashboard/capabilities.ts` |
| **Super admin** | The single instance operator, identified by `SUPER_ADMIN_EMAIL` | `requireSuperAdmin`, `requireSuperAdminMfa` in `lib/permissions.ts` |
| **Step-up** | The fresh TOTP verification required for the super-admin area. The proof lasts 10 minutes | `app/super-admin-mfa/` |
| **sessionVersion** | Integer on `User`. Bumping it revokes every web and mobile session | `User.sessionVersion` |

## Events and websites

| Term | Meaning | In code |
| --- | --- | --- |
| **Event status** | `DRAFT`, `PUBLISHED`, `HIDDEN`, `CANCELLED`. The Publishing UI calls `PUBLISHED` **Live** and `HIDDEN` **Offline** | `EventStatus`, `components/event/PublishingSection.tsx` |
| **Released page** | The event website is visible (`EventPage.isPublished = true`). Always written together with `Event.status = PUBLISHED` | `EventPage`, `app/actions/event.ts` |
| **Privacy type** | `PUBLIC`, `HIDDEN_LINK`, `APPROVAL_REQUIRED`, `INVITE_ONLY` | `EventPrivacyType` |
| **Listed publicly** | Lets an approval-required event appear in discovery | `Event.listedPublicly` |
| **Series** | A recurring event defined by an RRULE | `EventSeries.recurrenceRule` |
| **Occurrence / instance** | One materialised date of a series | `EventInstance` |
| **Page section** | A block of the event website: `HERO`, `ABOUT`, `HIGHLIGHTS`, `SCHEDULE`, `SPEAKERS`, `SPONSORS`, `VENUE`, `FAQ`, `RESOURCES`, `CREW` | `EventPageSectionType` |
| **Programme** | Sessions, tracks, rooms and speakers on the event website | `EventSession`, `EventScheduleTrack`, `EventSpeaker` |
| **Short link** | A seven-character code with at least one uppercase letter that redirects to a published, released event | `Event.shortCode`, `lib/shortLinkResolve.ts` |
| **Embed** | The framable public event view at `/embed/...`, allowed only for `ALLOWED_EMBED_ORIGINS` | `app/embed/` |

## Registration

| Term | Meaning | In code |
| --- | --- | --- |
| **RSVP / registration** | One person's sign-up for an event or occurrence | `RSVP` |
| **RSVP status** | `CONFIRMED`, `WAITLISTED`, `PENDING_APPROVAL`, `REJECTED` | `RsvpStatus` |
| **attendeeKey** | The dedupe key: `user:<id>` or `guest:<normalised email>` | `RSVP.attendeeKey`, `lib/rsvpCore.ts` |
| **Registration mode** | `INDIVIDUAL` or `TEAM` | `RegistrationMode` |
| **Unit** | On a `TEAM` event, one team or one solo registration. Capacity counts units, not people | `docs/TEAMS.md` |
| **Solo policy** | `TEAMS_ONLY`, `SOLO_ALLOWED`, `SOLO_WITH_MATCHING` | `SoloPolicy` |
| **Seeker** | A solo registrant listed as *looking for a team* | `TeamSeekerProfile` |
| **Crew** | The organising team. Their confirmed tickets (`isCrew`) never count against capacity or receive attendance checks | `RSVP.isCrew`, `EventCrewMember` |
| **Attendance confirmation** | The organiser-sent "Are you still coming?" question, answered at `/attend/:token`. Never sent automatically | `AttendanceCheck`, `AttendanceResponse` |
| **Undo snapshot** | A short-lived server-side copy that lets an organiser undo an RSVP deletion | `RsvpDeletionUndo` |

## Check-in

| Term | Meaning | In code |
| --- | --- | --- |
| **Check-in token** | The opaque per-RSVP token in the ticket QR. A bearer capability | `RSVP.checkInToken` |
| **Check-in projection** | The single commit path for a check-in. It also publishes the live update | `commitCheckInProjection` in `lib/checkInMutations.ts` |
| **Check-in list** | A custom list beyond entry (swag, meals, workshops), each with its own records and history | `CheckInList`, `CheckInListRecord`, `CheckInListEvent` |
| **Station** | A PIN-locked check-in page for door volunteers, open from 24 hours before the event until one hour after it | `Event.checkInStationPinHash` |
| **Offline check-in** | Desk check-in that keeps working without a connection and syncs later | `lib/offline-checkin.client.ts` |
| **Tear** | The live-ticket animation: the stub tears away when the attendee is checked in, driven by the SSE stream | `components/ticket/LiveTicket.tsx`, `/api/ticket/:token/events` |

## Hackathon judging

| Term | Meaning | In code |
| --- | --- | --- |
| **Entrant** | The team or solo registration that owns a project | `docs/HACKATHON.md` |
| **Submission** | A project: `DRAFT`, `SUBMITTED`, `WITHDRAWN`, `DISQUALIFIED`. Only `SUBMITTED` projects can be scored or win | `Submission`, `SubmissionStatus` |
| **Rubric / criterion** | The scoring criteria. They can change only while judging is `NOT_STARTED` | `JudgingCriterion`, `JudgingStatus` |
| **Score normalisation** | `RAW` (plain mean) or `ZSCORE` (each judge's scores standardised first) | `ScoreNormalization` |
| **Award** | A named prize given to submitted projects | `EventAward`, `EventAwardWinner` |

## Email, jobs and integrations

| Term | Meaning | In code |
| --- | --- | --- |
| **Outbox** | The queue that every email goes through. Request paths never wait for SMTP | `OutboxMessage`, `lib/outbox.ts`, `lib/outboxWorker.ts` |
| **Kind** | The outbox message type, for example `rsvp-confirmation` or `attendance-check` | `OutboxMessage.kind` |
| **Bulk kind** | A kind sent to a whole audience. Claimed after transactional kinds | `BULK_OUTBOX_KINDS` |
| **Capability email** | An outbox row carrying a raw bearer token. Deleted after delivery, expiry or terminal failure | `lib/outbox.ts` |
| **Heartbeat** | The worker's last start and success times, used to detect a stalled outbox | `OperationalHeartbeat` |
| **Broadcast** | An organiser email to a chosen set of registrations, delivered as one outbox message per recipient | `EventBroadcast`, `EventBroadcastDraft` |
| **Organisation webhook** | A signed HTTP callback for event activity, SSRF-checked | `WebhookEndpoint`, `WebhookDelivery`, `lib/webhooks/` |
| **Machine API** | `/api/v1`. Tenant-bound bearer credentials with explicit scopes | `ApiClient`, `ApiCredential`, `ApiClientScope` |
| **Mobile API** | `/api/mobile/v1`. User-identity tokens for the Yuyu apps | `MobileSession`, `lib/mobile/` |
| **Core** | A mutation function shared by Server Actions and the mobile API | `lib/core/` |
| **Saved view** | Named filters on a paged dashboard list. Never an access grant | `SavedView`, `SavedViewSurface` |

## Operations

| Term | Meaning | In code |
| --- | --- | --- |
| **Instance settings** | Database-stored SMTP, Google SSO, backup posture and alert webhook, managed in Super admin → Settings. Override the environment fallbacks | `InstanceSetting`, `lib/instanceSettings.ts` |
| **Ops alerts** | A redacted operational webhook (Mattermost or Slack-compatible) | `lib/opsAlerts.ts` |
| **Audit event** | A descriptive business or security record. Database triggers add a PII-free fallback record | `AuditEvent`, `recordAuditEvent` in `lib/audit.ts` |
| **Migrator** | The Docker target and Helm Job that run `prisma migrate deploy` separately from app startup | `Dockerfile`, `charts/yuyu/templates/migration-job.yaml` |
| **CI test mode** | `CI=true` with `ALLOW_INSECURE_PRODUCTION_TESTS=1`. Relaxes TLS and HTTPS checks for a production build in CI or staging only | `lib/env.ts` |
| **Help centre** | In-app user guide at `/help`, written as MDX in `content/help/` | `lib/help/` |
| **Dot sign** | Yuyu's dot-grid brand mark | `components/brand/DotMark.tsx` |

## Further reading

- [Data model](/architecture/data-model), [Permissions](/architecture/permissions), [Codebase tour](/start/codebase-tour)
- [docs/PERMISSIONS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/PERMISSIONS.md), [docs/TEAMS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/TEAMS.md), [docs/HACKATHON.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/HACKATHON.md)
