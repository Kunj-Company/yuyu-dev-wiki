# Add a Server Action

## Goal

Add an authenticated dashboard mutation end to end: input validation, the domain logic in a mutation core, a thin `"use server"` wrapper, the client call, and tests. Every Server Action needs **authentication, authorisation, Zod validation, rate limiting where applicable, and audit behaviour before it mutates anything** (`AGENTS.md`, "Security and tenancy rules").

This guide follows two real examples:

| Example | Shape | Files |
| --- | --- | --- |
| Saved views | Core in `lib/core/`, action is a thin gate | `lib/core/savedViews.ts`, `app/actions/saved-views.ts`, `tests/unit/saved-views-actions.test.ts`, `tests/integration/saved-views.db.test.ts` |
| Feedback settings | Core shared by the dashboard and the mobile API; access check injected | `lib/core/feedbackSettings.ts`, `app/actions/feedback-form.ts`, `app/api/mobile/v1/orgs/[orgSlug]/events/[eventId]/feedback/state/route.ts` |
| Organisation profile | Older, self-contained action using `lib/validators.ts` | `app/actions/org.ts` (`updateOrganisation`), `components/org/EditOrgForm.tsx` |

## Before you start

- Read [Mutation cores](/architecture/mutation-cores) and [Permissions](/architecture/permissions).
- Decide whether the mobile API will ever call this mutation. If it might, put the logic in `lib/core/` from the start: `AGENTS.md` says "change behaviour here, not in one surface".
- Pick the permission: organisation role (`OWNER`/`ADMIN`/`MEMBER` via `lib/permissions.ts`) or an event grant (`canAccessEvent`, `canManageRegistrationsFor` in `lib/eventAccess.ts`).
- Pick a rate-limit bucket from `Bucket` in `lib/rateLimit.ts`. General dashboard edits use `"action"` (180/min); specialised buckets exist, for example `"feedback"`, `"invite"`, `"broadcast"` and `"webhookManage"`.

## Steps

### 1. Write the input schema

Shared, reusable schemas live in `lib/validators.ts`. Schemas used by only one feature usually sit next to the core or the action. Use `.strict()` (or `.strip()`) so unknown keys can't sneak in, and bound every string.

```ts
// lib/validators.ts
export const updateOrganisationSchema = z.object({
  organisationSlug: z.string().trim().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().default(""),
  logoUrl: z
    .string()
    .refine(isUploadedImageUrl, "Invalid uploaded image URL")
    .or(z.literal("")),
});
```

```ts
// lib/core/feedbackSettings.ts
export const feedbackSettingsSchema = z.object({
  organisationSlug: z.string().trim().min(1).max(120),
  eventId: z.string().trim().min(1).max(128),
  isOpen: z.boolean(),
  title: z.string().trim().min(1).max(120),
  // ...
}).strict();
```

Always identify the tenant by **slug or id from the input, then resolve it server-side**. Never accept an `organisationId` from the client as proof of access.

### 2. Write the core function in `lib/core/`

A core function starts with `import "server-only"`, takes the caller's user id (or a resolved context) plus `input: unknown`, and returns an `ActionResult`-shaped value. The order inside is fixed: **parse, resolve access, rate-limit, mutate, audit, revalidate**.

`lib/core/savedViews.ts` resolves access as a separate function that returns `null` for "no access", so the caller can't tell a foreign event from a missing one:

```ts
export async function resolveSavedViewAccess(userId: string, organisationSlug: string, eventId: string, surface: SavedViewSurfaceKey): Promise<SavedViewContext | null> {
  if (!userId || !SAVED_VIEW_SURFACES.includes(surface)) return null;
  const org = await prisma.organisation.findUnique({ where: { slug: organisationSlug }, select: { id: true, slug: true } });
  if (!org) return null;
  const event = await prisma.event.findFirst({ where: { id: eventId, organisationId: org.id }, select: { id: true, registrationMode: true } });
  if (!event) return null;
  const membership = await getMembership(userId, org.id);
  // ... per-surface permission check
}
```

Note `findFirst({ where: { id: eventId, organisationId: org.id } })`: every lookup is scoped by the organisation that was just resolved.

Multi-row changes go in a `prisma.$transaction`. Write the audit row **inside** the transaction by passing `client: tx` to `recordAuditEvent` (`lib/audit.ts`), as `lib/core/feedbackSettings.ts` does:

```ts
await recordAuditEvent({ action: "FEEDBACK_FORM_UPDATED", actorUserId: context.userId, organisationId: context.organisation.id, targetType: "EventFeedbackForm", targetId: saved.id, metadata: { eventId: context.event.id, isOpen: saved.isOpen, certificateEnabled: saved.certificateEnabled }, client: tx });
```

`recordAuditEvent` metadata is typed `Record<string, string | number | boolean | null>`. Never put PII, names, tokens or answers in it (see the comment in `lib/audit.ts`). Saved views audits only the surface, never the view name.

If the mutation should notify webhooks, call `emitWebhookEvent` **after** the transaction commits (see [Add a webhook event](/guides/add-a-webhook-event)). If it sends email, enqueue an outbox row inside the transaction (see [Add an email](/guides/add-an-email)).

### 3. Write the Server Action wrapper

Put it in the matching `app/actions/*.ts` file (`"use server"` at the top). Return `ActionResult<T>` from `app/actions/org.ts`:

