# Extend the machine or mobile API

## Goal

Add an endpoint to one of Yuyu's two HTTP APIs without weakening tenant isolation or breaking the published contract.

| | Machine API `/api/v1` | Mobile API `/api/mobile/v1` |
| --- | --- | --- |
| Caller | Tenant-bound API client (bearer credential, not a user) | Signed-in user via mobile session tokens |
| Authorisation | Explicit scopes (`lib/api/v1/scopes.ts`) | The user's own org role and event grants, re-checked by `lib/core/*` |
| Wrapper | `handleMachineApiRequest` (`lib/api/v1/handler.ts`) | `authedMobileRoute` / `eventRoute` / `mobileRoute` (`lib/mobile/route.ts`, `lib/mobile/eventRoute.ts`) |
| DTOs | `lib/api/v1/schemas.ts` | `lib/mobile/schemas.ts` |
| Contract | `docs/API.md` | `docs/MOBILE_API.md`, `docs/mobile-api.openapi.yaml`, `docs/mobile-api-fixtures/` |
| Contract tests | `tests/unit/api-contracts.test.ts`, `tests/unit/api-handler.test.ts`, `tests/integration/api-v1.db.test.ts` | `tests/unit/mobile-api-contract.test.ts`, `tests/unit/mobile-dto.test.ts`, `tests/integration/mobile-api.db.test.ts` |

## Before you start

- Read [Machine API](/api/machine-api) or [Mobile API](/api/mobile-api), and [Mutation cores](/architecture/mutation-cores).
- Mobile mutations **must** go through a `lib/core/*` function shared with the dashboard. Never reimplement a rule in the route. If the core doesn't exist yet, write it first ([Add a Server Action](/guides/add-a-server-action)).
- The machine API is read-only today. Its handler always uses the `"apiRead"` rate-limit bucket. An `"apiWrite"` bucket is defined in `lib/rateLimit.ts` but nothing uses it yet, so a machine write endpoint is a design change: discuss it before building one.

## Machine API: steps

### 1. Choose or add a scope

```ts
// lib/api/v1/scopes.ts
export const API_SCOPES = [
  "events:read",
  "participants:read",
  "participants:attendance:read",
] as const;
```

Reuse a scope when the new endpoint exposes nothing beyond what that scope already grants. Otherwise add a new scope. Scopes are stored as strings (`ApiClientScope.scope String`), so no migration is needed. The settings UI (`components/api-clients/ApiClientManagement.tsx`) renders every entry in `API_SCOPES`, and `app/actions/api-clients.ts` validates with `apiScopeSchema`. Document the scope in the "Scopes" table of `docs/API.md` and in `content/help/developers/api.mdx`.

### 2. Define strict DTOs and query schemas

In `lib/api/v1/schemas.ts`, every response and query schema is `.strict()`, so a caller-supplied `organisationId` or an accidental extra field fails:

```ts
export const collectionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(1024).optional(),
}).strict();
```

### 3. Write the data function with an explicit `select`

Keep queries in `lib/api/v1/` (see `lib/api/v1/events.ts`). Always filter by the `organisationId` from the credential context, select only the fields the DTO needs, and parse the result through the DTO schema:

```ts
async function findEventRecord(organisationId: string, eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, organisationId },
    select: eventSelect,
  });
}

export async function getApiEvent(organisationId: string, eventId: string) {
  const event = await findEventRecord(organisationId, eventId);
  return event ? eventResponseSchema.parse({ data: eventDto(event) }) : null;
}
```

Paginate with the versioned cursor helpers in `lib/api/v1/pagination.ts` (`encodeCursor`, `decodeCursor`).

### 4. Add the route

`app/api/v1/events/[eventId]/route.ts` is the template:

