# Tutorial: add a feature end to end

A worked example that adds one small feature across every layer of Yuyu: schema, mutation core, Server Action, permissions, UI, tests and help article. It exists to show how the pieces fit together and in what order, using the same files and helpers the real features use.

::: warning The example feature is hypothetical
**Guest notes** does not exist in Yuyu. It was chosen because it is small but touches every layer, and because it forces the privacy decisions a real feature needs. Files marked **(new)** are invented for this tutorial. Every other path, function and component named below exists at the verified commit. Where the tutorial shows a snippet of an existing file, it is a trimmed excerpt. New code is a sketch to adapt, not a patch to apply, and none of it has been run.
:::

The per-layer details are in the guides, which this tutorial links instead of repeating: [Change the schema](/guides/change-the-schema), [Add a Server Action](/guides/add-a-server-action), [Add a page or route](/guides/add-a-page-or-route), [Add an email](/guides/add-an-email), [Add a webhook event](/guides/add-a-webhook-event) and [Extend the APIs](/guides/extend-the-apis).

## The feature

An organiser who runs the guest list can attach one short private note to a registration, such as "Allergic to nuts, seat near the door". It is shown only in a dialog opened from the guest's row menu.

| Decision | Choice | Why |
| --- | --- | --- |
| Who can read and write | `canManageRegistrationsFor` (organisation owner or admin, or the event's `MANAGE_REGISTRATIONS` grant) | The same people who already see the guest list and each guest's answers (`lib/eventAccess.ts`) |
| Where | One-off events only, one note per registration | Series occurrences use `eventInstanceId`, which would double the access logic for no gain here |
| Size | 1 to 500 characters. Saving an empty value deletes the note | Same shape as the attendance note |
| Storage | A new table, not a column on `RSVP` | `RSVP` is a wide, heavily indexed table. A new table is additive and cannot slow existing reads |
| Machine API, mobile API, webhooks, exports | **Not exposed** | These surfaces are minimal DTOs by contract. A free-text note about a person can hold anything, so it stays inside the dashboard |
| Email | None | Nothing about a note should reach the guest |
| Webhook | None | `docs/WEBHOOKS.md` payloads never carry free text. A `guest.note_changed` event would carry only ids, which is rarely useful. If you want one, follow [Add a webhook event](/guides/add-a-webhook-event) |
| Audit | `GUEST_NOTE_SAVED` and `GUEST_NOTE_CLEARED`, with the length only | `lib/audit.ts` forbids PII and free text in metadata |
| Rate limit | The existing `"action"` bucket | Ordinary dashboard edits, as in [Add a Server Action](/guides/add-a-server-action) |

Two privacy questions to settle and record before building, because the code will not settle them for you. First, the personal data export (`/api/exports/account`) is allow-listed, so a note about a guest is not in the guest's own export. If your jurisdiction treats organiser notes as personal data, that needs a decision. Second, the note deletes with the registration through the foreign-key cascade, so removing a guest erases it. An organiser's removal can be undone for five minutes (`deleteRsvpForUser` and `restoreRsvpForUser` in `lib/core/rsvpAdmin.ts`), and the tutorial does not add the note to that snapshot, so an undone removal brings the guest back without their note.

## 1. Branch

Every feature gets its own branch from `main` (`AGENTS.md`, "Branching"). See [Development workflow](/start/workflow).

```bash
git fetch origin && git switch -c feat/guest-notes origin/main
```

## 2. Schema and migration

Read [Change the schema](/guides/change-the-schema) first. The model follows `AttendanceCheck`, another row scoped to one RSVP. Add it to `prisma/schema.prisma`:

```prisma
/// An organiser's private note about one registration (hypothetical tutorial
/// feature). Never exposed through the machine API, mobile API, webhooks or
/// exports. Removed with the registration.
model GuestNote {
  id              String   @id @default(cuid())
  organisationId  String
  eventId         String
  rsvpId          String   @unique
  /// 1 to 500 characters, enforced by a CHECK constraint.
  body            String
  updatedByUserId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organisation Organisation @relation(fields: [organisationId], references: [id], onDelete: Cascade)
  event        Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  rsvp         RSVP         @relation(fields: [rsvpId], references: [id], onDelete: Cascade)
  updatedBy    User?        @relation(fields: [updatedByUserId], references: [id], onDelete: SetNull)

  @@index([eventId])
  @@index([organisationId])
}
```

Prisma needs the back-relations, so add `guestNotes GuestNote[]` to `Organisation`, `Event`, `RSVP` and `User`. Then create the migration without applying it, rename it so it sorts after the newest in `prisma/migrations/` (at the verified commit that is `20261029000000_event_crew`), and edit the SQL:

```bash
npm run db:migrate -- --create-only --name guest_notes
```

```sql
-- Guest notes (hypothetical tutorial feature). A new table only: no existing
-- row is rewritten. A note belongs to its registration, event and organisation
-- and goes with any of them.
CREATE TABLE "GuestNote" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "rsvpId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestNote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GuestNote_body_length" CHECK (char_length("body") BETWEEN 1 AND 500)
);

CREATE UNIQUE INDEX "GuestNote_rsvpId_key" ON "GuestNote"("rsvpId");
CREATE INDEX "GuestNote_eventId_idx" ON "GuestNote"("eventId");
CREATE INDEX "GuestNote_organisationId_idx" ON "GuestNote"("organisationId");

ALTER TABLE "GuestNote" ADD CONSTRAINT "GuestNote_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestNote" ADD CONSTRAINT "GuestNote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestNote" ADD CONSTRAINT "GuestNote_rsvpId_fkey" FOREIGN KEY ("rsvpId") REFERENCES "RSVP"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestNote" ADD CONSTRAINT "GuestNote_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

This mirrors `prisma/migrations/20261025010000_saved_views/migration.sql`: a CHECK named `<Table>_<rule>`, indexes, and cascading foreign keys. A new table creates no new enum values, so the rollback-note step in `docs/PRODUCTION_RELEASE.md` does not apply. The remaining schema steps from the guide still do:

- Add `GuestNote` and its constraint to `scripts/verify-production-schema.mjs` (`npm run db:verify`).
- Pin the migration in `tests/unit/migration-safety.test.ts` (no `DROP`, no `UPDATE`, the CHECK present).
- Run the drift check against a migrated disposable database.

## 3. Shared constants and the mutation core

Pure values that both the browser and the server need go in a plain module, as `lib/savedViews.ts` does for saved views. **(new)** `lib/guestNotes.ts`:

```ts
import { z } from "zod";

export const GUEST_NOTE_MAX_LENGTH = 500;

/** Empty clears the note. */
export const guestNoteBodySchema = z.string().trim().max(GUEST_NOTE_MAX_LENGTH, `Keep it under ${GUEST_NOTE_MAX_LENGTH} characters`);
```

Logic goes in `lib/core/`, not in the action, so any future surface (the mobile API) calls the same function. Read [Mutation cores](/architecture/mutation-cores). The conventions to copy are in `lib/core/rsvpAdmin.ts` (order of checks, `ActionResult`, `flattenZodErrors`) and `lib/core/savedViews.ts` (an access resolver that returns `null` for "no access", so a foreign id and a missing id look the same). **(new)** `lib/core/guestNotes.ts`:

```ts
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { canManageRegistrationsFor } from "@/lib/eventAccess";
import { isActionRateLimited } from "@/lib/actionRateLimit";
import { guestNoteBodySchema } from "@/lib/guestNotes";
import { flattenZodErrors } from "@/app/actions/utils";
import type { ActionResult } from "@/app/actions/org";

const NO_ACCESS = "You do not have permission to use guest notes here.";

const targetSchema = z.object({
  organisationSlug: z.string().trim().min(1).max(120),
  eventId: z.string().trim().min(1).max(128),
  rsvpId: z.string().trim().min(1).max(128),
}).strict();

const saveSchema = targetSchema.extend({ body: guestNoteBodySchema }).strict();

type Target = { organisationId: string; eventId: string; rsvpId: string };

/** The registration, if this user may manage registrations on its event. Otherwise null, whatever the reason. */
async function resolveTarget(userId: string, input: z.infer<typeof targetSchema>): Promise<Target | null> {
  const org = await prisma.organisation.findUnique({ where: { slug: input.organisationSlug }, select: { id: true } });
  if (!org) return null;
  if (!(await canManageRegistrationsFor({ userId, organisationId: org.id, eventId: input.eventId }))) return null;
  // Scoped by the organisation just resolved, never by an id from the client alone.
  const rsvp = await prisma.rSVP.findFirst({
    where: { id: input.rsvpId, eventId: input.eventId, event: { organisationId: org.id } },
    select: { id: true },
  });
  return rsvp ? { organisationId: org.id, eventId: input.eventId, rsvpId: rsvp.id } : null;
}

export async function loadGuestNoteForUser(actorUserId: string | null, input: unknown): Promise<ActionResult<{ body: string }>> {
  if (!actorUserId) return { ok: false, error: "You must be signed in." };
  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const target = await resolveTarget(actorUserId, parsed.data);
  if (!target) return { ok: false, error: NO_ACCESS };
  const note = await prisma.guestNote.findUnique({ where: { rsvpId: target.rsvpId }, select: { body: true } });
  return { ok: true, data: { body: note?.body ?? "" } };
}

export async function saveGuestNoteForUser(actorUserId: string | null, input: unknown): Promise<ActionResult<{ hasNote: boolean }>> {
  if (!actorUserId) return { ok: false, error: "You must be signed in." };
  if (await isActionRateLimited("action", actorUserId)) return { ok: false, error: "Too many changes. Try again shortly." };
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input.", fieldErrors: flattenZodErrors(parsed.error) };
  const target = await resolveTarget(actorUserId, parsed.data);
  if (!target) return { ok: false, error: NO_ACCESS };

  const { body } = parsed.data;
  await prisma.$transaction(async (tx) => {
    if (body === "") {
      await tx.guestNote.deleteMany({ where: { rsvpId: target.rsvpId } });
    } else {
      await tx.guestNote.upsert({
        where: { rsvpId: target.rsvpId },
        create: { organisationId: target.organisationId, eventId: target.eventId, rsvpId: target.rsvpId, body, updatedByUserId: actorUserId },
        update: { body, updatedByUserId: actorUserId },
      });
    }
    await recordAuditEvent({
      action: body === "" ? "GUEST_NOTE_CLEARED" : "GUEST_NOTE_SAVED",
      actorUserId,
      organisationId: target.organisationId,
      targetType: "RSVP",
      targetId: target.rsvpId,
      metadata: { eventId: target.eventId, length: body.length }, // never the text
      client: tx,
    });
  });
  // No revalidatePath: no server-rendered page shows the note. The dialog loads it on demand.
  return { ok: true, data: { hasNote: body !== "" } };
}
```

Points to notice, each from a rule in `AGENTS.md`:

- Authentication, rate limit, validation, authorisation, then the write, then the audit. The audit row is written inside the transaction with `client: tx`.
- The note text never enters audit metadata, logs or error messages.
- Missing and foreign registrations return the same refusal as no permission.
- The Zod schema is `.strict()` and every string is bounded.

## 4. Server Action

The action is a thin wrapper, as `app/actions/rsvp-admin.ts` is. **(new)** `app/actions/guest-notes.ts`:

```ts
"use server";

import { auth } from "@/lib/auth";
import type { ActionResult } from "./org";
import { loadGuestNoteForUser, saveGuestNoteForUser } from "@/lib/core/guestNotes";

async function currentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function loadGuestNote(input: unknown): Promise<ActionResult<{ body: string }>> {
  return loadGuestNoteForUser(await currentUserId(), input);
}

export async function saveGuestNote(input: unknown): Promise<ActionResult<{ hasNote: boolean }>> {
  return saveGuestNoteForUser(await currentUserId(), input);
}
```

Reading through a Server Action is a shortcut for the tutorial. A production feature might instead add the note to the guest-list loader so rows can show a marker. That changes `lib/eventDashboard/attendees.ts` and its paging, which is why the tutorial avoids it.

## 5. Permissions

Two layers, as everywhere (see [Tenancy and permissions](/architecture/permissions)):

1. **The server** is the real check. `resolveTarget` calls `canManageRegistrationsFor`.
2. **The UI** only avoids showing a control that would be refused. The Guests People panel is already limited to people who manage registrations, so no new capability flag is needed. If you added the note to a screen shown to other roles, you would add a flag to `lib/eventDashboard/capabilities.ts` (as `canEmbedEvent` is) and update `docs/PERMISSIONS.md`, which `tests/unit/event-capabilities.test.ts` checks against the matrix.

## 6. UI with design-system components

Use the controls in `components/ui/` and the dialog pattern of `components/event-dashboard/guests/AttendanceLinkDialog.tsx` (a small modal with a transition-wrapped action, an error `Callout` and a toast). Read [Frontend and design system](/architecture/frontend) and the rules in `docs/DESIGN.md`: labelled fields, one primary action, light and dark mode, 360px width, no emoji.

**(new)** `components/event-dashboard/guests/GuestNoteDialog.tsx`:

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { loadGuestNote, saveGuestNote } from "@/app/actions/guest-notes";
import { useToast } from "@/components/feedback/ToastProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Callout } from "@/components/ui/display";
import { Field, Textarea } from "@/components/ui/field";
import { GUEST_NOTE_MAX_LENGTH } from "@/lib/guestNotes";

export function GuestNoteDialog({ organisationSlug, eventId, guest, onClose }: {
  organisationSlug: string;
  eventId: string;
  guest: { rsvpId: string; name: string };
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState<string | null>(null); // null while loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true; // restart-safe under double-invoked effects (AGENTS.md)
    void loadGuestNote({ organisationSlug, eventId, rsvpId: guest.rsvpId }).then((result) => {
      if (!current) return;
      if (result.ok) setBody(result.data?.body ?? "");
      else setError(result.error);
    });
    return () => { current = false; };
  }, [organisationSlug, eventId, guest.rsvpId]);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveGuestNote({ organisationSlug, eventId, rsvpId: guest.rsvpId, body: body ?? "" });
      if (!result.ok) {
        setError(result.fieldErrors?.body?.[0] ?? result.error);
        return;
      }
      showToast(result.data?.hasNote ? "Note saved" : "Note removed", "success");
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(next) => { if (!next && !pending) onClose(); }}>
      <DialogContent size="sm">
        <DialogHeader
          title={`Note about ${guest.name}`}
          description="Only people who manage registrations for this event can see this. The guest never sees it."
        />
        <DialogBody className="flex flex-col gap-3">
          {error ? <Callout tone="danger" role="alert">{error}</Callout> : null}
          <Field label="Note" optional helperText={`Up to ${GUEST_NOTE_MAX_LENGTH} characters. Leave it empty to remove the note.`}>
            <Textarea
              value={body ?? ""}
              disabled={body === null}
              maxLength={GUEST_NOTE_MAX_LENGTH}
              onChange={(event) => setBody(event.target.value)}
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" disabled={pending} onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={pending} disabled={body === null} onClick={save}>Save note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Then wire it in, in two existing files:

1. `components/event-dashboard/guests/GuestRow.tsx`. Add an optional entry to `GuestRowActions`, with a `MenuItem` in the row menu next to the existing ones (`Pencil`, `Copy`, `UserX` come from `lucide-react`):

   ```tsx
   /** One-off events: add or edit the organiser-only note on this registration. */
   editNote?: (guest: AttendeeRow) => void;
   ```

   ```tsx
   {actions.editNote ? (
     <MenuItem icon={<StickyNote />} onSelect={() => actions.editNote?.(guest)}>
       Add or edit note
     </MenuItem>
   ) : null}
   ```

   The label is fixed because the on-demand load does not tell the row whether a note exists. `StickyNote` is a `lucide-react` icon, imported like the existing ones.

2. `components/event-dashboard/panels/GuestsPeople.tsx`. Following `shareAttendanceLink` and `setLinkGuest`, add state, pass the action only for one-off events, and render the dialog:

   ```tsx
   const [noteGuest, setNoteGuest] = useState<AttendeeRow | null>(null);
   // in the actions object:
   editNote: eventId ? (guest) => setNoteGuest(guest) : undefined,
   // in the JSX, beside AttendanceLinkDialog:
   {noteGuest && eventId ? (
     <GuestNoteDialog
       organisationSlug={organisationSlug}
       eventId={eventId}
       guest={{ rsvpId: noteGuest.id, name: guestDisplayName(noteGuest) }}
       onClose={() => setNoteGuest(null)}
     />
   ) : null}
   ```

Crew tickets are edited only in Guests, Crew (`GuestRow` hides **Edit registration** for them). Decide whether a note makes sense there, and hide the item with `!crew` if not.

## 7. Tests

Follow [Testing](/reference/testing). Two files cover the feature, mirroring the saved-views pair.

**Unit test the wrapper's refusals.** **(new)** `tests/unit/guest-notes-actions.test.ts`, modelled on `tests/unit/saved-views-actions.test.ts`. Mock `auth` and the core, and check that a signed-out caller and an invalid body never reach a write:

```ts
const mocks = vi.hoisted(() => ({ auth: vi.fn(), save: vi.fn(), load: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/core/guestNotes", () => ({ saveGuestNoteForUser: mocks.save, loadGuestNoteForUser: mocks.load }));

import { saveGuestNote } from "@/app/actions/guest-notes";

it("passes the signed-in user id to the core, and null when signed out", async () => {
  mocks.save.mockResolvedValue({ ok: false, error: "You must be signed in." });
  mocks.auth.mockResolvedValueOnce(null);
  await saveGuestNote({});
  expect(mocks.save).toHaveBeenCalledWith(null, {});
  mocks.auth.mockResolvedValueOnce({ user: { id: "user_1" } });
  await saveGuestNote({ body: "x" });
  expect(mocks.save).toHaveBeenLastCalledWith("user_1", { body: "x" });
});
```

Also add a pure test for `guestNoteBodySchema` (trims, accepts the empty string, rejects 501 characters).

**Integration test the core against PostgreSQL.** **(new)** `tests/integration/guest-notes.db.test.ts`, modelled on `tests/integration/saved-views.db.test.ts`: mock only the session, the rate limiter and `next/cache`, then call the real actions against seeded organisations, users, an event and RSVPs. Cover at least:

| Case | Expectation |
| --- | --- |
| Signed out | Refused, no row |
| A plain `MEMBER`, and a collaborator with only `CHECK_IN` | Refused (`NO_ACCESS`) |
| An owner, an admin, and a collaborator with `MANAGE_REGISTRATIONS` | Saves and loads |
| Another organisation's owner using your `rsvpId` | Refused with the same message as a missing id |
| An `rsvpId` from a different event of the same organisation | Refused |
| 501 characters, and unknown keys | `INVALID_REQUEST`-style refusal, no row (the schema is `.strict()`) |
| Empty body | Deletes the row, audits `GUEST_NOTE_CLEARED` |
| Happy path | One row, `updatedByUserId` set, audit row whose metadata has `length` and no text |
| Deleting the RSVP | The note cascades away |
| `GuestNote_body_length` | A direct insert of an empty or 501-character body fails |

Add a leak check beside the existing ones: the machine API and webhook DTOs are explicit selects with strict schemas, so nothing about notes can appear. If you want it proven, add a case to `tests/integration/api-v1.db.test.ts` that saves a note and asserts the participants response keys are unchanged.

```bash
npx vitest run tests/unit/guest-notes-actions.test.ts
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration -- tests/integration/guest-notes.db.test.ts
```

## 8. Help article and docs

User-visible behaviour needs a help article (`content/help/README.md`). Add an entry to the `guests` section of `content/help/manifest.ts`:

```ts
{ slug: "guests/guest-notes", title: "Notes on guests", summary: "Add a private note to a registration for you and your team." },
```

Then **(new)** `content/help/guests/guest-notes.mdx`. The page shows the title and summary from the manifest, so the article starts straight with prose, uses `<Steps>` and a permission callout, names buttons exactly as the app shows them, and is written for a volunteer organiser, in British English with no file names:

```mdx
Sometimes you need to remember something about one guest, such as a dietary need or a seat near the door. A note stays with the registration and only your organising team can see it.

<Callout kind="permission">

Owners and admins, and co-organisers with **Manage registrations**.

</Callout>

## Add a note

<Steps>

1. Open the event and choose the **Guests** tab.
2. Open the **More actions** menu on the guest's row and choose **Add or edit note**.
3. Type your note, up to 500 characters, and choose **Save note**.

</Steps>

Leave the box empty and save to remove a note. The guest never sees it, and it isn't included in emails or exports. Removing a guest deletes their note.
```

Run `npx vitest run tests/unit/help-content.test.ts`. It checks that every manifest entry has a file and every link and anchor resolves.

Keep the written docs in step, as the pull request rules ask:

- `docs/FEATURES.md`: one line describing guest notes.
- `docs/PERMISSIONS.md`: a row, "Guest notes: owner, admin, `MANAGE_REGISTRATIONS`".
- `docs/SECURITY.md`: one sentence, "Guest notes are never returned by the machine API, mobile API, webhooks or exports".
- `CHANGELOG.md`: an entry under Unreleased naming the migration, the audit actions and the new files.

## 9. Verify and open the pull request

From [Development workflow](/start/workflow), in the order CI runs them. A change that adds a table and a mutation needs the integration suite and the schema checks as well as the basics:

```bash
npm run lint
npx next typegen && npx tsc --noEmit
npm run test:unit
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration
npm run db:status && npm run db:verify
npm run build
git diff --check
```

Check the dialog in light and dark mode and at 360px, with the keyboard only. Then work through the [Security checklist](/reference/security-checklist) sections that apply: Tenancy and authorization, Server Actions, cores and route handlers, Data exposure, and Database and migrations. Push `feat/guest-notes`, open a pull request into `main` with `gh pr create --base main`, describe what changed and how you tested it, and merge with a merge commit once **CI** and **Quality gate** are green. See [Contributing upstream](/build/contributing).

## What the tutorial skipped

| Left out | Where to look when you need it |
| --- | --- |
| A "has note" marker in the guest list | `lib/eventDashboard/attendees.ts`, [Add a page or route](/guides/add-a-page-or-route) and `docs/PERFORMANCE.md` for large events |
| Series occurrences | `eventInstanceId` handling in `lib/core/rsvpAdmin.ts` |
| A mobile API route | [Extend the APIs](/guides/extend-the-apis). Reuse `lib/core/guestNotes.ts`, add the schema and DTO, the OpenAPI path and a fixture, and update the contract test. The apps then need updating too |
| An email to the organiser team | [Add an email](/guides/add-an-email): queue an outbox row inside the transaction, never send inline |
| A webhook event | [Add a webhook event](/guides/add-a-webhook-event): emit with `emitWebhookEvent` after the transaction commits |
| A setting to turn the feature off | [Add configuration](/guides/add-config) |

## Further reading

- [Add a Server Action](/guides/add-a-server-action) and [Change the schema](/guides/change-the-schema)
- [Mutation cores](/architecture/mutation-cores) and [Tenancy and permissions](/architecture/permissions)
- [Testing](/reference/testing) and [Security checklist](/reference/security-checklist)
- [Contributing upstream](/build/contributing)
- [content/help/README.md](https://github.com/twilighty-abhi/yuyu/blob/main/content/help/README.md)
