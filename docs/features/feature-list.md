# What Yuyu can do

Yuyu is a free, self-hosted platform for creating, running and following up on **free** events. You run it on your own servers, keep your own data, and invite your own organisers. This page is a scannable list of what the product does today. Each section links to the page that explains it in more depth.

::: tip Free events only
Yuyu has no payments, ticket sales, refunds, advertising or third-party trackers. Registering for and attending an event is always free. See [What Yuyu does not do](#what-yuyu-does-not-do).
:::

## At a glance

| Area | In one line | Read more |
| --- | --- | --- |
| Events and websites | Publish events with their own website, programme and short links | [Events and websites](/features/events-and-websites) |
| Registration | Custom forms, capacity, waitlist and approvals | [Registration and RSVP](/features/registration-and-rsvp) |
| Tickets and check-in | QR tickets, live and offline door check-in | [Tickets and check-in](/features/tickets-and-check-in) |
| Teams | Team sign-up for hackathons and competitions | [Teams](/features/teams) |
| Hackathon judging | Submissions, rubric scoring, awards and results | [Hackathon judging](/features/hackathon-judging) |
| Event crew | Crew tickets that never take a guest's place | [Crew](/features/crew) |
| Email | Transactional email and designed broadcasts | [Email and broadcasts](/features/email-and-broadcasts) |
| After the event | Feedback, certificates, reports and exports | [Feedback, certificates and reports](/features/feedback-certificates-reports) |
| Storage and media | Private object storage and safe image handling | [Storage and media](/features/storage-and-media) |
| Organisations and permissions | Roles, collaborators and exact grants | [Permissions](/architecture/permissions) |
| Accounts and security | Sign-in, two-step verification and audit trail | [Auth and sessions](/architecture/auth-and-sessions) |
| Integrations | Machine API, signed webhooks and a mobile API | [Machine API](/api/machine-api), [Webhooks](/api/webhooks), [Mobile API](/api/mobile-api) |
| Self-hosting | Docker, Helm chart, backups and health checks | [Deploy overview](/deploy/overview) |
| Administration | Super-admin area, instance settings and alerts | [Super admin](/features/super-admin) |

## Events and event websites

- Four visibility modes: public, hidden link, invite-only and approval-required. Approval-required events can also be listed on Discover.
- Draft, Live and Offline states, plus cancelled events, with a clear Publishing section.
- Event cloning, slug changes and a three-step create dialog.
- Event websites with programme tracks, speakers, venues, sponsors, FAQs and resources.
- Parallel programme tracks, with live schedule delays that cascade within the affected track.
- Custom accent colours and a cover photo editor (crop, rotate, adjust, preview).
- Short links (such as `/aB3x9Kq`) that follow slug changes and can be regenerated.
- An embeddable event card with in-frame registration, limited to origins you allow.
- Recurring event series, with a page and schedule for each occurrence.
- Public discovery with search by title, tags and organisation name.

Read more: [Events and websites](/features/events-and-websites).

## Registration, RSVP, waitlist and approval

- Guest registration by name and email, and registration for signed-in users.
- Custom registration questions: text, long text, email, phone, select, multi-select, radio, checkbox, number and date, with "show only if" logic.
- Capacity limits with automatic waitlisting and waitlist promotion.
- Approval-required sign-ups with approve, decline and re-accept.
- Duplicate registration prevention.
- Confirmation emails with an `.ics` calendar invitation.
- An "Are you still coming?" attendance confirmation with reminders, and an optional switch that frees the place when a guest says No.
- Invitations to invite-only events.
- Short-lived undo when a registration is removed.
- Saved views and filtered CSV exports on long guest lists, with server-side paging for events with thousands of registrations.

Read more: [Registration and RSVP](/features/registration-and-rsvp).

## Tickets and check-in

- QR tickets that the attendee can view, print or download.
- A live ticket that tears off its QR stub on the attendee's phone the moment they are checked in.
- Check-in by scanning, typing a code or searching, with undo.
- Offline-capable door desk that keeps a roster in the browser and syncs later.
- PIN-locked door stations for volunteers who do not have a Yuyu account.
- Custom check-in lists beyond venue entry, such as swag, meals or workshops.
- Badge printing with a quick print sheet, three templates and stock-sized presets.
- An immutable history of online and offline check-in actions.

Read more: [Tickets and check-in](/features/tickets-and-check-in).

## Teams

- Team registration for hackathons and competitions, where a team counts as one place.
- Join links and a team page.
- "Looking for a team" matching for solo attendees.
- Team approval and review by organisers.

Read more: [Teams](/features/teams).

## Hackathon judging and results

- Project submissions from teams and solo registrants.
- Rubric judging by invited judges, with a dedicated judge-only workspace.
- Automatic judge assignment.
- Awards, a public results page and a searchable project gallery.

Read more: [Hackathon judging](/features/hackathon-judging).

## Event crew

- A crew list with crew tickets that never take a guest's place.
- A crew sign-up link.
- Food preferences for catering.
- An optional Crew section on the public event page.

Read more: [Crew](/features/crew).

## Email and broadcasts

- Transactional email (confirmations, lifecycle messages, invitations, password resets) queued through a durable outbox.
- Broadcasts to selected groups of registrations, filtered by status and by who did or did not check in.
- Five email designs and starter templates.
- A review step and a five-second undo before a broadcast sends.
- Autosaved drafts that survive a reload or another device.

Read more: [Email and broadcasts](/features/email-and-broadcasts).

## Feedback, certificates and reports

- Per-event feedback forms with templates, custom questions and an open or closed state.
- Anonymous feedback by default, or feedback tied to a confirmed RSVP when certificates are on.
- Certificates built from text and image layers on your own artwork, issued as downloadable images.
- Response reporting with CSV export.
- A registration funnel in event analytics.
- A post-event PDF report.
- An attendee CSV for organisers with the right permission.

Read more: [Feedback, certificates and reports](/features/feedback-certificates-reports).

## Storage and media

- Uploaded images (covers, logos, speaker photos, certificate artwork, profile pictures) are validated and re-encoded to WebP. The original upload is not kept.
- Private S3-compatible object storage.
- A script to move database-stored assets to S3.
- An instance storage breakdown in the super-admin area.

Read more: [Storage and media](/features/storage-and-media).

## Organisations, roles and permissions

- Multiple organisations per user, each the boundary for its own events and data.
- Owner, admin and member roles, with protection for the last owner.
- Expiring, revocable invitation links for organisation members.
- Event collaborators (co-organisers) with exact grants: edit details, manage registrations, manage invitations, check in, publish and schedule, and judge.
- Organisation profile, logo and slug management, and organisation deletion with a typed confirmation.
- Audited administrative changes.

Read more: [Permissions](/architecture/permissions).

## Accounts, sign-in and security

- Email and password sign-in with inbox verification, and optional Google sign-in.
- Authenticator-app two-step verification with recovery codes.
- Password reset, and "sign out everywhere".
- An account area for your registrations, certificates, organisations, security activity and a personal data export.
- Rate limiting, content security policy nonces, audit events and private object storage.
- Light and dark modes with accessible defaults.

Read more: [Auth and sessions](/architecture/auth-and-sessions) and the [Security checklist](/reference/security-checklist).

## Machine API and webhooks

- A tenant-bound, read-only machine API under `/api/v1` with scoped bearer credentials, for events and confirmed participants.
- Credentials shown once, revocable, optionally expiring, and rotatable without downtime.
- Signed organisation webhooks (up to 10 endpoints per organisation) for registrations, status changes, check-ins, publish and cancel, and feedback.
- Reveal-once signing secrets, secret rotation, test sends, a delivery log with redelivery, automatic retries and auto-disable.
- Webhook payloads carry names and statuses only.

Read more: [Machine API](/api/machine-api) and [Webhooks](/api/webhooks).

## Mobile API and apps

- A mobile API under `/api/mobile/v1` for the Yuyu Android and iOS apps.
- Attendee features: sign-in, your tickets and team, discovery and registration.
- Organiser day-of work: check-in, guest and team approval, and the live programme.
- A judge's scoring workspace.

Read more: [Mobile API](/api/mobile-api) and [Mobile apps](/build/mobile-apps).

## Self-hosting and operations

- A standalone multi-stage Docker build and a Helm chart.
- Database backup and restore scripts, with optional copy to a private backup bucket.
- Separate migration step before rolling out a new image.
- Readiness and health endpoints.
- Redis-backed live check-in updates across more than one replica.
- An optional operational alerts webhook (Mattermost or Slack compatible) for server errors, sign-in and email failures and restarts.
- An in-app help centre at `/help` with search and screenshots.

Read more: [Deploy overview](/deploy/overview), [Docker](/deploy/docker), [Kubernetes](/deploy/kubernetes) and [Operations](/deploy/operations).

## Administration

- A separate super-admin area, restricted to a configured email and protected by two-step verification step-up.
- Instance settings for SMTP (with a test email), Google sign-in and backup posture, applied on every replica without a restart.
- A control to disable new account creation while keeping existing sign-ins.
- Retry for recently failed email.
- Read-only insights on activity, email and security.

Read more: [Super admin](/features/super-admin).

## What Yuyu does not do

The Yuyu repository states these limits explicitly:

- No paid events, ticket sales, payments, refunds or event revenue.
- No advertising or third-party trackers.
- Backup settings in the super-admin area are display-only. They do not run, retain or restore backups. Use the backup scripts or your database provider.
- Running more than one replica needs a shared `REDIS_URL` for live check-in.
