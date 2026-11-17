# Brand and dot sign

Yuyu's own identity is the **dot sign**: a 5 by 5 grid of round dots that draws a "Y". Everything in `components/brand/*` renders dot patterns, so the logo, faces, icons and loader are all the same primitive with different patterns. The dot sign belongs to Yuyu's own surfaces only. Organiser logos, covers, certificates and event accent colours are never restyled with it.

## Key files

| Path | Role |
| --- | --- |
| `components/brand/DotGrid.tsx` | The primitive: a CSS grid of perfect circles from a pattern string. Also exports `DOT_COLORS` |
| `components/brand/patterns.ts` | Pattern strings (`MARK`, faces, icons), `FACE_MOODS`, `ICON_NAMES`, `parsePattern` |
| `components/brand/DotMark.tsx` | The mark, with size and variant rules |
| `components/brand/DotLockup.tsx` | Mark plus the "yuyu" wordmark |
| `components/brand/DotFace.tsx` | Ten moods on a 7 by 7 grid, with hover motion |
| `components/brand/DotIcon.tsx` | Thirteen 7 by 7 spot icons |
| `components/brand/DotLoader.tsx` | `DotLoader` and `PageLoader` |
| `public/brand/` | Hand-written SVG masters and generated PNGs |
| `scripts/generate-brand-assets.ts` | `npm run brand:generate` |
| `tests/unit/brand-dot-grid.test.ts` | Pins the patterns, sizes and token use |

## Patterns

`patterns.ts` describes every drawing as a string. Rows are separated by `|`, and each character is a cell:

| Letter | Meaning | Default colour (`DOT_COLORS`) |
| --- | --- | --- |
| `X` | Lit dot | `var(--yy-brand-marigold)` |
| `O` | Base dot, or ink detail | `var(--yy-brand-dot-base)` |
| `.` | Soft (unlit) dot | `var(--yy-brand-dot-off)` |
| `D` | Deep marigold | `var(--yy-brand-marigold-deep)` |
| `W` | White | `#FFFFFF` |
| `m` | Soft dot on marigold | `#F0A537` |
| space | No dot | transparent |

The mark itself, rows top to bottom:

```
X...X
.X.X.
..X..
..X..
..O..
```

That is six marigold dots and one ink base dot, the foot of the Y. `MARK_BRIGHT` is the same drawing with the soft dots removed (shown under 48px). `MARK_ON_MARIGOLD` is an ink Y on a marigold background, with a white base dot. `DOT_WORDMARK` spells "YUYU" in dots for posters, merch and stage screens, and is not for UI headers.

`parsePattern(pattern)` splits a pattern into equal-width rows, padding short rows with spaces.

## DotGrid

The primitive. Every other brand component calls it.

| Prop | Notes |
| --- | --- |
| `pattern` | Pattern string |
| `dot` | Dot diameter in px |
| `gap` | Defaults to a quarter of a dot |
| `colors` | Letter-to-colour overrides, merged over `DOT_COLORS` |
| `label` | When set, the grid is `role="img"` with that accessible name. Otherwise it is `aria-hidden` |
| `cellClassName`, `cellStyle` | Per-cell hooks (used by `DotFace` for hover motion) |
| `style` | Only for surfaces without the app stylesheet, such as `global-error` |

Display stays in the class, never inline, so callers can write `hidden md:inline-grid`.

## DotMark

```tsx
<DotMark size={32} variant="auto" label="Yuyu" />
```

| Prop | Values | Notes |
| --- | --- | --- |
| `size` | Number, default 32 | Clamped to a minimum of `DOT_MARK_MIN_SIZE` (16px) |
| `variant` | `auto` (default), `full`, `bright`, `onMarigold`, `mono` | |
| `label` | String, default "Yuyu", or `null` | Pass `null` when a visible wordmark already names the brand |

Behaviour:

- `auto` draws the full grid (lit and soft dots) at 48px and above, and the bright dots only below 48px.
- Bright dots under 32px switch to `--yy-brand-marigold-small`: deep marigold on light backgrounds, standard marigold on dark. This keeps them visible on white.
- `mono` draws in `currentColor` for both lit and base dots. It uses the bright pattern.
- `onMarigold` draws the ink-on-marigold pattern.

Rules from the brand brief:

- Leave one dot step of clear space around the mark.
- Never render the mark smaller than 16px.
- Marigold is never used for text.
- Don't use square dots, rotation, other hues, filled soft dots, outlines, shadows or gradients. A unit test checks the mark contains no gradients and uses 25 round cells.

## DotLockup

The mark plus "yuyu" in Bricolage Grotesque 800, tracking -3%, in ink. The wordmark is real text in the self-hosted font, never inside an SVG.

| Prop | Values |
| --- | --- |
| `layout` | `horizontal` (headers), `stacked` (square spaces), `tagline` (marketing, adds "Free events, run by communities") |
| `size` | `sm` (mark 36, text 26), `md` (mark 36, text 24, footer), `lg` (mark 60, text 54). Ignored for `stacked` and `tagline`, which have fixed sizes |
| `label` | Default "Yuyu". The lockup is one image with that name. `null` removes the role |

The site header and app shell use `horizontal` and `sm`. When the sidebar is collapsed, the app shell shows the dot mark alone.

## DotFace

Ten moods on a 7 by 7 grid. Faces carry meaning, not decoration, so choose by what the moment says.

