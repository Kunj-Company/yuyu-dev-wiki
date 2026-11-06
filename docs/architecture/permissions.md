# Permissions

`Organisation` is Yuyu's tenant boundary. Access is decided on the server from three inputs: the user's `Membership` role in the organisation (`OWNER`, `ADMIN`, `MEMBER`), any `EventCollaborator` grant they hold on one event or series (exact `EventPermission` values), and, separately, the instance-wide super-admin identity. This page lists the helper functions you call to enforce that, says when to use each, and explains how the dashboard's capability object keeps the UI in step with the server. The full control-by-control matrix lives in the handbook's `docs/PERMISSIONS.md`.

## Key files

| Path | Role |
| --- | --- |
| `lib/permissions.ts` | Organisation roles, role predicates, page-style `require*` guards, super-admin |
| `lib/eventAccess.ts` | Per-event and per-series grant checks |
| `lib/dashboardGuards.ts` | `cache()`d guards awaited by dashboard layouts (real 404s) |
| `lib/eventDashboard/capabilities.ts` | `eventCapabilities` and `seriesCapabilities`: what the dashboard shows |
| `lib/eventDashboard/context.ts` | `loadEventDashboard`: resolves access and computes capabilities |
| `lib/judgingPermissions.ts`, `lib/judgingAccess.ts` | `JUDGE` rules and judging context resolvers |
| `lib/core/teams.ts` | `resolveOrganiserEvent` (registration-manager context for teams and crew) |
| `lib/mobile/permissions.ts` | `eventPermissionsFor`: mobile UI flags |
| `lib/help/access.ts` | Help centre audiences |

## How it works

### Roles and grants

