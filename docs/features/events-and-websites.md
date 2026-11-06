# Events and websites

An `Event` is the unit almost everything else hangs off: registrations, teams, crew, check-in, judging, emails and the public website. This page covers the event record itself and how it reaches the public: the publication switch, the event website (`EventPage` and its content models), the programme with live delays, recurring series, short links, the embed and discovery. If you touch anything that decides whether an event is visible or open for sign-ups, read [Invariants](#invariants) first.

## Key files

| Path | Role |
| --- | --- |
| `app/actions/event.ts` | `createEvent`, `updateEvent`, `publishEvent`, `cloneEvent`, `deleteEvent`, `updateEventSlug`, `uploadEventCoverImage` |
| `app/actions/event-website.ts` | `saveEventPage`, `showCrewSection`, highlights, speakers, sponsors, FAQs, resources, venue, tracks, sessions, `deleteWebsiteContent` |
| `lib/core/eventProgramme.ts` | `setEventSessionDelayForUser` (shared with the mobile API), `eventWebsiteContextForUser`, `revalidateEventWebsitePaths` |
| `lib/eventProgram.ts` | `effectiveEventProgram` (per-track delay cascade) and `conflictingTrackSessionIds` |
| `app/actions/series.ts` | `createEventSeries`, `updateEventSeriesMeta`, `deleteEventSeries` |
| `app/actions/schedule.ts` | `saveScheduleItem`, `setScheduleDelay` (series occurrence schedule) |
| `lib/recurrence.ts` | `buildRecurrenceIcs`, `materializeInstances` (RRULE expansion via the `rrule` package) |
| `app/actions/shortLink.ts` | `createEventShortLink`, `regenerateEventShortLink` |
| `lib/shortLink.ts` / `lib/shortLinkResolve.ts` | Code generation and shape check; `resolveShortCode`, `resolveShortLinkSegment` |
| `lib/publicEventAccess.ts` | `resolvePublicEventAccess(ForUser)`: the single rule for who may view a public event page |
| `lib/eventVisibility.ts` | `listedEventAudienceWhere`, `isDiscoverableEvent`, `shouldIndexPublicEvent` |
| `app/[orgSlug]/[eventSlug]/*` | Public event page, `schedule`, `sessions/[sessionSlug]`, `speakers/[speakerSlug]`, OG and Twitter images |
| `app/[orgSlug]/i/[instanceId]/*` | Public page and schedule for a series occurrence |
| `app/[orgSlug]/layout.tsx`, `app/[orgSlug]/page.tsx` | Organisation page; falls back to short-link resolution when no organisation matches |
| `app/embed/[orgSlug]/[eventSlug]/page.tsx` | Framable event card (renders the canonical event page) |
| `proxy.ts`, `lib/env.ts` | `frame-ancestors` from `ALLOWED_EMBED_ORIGINS`; env validation of that list |

## How it works

### Event states and the publication switch

`EventStatus` is `DRAFT`, `PUBLISHED`, `HIDDEN` or `CANCELLED` (the dashboard labels the first three Draft, Live and Offline). Public visibility needs **two** flags: `Event.status = PUBLISHED` and `EventPage.isPublished = true` (the "website released" flag). Every writer keeps them in step:

- `createEvent` creates the page row in the same `prisma.event.create` with `isPublished: data.status === PUBLISHED`.
- `updateEvent` locks the event row (`SELECT ... FOR UPDATE`), applies the update and upserts `EventPage.isPublished` from the new status in the same transaction.
- `publishEvent` locks the row, sets `PUBLISHED` only if it was not already, and upserts the page with `isPublished: true` (creating it for clones or older drafts that have none). Only the caller that actually changed the status writes `EVENT_PUBLISHED` and emits `event.published`.
- `saveEventPage` creates a missing page row released exactly when the event is already published; it never changes the release flag on an existing row.

```ts
// app/actions/event.ts (publishEvent)
const previousStatus = await prisma.$transaction(async (tx) => {
  const [locked] = await tx.$queryRaw<Array<{ status: EventStatus }>>`SELECT "status" FROM "Event" WHERE "id" = ${event.id} FOR UPDATE`;
  if (!locked) return null;
  if (locked.status !== EventStatus.PUBLISHED) {
    await tx.event.update({ where: { id: event.id }, data: { status: EventStatus.PUBLISHED } });
  }
  await tx.eventPage.upsert({
    where: { eventId: event.id },
    create: { eventId: event.id, isPublished: true },
    update: { isPublished: true },
  });
  return locked.status;
});
```

Readers check both flags: `resolvePublicEventAccessForUser` (public pages, mobile public API), `reserveRsvp` and `submitRsvpCore` in `lib/rsvpCore.ts`, `resolveShortCode`, and the team cores' `isOpenForRegistration`.

`updateEvent` also enforces capacity and team rules under the same lock: capacity cannot drop below the current confirmed count (`countConfirmedForCapacity`, units on team events), `registrationMode` cannot change once any RSVP exists, and `teamMaxSize` cannot drop below the largest team. Saving the form clears any mobile "close sign-ups" snapshot (`registrationManuallyClosedAt` and the two `...BeforeManualClose` fields).

Creating events, series, clones and cover images requires a verified email (`isUserEmailVerified`). Creation, publishing, cloning, slug changes and deletion are owner/admin only (`canCreateEvent`, `canPublishEvents`).

### Who can see a public page

`resolvePublicEventAccessForUser(viewerUserId, { status, privacyType, websiteReleased, ... })`:

1. A viewer with the `EDIT_DETAILS` or `PUBLISH_AND_SCHEDULE` capability on the event (or series) may **preview** it in any state.
2. Otherwise the event must be `PUBLISHED` and released, or the result is `allowed: false`.
3. `INVITE_ONLY` events additionally need a signed-in user with a verified email that matches an `EventInvite` (or `SeriesInvite`) row. Knowing the URL is not an invite.

`EventPrivacyType` is `PUBLIC`, `HIDDEN_LINK`, `APPROVAL_REQUIRED` or `INVITE_ONLY`. Listing (organisation page, Discover, search, sitemap indexing) uses `listedEventAudienceWhere`: `PUBLIC`, or `APPROVAL_REQUIRED` with `listedPublicly = true`. `updateEvent` forces `listedPublicly` to false for any other privacy type.

### Event website

`EventPage` (one per event) holds the release flag, tagline, logo, accent colour and about HTML. Content lives in separate models, each scoped by `eventId`:

| Content | Models |
| --- | --- |
| Sections and their order | `EventPageSection` (`EventPageSectionType`: `HERO`, `ABOUT`, `HIGHLIGHTS`, `SCHEDULE`, `SPEAKERS`, `SPONSORS`, `VENUE`, `FAQ`, `RESOURCES`, `CREW`) |
| Highlights, FAQs, resources | `EventHighlight`, `EventFaq`, `EventResource` |
| Venue | `EventVenue`, `EventVenueRoom` |
| Programme | `EventScheduleTrack`, `EventSession`, `EventSessionSpeaker`, `EventSpeaker` |
| Sponsors | `EventSponsor` (`SponsorTier`) |

Content items carry `ContentVisibility`; only published items render publicly. Website actions resolve the caller with `EDIT_DETAILS` (page settings, highlights, speakers, sponsors, resources, FAQs, venue) or `PUBLISH_AND_SCHEDULE` (tracks and sessions) through the event collaborator rules, then call `revalidateEventWebsitePaths`. Uploaded images (logos, speaker photos, sponsor logos, covers) must be this organisation's uploads in the right category (`isOrganisationUploadUrl(url, orgId, "event-covers" | "event-page-logos" | ...)`); see [Storage and media](/features/storage-and-media).

`saveEventPage` accepts every section type once. It tolerates a form that predates `CREW` (one fewer section) and leaves the saved `CREW` row untouched in that case.

### Programme and live delays

Planned session times are never rewritten. `setEventSessionDelayForUser` stores `EventSession.delayMinutes` (0 to 1440), audited as `EVENT_SESSION_DELAY_SET`. `effectiveEventProgram` sorts sessions and accumulates delays **per track**: a session's own delay shifts later sessions in the same track, never other tracks. Sessions without a track share a `"legacy-default-track"` bucket. `conflictingTrackSessionIds` reports same-track overlaps, which the dashboard shows as warnings rather than refusing.

### Recurring series

`createEventSeries` builds an ICS string (`DTSTART` plus `RRULE`) with `buildRecurrenceIcs`, expands it with `materializeInstances` and, in one transaction, creates the `EventSeries` and its `EventInstance` rows. Expansion defaults to 48 occurrences within 366 days (hard cap 500); a rule that yields nothing is refused. Each occurrence has its own RSVP list (`RSVP.eventInstanceId`), schedule (`EventScheduleItem`) and public page `/:orgSlug/i/:instanceId`. Series capacity, privacy and status live on `EventSeries`.

Series stay individual: the series validators refuse team settings, and crew, judging and attendance confirmation are one-off-event features.

### Short links

`Event.shortCode` is an optional unique 7-character code served at `/:code`. `generateShortCode` uses `crypto.randomInt` and guarantees at least one uppercase letter, so a code can never equal an organisation slug (always lowercase).

- `createEventShortLink` is idempotent: it writes with `updateMany({ where: { shortCode: null } })` so concurrent creates cannot overwrite each other, retries on a `P2002` collision, and returns the winner's code. `regenerateEventShortLink` overwrites unconditionally, retiring the old code. Both are owner/admin only (`canManageEvents`) and audited (`EVENT_SHORT_LINK_CREATED` / `_REGENERATED`).
- Resolution happens in `app/[orgSlug]/layout.tsx` and `page.tsx` when no organisation matches the segment. `resolveShortLinkSegment` checks the shape, applies the `shortLink` rate limit (30/min per IP) and calls `resolveShortCode`, which returns a path only for a `PUBLISHED` event with a released page. Malformed, unknown, unreleased and rate-limited lookups all return `null`, which renders the same 404 as an unknown organisation. Audience rules (invite-only, approval) are left to the destination page.

### Embed, discovery and public pages

`/embed/:orgSlug/:eventSlug` renders the canonical event page component plus a credit, so it inherits every access check. `proxy.ts` builds `frame-ancestors` from `ALLOWED_EMBED_ORIGINS`; `lib/env.ts` rejects entries that are not exact HTTPS origins without paths.

`/discover`, `/search` and `GET /api/search` list only events that pass `isDiscoverableEvent`. `shouldIndexPublicEvent` uses the same rule for crawler indexing.

## Invariants

- **Publication is one switch.** `Event.status = PUBLISHED` and `EventPage.isPublished` change together in one transaction. Never write one without the other. Enforced by the three writers above; covered by `tests/unit/event-publishing.test.ts`, `tests/integration/publish-event.db.test.ts` and `tests/e2e/event-visibility.spec.ts`.
- **Every public reader checks both flags.** A new public surface (page, API, feed) must go through `resolvePublicEventAccess` or replicate `status === PUBLISHED && page.isPublished === true` for anonymous visitors.
- **Listings use `listedEventAudienceWhere`.** Combine it with `AND` so it does not clash with a search `OR`. Do not hand-roll a `privacyType: PUBLIC` filter.
- **Short codes never reveal hidden events.** Every failure mode of resolution returns the same 404. Covered by `tests/integration/short-links.db.test.ts` (resolution for every non-published status) and `tests/e2e/short-links.spec.ts`.
- **Capacity edits run under the event lock.** `updateEvent` takes `FOR UPDATE` before counting, like every other capacity change (see [Registration and RSVP](/features/registration-and-rsvp)).
- **Planned programme times are immutable.** Delays are stored separately and applied per track at read time.
- **Webhooks fire after commit.** `event.published` and `event.cancelled` are emitted with `emitWebhookEvent` after the transaction, and only on a real status change.

## Making changes

**Add a field to the event form**

1. Add the column in `prisma/schema.prisma` with a migration (see [Change the schema](/guides/change-the-schema)).
2. Extend `createEventSchema` / `updateEventSchema` in `lib/validators.ts`.
3. Write it in `createEvent` and inside the `updateEvent` transaction. If it affects whether people can register, also read it under the lock in `reserveRsvp`.
4. Copy or deliberately skip it in `cloneEvent`.
5. Add a unit test next to `tests/unit/event-create-timezone.test.ts` or `event-publishing.test.ts`.

**Add a website content type**

1. Add the model with `eventId` and `ContentVisibility`; add an `EventPageSectionType` value if it needs its own section (record the new enum value in the release rollback notes).
2. Add a `save...` action in `app/actions/event-website.ts` that resolves context with `EDIT_DETAILS`, validates with Zod, checks upload URLs and calls `revalidateEventWebsitePaths`.
3. Extend `deleteWebsiteContent` and the public page renderer, filtering to published items.
4. `saveEventPage` validates the section list against `Object.values(EventPageSectionType)` and allows exactly one missing type (forms opened before `CREW` existed). A new section type means older open forms send two fewer, so revisit that `.min(...)` bound and keep the "missing row is left untouched" behaviour.

**Add a new public surface for events**: start from `resolvePublicEventAccess` and return `notFound()` on `allowed: false`. Never return a different status code for "exists but hidden".

## Testing

| Test | Covers |
| --- | --- |
| `tests/unit/event-publishing.test.ts` | Status and release written together |
| `tests/unit/public-event-access.test.ts`, `security-visibility.test.ts` | Access and listing rules |
| `tests/unit/short-link.test.ts`, `short-link-actions.test.ts`, `short-link-resolve.test.ts` | Code shape, actions, resolution |
| `tests/unit/event-program.test.ts`, `event-session-delay-actions.test.ts`, `event-session-track-actions.test.ts`, `event-website-release-actions.test.ts` | Programme and website actions |
| `tests/unit/recurrence-safety.test.ts`, `format-recurrence.test.ts` | RRULE expansion |
| `tests/integration/publish-event.db.test.ts`, `short-links.db.test.ts`, `collaborator-permissions.db.test.ts` | Publication, short links, grants refused for publish and short links |
| `tests/e2e/event-visibility.spec.ts`, `short-links.spec.ts`, `series-occurrence.spec.ts` | Browser flows |

```bash
npx vitest run tests/unit/event-publishing.test.ts tests/unit/short-link-resolve.test.ts
npm run test:integration -- tests/integration/publish-event.db.test.ts tests/integration/short-links.db.test.ts
npx playwright test tests/e2e/event-visibility.spec.ts tests/e2e/short-links.spec.ts
```

Integration tests need a disposable `TEST_DATABASE_URL`; see [Testing](/reference/testing).

## Further reading

- [FEATURES.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/FEATURES.md) and [ROUTES.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/ROUTES.md) in the repo handbook
- [Permissions](/architecture/permissions) for `EDIT_DETAILS` and `PUBLISH_AND_SCHEDULE`
- [Registration and RSVP](/features/registration-and-rsvp)
- [Webhooks](/api/webhooks) for `event.published` and `event.cancelled`
