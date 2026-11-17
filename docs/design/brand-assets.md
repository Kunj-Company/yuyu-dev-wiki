# Brand assets

An inventory of every brand file Yuyu ships and every asset generated from it, with a preview, the file name and where it is used. The dot sign itself (construction, patterns, React components) is explained on [Brand and dot sign](/design/brand). This page is about the files.

::: tip Gallery and download
The [Component library](/library/index.html) has pages for [Logos](/library/index.html#/foundations/logos), [App icons](/library/index.html#/foundations/app-icons), [Faces and icons](/library/index.html#/foundations/faces-and-icons), [Illustrations](/library/index.html#/foundations/illustrations), [Fonts](/library/index.html#/foundations/fonts) and [Download the asset kit](/library/index.html#/foundations/asset-kit). The previews below are the same files the gallery serves, from `/library/assets/`.
:::

## Where the files live

| Location | Contents |
| --- | --- |
| `public/brand/` in Yuyu | Hand-written SVG masters and the generated PNGs |
| `public/brand/fonts/` in Yuyu | Static TTFs and licence texts, used by the report PDF |
| `public/landing/` in Yuyu | Dot illustrations (65 SVG files, most with a `-dark.svg` twin) |
| `app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico` in Yuyu | Next.js file-convention icons |
| `library/public/assets/brand`, `fonts`, `illustrations` here | Copies for the gallery and this wiki, made by `npm run library:sync` |

`scripts/sync-library.mjs` copies `public/brand` (leaving out the `idlistack-*` logo PNGs and the `fonts` folder), `public/brand/fonts`, and the SVG files in `public/landing` (renamed `illustrations`). The two Idlistack logo PNGs are in Yuyu's `public/brand` but are not part of the dot sign and are not in the gallery.

## Marks

The mark is the 5 by 5 dot grid that draws a Y: six marigold dots and one ink base dot. All three are SVG, 120 by 120.

| Preview | File | Variant | Use |
| --- | --- | --- | --- |
| ![Full mark](/library/assets/brand/mark-full.svg) | `mark-full.svg` | Full grid, with the soft unlit dots | 48px and above |
| ![Bright mark](/library/assets/brand/mark-bright.svg) | `mark-bright.svg` | Bright dots only | Below 48px |
| ![Mono mark](/library/assets/brand/mark-mono.svg) | `mark-mono.svg` | One colour, bright pattern | Single-colour contexts |

The Figma kit also draws a fourth mark, **On marigold** (an ink Y on a marigold background). In code it is `DotMark variant="onMarigold"`, and it is not a separate file in `public/brand`.

## Lockups and wordmark

| Preview | File | Use |
| --- | --- | --- |
| ![Horizontal lockup](/library/assets/brand/lockup-horizontal.svg) | `lockup-horizontal.svg` | Mark and "yuyu" for light backgrounds, 203 by 60 |
| ![Dot wordmark](/library/assets/brand/wordmark-dots.svg) | `wordmark-dots.svg` | "YUYU" spelled in dots for posters, merch and stage screens. Not for UI headers |
| ![Email lockup](/library/assets/brand/email-lockup.png) | `email-lockup.png` | Hosted PNG for email headers (365 by 108), never inline SVG |

The dark horizontal lockup, `lockup-horizontal-dark.svg`, is for dark backgrounds:

<div style="background:#18181B;padding:16px;border-radius:12px;display:inline-block">

![Horizontal lockup for dark backgrounds](/library/assets/brand/lockup-horizontal-dark.svg)

</div>

The Figma kit lists three lockups: **Horizontal**, **Stacked** and **Tagline**. Only the horizontal one is a file. Stacked and tagline are `DotLockup` layouts in React (`layout="stacked"` and `layout="tagline"`), and in the app the wordmark is real text in the self-hosted font, not an image.

## App icons and favicons

| Preview | File | Size | Use |
| --- | --- | --- | --- |
| ![App icon](/library/assets/brand/app-icon.svg) | `app-icon.svg` | 180 | Master for the PWA icons |
| ![App icon 192](/library/assets/brand/icon-192.png) | `icon-192.png` | 192 | Web app manifest |
| ![App icon 512](/library/assets/brand/icon-512.png) | `icon-512.png` | 512 | Web app manifest |
| ![Maskable icon](/library/assets/brand/maskable.svg) | `maskable.svg` | 512 | Master for the maskable PNG |
| ![Maskable icon 512](/library/assets/brand/maskable-512.png) | `maskable-512.png` | 512 | Manifest icon with `purpose: "maskable"`, flattened on ink |
| ![Apple touch icon](/library/assets/brand/apple-touch-icon.svg) | `apple-touch-icon.svg` | 180 | Master for the iOS icon |
| ![Apple touch icon PNG](/library/assets/brand/apple-touch-icon.png) | `apple-touch-icon.png` | 180 | iOS home screen: full ink square, no transparency |
| ![Favicon 16](/library/assets/brand/favicon-16.svg) | `favicon-16.svg` | 16 | Pixel-aligned 2px dots |
| ![Favicon 32](/library/assets/brand/favicon-32.svg) | `favicon-32.svg` | 32 | Browser tab |

The Figma kit has three app-icon colourways: **Ink**, **Light** and **Marigold**. Yuyu ships the ink one as files.

## Social card

| Preview | File | Use |
| --- | --- | --- |
| ![Open Graph card](/library/assets/brand/og-default.png) | `og-default.png` (generated from `og-default.svg`) | 1200 by 630 default share card for Yuyu's own pages. Event pages set their own image |

`app/layout.tsx` points both `openGraph.images` and `twitter.images` at `/brand/og-default.png`. No separate social avatar file is shipped in `public/brand`.

## How the PNGs are made

`scripts/generate-brand-assets.ts` (`npm run brand:generate` in Yuyu) rasterises the SVG masters with `sharp`: `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png`, `og-default.png` and `email-lockup.png`. The maskable, Apple and social outputs are flattened onto ink `#18181B`. Edit the SVG, run the script, and commit both the master and the output.

## Dot faces

Ten moods on a 7 by 7 grid. Faces are always live `DotFace` components, never image files, so there is nothing to download. They carry meaning:

| Face | Meaning |
| --- | --- |
| Happy | Hello, greeting |
| Cheering | "You're in" |
| Wink | Checked in |
| Love | Feedback |
| Done | All set |
| Waiting | Waitlist |
| Surprised | Event full |
| Thinking | Loading |
| Sleepy | Empty states |
| Sad | Errors and not-found |

See [Brand and dot sign](/design/brand#dotface) for props and hover motion, and the gallery's [Faces and icons](/library/index.html#/foundations/faces-and-icons) page. To see the faces move, replay them, or download an animated SVG of each, open [Animated faces](/library/index.html#/foundations/animated-faces).

## Dot icons

Thirteen product spot icons on a 7 by 7 grid: Date, Venue, Guests, Time, Speaker, Check-in, Feedback, Certificate, Reminder, Done, Page, Lock and Code. In React they are `DotIcon`. Static SVG versions of some (`icon-date.svg`, `icon-time.svg`, `icon-speaker.svg`, `icon-guests.svg`, `icon-check-in.svg`, `icon-certificate.svg`, `icon-done.svg`, `icon-page.svg`) are in the illustrations folder, each with a `-dark.svg` twin.

<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">

![Date icon](/library/assets/illustrations/icon-date.svg)
![Time icon](/library/assets/illustrations/icon-time.svg)
![Speaker icon](/library/assets/illustrations/icon-speaker.svg)
![Guests icon](/library/assets/illustrations/icon-guests.svg)
![Check-in icon](/library/assets/illustrations/icon-check-in.svg)

</div>

## Illustrations

The 65 SVG files from Yuyu's `public/landing`, served here as `/library/assets/illustrations/`. Each one that is shown on both themes has a `-dark.svg` twin, swapped with CSS by `ThemedImage` (no JavaScript, no flash).

| Group | File pattern | Used for (judging by the file names) |
| --- | --- | --- |
| Features | `features-*.svg` | The Features page (check-in, developers, event pages, feedback, privacy, programme, registration, series, teams) and `features-bullet.svg` |
| Hero and cards | `hero-*.svg`, `discover-card-dots.svg`, `preview-cover-dots.svg` | The home page hero and card covers |
| Spot icons | `icon-*.svg`, `about-icon-*.svg`, `legal-icon-alert*.svg` | Icons on the About, legal and landing pages |
| Steps | `step-create`, `step-share`, `step-thanks`, `step-welcome` | How-it-works steps |
| Event accent swatches | `swatch-ember`, `swatch-iris`, `swatch-teal`, `swatch-ink` | The accent presets |
| Ticket | `ticket-perforation*.svg`, `ticket-qr.svg` | The ticket illustration |
| Misc | `point-dot.svg` | A single dot |

These belong to Yuyu's own pages. Don't use them on organiser surfaces. See the gallery's [Illustrations](/library/index.html#/foundations/illustrations) page for a browsable grid.

## Fonts

| Family | Role | Files | Licence |
| --- | --- | --- | --- |
| Bricolage Grotesque | Display, headings and the wordmark (weight 800) | `BricolageGrotesque-ExtraBold.ttf` | SIL Open Font License 1.1 (`OFL-BricolageGrotesque.txt`) |
| Figtree | Body and UI | `Figtree-Regular.ttf`, `Figtree-Bold.ttf` | SIL Open Font License 1.1 (`OFL-Figtree.txt`) |
| JetBrains Mono | Code, IDs, API | Not shipped as a file. Installed from the Fontsource package | OFL-1.1, as declared in the `@fontsource/jetbrains-mono` package |

The static TTFs are used by the report PDF (`lib/eventReportPdf.ts`). The web app uses the Fontsource packages instead, so fonts are self-hosted and there is no font CDN.

::: warning Licence
The SIL OFL lets you use, embed and redistribute these fonts, including commercially, but the font files cannot be sold on their own and any redistribution must keep the licence text. The two licence files travel with the TTFs, so keep them next to the fonts if you copy them. Check the full terms in the licence files before redistributing.
:::

## Usage rules

These come from the Figma brand kit's "Usage rules" section and `docs/DESIGN.md`.

**Construction**

- 5 × 5 grid of perfect circles
- Gap between dots is ¼ of a dot
- Six marigold dots draw the Y
- One ink dot at the base: the host

**Space and size**

- Clear space: one dot-step on every side
- 48px and up: full grid with soft dots
- Under 48px: bright dots only
- Never smaller than 16px

**Colours**

- Marigold is for dots and fills, never text: it fails contrast on white.

**Don't**

- Use square or rounded-square dots
- Rotate or skew the mark
- Recolour dots in other hues
- Fill the soft dots to make a solid block
- Add outlines, shadows or gradients

The dot sign belongs to Yuyu's own surfaces. Organiser logos, covers, certificates and event accent colours are never restyled with it. Colour values are on [Colour reference](/design/colour#brand-dot-colours).

## Copy-paste snippets

**The mark in an image tag**, with a text alternative:

```html
<img src="/brand/mark-full.svg" width="48" height="48" alt="Yuyu" />
```

Use `mark-bright.svg` below 48px, and never go under 16px.

**Favicon and app icons.** Yuyu does not write these links by hand. Next.js generates them from the files `app/icon.svg`, `app/apple-icon.png` and `app/favicon.ico`, and the web app manifest (`app/manifest.ts`) lists the three PNG icons. The equivalent plain HTML for another site, using the shipped files, is:

```html
<link rel="icon" href="/brand/favicon-32.svg" type="image/svg+xml" sizes="32x32" />
<link rel="icon" href="/brand/favicon-16.svg" type="image/svg+xml" sizes="16x16" />
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" sizes="180x180" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#18181B" />
```

The manifest in Yuyu sets `theme_color` to `#18181B` and `background_color` to `#FFFFFF`.

**Social card**, as Yuyu declares it in `app/layout.tsx`:

```ts
openGraph: { siteName: "Yuyu", images: [{ url: "/brand/og-default.png", width: 1200, height: 630, alt: "Yuyu" }] },
twitter: { card: "summary_large_image", images: ["/brand/og-default.png"] },
```

**Fonts through Fontsource**, the imports at the top of `app/layout.tsx`:

```ts
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/figtree/wght.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
```

Then use the theme classes `font-display`, `font-sans` and `font-mono`. See [Typography and layout](/design/typography-and-layout#fonts).

## Further reading

- [Brand and dot sign](/design/brand), [Colour reference](/design/colour), [Typography and layout](/design/typography-and-layout)
- [Figma file map](/design/figma), which describes the brand kit sections these files come from
- Gallery: [Logos](/library/index.html#/foundations/logos), [App icons](/library/index.html#/foundations/app-icons), [Faces and icons](/library/index.html#/foundations/faces-and-icons), [Illustrations](/library/index.html#/foundations/illustrations), [Fonts](/library/index.html#/foundations/fonts), [Download the asset kit](/library/index.html#/foundations/asset-kit)
- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md), sections 2.3 and 3
