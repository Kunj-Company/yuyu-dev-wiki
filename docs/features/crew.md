# Crew

The event crew is the team running a one-off event: volunteers, hosts, staff. A crew member is a person, not an account. Each one is an `EventCrewMember` row that owns exactly one `CONFIRMED` RSVP flagged `isCrew`, which is their QR ticket. Crew count as "going" in headcounts but **never against `Event.capacity`**, never join teams, are never asked to confirm attendance and never enter hackathon projects. They are managed only through `lib/core/crew.ts`; every guest flow refuses crew tickets.

## Key files

| Path | Role |
| --- | --- |
| `lib/core/crew.ts` | Schemas (`crewProfileSchema`, `organiserCrewSchema`), `addCrewMemberTx`, `addCrewMemberAsOrganiser`, `updateCrewMemberAsOrganiser`, `setCrewMemberVisibility`, `removeCrewMember`, `moveCrewMember`, join link (`setCrewJoinLink`, `loadCrewJoinPage`, `joinCrewWithLink`), `listCrewForOrganiser`, `listPublicCrew`, `summariseFoodPreferences` |
| `app/actions/crew.ts` | Organiser actions behind a shared `gate` (session, rate limit, `resolveOrganiserEvent`), photo uploads, the public `joinCrew` |
| `lib/teamUnits.ts` | `takesCapacity = { isCrew: false }`, spread into every capacity count |
| `app/actions/event-website.ts` | `showCrewSection` (turns on the public `CREW` section) |
| `app/crew/[token]/page.tsx` | Public sign-up page for the crew link |
| `components/crew/*` | Guests → Crew UI and the public crew cards |
| `prisma/migrations/20261029000000_event_crew/migration.sql` | Tables, `RSVP.isCrew`, the `RSVP_crew_shape` CHECK |

## How it works

### Data model

| Model / field | Notes |
| --- | --- |
| `EventCrewMember` | `name`, `email` (normalised, unique per event), `foodPreference`, `role`, `bio`, `photoUrl`, `linkedinUrl`, `showOnPage`, `joinedViaLink`, `sortOrder`; `rsvpId` unique; cascades from the RSVP and the event |
| `RSVP.isCrew` | Marks the crew ticket |
| `EventCrewJoinLink` | At most one per event (`eventId` is the primary key); `token` unique and stored as-is |
| `EventPageSectionType.CREW` | Public Crew section, off by default |

```sql
-- prisma/migrations/20261029000000_event_crew/migration.sql
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_crew_shape"
  CHECK (NOT "isCrew" OR ("eventId" IS NOT NULL AND "teamId" IS NULL AND "status" = 'CONFIRMED')) NOT VALID;
ALTER TABLE "RSVP" VALIDATE CONSTRAINT "RSVP_crew_shape";
```

So a crew RSVP always belongs to a one-off event, has no team and is confirmed. Limits are enforced by the Zod schemas (name 120, email 254, food 80, role 120, bio 600, `http(s)` LinkedIn up to 500) and `MAX_CREW_MEMBERS = 500` per event. Photos must be this organisation's uploads in the `event-crew` category (`CREW_PHOTO_CATEGORY`).

### Adding a member: `addCrewMemberTx`

Inside one transaction:

1. `lockEventForCrew` takes the same `SELECT ... FOR UPDATE` on `Event` as every capacity and team change.
2. Refuse when the event already has 500 crew, or the email is already on the crew (`ALREADY_ON_CREW`).
3. Look for an existing registration by `guest:<email>` or a user with that email (case-insensitive).
   - Link sign-ups never convert a registration: the core returns an internal "ignored" result and the caller answers exactly as for a new sign-up.
   - A team member is refused until they leave their team.
   - An organiser adding an existing solo registrant converts that RSVP: `isCrew: true`, `CONFIRMED`, same `checkInToken`. Their `TeamSeekerProfile` and any `AttendanceCheck` are deleted. The freed place is **not** auto-promoted; organisers promote the waitlist as usual.
   - Otherwise a new guest RSVP is created with `isCrew: true`.
4. Create the `EventCrewMember` at the end of the sort order and queue `rsvp-confirmation`. The outbox worker reads the crew flag from the RSVP at delivery and words the email for crew.

After commit, `registration.created` is emitted only when a new RSVP was created. `removeCrewMember` deletes the RSVP (the crew row cascades) with a conditional `deleteMany({ where: { id, eventId, isCrew: true } })` and emits `registration.status_changed` with status `CANCELLED`.

### Capacity

```ts
// lib/teamUnits.ts
/**
 * Spread into every RSVP count compared with a capacity: crew tickets
 * (docs/CREW.md) count in headcounts but never take an attendee place.
 */
export const takesCapacity = { isCrew: false } as const satisfies Prisma.RSVPWhereInput;
```