| Who | Can do |
| --- | --- |
| `OWNER` | Everything in the organisation, plus members (`canManageMembers`), deleting the organisation (`canDeleteOrg`) and API clients |
| `ADMIN` | Everything event-related: create, edit, publish, emails, feedback, reports, collaborators, webhooks |
| `MEMBER` | Opens every event dashboard read-only; acts on an event only through a grant |
| Collaborator | Only the exact grants on one event or series: `EDIT_DETAILS`, `MANAGE_REGISTRATIONS`, `MANAGE_INVITATIONS`, `CHECK_IN`, `PUBLISH_AND_SCHEDULE`, and the event-only `JUDGE` |
| Super-admin | Instance area only: verified email equal to `SUPER_ADMIN_EMAIL`, plus a TOTP step-up ([Auth and sessions](/architecture/auth-and-sessions#super-admin-step-up)) |

A grant never implies another, and no grant reaches organisation-level operations (publishing, the Details form, emails, short links, collaborators and so on).

### Organisation helpers (`lib/permissions.ts`)

| Function | Signature | Use it when |
| --- | --- | --- |
| `getMembership` | `(userId: string, organisationId: string) => Promise<Membership \| null>` | You already have the organisation id and need the role. The usual first step in a Server Action or core |
| `hasRoleAtLeast` | `(role: MembershipRole, min: MembershipRole) => boolean` | Rank comparison: `MEMBER < ADMIN < OWNER` |
| `isOrgAdmin` | `(role: MembershipRole) => boolean` | `OWNER` or `ADMIN` |
| `canManageEvents` | `(m: Membership \| null) => boolean` | Owner/admin event operations (broadcasts, attendance confirmation, details) |
| `canPublishEvents` | `(m: Membership \| null) => boolean` | Publishing; same rule as `canManageEvents` |
| `canManageWebhooks` | `(m: Membership \| null) => boolean` | Webhook endpoints, secrets, tests, delivery log |
| `canManageMembers`, `canDeleteOrg` | `(m: Membership \| null) => boolean` | Owner-only operations |
| `isUserEmailVerified` | `(userId: string) => Promise<boolean>` | Mutation gates that need a verified inbox. It reads the database because the JWT can be stale |
| `requireAuth` | `() => Promise<Session & { user: { id: string } }>` | Pages and actions that need a signed-in user. Redirects to `/login` |
| `requireOrgRole` | `(orgSlug: string, minRole: MembershipRole) => Promise<OrgAccessContext>` | Pages (and some actions) that need a minimum role. Redirects to `/dashboard` (no organisation or membership) or `/dashboard/:orgSlug` (role too low) |
| `requireOrgMembership` | `(orgSlug: string) => Promise<OrgAccessContext>` | `requireOrgRole(orgSlug, "MEMBER")` |
| `requireOrgDashboardAccess` | `(orgSlug: string) => Promise<… & { membership: Membership \| null; isCollaborator: boolean }>` | Organisation dashboard pages that collaborators may also open |
| `requireSuperAdmin`, `requireSuperAdminMfa` | `() => Promise<Session & …>` | Super-admin pages and actions. Unauthorised users get `notFound()` |
| `superAdminEmailFor` | `(userId: string) => Promise<string \| null>` | Checking super-admin identity without the MFA step |

`canCreateEvent` is deprecated; use `canManageEvents`.

::: tip Redirect or return?
The `require*` helpers call `redirect()` or `notFound()`, which suits pages. In Server Actions and cores, prefer resolving the organisation yourself, calling `getMembership` and returning a UI-safe `ActionResult` error. `requireBroadcastContext` in `lib/core/broadcasts.ts` shows this: unknown organisation gives "Organisation not found.", no `canManageEvents` gives "You do not have permission to email attendees.", and an event outside the organisation gives "Event not found.".
:::

### Event and series helpers (`lib/eventAccess.ts`)

```ts
export async function canAccessEvent(params: {
  userId: string;
  organisationId: string;
  eventId?: string;
  eventSeriesId?: string;
  permission: EventPermission;
})
```

- **`canAccessEvent`** returns `false` unless exactly one of `eventId` or `eventSeriesId` is given and the target belongs to `organisationId`. Owners and admins pass. Anyone else needs a collaborator row on that exact target whose `permissions` include `permission`. Use it for every grant-gated operation (`CHECK_IN` in `lib/core/checkin.ts`, `EDIT_DETAILS` for page content, `PUBLISH_AND_SCHEDULE` for the programme, `MANAGE_INVITATIONS` for invites).
- **`canViewEventDashboard({ userId, organisationId, eventId? | eventSeriesId? })`** checks for any membership, or any grant on the target. Use it for opening a dashboard, not for acting.
- **`canManageRegistrationsFor({ userId, organisationId, eventId? | eventInstanceId? })`** is for the guest list. For a standalone event it is `canAccessEvent(… MANAGE_REGISTRATIONS)`. For a series occurrence it looks up the instance's series and checks the series-level grant. Every RSVP core uses it, and so does `resolveOrganiserEvent`.

### Context resolvers

These return a small context of ids, or `null`. Callers authenticate first.

| Resolver | Grants access to | Returns |
| --- | --- | --- |
| `resolveOrganiserEvent(userId, organisationSlug, eventId)` (`lib/core/teams.ts`) | Owner/admin or `MANAGE_REGISTRATIONS` | `OrganiserEventContext` for teams, crew and team exports |
| `resolveJudgeContext(userId, organisationSlug, eventId)` (`lib/judgingAccess.ts`) | Owner/admin or `JUDGE` | `JudgeContext` with `isAdmin` |
| `resolveJudgingOrganiser(userId, organisationSlug, eventId)` | Owner/admin only | `JudgingOrganiserContext` |

`judgingPermissionsFor(isAdmin, isMember, grant)` (`lib/judgingPermissions.ts`) is the pure rule behind them. `JUDGE` never satisfies any other check, and a non-member whose grants are exactly `[JUDGE]` is `isJudgeOnly`: the dashboard shows only the judging workspace.

### Dashboard guards

Next.js renders a segment's `loading.tsx` as a Suspense boundary around the page but not its own layout. Once the fallback streams, the status is already 200, so a later `notFound()` cannot become a real 404. For that reason every dashboard segment with a `loading.tsx` has a layout that awaits a guard first:

```ts
export default async function CheckInGuardLayout({ children, params }: { … }) {
  const { orgSlug, eventId } = await params;
  await guardEventPermission(orgSlug, eventId, EventPermission.CHECK_IN);
  return children;
}
```

(from `app/dashboard/[orgSlug]/event/[eventId]/check-in/layout.tsx`, props type trimmed)

| Guard (`lib/dashboardGuards.ts`) | Checks |
| --- | --- |
| `guardOrgDashboard(orgSlug)` | Membership or any grant in the organisation |
| `guardOrgRole(orgSlug, minRole)` | `requireOrgRole` |
| `guardEventDashboard(orgSlug, eventId)` | Event in the organisation and viewable (a `JUDGE`-only grant counts) |
| `guardEventPermission(orgSlug, eventId, permission)` | Owner/admin or that exact grant |
| `guardSeriesDashboard(orgSlug, seriesId)` | Series in the organisation and viewable |
| `guardWebhookEndpoint(orgSlug, endpointId)` | Admin and the endpoint belongs to the organisation |

All are wrapped in React `cache()`, so the page's own identical check is deduplicated. Pages keep their checks as defence in depth.

### Capability object (UI parity)

`eventCapabilities(role, grant)` is a pure function that returns flags such as `canManageRegistrations`, `canCheckIn`, `canManageCheckInLists` (`EDIT_DETAILS`), `canEditPageContent`, `canManageSchedule`, `canSendEmails` (admin), `canPublish` (admin), `canJudge`, `canManageJudging` and `isJudgeOnly`. `loadEventDashboard` computes it once per request and the dashboard components read it to decide which controls to render. Each flag mirrors the server check of the action behind the control, so the UI never shows a control the server would refuse, nor hides one a grant allows. **The flags are visibility only.** Every action still re-checks. `seriesCapabilities` does the same for series pages.

The mobile API has its own pure equivalent, `eventPermissionsFor(isAdmin, grant, { submissionsEnabled })`. One deliberate difference is that `manageRegistrations` stays admin-only in the mobile contract, while the shared RSVP cores accept the `MANAGE_REGISTRATIONS` grant.

## Invariants

- **Resolve the organisation from the slug (or the machine credential), never from a client-supplied organisation id**, then re-read every target with an `organisationId` predicate. A foreign id must behave like an unknown one.
- **UI visibility is never authorisation.** Every Server Action and route handler checks access itself.
- **Grants are exact.** Never write `has(A) || has(B)` to let one grant stand in for another, and never let `JUDGE` satisfy a non-judging check. `tests/unit/event-capabilities.test.ts` and `tests/unit/judging-permissions.test.ts` pin the rules.
- **Standalone grants never reach a series, and series grants never reach a standalone event.** `canAccessEvent` takes exactly one target.
- **Refusals on dashboard pages are real HTTP statuses** (404, or 307 to `/dashboard`, the organisation or sign-in). Put any new `loading.tsx` below a guard layout. `tests/unit/dashboard-loading-boundaries.test.ts` checks this.
- **Saved views are not grants.** A view only selects filters; the list's own check runs first.
- **Super-admin is not an organisation role.** Every super-admin page calls `requireSuperAdminMfa()` itself.

## Making changes

- **Gate a new event action by a grant:** in the core or action, resolve the organisation, call `canAccessEvent({ …, permission: EventPermission.X })`, and return an error such as "You do not have permission to …" (the wording also maps to mobile `FORBIDDEN`). Add or reuse a flag in `eventCapabilities` and use it in the component. Add the row to `docs/PERMISSIONS.md` and a case to `tests/unit/event-capabilities.test.ts`.
- **Add a new grant:** add the enum value to `EventPermission` with a migration (record it in the rollback notes, because the old release cannot read it), extend `eventCapabilities`, the collaborator invite UI, `eventPermissionsFor`, and the tests. See [Change the schema](/guides/change-the-schema).
- **Add a guarded dashboard page with a loading screen:** add a `layout.tsx` in the same segment that awaits the matching `guard*`, then add the `loading.tsx`. See [Add a page or route](/guides/add-a-page-or-route).

## Testing

| What | File |
| --- | --- |
| Capability table | `tests/unit/event-capabilities.test.ts` |
| Grant checks | `tests/unit/event-access.test.ts`, `tests/integration/collaborator-permissions.db.test.ts` |
| Judging roles | `tests/unit/judging-permissions.test.ts` |
| Loading boundaries | `tests/unit/dashboard-loading-boundaries.test.ts` |
| Super-admin | `tests/unit/super-admin-permissions.test.ts`, `tests/unit/super-admin-page-guards.test.ts` |
| Help audiences | `tests/unit/help-access.test.ts` |

```bash
npx vitest run tests/unit/event-capabilities.test.ts tests/unit/event-access.test.ts
npm run test:integration
```

## Further reading

- [PERMISSIONS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/PERMISSIONS.md) (full matrix), [SECURITY.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/SECURITY.md#authorization-and-tenancy), [HACKATHON.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/HACKATHON.md)
- [Mutation cores](/architecture/mutation-cores), [Auth and sessions](/architecture/auth-and-sessions), [Add a page or route](/guides/add-a-page-or-route), [Security checklist](/reference/security-checklist)
