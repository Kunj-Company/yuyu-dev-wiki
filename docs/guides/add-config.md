# Add configuration

## Goal

Add a new configuration value as either:

- an **environment variable**, read at process start or at use, and set by the operator in `.env` or the deployment Secret, or
- an **instance setting**, stored in the `InstanceSetting` singleton row and changed by the super admin at `/super-admin/...` without a restart.

Choose the instance setting when an operator should be able to change the value at runtime on every replica, and especially for credentials of external services (SMTP and Google SSO already work this way). Choose an environment variable for infrastructure wiring, process-level secrets and anything needed before the database is reachable.

## Before you start

- Read [Configuration](/reference/configuration) and `docs/CONFIGURATION.md`.
- Never read, print or commit real `.env` values. Use `.env.example` for names and redacted examples (`AGENTS.md`).
- `NEXT_PUBLIC_*` variables are **build-visible**: changing them needs a rebuild (the `Dockerfile` passes `NEXT_PUBLIC_BASE_URL` as a build `ARG`). Don't add a build-visible flag for something an operator should toggle. `AGENTS.md` specifically forbids reintroducing one for Google SSO.

## Environment variable: steps

### 1. Add it to `.env.example`

Use a comment that says what it does, its default, and whether it is development-only. Existing entries look like this:

```bash
# Sent email queue records are removed by the scheduler after this many days.
OUTBOX_RETENTION_DAYS="30"
# Development and tests only: let organisation webhooks reach http:// and
# private/loopback receivers. Ignored by a production server (except the CI
# production-build test mode) and refused by `npm run production:check`.
# WEBHOOKS_ALLOW_PRIVATE_TARGETS="1"
```

The Helm chart mounts one operator-created Secret (`existingSecret`, default `yuyu-runtime`) with `envFrom` on every app pod and the migration Job. `charts/yuyu/values.yaml` says that Secret "must contain every production runtime variable in .env.example". The chart doesn't list variables one by one, so no chart change is needed. Do mention the new variable in the release notes, though, so operators add it to the Secret.

### 2. Add a format rule to `lib/env.ts`

`envSchema` format-checks values when they are present. Blank strings count as unset (`environmentValues` filters them out), so `.env.example` placeholders never fail validation.

```ts
export const envSchema = z.object({
  // ...
  // Development/test only; ignored by a production server outside CI test mode (lib/webhooks/urlSafety.ts).
  WEBHOOKS_ALLOW_PRIVATE_TARGETS: z.enum(["0", "1"]).optional(),
  // ...
  OUTBOX_RETENTION_DAYS: z.coerce.number().int().positive().max(365).optional(),
});
```

### 3. If production requires it, enforce it in two places

1. `validateRuntimeEnvironment()` in `lib/env.ts` runs when a production server starts (it is called from `instrumentation.ts`). Add the name to its `missing` list, plus any cross-field rule:

   ```ts
   const missing = ["AUTH_URL", "NEXT_PUBLIC_BASE_URL", "REDIS_URL", "CRON_SECRET", "HEALTHCHECK_SECRET", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY", "MFA_ENCRYPTION_KEY", "TRUSTED_PROXY_IP_HEADER", "S3_BUCKET", "S3_REGION"]
     .filter((key) => !process.env[key]?.trim());
   ```

2. `scripts/check-production-env.mjs` (`npm run production:check`) is the operator's preflight. It is a standalone `.mjs` script that doesn't import `lib/env.ts`, so add the variable to its `required` array and copy any format rule there too.

Keep the two in step. Values that can also come from the super-admin panel (SMTP, Google) must **not** be required in either place.

### 4. Read it in one place

Read the variable in the module that owns the behaviour, with a safe default and bounds. Treat blank as unset. From `lib/retention.ts`:

```ts
const outboxRetentionDays = Math.min(
  Math.max(Number(process.env.OUTBOX_RETENTION_DAYS || 30), 1),
  365,
);
```

`lib/instanceSettings.ts` has a private `envValue(...names)` helper that trims and skips blanks for its own fallbacks.

For a secret, never log it or put it in an error message, an audit row or a UI prop.

### 5. Document and test

- Add a row to the right table in `docs/CONFIGURATION.md` (`| Variable | Production | Purpose |`). Production is `Required`, `Recommended`, `Optional` or `Optional fallback`.
- `tests/unit/env.test.ts` covers `validateRuntimeEnvironment`. Add a case for a missing or malformed value if production requires it.
- `tests/unit/production-check-script.test.ts` covers `scripts/check-production-env.mjs`. Add the matching case there.

## Instance setting: steps

### 1. Add a column to `InstanceSetting`

```prisma
/// Instance-wide, super-admin-managed controls. The singleton row is created
/// on first change; absence deliberately preserves the secure default below.
model InstanceSetting {
  id                    String   @id
  allowNewUserSignups   Boolean  @default(true)
  // ...
  opsWebhookUrlEncrypted String?
  opsWebhookEnabled      Boolean  @default(false)
}
```

The row may not exist (it is created on the first save), so your reader must return the right default when it is missing. Make the column nullable or give it a constant default, and follow [Change the schema](/guides/change-the-schema) for the migration. Add the column to the `InstanceSetting` list in `scripts/verify-production-schema.mjs` if the app depends on it.

