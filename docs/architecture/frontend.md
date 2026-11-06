# Frontend

Yuyu's UI is React 19 on the Next.js 16 App Router. Pages are Server Components that load data and check access on the server, and `"use client"` components are added only where the browser is needed: forms with pending state, dialogs, scanners, editors and the live ticket. Styling is Tailwind CSS 4 on top of `--yy-*` CSS custom properties, with Radix UI primitives and lucide icons wrapped in `components/ui`. The design brief (`docs/DESIGN.md`) is the reference for tokens, components and voice. The in-app user guide at `/help` is MDX in `content/help/`.

## Key files

| Path | Role |
| --- | --- |
| `app/layout.tsx` | Root layout: fonts, `await connection()` (CSP nonce), colour-mode cookie, `Providers`, `ChromeSwitch` |
| `app/styles/tokens.css` | Every design token as a `--yy-*` variable, light and dark |
| `app/globals.css` | Tailwind 4 `@theme inline` mapping tokens to utilities and the type scale |
| `components/ui/*` | Shared primitives: `Button`, `IconButton`, `Field`, `Input`, `Dropdown`, `Checkbox`, `Switch`, `Tabs`, `Dialog`, `ConfirmDialog`, `Menu`, `Table`, `Chip`, `Card`, `Callout`, `EmptyState`, `DateBlock`, `StatTile` and more |
| `components/brand/*` | `DotMark`, `DotLockup`, `DotLoader` and the dot-sign patterns |
| `components/chrome/*` | `AppShell`, `ChromeSwitch`, `SiteHeader`, `SiteFooter`, `EventContextHeader`, `ColorModeToggle` |
| `components/event-dashboard/*` | Event dashboard tabs and panels |
| `components/feedback/ToastProvider.tsx` | `useToast` for mutation feedback |
| `lib/cn.ts` | `cn(...)` class merging |
| `lib/theme/accent.ts` | `getAccentTokens`, `accentStyle`: contrast-checked organiser accent colours |
| `lib/format/datetime.ts`, `lib/format/intlCache.ts` | The one date formatter; cached `Intl.DateTimeFormat` instances |
| `lib/colorMode.ts`, `lib/sidebar.ts` | Colour-mode and sidebar cookies |
| `content/help/`, `lib/help/*`, `components/help/*` | Help centre |

## How it works

### Server first