```ts
export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      needsForce?: boolean;
      reauthRequired?: boolean;
      code?: ActionErrorCode;
    };
```

The saved-views action authenticates, rate-limits, then resolves access before calling the core (`app/actions/saved-views.ts`):

```ts
async function gate(input: unknown): Promise<Gate> {
  const fields = typeof input === "object" && input !== null && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const scope = scopeSchema.safeParse({ organisationSlug: fields.organisationSlug, eventId: fields.eventId, surface: fields.surface });
  if (!scope.success) return { ok: false, error: "Invalid input." };
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "You must be signed in." };
  if (await isActionRateLimited("action", userId)) return { ok: false, error: "Too many changes. Try again shortly." };
  const ctx = await resolveSavedViewAccess(userId, scope.data.organisationSlug, scope.data.eventId, scope.data.surface);
  if (!ctx) return { ok: false, error: NO_PERMISSION };
  return { ok: true, ctx, input: fields };
}
```

When the core already does everything, the action is one line, as in `app/actions/checkin-lists.ts`:

```ts
export async function createCheckInList(input: unknown): Promise<ActionResult<CheckInListSummary>> {
  return createCheckInListForUser(await currentUserId(), input);
}
```

Rules for the wrapper:

- `isActionRateLimited(bucket, subject)` (`lib/actionRateLimit.ts`) checks both the client IP and a SHA-256 fingerprint of the subject. Pass the user id. `proxy.ts` also applies a global `"action"` ceiling to every request carrying a `next-action` header.
- Return UI-safe messages. Catch unexpected errors and log a category only, as `updateOrganisation` does: `console.error("[organisation] update failed")`.
- For Zod failures, `flattenZodErrors` in `app/actions/utils.ts` turns issues into `fieldErrors`.
- Mutations that need a fresh sign-in (machine credentials, for example) call `hasRecentAuthentication()` from `lib/reauth.ts` and return `reauthRequired: true`.
- Super-admin actions start with `await requireSuperAdminMfa()` instead (`app/actions/instance-settings.ts`).
- Call `revalidatePath(...)` for pages that render the changed data.

### 4. Call it from the UI

Client components import the action directly and run it in a transition. Excerpt from `components/org/EditOrgForm.tsx`:

```tsx
"use client";

import { useId, useState, useTransition } from "react";
import { updateOrganisation } from "@/app/actions/org";
import { useToast } from "@/components/feedback/ToastProvider";
// ...
const [pending, startTransition] = useTransition();
```

Show `result.error` and `result.fieldErrors` through the labelled `components/ui` controls, and announce the outcome with `useToast`. Hiding a button is never authorisation: the server checks above are what protect the data. See [Frontend](/architecture/frontend).

### 5. Test it

**Unit test the wrapper** with mocks for `auth`, the rate limiter and the core. Excerpt from `tests/unit/saved-views-actions.test.ts`:

```ts
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/actionRateLimit", () => ({ isActionRateLimited: mocks.rateLimit }));
vi.mock("@/lib/core/savedViews", () => ({
  resolveSavedViewAccess: mocks.resolve,
  // ...
}));

it("refuses signed-out, rate-limited, unknown surfaces and callers without the surface permission", async () => {
  mocks.auth.mockResolvedValueOnce(null);
  expect(await saveView({ ...scope, name: "x", params: {} })).toEqual({ ok: false, error: "You must be signed in." });
  // ...
  expect(mocks.create).not.toHaveBeenCalled();
});
```

**Integration test the core** against PostgreSQL in `tests/integration/<feature>.db.test.ts`. `tests/integration/saved-views.db.test.ts` mocks only the session, the rate limiter and `next/cache`, then calls the real action:

```ts
vi.mock("@/lib/auth", () => ({ auth: async () => (session.userId ? { user: { id: session.userId } } : null) }));
vi.mock("@/lib/actionRateLimit", () => ({ isActionRateLimited: async () => false }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
```

Cover at least: signed out, wrong role, another organisation's id, invalid input, the happy path, and the audit row.

## Checklist

- [ ] Input schema is strict and bounded; tenant resolved from slug/id on the server
- [ ] Logic lives in `lib/core/` if any other surface (mobile API) may need it
- [ ] `auth()` (or `requireOrgRole` / `requireSuperAdminMfa`) runs before any read of tenant data
- [ ] Permission checked with `lib/permissions.ts` or `lib/eventAccess.ts`; unknown and foreign ids give the same answer
- [ ] `isActionRateLimited` with a suitable bucket and the user id as subject
- [ ] Multi-row writes in one `$transaction`; audit written with `client: tx`
- [ ] Audit metadata has no PII, tokens or answers
- [ ] Webhook emitted only after commit; email queued through the outbox, never sent inline
- [ ] UI-safe errors only; `revalidatePath` for affected pages
- [ ] Unit test for the wrapper's refusals and an integration test for the core
- [ ] Help article in `content/help/` updated if user-visible behaviour changed

## Verify

```bash
npx vitest run tests/unit/saved-views-actions.test.ts   # replace with your test file
npm run lint
npx next typegen && npx tsc --noEmit
npm run test:unit
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration
npm run build
```

See [Testing](/reference/testing) for creating the disposable `yuyu_test` database, and the [security checklist](/reference/security-checklist) before opening the PR.