| Mood | Meaning |
| --- | --- |
| `happy` | Hello, greeting |
| `cheering` | "You're in" |
| `wink` | Checked in |
| `love` | Feedback |
| `done` | All set |
| `waiting` | Waitlist |
| `surprised` | Event full |
| `thinking` | Loading |
| `sleepy` | Empty states |
| `sad` | Errors and not-found |

| Prop | Notes |
| --- | --- |
| `mood` | One of `FACE_MOODS` |
| `size` | Overall width in px, default 136. Dot size is `size / 8.5` |
| `label` | Accessible name. Faces are decorative (`aria-hidden`) without it |
| `colors` | Letter overrides |
| `hover` | Default `true`. Pass `false` where a face must stay still |

With `hover`, hovering the face or any `.group` ancestor ripples the dots out from the centre, blinks the eyes (only moods with eyes in the top rows blink) and lifts the face 4px with a -4 degree tilt. The CSS is `.yy-face` in `globals.css`. It applies only with `(hover: hover)` and no reduced-motion preference.

The exact timings (a 560ms ripple with a 45ms step per grid distance from the centre, a 900ms blink, a 320ms springy lift), a replay button for every face, the group-card behaviour and a downloadable animated SVG are in the gallery's [Animated faces](/library/index.html#/foundations/animated-faces) page.

Faces are always live `DotFace` grids, never images. `EmptyState` accepts a `mood`:

```tsx
<EmptyState mood="sleepy" title="No guests yet.">
  {/* one line of explanation and a next step */}
</EmptyState>
```

From `components/event-dashboard/panels/GuestsPeople.tsx`. The brief says the public organiser surfaces (the organisation page, the event schedule) don't show faces. Keep the existing words beside a face.

## DotIcon

Thirteen product spot icons on a 7 by 7 grid: `date`, `venue`, `guests`, `time`, `speaker`, `check-in`, `feedback`, `certificate`, `reminder`, `done`, `page`, `lock`, `code`. Ink dots follow the theme and marigold marks the highlight.

```tsx
<DotIcon name="date" size={54} />
```

`size` is the overall width (54px master: 6px dots with 2px gaps; the gap is a third of a dot, not a quarter). Pass `label` to make it an image. Dot illustrations are for Yuyu's own pages.

For static dot artwork in `/public/landing`, each SVG has a `-dark.svg` twin. `ThemedImage` renders both and CSS hides the wrong one (`.yy-img-light`, `.yy-img-dark`), with no JavaScript and no flash.

## DotLoader and PageLoader

`DotLoader` is three dots, two marigold and one ink, hopping left to right in turn (`.yy-dot-loader-jump`, a 1.2s loop with a 160ms stagger). It renders `role="status"` with a screen-reader label.

| Prop | Default |
| --- | --- |
| `size` | 48 (overall width) |
| `label` | "Loading" |

`PageLoader` centres a `DotLoader` fixed in the viewport (`pointer-events-none fixed inset-0 z-40`) for route `loading.tsx` screens. With reduced motion the dots rest on the baseline. Buttons keep their own pending state with `Spinner`, not the dot loader.

::: warning
A `loading.tsx` is a Suspense boundary, and once its fallback streams the status is a fixed 200, so a `notFound()` or redirect inside it can no longer be a real 404 or 307. Yuyu has no root, `app/dashboard` or organisation-wide `loading.tsx`. Each screen sits below a layout that awaits the access check first, and `tests/unit/dashboard-loading-boundaries.test.ts` pins where one may live. See [Architecture overview](/architecture/overview#rendering-model).
:::

## Assets

Hand-written SVG masters live in `public/brand/` (`mark-full.svg`, `mark-bright.svg`, `mark-mono.svg`, the horizontal lockups in light and dark, `app-icon.svg`, `maskable.svg`, `og-default.svg` and more). `npm run brand:generate` rasterises them into the favicon, PWA icons, apple-touch icon, default social card and the email lockup PNG. Commit both the masters and the outputs.

Where React can't render, use these files:

- **Emails** use the hosted `public/brand/email-lockup.png`, built from `NEXT_PUBLIC_BASE_URL`, with `width`, `height` and `alt="Yuyu"`. Never inline SVG.
- **Share cards** (`lib/og/shareCard.tsx`) and the **report PDF** (`lib/eventReportPdf.ts`) draw the same mark. The PDF embeds static Bricolage Grotesque and Figtree instances from `public/brand/fonts/`.

## Where the brand does not go

- Never restyle organiser logos, covers, certificates or accents with it.
- Event-context pages show the organiser's identity. They carry only a small credit: an 18px `DotMark` and "Free event, powered by Yuyu" in the footer.
- Materials that are physical stay themselves in dark mode: the About letter and envelope stay paper, badges stay black on white, and QR codes sit on a white plate.
- Never redraw the mark by hand. Use `DotMark` or `DotLockup`, or the masters.

## Invariants

- **All dot art goes through `DotGrid`** and brand tokens. No gradients, no other hues, no square dots.
- **Labels follow the visible text.** Give a mark or lockup a `label`, or `null` it when a visible wordmark already names the brand.
- **Patterns stay on their grid.** Marks are 5 by 5, faces and icons 7 by 7. The unit test checks every face and icon.
- **Faces mean something.** Don't use a mood for decoration.
- **Light and dark pairs** for static dot art use `ThemedImage`.

## Further reading

- [Design tokens](/design/tokens#brand), [Components](/design/components), [UI patterns](/design/patterns), [Accessibility](/design/accessibility)
- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md), sections 2.3 and 3