```ts
export const GET = withApiMonitoring(
  "GET /api/v1/events/:eventId",
  async (request: Request, routeContext: Context) =>
    handleMachineApiRequest(request, "events:read", async (context) => {
      const query = emptyQuerySchema.safeParse(
        Object.fromEntries(new URL(request.url).searchParams.entries()),
      );
      if (!query.success) return apiError("INVALID_REQUEST", 400);

      const params = await routeContext.params;
      const eventId = apiResourceIdSchema.safeParse(params.eventId);
      if (!eventId.success) return apiError("INVALID_REQUEST", 400);

      const response = await getApiEvent(context.organisationId, eventId.data);
      if (!response) return apiError("RESOURCE_NOT_FOUND", 404);
      return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
    }),
);
```

`handleMachineApiRequest` authenticates the credential (`INVALID_CREDENTIAL`, 401), checks the scope (`INSUFFICIENT_SCOPE`, 403), applies the per-client `"apiRead"` limit (`RATE_LIMITED`, 429), and records last-use in `after()`. Use only the codes in `ApiErrorCode` (`lib/api/v1/errors.ts`). For a scope that only widens another, check it inside the operation, as the participants route does with `context.scopes.has("participants:attendance:read")`.

### 5. Document and test

- Add the endpoint to "Endpoints" in `docs/API.md` and to `docs/ROUTES.md`.
- Unit: extend `tests/unit/api-contracts.test.ts` so the new DTO rejects an extra field and the query rejects unknown parameters.
- Integration: extend `tests/integration/api-v1.db.test.ts` with a cross-tenant case ("never resolves an event through a different organisation") and a forbidden-fields check.

## Mobile API: steps

### 1. Pick the route wrapper

| Wrapper | Use for |
| --- | --- |
| `mobileRoute(routeId, handler, { optionalAuth })` | Public routes; with `optionalAuth`, an invalid bearer gives `UNAUTHENTICATED` |
| `authedMobileRoute(routeId, handler)` | Signed-in routes; adds the per-user `"mobileApi"` rate limit |
| `eventRoute(routeId, requirement, handler)` | Organiser routes under `orgs/[orgSlug]/events/[eventId]`; unseen events are `NOT_FOUND`, a missing permission is `FORBIDDEN` |

All of them catch errors and answer `INTERNAL_ERROR` without details.

### 2. Write the route over a shared core

The feedback toggle (`app/api/mobile/v1/orgs/[orgSlug]/events/[eventId]/feedback/state/route.ts`) parses a strict body, calls the same core the dashboard uses, maps failures, and parses its response through a DTO:

```ts
const bodySchema = z.object({ open: z.boolean() }).strict();

export const POST = eventRoute("POST /api/mobile/v1/orgs/:orgSlug/events/:eventId/feedback/state", null, async (request, _params, { auth, event }) => {
  const body = await parseJsonBody(request, bodySchema);
  if ("response" in body) return body.response;
  // ... read current settings
  const result = await saveFeedbackSettingsForUser(auth.userId, {
    organisationSlug: event.organisation.slug,
    eventId: event.event.id,
    isOpen: body.data.open,
    // ...
  });
  if (!result.ok) return mobileActionError(result);
  return mobileOk(feedbackStateDtoSchema.parse({ open: body.data.open }));
});
```

Helpers in `lib/mobile/http.ts`: `parseJsonBody` and `parseQuery` (size-capped, Zod-validated, `INVALID_REQUEST` with `fieldErrors`), `mobileOk` and `mobileError` (envelope plus `no-store`), and `mobileActionError`, which maps an `ActionResult` failure (including `code` values such as `TEAM_MEMBER`) to a mobile error.

::: warning
`classifyActionError` picks the mobile code from `needsForce`, from a pass-through `code`, or **by matching the core's message text**. For example, `/^Too many/` becomes `RATE_LIMITED`, `/permission/` becomes `FORBIDDEN`, `/not found\.?$/` becomes `NOT_FOUND`, and anything unmatched becomes `CONFLICT`. When a new core error should map to a specific code, word it to match, or set `code` on the `ActionResult` (`ActionErrorCode` in `app/actions/org.ts` plus `PASS_THROUGH_CODES` in `lib/mobile/http.ts`).
:::

