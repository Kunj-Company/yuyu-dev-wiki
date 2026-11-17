# Fork and customise

Forking is the right choice when you want Yuyu under your own name, with changes the maintainers will not take, or with a different set of defaults. This page covers the licence position first, then what to rebrand and where it lives, how configuration works, how to keep a fork in sync, and which parts of the code you must not weaken.

## Check the licence first

::: warning There is no licence file
The repository has no `LICENSE` file. The Yuyu `README.md` ends with: "No license file is currently included. Do not redistribute the project as open source until a license is added." The app footer and `lib/openSource.ts` call the repository open source, but without a licence no one has been granted a right to copy, modify or redistribute the code beyond what GitHub's own terms allow for a public repository. This is not legal advice. Ask the maintainers, in [GitHub Discussions](https://github.com/twilighty-abhi/yuyu/discussions), for explicit permission before you run a public fork, redistribute it, or ship a derived product.
:::

`CONTRIBUTING.md` adds a product boundary that a fork should keep or consciously give up: Yuyu is for **free** events, and "contributions that add payments, ticket sales, ads or third-party trackers won't be accepted". The privacy claims in the README and `docs/SECURITY.md` (no advertising trackers, self-hosted fonts, no third-party font CDN at runtime) are things your users will assume of a Yuyu-derived product.

## Fork and run it

```bash
gh repo fork twilighty-abhi/yuyu --clone
cd yuyu
git remote -v        # origin = your fork, upstream = twilighty-abhi/yuyu
```

Then follow [Local setup](/start/local-setup) and the [Development workflow](/start/workflow). A fork keeps the same branch rules: feature branches from `main`, pull requests, merge commits. Deploying is covered in [Deployment](/reference/deployment) and `docs/DEPLOYMENT_DOCKER.md`.

## What to rebrand

Yuyu's own identity is the **dot sign**: a 5 by 5 grid of round dots drawing a "Y" in marigold `#FFB547`, with the lowercase wordmark in Bricolage Grotesque. It appears only on Yuyu's own surfaces. Organiser logos, covers, certificates and event accent colours are never restyled with it, and that stays true after a rebrand. See [Brand and dot sign](/design/brand).

| What | Where | Notes |
| --- | --- | --- |
| Logo and dot sign | `components/brand/` (`DotMark`, `DotLockup`, `DotFace`, `DotIcon`, `DotLoader`, `patterns.ts`) | The mark pattern lives in `patterns.ts`. Replace the pattern and lockups together. The face moods are tied to meaning (Sleepy for empty states, Cheering for "You're in") |
| SVG masters and raster outputs | `public/brand/` | Edit the SVG masters, then `npm run brand:generate` rebuilds the favicon, PWA icons, apple-touch icon, default social card and `email-lockup.png`. Commit the masters and the outputs. The script is `scripts/generate-brand-assets.ts` and needs Node 22.18 or newer |
| Colour tokens | `app/styles/tokens.css` (`--yy-brand-marigold`, `--yy-brand-marigold-deep`, `--yy-brand-dot-base`, `--yy-brand-dot-off`, and the neutrals) | `app/globals.css` maps them to Tailwind in `@theme inline`. Change the values, not the component classes. Check contrast in light and dark mode |
| Default event accent | `--yy-accent` and its siblings in `app/styles/tokens.css` | Organisers override it per event with `lib/theme/accent.ts` (`getAccentTokens`). The default is only the fallback |
| Fonts | `app/layout.tsx` imports `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/figtree` and `@fontsource/jetbrains-mono` | Keep fonts self-hosted. The report PDF embeds static instances from `public/brand/fonts/`, so replace those too (`lib/eventReportPdf.ts`) |
| Site name, titles, PWA | `app/layout.tsx` (title, `applicationName`, `siteName`, Open Graph image) and `app/manifest.ts` | Both hard-code "Yuyu" |
| Instance name shown to apps | `app/api/mobile/v1/auth/config/route.ts` | `instanceName` is the literal `"Yuyu"`. There is no setting for it, so a rebranded fork must edit it for the mobile apps to show your name |
| Sender name | `DEFAULT_EMAIL_FROM` in `lib/instanceSettings.ts` (`Yuyu Events <noreply@localhost>`), or set the sender in **Super admin → Settings** or `EMAIL_FROM` | The saved value wins, then `EMAIL_FROM`, then the default |
| Email design | `lib/email/`, `public/brand/email-lockup.png` | Emails build the lockup URL from `NEXT_PUBLIC_BASE_URL` with `alt="Yuyu"` |
| Embed credit | `EmbedCredit` in `components/chrome/SiteFooter.tsx` | The text is "Free event, powered by Yuyu" |
| Footer, project links | `components/chrome/SiteFooter.tsx`, `lib/openSource.ts` (`GITHUB_REPO` and the issue, discussion and contributing URLs) | The footer also links the maintainers' hosting company. Remove or replace it |
| Marketing and legal pages | `app/about/`, `app/features/`, `app/privacy/`, `app/terms/`, `components/landing/`, `components/legal/` | These are the maintainers' words and legal terms. Rewrite them. Do not publish the originals under your name |
| Help content | `content/help/` (`manifest.ts`, MDX articles) | About 126 files under `app`, `components`, `lib` and `content` mention "Yuyu" in total, so search before you ship. Follow `content/help/README.md`: British English, no file names in public sections, and run `npx vitest run tests/unit/help-content.test.ts` after edits |
| Mobile app identity | The `yuyu-android` and `yuyu-ios` repositories | Package `com.twilighty.yuyu`, the default App Links host `yuyu.idliapps.com` and the iOS `bundleIdPrefix` are the maintainers'. See [Android and iOS apps](/build/mobile-apps) |

