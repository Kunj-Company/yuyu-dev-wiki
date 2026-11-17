# Typography and layout

This page covers the three typefaces, the named type-scale classes, spacing, breakpoints, and the page shells that frame every route. For colour, radius and shadow values see [Design tokens](/design/tokens).

## Key files

| Path | Role |
| --- | --- |
| `app/layout.tsx` | Imports the self-hosted fonts, sets `data-color-mode`, renders `Providers` and `ChromeSwitch` |
| `app/globals.css` | `--font-*` theme values, base styles and the `text-*` type scale |
| `lib/cn.ts` | Registers the scale classes with `tailwind-merge` |
| `components/chrome/ChromeSwitch.tsx` | Chooses site, auth or own chrome from the path |
| `components/chrome/AppShell.tsx` | Dashboard sidebar, mobile top bar and main column |
| `components/chrome/OrganiserChrome.tsx` | Organiser-branded header and footer for event-context pages |
| `components/chrome/SiteHeader.tsx`, `SiteFooter.tsx`, `EventContextHeader.tsx` | Public headers and footers |
| `components/ui/display.tsx` | `PageHeader`, `SectionHeading`, `SettingsRow` |

## Fonts

| Role | Family | Tailwind class | Fallback |
| --- | --- | --- | --- |
| Display and headings | Bricolage Grotesque (variable, with optical size), weight 800 in use | `font-display` | `ui-sans-serif, system-ui, sans-serif` |
| Body and UI | Figtree (variable weight) | `font-sans` | `system-ui, sans-serif` |
| Code, IDs, API | JetBrains Mono 400 and 500 | `font-mono` | `ui-monospace, monospace` |

`app/layout.tsx` imports `@fontsource-variable/bricolage-grotesque/opsz.css`, `@fontsource-variable/figtree/wght.css` and `@fontsource/jetbrains-mono` at 400 and 500. Fonts are self-hosted, so there is no font CDN at runtime and the CSP stays simple. Don't use Inter, Roboto or Arial.

Base styles in `@layer base`:

- `body` is Figtree 16px with line height 1.6 and the `--yy-bg-canvas` and `--yy-text` colours.
- `h1` to `h4` are Bricolage Grotesque, weight 800.
- `code`, `kbd`, `samp` and `pre` use the mono family.
- `::selection` uses `--yy-highlight-peach`.

## Type scale

The scale is a set of named component classes in `app/globals.css`. Use them instead of ad hoc `text-[..px]` values. Sizes switch at the 640px (`sm`) breakpoint.

| Class | Family and weight | Mobile size | From 640px | Line height | Tracking | Used for |
| --- | --- | --- | --- | --- | --- | --- |
| `text-display-xl` | Bricolage 800 | 44px | 76px | 0.98 | -0.035em | Yuyu home hero |
| `text-display-l` | Bricolage 800 | 40px | 68px | 1 | -0.03em | Event title, About and Features hero |
| `text-display-m` | Bricolage 800 | 36px | 54px | 1 | -0.03em | Page titles on public pages |
| `text-h1` | Bricolage 800 | 30px | 38px | 1.1 | -0.02em | Dashboard page title (`PageHeader`) |
| `text-h2` | Bricolage 800 | 24px | 30px | 1.15 | -0.01em | Event page sections |
| `text-h3` | Bricolage 800 | 20px | 24px | 1.2 | none | Card and dialog titles |
| `text-h4` | Bricolage 800 | 18px | 20px | 1.25 | none | Dashboard section titles (`SectionHeading`) |
| `text-title` | Figtree 700 | 16px | 16px | 1.35 | none | Card and sub-section titles inside the app (`CardHeader`) |
| `text-body-l` | Figtree | 17px | 19px | 1.6 | none | Lead paragraphs |
| `text-body` | Figtree | 16px | 16px | 1.6 | none | Default public copy |
| `text-body-ui` | Figtree | 15px | 15px | 1.5 | none | Dashboard default |
| `text-label` | Figtree 600 | 14px | 14px | 1.4 | none | Form labels, table headers, menu group names |
| `text-caption` | Figtree | 13px | 13px | 1.45 | none | Helper text, timestamps |
| `text-overline` | Figtree 700, uppercase | 12px | 13px | 1.3 | 0.06em | "VENUE", "ON THIS PAGE" |
| `text-mono` | JetBrains Mono | 13px | 13px | 1.5 | none | Codes, endpoints, scopes |