- Pages and layouts are async Server Components. They call guards (`lib/dashboardGuards.ts`) and loaders (`lib/eventDashboard/*`, `lib/dashboardHome.ts`, and others) and pass plain props down.
- The event dashboard loads its context once with `loadEventDashboard(orgSlug, eventId)`. That includes the `permissions` capability object, which decides which controls render ([Permissions](/architecture/permissions#capability-object-ui-parity)).
- Client components call Server Actions directly and handle the `ActionResult`. The pattern from `components/event-dashboard/overview/WaitingForYou.tsx`:

```tsx
const result = await (decision === "approve" ? approveRsvp : rejectRsvp)({ organisationSlug, rsvpId: request.id, eventId });
setBusyId(null);
if (!result.ok) {
  showToast(result.error, "error");
  return;
}
showToast(success, "success");
router.refresh();
```

It runs inside `useTransition`, with a busy state per row, and the result is reported through `useToast`. Show `result.error` as is, because it is written to be UI-safe.

### Chrome and the dashboard shell

`ChromeSwitch` (client) picks the frame from the path:

- Yuyu's own pages (`/about`, `/discover`, `/help`, capability pages such as `/ticket/…`) get `SiteHeader` and `SiteFooter`.
- `/dashboard`, `/account`, `/super-admin`, `/embed/` and `/login` render their own chrome.
- Auth flows get a minimal header.

`app/dashboard/layout.tsx` requires a session, loads `getAppShellData(userId)` (`lib/appShell.ts`), reads the `yy-sidebar` cookie (`isSidebarCollapsed`), and renders `AppShell`. The sidebar collapse state is in a cookie so the server renders the right width with no flash. Super-admin uses its own top bar (`components/super-admin/SuperAdminTopBar.tsx`) with no sidebar.

### Design tokens and theming

- `app/styles/tokens.css` declares `--yy-*` variables such as `--yy-bg-canvas`, `--yy-border`, `--yy-text`, `--yy-text-muted`, and the brand and status colours. Light values sit under `:root`. Dark values sit under `:root[data-color-mode="dark"]` and `.yy-dark-band`, and under `prefers-color-scheme: dark` when no mode is saved.
- `app/globals.css` maps them in `@theme inline` (for example `--color-canvas: var(--yy-bg-canvas)`), so components use classes like `bg-canvas`, and defines the type scale (`text-display-*`, `text-h*`, `text-body*`, `text-label`, `text-caption`).
- **Colour mode:** the root layout reads the `yuyu.color-mode` cookie (`COLOR_MODE_COOKIE`) and sets `data-color-mode` on `<html>`. With no cookie, the attribute is omitted and the OS preference applies.
- **Event accent:** event pages compute `--yy-accent`, `--yy-accent-soft`, `--yy-on-accent` and `--yy-accent-text` with `getAccentTokens(hex, scheme)` (WCAG contrast checks, validated hex) and set them as inline style variables on the page root. Yuyu's own chrome never uses an event accent.
- **Fonts** are self-hosted through Fontsource (Bricolage Grotesque, Figtree, JetBrains Mono), imported in `app/layout.tsx`. There is no font CDN, which keeps the CSP simple.

### Dates and numbers

All UI dates go through `lib/format/datetime.ts` (`formatDateBlock`, `formatDayLong`, `formatTime`, `formatTimeRange`, `formatRelativeDay`, `formatRelativeTime` and others). These always take the event's IANA `timeZone`. Formatters are built through `cachedDateTimeFormat` in `lib/format/intlCache.ts` and never per row, because large-event dashboards render tens of thousands of dates. Don't parse or format `Date` ad hoc in components.

### Help centre

- `content/help/manifest.ts` lists sections, article order, titles, summaries and each section's `access` (`public`, `org-admin`, `super-admin`). Articles are `content/help/<section>/<article>.mdx`.
- `lib/help/access.ts` resolves the viewer's audiences once per request. `lib/help/content.ts` finds articles only through the manifest, so unknown and restricted paths are real 404s.
- `/help/[...slug]` renders the MDX with `@next/mdx` and the components in `components/help/mdx.tsx` (`Steps`, `Callout`, `Screenshot`, `Kbd`). `next.config.ts` traces `content/help/**/*.mdx` into the standalone build, because search reads article text at runtime.
- Search runs in the browser (`components/help/HelpSearch.tsx`) over `GET /api/help/search-index`. It returns only the viewer's readable articles and is never cached.
- Screenshots in `public/help/` are captured from fictional seed data by `npm run help:screenshots` (`tests/help-screenshots/`). Run it against a disposable database only.

## Invariants

- **Server Components by default.** Add `"use client"` only for state, effects, handlers or browser APIs. Never make permission decisions on the client.
- **No hard-coded colours.** Use tokens and Tailwind theme classes (`docs/DESIGN.md`, section 2).
- **Use `components/ui` primitives** for controls, so labels, focus rings and keyboard behaviour stay consistent. `IconButton` requires a `label` that becomes the accessible name (checked by `tests/unit/frontend-boundaries.test.ts`).
- **Accessible async feedback.** Mutations show pending state and a toast or inline error. Live check-in results use `aria-live`.
- **Restart-safe animations.** With framer-motion's `useAnimate`, give each effect run its own local `current` flag, clear it in cleanup and check it after every await. Never use a one-shot "started" ref, because React dev mode double-invokes effects.
- **No root `loading.tsx`**, and dashboard loading screens only below a guard layout ([Architecture overview](/architecture/overview#rendering-model)).
- **No external scripts, fonts or image hosts.** The CSP is nonce-based with `'strict-dynamic'`.
- **Verify CSS changes with a clean build.** A stale `.next/cache` can serve old CSS.
- **Help articles stay accurate.** When a feature changes, update its MDX. Public articles never name files, fields, environment variables or routes (`content/help/README.md`).

## Making changes

- **A new dashboard control:** add or reuse a flag in `eventCapabilities`, render the control only when the flag is true, call the Server Action, and handle `ActionResult` with `useToast` and `router.refresh()`. The server check must exist independently.
- **A new primitive:** check `components/ui` and the shared list in `docs/DESIGN.md` §9.3 first. If it is really new, build it on Radix with Tailwind token classes and `cn()`.
- **A new token:** add the light and dark values to `app/styles/tokens.css`, then map it in `@theme inline` in `app/globals.css`.
- **A new help article:** add the manifest entry, create the `.mdx` file, then run `npx vitest run tests/unit/help-content.test.ts`. That test checks files, links, anchors and screenshot names.

## Testing

| What | File |
| --- | --- |
| Frontend boundaries (bounded queries, accessible names, error boundaries) | `tests/unit/frontend-boundaries.test.ts` |
| Accent and colour maths | `tests/unit/accent-tokens.test.ts`, `tests/unit/color-space.test.ts` |
| Formatters | `tests/unit/format-datetime.test.ts`, `tests/unit/intl-formatter-cache.test.ts` |
| Chrome selection | `tests/unit/chrome-switch.test.ts` |
| Help centre | `tests/unit/help-content.test.ts`, `tests/unit/help-access.test.ts`, `tests/unit/help-screens-guard.test.ts` |
| Browser flows | `tests/e2e/` (Playwright) |

```bash
npm run lint
npm run test:unit
npm run build          # clean build to verify CSS
npm run test:e2e
```

## Further reading

- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md), [ARCHITECTURE.md, "Help centre"](https://github.com/twilighty-abhi/yuyu/blob/main/docs/ARCHITECTURE.md), [content/help/README.md](https://github.com/twilighty-abhi/yuyu/blob/main/content/help/README.md)
- [Architecture overview](/architecture/overview), [Permissions](/architecture/permissions), [Add a page or route](/guides/add-a-page-or-route), [Testing](/reference/testing)