The `requirement` argument of `eventRoute` takes a predicate over `EventPermissionsDto` (from `eventPermissionsFor` in `lib/mobile/permissions.ts`), for example `canSeeGuests`. Pass `null` when the core does the check itself, as above.

### 3. Add the DTO

Add a strict schema to `lib/mobile/schemas.ts`. For example:

```ts
export const feedbackStateDtoSchema = z.object({ open: z.boolean() }).strict();
```

Never include ticket tokens except for their owner or `CHECK_IN` roster holders, and never include tokens, PINs, emails or answers that the matching web view would not show.

### 4. Update the OpenAPI contract

In `docs/mobile-api.openapi.yaml`, add the path and method with a `default` error response, and add any new response component:

```yaml
  /api/mobile/v1/orgs/{orgSlug}/events/{eventId}/feedback/state:
    post:
      tags: [Day-of]
      summary: Open or close the feedback form (organisation admins)
      parameters: [{ $ref: "#/components/parameters/orgSlug" }, { $ref: "#/components/parameters/eventId" }]
      # requestBody …
      responses:
        "200": { description: OK, content: { application/json: { schema: { $ref: "#/components/schemas/FeedbackStateResponse" } } } }
        "403": { $ref: "#/components/responses/Error" }
        "404": { $ref: "#/components/responses/Error" }
        "409": { $ref: "#/components/responses/Error" }
        default: { $ref: "#/components/responses/Error" }
```

`tests/unit/mobile-api-contract.test.ts` enforces the following:

- **"documents exactly the implemented /api/mobile/v1 routes and methods"**: it walks `app/api/mobile/v1/**/route.ts`, reads `export const GET|POST|PATCH|PUT|DELETE`, and compares the result with the spec. An undocumented route fails.
- **"gives every operation a default error response"**.
- **"covers every fixture file"**: every JSON file in `docs/mobile-api-fixtures/` must appear in the test's `fixtures` list as `[file, OpenAPI component, Zod schema]`. Each fixture is validated against both the OpenAPI component and the route's Zod schema.
- **Parity**: components in the `parity` list must have exactly the same fields as their Zod schema.

For a substantial response, add a fixture file and its entry, and add the component and schema to `parity`:

```ts
["registration-state.json", "RegistrationStateResponse", dto.successEnvelope(dto.registrationStateDtoSchema)],
```

### 5. Document and test

- Add the endpoint to `docs/MOBILE_API.md` under its section (Me, Public, Organiser, Judging), including its error codes.
- Unit: add forbidden-field cases to `tests/unit/mobile-dto.test.ts` for any DTO that sits near sensitive data.
- Integration: extend `tests/integration/mobile-api.db.test.ts` with cross-tenant `NOT_FOUND` and a caller who lacks the permission.

## Checklist

- [ ] Machine: scope chosen or added; documented in `docs/API.md` and the help centre
- [ ] Machine: every query filters by `context.organisationId`; explicit `select`; DTO parsed through a strict schema
- [ ] Machine: only `ApiErrorCode` codes; `Cache-Control: no-store`
- [ ] Mobile: correct wrapper; mutations go through `lib/core/*`; strict body and query schemas
- [ ] Mobile: strict DTO in `lib/mobile/schemas.ts`; no tokens, PINs, emails or answers beyond what the web shows
- [ ] Mobile: OpenAPI path with `default` error; fixture and `parity` entries where relevant
- [ ] `docs/MOBILE_API.md` / `docs/API.md` and `docs/ROUTES.md` updated
- [ ] Cross-tenant and forbidden-field tests added

## Verify

```bash
npx vitest run tests/unit/api-contracts.test.ts tests/unit/api-handler.test.ts
npx vitest run tests/unit/mobile-api-contract.test.ts tests/unit/mobile-dto.test.ts
npm run test:unit
npx next typegen && npx tsc --noEmit
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration
npm run build
```