It is spread into `countConfirmedForCapacity`, `countConfirmedUnits`, `reserveRsvp`, `confirmRsvpWithinCapacity` and `hasCapacityToRestoreConfirmedRsvp`. An event with capacity 1 and two crew still confirms one attendee before waitlisting the next.

### Join link

- `generateCrewJoinToken` is 32 random bytes, base64url. `setCrewJoinLink(ctx, "create" | "rotate" | "disable")`: create keeps an existing token, rotate replaces it (the old link 404s at once), disable deletes the row.
- `loadCrewJoinPage` checks the token shape before any lookup. `joinCrewWithLink` refuses cancelled and ended events (`isCrewJoinOpen`) and always adds with `showOnPage: false, joinedViaLink: true`, so link sign-ups stay hidden until reviewed.
- `joinCrew` applies the `rsvp` rate limit by email and audits `EVENT_CREW_JOINED_WITH_LINK` with the event id only. `/crew/:token` is `noindex`, `no-referrer`, never cached, and disallowed in `robots.txt`.

### Permissions

Every organiser action goes through `gate` in `app/actions/crew.ts`: signed in, the `action` rate-limit bucket, then `resolveOrganiserEvent` (owner/admin or `MANAGE_REGISTRATIONS`). Every core re-scopes the member or link by `eventId` and `organisationId`, so another tenant's ids are "not found". `showCrewSection` needs `EDIT_DETAILS`.

### Public section

`listPublicCrew` returns only members with `showOnPage`, selecting `id`, `name`, `role`, `bio`, `photoUrl`, `linkedinUrl`. Email, food preference and the ticket are never selected.

## Invariants

- **Crew never take a place.** Any new count compared with `Event.capacity` must spread `takesCapacity` or call `countConfirmedForCapacity`. Covered by `tests/integration/crew.db.test.ts` and `tests/e2e/crew.spec.ts` (capacity 1 with crew).
- **Crew RSVP shape is a database rule.** `RSVP_crew_shape` keeps crew confirmed, team-less and on a one-off event.
- **Only `lib/core/crew.ts` writes crew.** Guest flows refuse crew: `cancelRsvpForUser` (self-cancel), `updateRsvpRegistrationForUser` and `deleteRsvpForUser` (Guests · People), team cores (filter `isCrew: false`), attendance confirmation (`unaskedWhere` filters `isCrew: false`), and submission cores.
- **The link never converts or reveals.** A link sign-up for an email already on the crew or already registered changes nothing and gets the same answer as a new sign-up.
- **Lock before converting.** Converting a registration runs under the event lock so it cannot interleave with a registration or team change.
- **Join tokens are bearer capabilities.** Never log them or put them in audit metadata or analytics.

## Making changes

**Add a crew profile field**

1. Add the column to `EventCrewMember` with a migration.
2. Extend `crewProfileSchema` with a length limit; `.strict()` means unknown keys are refused.
3. Write it in `cleanProfile`, decide whether `listPublicCrew` may select it (private by default), and add it to `OrganiserCrewMember`.
4. Add schema cases to `tests/unit/crew.test.ts`.

**Add a guest flow that touches RSVPs**: decide what it does for `isCrew` and refuse explicitly if crew should not use it. Add a row to [CREW_TEST_CONDITIONS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/CREW_TEST_CONDITIONS.md) and an integration case.

**Add a capacity count**: use `countConfirmedForCapacity` rather than writing a new query.

## Testing

| Test | Covers |
| --- | --- |
| `tests/unit/crew.test.ts` | Schemas, trimming, limits, LinkedIn URLs, upload-only photos, token shape, food summary |
| `tests/unit/email-construction.test.ts`, `outbox.test.ts` | Crew ticket wording, crew flag read at delivery |
| `tests/integration/crew.db.test.ts` | Capacity, conversion, duplicates, link create/rotate/disable, cross-tenant refusals, guest-flow refusals, cascades, the CHECK |
| `tests/e2e/crew.spec.ts` | Link sign-up, headers, capacity, public section |
| `tests/e2e/crew-smoke.spec.ts` | Organiser dashboard smoke (paced under the `rsvp` limit) |

```bash
npx vitest run tests/unit/crew.test.ts
npm run test:integration -- tests/integration/crew.db.test.ts
npx playwright test tests/e2e/crew.spec.ts tests/e2e/crew-smoke.spec.ts
```

## Further reading

- [CREW.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/CREW.md) and [CREW_TEST_CONDITIONS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/CREW_TEST_CONDITIONS.md)
- [Registration and RSVP](/features/registration-and-rsvp) for the capacity lock
- [Tickets and check-in](/features/tickets-and-check-in): crew check in like anyone else
- [Teams](/features/teams)