Rules:

- Never track tighter than -0.035em. Letters must not touch.
- Keep body copy to about 640px wide (`PageHeader` caps its description at `max-w-[640px]`).
- Inputs use 16px text (`text-base`), which stops iOS from zooming on focus.
- Display type is for event titles, the ticket, success states and Yuyu's marketing pages. Dashboards use `text-h1` at most.
- The highlighter under a display word on Yuyu's own pages is `.yy-highlight`, built from `--yy-highlight-peach`.
- Organiser-written rich text renders inside `.yy-prose`, which styles sanitised HTML with the same type and uses `--yy-accent-text` for links.

```tsx
<div className="min-w-0">
  {kicker ? <p className="mb-1.5 text-body-ui text-ink-muted">{kicker}</p> : null}
  <h1 className="break-words text-h1 text-ink">{title}</h1>
  {description ? <p className="mt-2 max-w-[640px] text-body-ui text-ink-secondary">{description}</p> : null}
</div>
```

This is `PageHeader` in `components/ui/display.tsx`: an optional muted kicker, an `h1`, and a one-line description.

## Spacing

Spacing is Tailwind's 4px base. DESIGN.md restricts the scale to `2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80`.

| Context | Value |
| --- | --- |
| Inline gaps (icon and label, chips) | 6 to 10px |
| Form field gap | 12 to 14px (`Field` uses `gap-1.5` between label, control and helper; forms use `gap-4` between fields) |
| Card padding | 16 to 24px. Dashboard 16 to 20px, public 24 to 32px (`Card` `padding` is `sm` 16, `md` 20, `lg` 24 rising to 32 from 640px) |
| Section gap, dashboard | 24px |
| Section gap, event page | 40 to 48px |
| Section gap, marketing | 64 to 80px |
| Page side gutter | 24px desktop, 16px mobile |
| Content max width | 1160px public. Dashboard is fluid with forms at 900px or less |

## Breakpoints and grid

Mobile first, with three breakpoints defined in the theme:

| Prefix | Min width | Typical change |
| --- | --- | --- |
| `sm` | 640px | Type scale steps up. Stacked actions go inline. Side gutter becomes 24px |
| `md` | 960px | Sidebar appears, two-column layouts open |
| `lg` | 1200px | Three-column editors and sticky previews |

Note that `md` is 960px here, not Tailwind's default 768px. Two-column layouts (content plus a side card) stack below `md`. On event pages the registration card moves below the title block on mobile, with a sticky bottom Register bar once the card scrolls away.

Everything must work at 360px wide with no horizontal page scroll. Tables scroll inside their own box (`Table` wraps itself in an `overflow-x-auto` region). Tab rows scroll sideways with faded arrow hints.

Layouts are plain CSS grid and flex with Tailwind utilities. There is no layout primitive library, so write `grid gap-4 sm:grid-cols-2` directly. Examples in the code:

- Settings pages use `SettingsRow`: `md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]`, a label column and a field column.
- Detail lists use `DetailList`: `sm:grid-cols-[max-content_minmax(0,1fr)]`.
- The badge designer uses `300px | 1fr | 272px` at `lg`.

## Page shells

`ChromeSwitch` (a client component using `usePathname`) picks the frame for a route without moving route files. `chromeFor(pathname)` returns one of three kinds.

