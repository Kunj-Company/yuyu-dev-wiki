# Change the schema

## Goal

Ship a Prisma schema change as a reviewed, additive migration that runs safely against a live production database, can be rolled back, and keeps the schema checks green. `prisma/schema.prisma` is authoritative for the data model; the migration SQL in `prisma/migrations/<timestamp>_<name>/migration.sql` is what actually runs.

## Before you start

- Read [Data model](/architecture/data-model) and the lock checklist in `docs/production-operations.md` ("Lock checklist for the team, judging and large-event migrations").
- Have the development database running (`docker compose up -d`, see [Local setup](/start/local-setup)) and a separate disposable `yuyu_test` database for integration tests.
- Never use `npm run db:push` for a change that will be deployed (`AGENTS.md`, `docs/DEVELOPMENT.md`).
- Know which release is running in production. The previous release must keep working against the new schema until the rollout finishes, and possibly after an image rollback.

## Steps

### 1. Edit `prisma/schema.prisma`

Prefer changes that are safe for existing rows:

| Change | Safe pattern | Real example |
| --- | --- | --- |
| New column | Nullable, or `NOT NULL` with a **constant** default (no table rewrite) | `Event.emailEntrantsOnResults Boolean @default(false)` (`20261028010000_hackathon_email_toggles`) |
| New table | New table with its own FKs and cascades | `SavedView` (`20261025010000_saved_views`) |
| New enum | New `CREATE TYPE` used only by a new column | `SavedViewSurface` |
| New enum value on an existing enum | `ALTER TYPE ... ADD VALUE`, plus a rollback note (step 6) | `CREW` on `EventPageSectionType` (`20261029000000_event_crew`) |
| New index on a big table | Plan a `CREATE INDEX CONCURRENTLY` pre-build | `20261026000000_large_event_indexes` |

Avoid in a single release: dropping or renaming columns the running release still reads, tightening nullability without a backfill, and changing a column type in place.

Document intent next to the model with `///` comments, as `InstanceSetting` and `WebhookEndpoint.eventTypes` do.

### 2. Generate the migration without applying it

`npm run db:migrate` runs `prisma migrate dev`. Use Prisma's `--create-only` flag so you can edit the SQL before it is applied:

```bash
npm run db:migrate -- --create-only --name my_change
```

Rename the folder if needed so the timestamp sorts after the newest migration in `prisma/migrations/`.

### 3. Review and hand-edit the SQL

Open `migration.sql` and check indexes, nullability, defaults, cascades and backfills (`AGENTS.md`, "Data, schema, and background work"). Start the file with a comment explaining the change and whether it is purely additive. From `prisma/migrations/20261028010000_hackathon_email_toggles/migration.sql`:

```sql
-- Hackathon emails become opt-in per event (docs/HACKATHON.md). Purely
-- additive: existing events get false, so publishing results or submitting a
-- project queues no email until an organiser turns the matching switch on.
ALTER TABLE "Event" ADD COLUMN "emailEntrantsOnResults" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "emailSubmissionReceipts" BOOLEAN NOT NULL DEFAULT false;
```

Prisma does not model CHECK constraints, so add them by hand. Name them `<Table>_<rule>`, as in `SavedView_name_length`. To avoid a long scan under an exclusive lock, add a CHECK on an existing table `NOT VALID` first, then validate it. From `20261029000000_event_crew`:

```sql
-- Every RSVP row so far has isCrew = false, so the check is added NOT VALID
-- (no scan under the ACCESS EXCLUSIVE lock) and validated separately.
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_crew_shape"
  CHECK (NOT "isCrew" OR ("eventId" IS NOT NULL AND "teamId" IS NULL AND "status" = 'CONFIRMED')) NOT VALID;
ALTER TABLE "RSVP" VALIDATE CONSTRAINT "RSVP_crew_shape";
```

Raw SQL that writes or compares timestamps (in a backfill, say) must use the helpers in `lib/sqlTimestamp.ts` in application code. In migration SQL, avoid depending on the server `TimeZone`.

### 4. Check the locks

Prisma applies each migration in one transaction, with no lock timeout. From `docs/production-operations.md`:

- Any `ALTER TABLE` on an existing table takes an **ACCESS EXCLUSIVE** lock. While it waits, every new read and write of that table queues behind it. `Event` and `RSVP` are the hot tables.
- A plain `CREATE INDEX` blocks writes to the table until the build finishes (about 2 seconds per million registrations for the large-event indexes).
- Adding a foreign key to an existing table briefly blocks writes to the referenced table.