### 2. Add a reader to `lib/instanceSettings.ts`

Read at use time, with no caching, so every replica sees a change on its next request:

```ts
/** A missing singleton row intentionally preserves the historical default. */
export async function isNewUserRegistrationEnabled(): Promise<boolean> {
  const settings = await prisma.instanceSetting.findUnique({
    where: { id: INSTANCE_SETTINGS_ID },
    select: { allowNewUserSignups: true },
  });
  return settings?.allowNewUserSignups ?? true;
}
```

If the setting has an environment fallback, follow the existing rule: **the database overrides the environment**. Don't mix sources field by field. Saved SMTP replaces every `SMTP_*` variable together (`resolveEmail`), and a saved Google client ID is used only with the saved secret (`resolveGoogle`). Expose a secret-free status function for the UI, as `getEmailSettingsStatus` and `getGoogleSsoStatus` do.

### 3. Secrets: encrypt, write-only

Store secrets with `encryptInstanceConfigSecret` and read them with `decryptInstanceConfigSecret` (`lib/instanceConfigSecrets.ts`). These use domain-separated key material from `MFA_ENCRYPTION_KEY`. Name the column `...Encrypted`. Never return the value to the browser. The UI receives only "has a value" and "unreadable" flags, and an empty input means "keep the current one". `scripts/check-instance-secrets.mjs` checks that the current key can decrypt saved secrets.

### 4. Add the Server Action

Put it in `app/actions/instance-settings.ts`. The order is the same for every action there: fresh-MFA super-admin gate, rate limit, Zod, upsert on the singleton id, audit, revalidate.

```ts
export async function setNewUserRegistrationEnabled(input: unknown): Promise<ActionResult> {
  const session = await requireSuperAdminMfa();
  if (await isActionRateLimited("action", session.user.id)) return { ok: false, error: "Too many requests. Try again shortly." };
  const parsed = signupSettingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid account creation setting." };

  await prisma.instanceSetting.upsert({
    where: { id: INSTANCE_SETTINGS_ID },
    create: { id: INSTANCE_SETTINGS_ID, allowNewUserSignups: parsed.data.allowNewUserSignups },
    update: { allowNewUserSignups: parsed.data.allowNewUserSignups },
  });
  await recordAuditEvent({
    action: "NEW_USER_REGISTRATION_SETTING_UPDATED",
    actorUserId: session.user.id,
    targetType: "InstanceSetting",
    targetId: INSTANCE_SETTINGS_ID,
    metadata: { allowNewUserSignups: parsed.data.allowNewUserSignups },
  });
  revalidatePath("/login");
  revalidatePath("/super-admin/auth");
  return { ok: true };
}
```

Audit metadata records *that* a secret changed (`smtpPasswordChanged: true`), never its value.

### 5. Add the control

Put the client control in `components/super-admin/`, modelled on `AccountCreationControl.tsx`. Render it from a super-admin page that calls `await requireSuperAdminMfa()` itself, as `app/super-admin/auth/page.tsx` does. Pass only secret-free status into props. See [Super admin](/features/super-admin).

### 6. Document and test

- Document the setting in `docs/CONFIGURATION.md` ("Panel settings and environment fallbacks") and in the help centre (`content/help/instance/settings.mdx`).
- Reader: extend `tests/unit/instance-settings.test.ts`. It mocks `@/lib/db` and `@/lib/instanceConfigSecrets` and asserts the missing-row default:

  ```ts
  it("allows new registrations when no singleton setting exists", async () => {
    findUnique.mockResolvedValue(null);
    await expect(isNewUserRegistrationEnabled()).resolves.toBe(true);
  ```

- Action: extend `tests/unit/instance-admin-actions.test.ts` (fresh MFA gate, no plaintext secret reaching Prisma).

## Checklist

- [ ] Environment variable: in `.env.example` with a comment; format rule in `envSchema`; blank treated as unset
- [ ] Production-required: added to `validateRuntimeEnvironment` **and** `scripts/check-production-env.mjs`; tests in `env.test.ts` and `production-check-script.test.ts`
- [ ] Not build-visible unless it truly must be (`NEXT_PUBLIC_*` needs a rebuild)
- [ ] Row added to `docs/CONFIGURATION.md`; release notes tell operators to add it to the Helm Secret
- [ ] Instance setting: missing-row default preserved; additive migration; reader reads at use time
- [ ] Database overrides environment as a whole, never per field
- [ ] Secrets encrypted with `encryptInstanceConfigSecret`, write-only, absent from props, logs and audit metadata
- [ ] Action uses `requireSuperAdminMfa`, rate limit, Zod, upsert on `INSTANCE_SETTINGS_ID`, audit, `revalidatePath`
- [ ] Super-admin page calls `await requireSuperAdminMfa()` itself

## Verify

```bash
npx vitest run tests/unit/env.test.ts tests/unit/production-check-script.test.ts
npx vitest run tests/unit/instance-settings.test.ts tests/unit/instance-admin-actions.test.ts
npx vitest run tests/unit/super-admin-page-guards.test.ts
npm run production:check     # with a production-like environment loaded
npm run db:verify            # if you added an InstanceSetting column
npx next typegen && npx tsc --noEmit
npm run build
```
