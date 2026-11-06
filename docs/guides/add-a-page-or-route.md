# Add a page or route

## Goal

Add one of these with the right access checks:

- a **dashboard page** under `app/dashboard/[orgSlug]/...`
- a **public page** under `app/[orgSlug]/[eventSlug]/...`
- a **super-admin page** under `app/super-admin/...`
- a **route handler** (`route.ts`) under `app/api/...`

In Yuyu, pages and handlers resolve access on the server from the current database state. A URL is never proof of access, and UI visibility is never authorisation.

## Before you start

- Read [Architecture overview](/architecture/overview) (request lifecycle, `proxy.ts`) and [Permissions](/architecture/permissions).
- Read the relevant guide in `node_modules/next/dist/docs/` before using Next.js routing, caching or metadata APIs. This is Next.js 16 and `AGENTS.md` warns that it differs from older versions.
- Use Server Components by default. Add `"use client"` only for browser state, effects, event handlers or browser APIs.
- If the page mutates data, add a Server Action as well ([Add a Server Action](/guides/add-a-server-action)).

## Steps

### 1. Dashboard page

**Pick the guard.** `lib/dashboardGuards.ts` wraps the `lib/permissions.ts` checks in React `cache()`:

| Guard | Allows |
| --- | --- |
| `guardOrgDashboard(orgSlug)` | Members, or event/series collaborators |
| `guardOrgRole(orgSlug, minRole)` | Membership at `MEMBER`, `ADMIN` or `OWNER` or above |
| `guardEventDashboard(orgSlug, eventId)` | The event belongs to the organisation and the viewer may open its dashboard (a `JUDGE`-only grant counts) |
| `guardEventPermission(orgSlug, eventId, permission)` | Organisation `OWNER`/`ADMIN`, or that exact `EventPermission` grant |
| `guardSeriesDashboard(orgSlug, seriesId)` | Same as event dashboard, for a series |
| `guardWebhookEndpoint(orgSlug, endpointId)` | Organisation admin, endpoint belongs to the organisation |

Unknown and foreign event, series and endpoint ids become `notFound()`. An unknown organisation or a missing membership redirects to `/dashboard`, and a role below `minRole` redirects to `/dashboard/:orgSlug` (`requireOrgRole` in `lib/permissions.ts`).

**Put the guard in a layout if the segment has a `loading.tsx`.** A `loading.tsx` is a Suspense boundary around its page but not its own layout. Once its fallback streams, the status is a fixed 200, so a `notFound()` inside the page becomes a "200 with not-found UI". Real example, `app/dashboard/[orgSlug]/event/[eventId]/check-in/layout.tsx`:

```tsx
import { EventPermission } from "@prisma/client";
import { guardEventPermission } from "@/lib/dashboardGuards";

export default async function CheckInGuardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; eventId: string }>;
}) {
  const { orgSlug, eventId } = await params;
  await guardEventPermission(orgSlug, eventId, EventPermission.CHECK_IN);
  return children;
}
```

**Keep the page's own check as well** (defence in depth). The check-in page still calls `requireOrgDashboardAccess(orgSlug)` and scopes the event query with `organisationId: organisation.id`. The webhook endpoint page calls `requireOrgRole(orgSlug, "ADMIN")` and then `getWebhookEndpointDetail(organisation.id, endpointId)`, returning `notFound()` when that is null.

**Register the boundary.** `tests/unit/dashboard-loading-boundaries.test.ts` pins every `loading.tsx` under `app/`, the layout and guard that protect it, and the files it wraps. If you add a `loading.tsx`, or a page or layout under one, add an entry:

```ts
"app/dashboard/[orgSlug]/event/[eventId]/check-in": { guardLayout: "app/dashboard/[orgSlug]/event/[eventId]/check-in/layout.tsx", guard: /await guardEventPermission\(orgSlug, eventId, EventPermission\.CHECK_IN\)/, wraps: ["page.tsx"] },
```

The loading component itself is small:

```tsx
import { PageLoader } from "@/components/brand/DotLoader";

export default function Loading() {
  return <PageLoader label="Loading webhook endpoint" />;
}
```

::: danger
Do not add a root `app/loading.tsx`. It makes public pages stream a 200 before `notFound()`/`redirect()` run (`docs/DEVELOPMENT.md`).
:::

Many event dashboard features are tabs on `/dashboard/:orgSlug/event/:eventId` (`?tab=` and `?sub=`), not separate routes; see `docs/ROUTES.md`. Consider a tab before adding a segment.

### 2. Public event page

Public pages resolve the organisation and event, then ask `resolvePublicEventAccess` (`lib/publicEventAccess.ts`). It checks publication, website release, invite-only lists and preview rights. Excerpt from `app/[orgSlug]/[eventSlug]/schedule/page.tsx`:

```tsx
export const metadata: Metadata = { title: "Event programme" };

export default async function EventSchedulePage({ params }: { params: Promise<{ orgSlug: string; eventSlug: string }> }) {
  const { orgSlug, eventSlug } = await params;
  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug } });
  if (!org) notFound();
  const event = await prisma.event.findUnique({ where: { organisationId_slug: { organisationId: org.id, slug: eventSlug } }, /* include … */ });
  if (!event) notFound();
  const access = await resolvePublicEventAccess({ organisationId: org.id, eventId: event.id, status: event.status, privacyType: event.privacyType, websiteReleased: event.page?.isPublished ?? false });
  if (!access.allowed) notFound();
  // ...
}
```

Rules:

- Pass `websiteReleased: event.page?.isPublished`. Publication is `Event.status = PUBLISHED` **and** `EventPage.isPublished` together.
- Hidden, unreleased and uninvited all answer the same `notFound()`, so a page never confirms that a hidden event exists.
- Filter child content by `visibility: ContentVisibility.PUBLISHED`, as the programme query does.
- Pages that carry a capability in the URL (`/ticket/:token`, `/team/…`, `/submit/…`, `/attend/…`, `/crew/…`) get `no-store` from `isNoStorePage` in `proxy.ts`. If you add a new capability-link route, extend that function.

### 3. Super-admin page

Every `app/super-admin/**/page.tsx` must call the guard itself, because layout checks don't re-run on client navigation. From `app/super-admin/settings/page.tsx`:

```tsx
import { requireSuperAdminMfa } from "@/lib/permissions";
// ...
  await requireSuperAdminMfa();
```

`tests/unit/super-admin-page-guards.test.ts` fails if any super-admin page leaves it out. Super-admin insights stay read-only and capped, and never load secrets, tokens, answers or message bodies. See [Super admin](/features/super-admin).

### 4. Route handler

Use a route handler for public or token-based endpoints, file downloads and APIs. Dashboard mutations should be Server Actions instead.

**Public, token-based**: validate the token shape first, then rate-limit per IP, then look it up. Return the same response for "unknown" and "malformed". From `app/api/ticket/[token]/status/route.ts`:

```ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const token = parseTicketToken((await context.params).token);
  if (!token) return emptyTicketResponse(404);
  if (!(await checkRateLimitById("ticketStatus", `ip:${getClientIpFromHeaders(request.headers)}`))) {
    return emptyTicketResponse(429);
  }
  const ticket = await findTicketCheckIn(token);
  if (!ticket) return emptyTicketResponse(404);
  return Response.json(toTicketCheckInState(ticket.checkedInAt), { headers: TICKET_STATE_BASE_HEADERS });
}
```

**Authenticated, session-based**: call `auth()`, resolve access through the same core the matching dashboard view uses, audit exports, and give every denial the same empty response. From `app/api/exports/events/[eventId]/teams/route.ts`:

```ts
export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return exportNotFound();
  const { eventId } = await context.params;
  if (!eventId || eventId.length > 128) return exportNotFound();
  // ...
  const ctx = await resolveOrganiserEvent(userId, event.organisation.slug, event.id);
  if (!ctx) return exportNotFound();
  await recordAuditEvent({ action: "TEAM_LIST_EXPORTED", actorUserId: userId, /* … */ });
```

**Rate limits.** `proxy.ts` applies a per-IP `"global"` bucket to every `/api` path except `/api/health`, plus per-path buckets for `/api/rsvp`, `/api/search`, `/api/auth` and uploads. Add a handler-level `checkRateLimitById(bucket, key)` for anything that is expensive or guessable. If no existing `Bucket` in `lib/rateLimit.ts` fits, add one to both the `Bucket` union and the `limits` record.

**Monitoring.** Public APIs such as `app/api/search/route.ts` wrap the handler in `withApiMonitoring("GET /api/search", ...)` from `lib/apiMonitor.ts`. The machine and mobile APIs have their own wrappers; see [Extend the APIs](/guides/extend-the-apis).

### 5. Document the route

Add the route to the matching table in `docs/ROUTES.md` (public pages, dashboard, super-admin, APIs or mutation endpoints). If users will see it, update or add the help article in `content/help/` and run the help-content test.

## Checklist

- [ ] Server Component unless browser APIs are needed
- [ ] Dashboard: guard from `lib/dashboardGuards.ts` in the layout beside any `loading.tsx`, plus the page's own check
- [ ] New `loading.tsx` registered in `tests/unit/dashboard-loading-boundaries.test.ts`
- [ ] Public: `resolvePublicEventAccess` with `websiteReleased`; hidden and unknown give the same `notFound()`
- [ ] Super-admin: page calls `await requireSuperAdminMfa()` itself
- [ ] Route handler: input and token shape validated, rate-limited, tenant-scoped queries, uniform denial responses
- [ ] Capability-link pages added to `isNoStorePage` in `proxy.ts`
- [ ] Exports and other sensitive reads audited without PII in metadata
- [ ] `docs/ROUTES.md` and the help centre updated

## Verify

```bash
npx vitest run tests/unit/dashboard-loading-boundaries.test.ts tests/unit/super-admin-page-guards.test.ts
npx vitest run tests/unit/help-content.test.ts      # if you touched content/help
npm run lint
npx next typegen && npx tsc --noEmit
npm run build
npm run test:e2e                 # routing, auth or public-flow changes
npm run test:e2e:production      # security headers, auth, tickets, public flows
```