For each statement, write down the lock it takes and add a row to the "Recent schema migrations" table in `docs/production-operations.md`. If an index is large, document a `CREATE INDEX CONCURRENTLY IF NOT EXISTS` pre-build, as that page does, and use `IF NOT EXISTS` in the migration so it skips the index when it already exists.

### 5. Apply locally and update code

```bash
npm run db:migrate      # applies the edited migration and regenerates the client
npm run db:status
```

Then update the code that reads and writes the new fields. Keep `select` objects explicit, and add new fields to DTOs only when they are meant to leave the server (see [Extend the APIs](/guides/extend-the-apis)).

### 6. Enum values: write the rollback note

The previous release's Prisma client **cannot read rows that use a new enum value**. From `docs/PRODUCTION_RELEASE.md`, "Rollback":

> The old release's Prisma client cannot read the new enum values, so once a `JUDGE` co-organiser grant or a `CREW` event-page section has been saved, the old public event pages answer 500 and its dashboards throw.

For every enum value you add to an existing enum, extend that section with:

- a `SELECT count(*)` that shows whether any row uses the value yet (the image-only rollback is safe only while it is 0)
- the minimum cleanup SQL that would let the previous release run again

`AGENTS.md` makes this mandatory: "record new enum values in the rollback notes of `docs/PRODUCTION_RELEASE.md`".

### 7. Add the schema to `db:verify`

`scripts/verify-production-schema.mjs` (`npm run db:verify`) checks that production has the tables, columns, constraints, indexes and triggers the app relies on. Add your new table, column, constraint or index name to the matching list. For example, the `Event` column list includes `"emailEntrantsOnResults", "emailSubmissionReceipts"`, and the constraint list includes `"RSVP_crew_shape"`.

### 8. Pin the migration in a test

`tests/unit/migration-safety.test.ts` reads migration files and asserts what they do and don't contain. Add a case for your migration:

```ts
it("adds the hackathon email switches as NOT NULL DEFAULT false columns without rewriting rows", () => {
  const sql = readFileSync(resolve(root, "prisma/migrations/20261028010000_hackathon_email_toggles/migration.sql"), "utf8");
  expect(sql).not.toMatch(/\bDROP\b/i);
  expect(sql).not.toMatch(/^\s*UPDATE\s/im);
  expect(sql).toContain('ALTER TABLE "Event" ADD COLUMN "emailEntrantsOnResults" BOOLEAN NOT NULL DEFAULT false;');
  expect(sql).toContain('ALTER TABLE "Event" ADD COLUMN "emailSubmissionReceipts" BOOLEAN NOT NULL DEFAULT false;');
  expect(sql.match(/ADD COLUMN/g)).toHaveLength(2);
});
```

If you added a CHECK or cascade that protects an invariant, also cover it against PostgreSQL. `tests/integration/schema-invariants.db.test.ts` holds the general database CHECKs; feature suites such as `saved-views.db.test.ts` cover their own CHECKs and cascades.

### 9. Check for drift

CI (`.github/workflows/quality.yml`) migrates a fresh database, runs `db:verify`, and then requires no drift:

```bash
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
```

Run the same command locally against your migrated development database.

::: warning
Do not run integration tests or `migrate diff` experiments against a non-disposable database. `TEST_DATABASE_URL` must point at `yuyu_test`, never `yuyu_dev` or production.
:::

## Checklist

- [ ] Change is additive: nullable or constant-default columns, new tables, new enums
- [ ] `migration.sql` starts with a comment explaining the change and whether it is purely additive
- [ ] Hand-written CHECKs are named `<Table>_<rule>`; CHECKs on existing tables use `NOT VALID` then `VALIDATE`
- [ ] Lock for each statement recorded; row added to "Recent schema migrations" in `docs/production-operations.md`
- [ ] Large indexes have a documented `CONCURRENTLY` pre-build and use `IF NOT EXISTS`
- [ ] New enum values on existing enums listed in the `docs/PRODUCTION_RELEASE.md` rollback notes, with a count query and cleanup SQL
- [ ] `scripts/verify-production-schema.mjs` lists the new tables, columns, constraints and indexes
- [ ] Case added to `tests/unit/migration-safety.test.ts`
- [ ] Integration coverage for new constraints and cascades
- [ ] `migrate diff --exit-code` reports no drift

## Verify

```bash
npm run db:status
npm run db:verify
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
npx vitest run tests/unit/migration-safety.test.ts
npx next typegen && npx tsc --noEmit
DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run db:deploy
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration
```

In production the migration runs once as a release job with `npm run db:deploy` (the Helm migration Job, when enabled), never at application start. See [Deployment](/reference/deployment).