Search for hard-coded strings with `grep -rn "Yuyu" app components lib content`, and expect some unit tests (for example email construction) to assert the current wording. Update those tests with the copy.

## Configuration

Configuration has three layers, in this order of precedence for the settings that have more than one:

1. **Environment variables.** Names and formats are in `.env.example` and `lib/env.ts`. Production needs TLS-backed PostgreSQL, `rediss://` Redis, private S3 storage, stable encryption keys and matching HTTPS `AUTH_URL` and `NEXT_PUBLIC_BASE_URL`. `npm run production:check` validates them. See [Configuration](/reference/configuration).
2. **Instance settings in the database.** SMTP, Google sign-in, backup posture and the operational alerts webhook are edited in **Super admin → Settings**. They override the legacy environment fallbacks, and secrets are encrypted at rest and write-only.
3. **Code defaults.** Constants such as rate-limit windows (`lib/rateLimit.ts`) and token lifetimes (`lib/mobile/tokens.ts`) are not configurable. Changing them is a code change, with the security review that implies.

Things a rebranded fork usually sets: `NEXT_PUBLIC_BASE_URL` and `AUTH_URL` (build-visible, so a change needs a rebuild), `SUPER_ADMIN_EMAIL`, `ALLOWED_EMBED_ORIGINS` for your own sites, `GOOGLE_MOBILE_CLIENT_IDS`, `ANDROID_APP_SHA256_CERT_FINGERPRINTS` and `APPLE_APP_IDS` if you ship your own mobile apps. To add a setting of your own, follow [Add configuration](/guides/add-config).

## Keep in sync with upstream

```bash
git fetch upstream
git switch -c sync/upstream-$(date +%Y%m%d) main
git merge upstream/main          # merge, as upstream itself does
npm install && npx prisma generate
npm run db:status                # new migrations pending?
npm run lint && npx next typegen && npx tsc --noEmit && npm run test:unit
```

What to expect, from the repository's own rules:

- **Keep your changes in few, well-named places.** Edit the files in the rebrand table, add new files for new features, and avoid reformatting upstream files. Merge conflicts then stay in the copy and token files.
- **Migrations are ordered by timestamp and are additive.** Upstream names them `YYYYMMDDHHMMSS_name` under `prisma/migrations/`. If your fork adds migrations, give them timestamps later than upstream's newest, and expect interleaving when upstream adds more. Applying upstream migrations is a separate release step (`npm run db:deploy`), never application start-up. Read the rollback notes in `docs/PRODUCTION_RELEASE.md` before you apply new enum values: the previous release cannot read rows that use them.
- **Releases are not tagged.** `CHANGELOG.md` names releases by date and `package.json` stays at `0.1.0`, so sync against commits on `main`. Read the changelog's upgrade notes and `docs/PRODUCTION_RELEASE.md` first.
- **Upstream's docs move with the code.** Mobile contract changes arrive in `docs/mobile-api.openapi.yaml` and `docs/mobile-api-fixtures/`. If you run your own mobile apps, refresh their copies at the same time.
- **Re-run the drift check** after merging migrations: `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code` against a disposable, freshly migrated database.

## What not to change

These are the invariants in `AGENTS.md`, `docs/SECURITY.md` and [Security checklist](/reference/security-checklist). A rebrand needs none of them to change. If your fork weakens one, you own the consequence for every organiser on your instance.

| Invariant | Why it matters |
| --- | --- |
| `Organisation` is the tenant boundary. Every dashboard read and write resolves the organisation server-side and checks role. UI visibility is never authorisation | Cross-tenant data leaks |
| Machine API credentials resolve the tenant only from the credential, use explicit scopes, strict DTOs and digest-only storage | A caller-chosen tenant is a data breach |
| Mobile sessions are user identities: token digests only, rotating refresh tokens with reuse revocation, `sessionVersion` binding, all mutations through `lib/core/*` | Stolen or stale tokens, and drifting rules between web and apps |
| Super-admin pages each call `await requireSuperAdminMfa()`, and instance secrets stay write-only and encrypted with `MFA_ENCRYPTION_KEY` material | Enforced by `tests/unit/super-admin-page-guards.test.ts` |
| Event publication sets `Event.status` and `EventPage.isPublished` together in one transaction | Unpublished events must never be reachable |
| Capacity, waitlist and duplicate-RSVP logic stays in transactions with database constraints behind it | Over-booking races |
| Ticket, certificate, invitation, reset, MFA, scheduler and readiness values are bearer secrets and never appear in logs, audit metadata or analytics | Link-based capabilities |
| Production keeps CSP nonces, security headers, trusted proxy-IP handling, Server Action origin checks, Redis fail-closed limits and TLS checks | See [Reverse proxy and TLS](/deploy/reverse-proxy) |
| Webhook targets stay SSRF-checked at save and at delivery, with the pinned lookup. `WEBHOOKS_ALLOW_PRIVATE_TARGETS` is never set on a deployed instance | Server-side request forgery |
| Uploads go through validation, decode, resize, metadata stripping and WebP re-encoding. Storage stays private | Malicious images, location leaks |
| Email goes through the outbox. Request paths never wait on SMTP | Reliability and bulk-send limits |
| Organiser logos, covers, certificates and accents are not restyled with the brand | `docs/DESIGN.md` §2.3 |

Run the stronger checks in [Testing](/reference/testing) after any change that touches authorisation, mutations, public routes, the APIs or deployment.

## Further reading

- [Ways to build on Yuyu](/build/overview)
- [Brand and dot sign](/design/brand)
- [Configuration](/reference/configuration)
- [Deployment](/reference/deployment)
- [Contributing upstream](/build/contributing)
- [README.md](https://github.com/twilighty-abhi/yuyu/blob/main/README.md)
- [docs/DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md)