| Kind | Paths | Frame |
| --- | --- | --- |
| `site` | `/`, `/about`, `/features`, `/discover`, `/search`, `/help`, `/privacy`, `/terms`, `/join/…`, `/ticket/…`, `/team/…`, `/submit/…`, `/attend/…`, `/crew/…` | `SiteHeader`, `<main id="main-content">`, `SiteFooter` |
| `auth` | `/reset-password`, `/verify-email`, `/super-admin-mfa` | Logo-only header and a centred `<main>` |
| `own` | `/dashboard`, `/account`, `/super-admin`, `/embed/…`, `/login`, and everything else (organiser context) | The route's own layout renders the chrome |

Details of the shells:

- **Site pages.** Full-bleed pages (`/`, `/about`, `/features`, `/discover`) lay out their own sections. Other site pages are wrapped in `mx-auto w-full max-w-[1160px] px-4 py-8 sm:px-6 sm:py-10`.
- **Organiser context** (`/:org`, `/:org/:event`, and sub-pages). `OrganiserChrome` renders `EventContextHeader` (the organiser's logo and name, not Yuyu's) and `EventFooter` around `max-w-[1160px] px-4 py-6 sm:px-6 sm:py-8`. Venue check-in kiosks (`/:org/:event/check-in`) get a bare `<main>` with no chrome.
- **Dashboard.** `app/dashboard/layout.tsx` requires a session, then renders `AppShell`.
- **Every shell** gets a skip link (`.skip-link`, "Skip to main content"), rendered once by `ChromeSwitch` for all three chrome kinds. `AppShell` and `OrganiserChrome` render the `<main id="main-content" tabIndex={-1}>` target. A unit test pins this.

### AppShell

| Part | Behaviour |
| --- | --- |
| Sidebar | `md` and up. Sticky, full height, `bg-subtle`, right border. 224px wide, or a 68px icon rail when collapsed. Collapse state is in the `yy-sidebar` cookie so the server renders the right width |
| Mobile top bar | Below `md`. Sticky 56px bar (`h-14`) with a menu button that opens a left sheet of `min(280px, 86vw)` |
| Main column | `min-w-0 flex-1`, padding `px-4 py-6`, then `sm:px-6`, then `md:px-10 md:py-9`. Content sits in `mx-auto w-full max-w-[1200px]` |
| Active nav item | Canvas fill with a border, weight 600, `aria-current="page"` |

The sidebar has two modes: outside an organisation (Home, the organisations list, New organisation) and inside one (the organisation switcher, Events, Series, Members, Settings). Super-admin pages do not use `AppShell`. They have a sticky top bar (`SuperAdminTopBar`) with pill links to each section.

### Dashboard page layout

Dashboard pages follow a fixed rhythm:

1. `PageHeader`: optional muted kicker, `text-h1`, a one-line description, and actions on the right (stacking below `sm`).
2. Tabs where the page has sections (see [UI patterns](/design/patterns#dashboard-tabs)).
3. Sections separated by 24px, each with a `SectionHeading` (`text-h4`) and `Card` or `Table` content.
4. Settings pages use `SettingsRow` entries separated by dividers, with Save and Discard at the bottom right.

The event dashboard has eight tabs (Overview, Guests, Event page, Emails, Check-in, Feedback, Analytics, Settings), plus a ninth, Judging, between Check-in and Feedback on events that use hackathon judging.

## Invariants

- **Use the scale classes**, not raw pixel sizes, so mobile and desktop sizes stay in step.
- **Register new `text-*` scale classes in `lib/cn.ts`** or `tailwind-merge` will drop one of two conflicting classes.
- **No third-party font hosts.** Add fonts through Fontsource in `app/layout.tsx`.
- **Every page has one `main-content` landmark** reachable from the skip link.
- **360px, no horizontal page scroll.** Wide content scrolls inside its own container.

## Further reading

- [Design tokens](/design/tokens), [Components](/design/components), [UI patterns](/design/patterns), [Accessibility](/design/accessibility)
- [Frontend](/architecture/frontend#chrome-and-the-dashboard-shell)
- [Add a page or route](/guides/add-a-page-or-route)
- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md), sections 2.6, 2.7, 2.11 and 4.13
