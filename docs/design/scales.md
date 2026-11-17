# Type, spacing and elevation scales

The numeric scales behind Yuyu's design: type, spacing, radius, shadow and breakpoints. Figma stores them as named styles and variables, code stores them as CSS classes and theme values, and this page puts both side by side. The Figma values are saved in `library/src/foundations/figma.json` and the code values come from the vendored `globals.css` and `tokens.css`, merged by `scripts/build-tokens.mjs`. The [Component library](/library/index.html#/foundations/type) shows the same scales live.

For the reasoning behind the scale (fonts, tracking rules, page shells) see [Typography and layout](/design/typography-and-layout). For colour, see [Colour reference](/design/colour).

## Type scale

Sixteen text styles in Figma. Sizes in the table are the desktop sizes (from the `sm` breakpoint, 640px); the code switches to a smaller size below it.

| Figma style | Family and style | Size | Line height | Letter spacing (Figma) | Code class | Code size on mobile |
| --- | --- | --- | --- | --- | --- | --- |
| `Display/XL` | Bricolage Grotesque ExtraBold (800) | 76px | 0.98 | -3.5 | `text-display-xl` | 44px |
| `Display/L` | Bricolage Grotesque ExtraBold (800) | 68px | 0.98 | -3 | `text-display-l` | 40px |
| `Display/M` | Bricolage Grotesque ExtraBold (800) | 54px | 1 | -3 | `text-display-m` | 36px |
| `Heading/H1` | Bricolage Grotesque ExtraBold (800) | 38px | 1.1 | -2 | `text-h1` | 30px |
| `Heading/H2` | Bricolage Grotesque ExtraBold (800) | 30px | 1.15 | -1 | `text-h2` | 24px |
| `Heading/H3` | Bricolage Grotesque ExtraBold (800) | 24px | 1.2 | 0 | `text-h3` | 20px |
| `Heading/H4` | Bricolage Grotesque ExtraBold (800) | 20px | 1.25 | 0 | `text-h4` | 18px |
| `Text/Body L` | Figtree Regular (400) | 19px | 1.6 | 0 | `text-body-l` | 17px |
| `Text/Body` | Figtree Regular (400) | 16px | 1.6 | 0 | `text-body` | same |
| `Text/Body UI` | Figtree Regular (400) | 15px | 1.5 | 0 | `text-body-ui` | same |
| `Text/Body UI Strong` | Figtree SemiBold (600) | 15px | 1.5 | 0 | none | n/a |
| `Text/Label` | Figtree SemiBold (600) | 14px | 1.4 | 0 | `text-label` | same |
| `Text/Button` | Figtree Bold (700) | 15px | 1.3 | 0 | none | n/a |
| `Text/Caption` | Figtree Regular (400) | 13px | 1.45 | 0 | `text-caption` | same |
| `Text/Overline` | Figtree Bold (700) | 13px | 1.3 | 6 | `text-overline` | 12px |
| `Code/Mono` | JetBrains Mono Regular (400) | 13px | 1.5 | 0 | `text-mono` | same |

::: warning Letter spacing units
`figma.json` stores the Figma letter spacing in a field called `letterSpacingPx`, but every non-zero value equals the code's em value times 100: Display/XL is -3.5 and `text-display-xl` is `-0.035em`, Heading/H1 is -2 and `text-h1` is `-0.02em`, Text/Overline is 6 and `text-overline` is `0.06em`. They behave as percentages of the font size, not pixels. Read the Figma column as percent, and do not translate it to px.
:::

### Type in code

These are the real rules in `app/globals.css`. Code has the named classes below, and Figma lacks `text-title`.

| Class | Family and weight | Mobile size | From 640px | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| `text-display-xl` | Bricolage Grotesque 800 | 44px | 76px | 0.98 | -0.035em |
| `text-display-l` | Bricolage Grotesque 800 | 40px | 68px | 1 | -0.03em |
| `text-display-m` | Bricolage Grotesque 800 | 36px | 54px | 1 | -0.03em |
| `text-h1` | Bricolage Grotesque 800 | 30px | 38px | 1.1 | -0.02em |
| `text-h2` | Bricolage Grotesque 800 | 24px | 30px | 1.15 | -0.01em |
| `text-h3` | Bricolage Grotesque 800 | 20px | 24px | 1.2 | none |
| `text-h4` | Bricolage Grotesque 800 | 18px | 20px | 1.25 | none |
| `text-title` | Figtree 700 | 16px | 16px | 1.35 | none |
| `text-body-l` | Figtree | 17px | 19px | 1.6 | none |
| `text-body` | Figtree | 16px | 16px | 1.6 | none |
| `text-body-ui` | Figtree | 15px | 15px | 1.5 | none |
| `text-label` | Figtree 600 | 14px | 14px | 1.4 | none |
| `text-caption` | Figtree | 13px | 13px | 1.45 | none |
| `text-overline` | Figtree 700 | 12px | 13px | 1.3 | 0.06em |
| `text-mono` | JetBrains Mono | 13px | 13px | 1.5 | none |

`text-overline` is also uppercase. `text-title` is Figtree 700 at 16px with a 1.35 line height, used for card and sub-section titles inside the app (`CardHeader`).

## Spacing

Figma defines 11 spacing variables. Each is a multiple of the 4px base, and each equals the Tailwind step of the same number (`space-4` is 16px, which is `p-4`, `gap-4` and so on).

| Figma variable | Value | Tailwind step |
| --- | --- | --- |
| `space-1` | 4px | `1` (`p-1`, `gap-1`) |
| `space-2` | 8px | `2` (`p-2`, `gap-2`) |
| `space-3` | 12px | `3` (`p-3`, `gap-3`) |
| `space-4` | 16px | `4` (`p-4`, `gap-4`) |
| `space-5` | 20px | `5` (`p-5`, `gap-5`) |
| `space-6` | 24px | `6` (`p-6`, `gap-6`) |
| `space-8` | 32px | `8` (`p-8`, `gap-8`) |
| `space-10` | 40px | `10` (`p-10`, `gap-10`) |
| `space-12` | 48px | `12` (`p-12`, `gap-12`) |
| `space-16` | 64px | `16` (`p-16`, `gap-16`) |
| `space-20` | 80px | `20` (`p-20`, `gap-20`) |

Code is looser than Figma here. `docs/DESIGN.md` allows `2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80`, so 2, 6, 10, 14, 28, 56 and 72px are valid in code but have no Figma variable. Typical use is on [Typography and layout](/design/typography-and-layout#spacing).

## Radius

| Figma variable | Value | Code | Typical use |
| --- | --- | --- | --- |
| `radius-sm` | 8px | `rounded-sm` | Tiny controls |
| `radius-md` | 12px | `rounded-md` | Inputs, date block, nav items |
| `radius-lg` | 16px | `rounded-lg` | Cards, list rows, tables, stat tiles, callouts |
| `radius-xl` | 20px | `rounded-xl` | Registration card, feature cards, option cards |
| `radius-2xl` | 24px | `rounded-2xl` | Dialogs, hero panels, account cards |
| `radius-full` | 999px | `rounded-full` | All buttons, chips, segmented controls, avatars |
| not in Figma | n/a | `rounded-3xl` (28px) | Largest hero panels and CTA bands |

`radius-3xl` exists only in code (`--radius-3xl: 28px` in `@theme inline`). Don't nest more than two rounded containers.

## Elevation

Yuyu is flat by default: cards use a 1px `border-line` and no shadow. Figma has three shadow styles, each with two layers. Figma records the colour (with its alpha as hex), the vertical offset and the blur. Every layer is `#18181B` ink.

| Figma style | Layer 1 | Layer 2 |
| --- | --- | --- |
| `Shadow/Raised` | y 1px, blur 2px, `#18181B0A` (0.04) | y 12px, blur 32px, `#18181B0F` (0.06) |
| `Shadow/Float` | y 1px, blur 2px, `#18181B0A` (0.04) | y 24px, blur 48px, `#18181B14` (0.08) |
| `Shadow/Ticket` | y 1px, blur 2px, `#18181B0F` (0.06) | y 16px, blur 40px, `#18181B1A` (0.10) |

The code values, in light and dark, from `tokens.css`:

| Token | Class | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `--yy-shadow-raised` | `shadow-raised` | `0 1px 2px rgba(24, 24, 27, 0.04), 0 12px 32px rgba(24, 24, 27, 0.06)` | `0 12px 32px rgba(0, 0, 0, 0.5)` | Event registration card, auth card |
| `--yy-shadow-float` | `shadow-float` | `0 1px 2px rgba(24, 24, 27, 0.04), 0 24px 48px rgba(24, 24, 27, 0.08)` | `0 24px 48px rgba(0, 0, 0, 0.5)` | Menus, popovers, dialogs, toasts |
| `--yy-shadow-ticket` | `shadow-ticket` | `0 1px 2px rgba(24, 24, 27, 0.06), 0 16px 40px rgba(24, 24, 27, 0.1)` | `0 1px 2px rgba(0, 0, 0, 0.5), 0 16px 40px rgba(0, 0, 0, 0.5)` | Ticket stub |
| `--yy-shadow-segment` | `shadow-segment` | `0 1px 3px rgba(24, 24, 27, 0.12)` | `0 1px 3px rgba(0, 0, 0, 0.5)` | Selected segment, switch thumb |

The three Figma shadows match the code light values layer for layer (Figma's `0A` alpha is 0.04, `0F` is 0.06, `14` is 0.08, `1A` is 0.10). Differences:

- `shadow-segment` exists only in code. Figma has no style for it.
- Dark mode shadows (`rgba(0, 0, 0, 0.5)`) exist only in code, because the saved Figma data covers the light shadows.
- Figma has no spread or x offset in the saved data, and the code layers have none either.

## Breakpoints

Mobile first, with three breakpoints in the theme. `md` is 960px, not Tailwind's default 768px.

| Prefix | Min width | Typical change |
| --- | --- | --- |
| `sm` | 640px | Type scale steps up. Stacked actions go inline. Side gutter becomes 24px |
| `md` | 960px | Sidebar appears, two-column layouts open |
| `lg` | 1200px | Three-column editors and sticky previews |

The saved Figma data has no breakpoint variables. Figma frames are drawn at one width, so the type sizes above are the desktop (`sm` and up) values.

## Figma vs code

| Area | Figma | Code |
| --- | --- | --- |
| Radius `3xl` | Not defined | `rounded-3xl`, 28px |
| Mobile type sizes | Desktop sizes only | Smaller sizes below 640px (for example `text-h1` 30px, then 38px) |
| `Text/Body UI Strong` | A style (Figtree SemiBold 15) | No class. Write `text-body-ui font-semibold` |
| `Text/Button` | A style (Figtree Bold 15, line height 1.3) | No class. `Button` sets `font-semibold` with a per-size size (14px, 15px, 17px) in `button.tsx` |
| `text-title` | Not defined | Figtree 700, 16px, 1.35 |
| `Display/L` line height | 0.98 | 1 |
| Spacing | 11 steps | 18 allowed values in DESIGN.md |
| `shadow-segment`, dark shadows | Not defined | Defined |
| Breakpoints | Not defined | `sm`, `md`, `lg` |

The line-height and the Button rows are real differences between the saved Figma values and the CSS. Everything else in the type table (sizes, other line heights, family and weight) agrees.

::: tip Updating a scale
Change the value in Figma, update `library/src/foundations/figma.json`, and run `node scripts/build-tokens.mjs`. Code-only values (mobile sizes, `radius-3xl`, `text-title`) are read from the vendored CSS, so they update after `npm run library:sync`. See [Figma file map](/design/figma#syncing-tokens).
:::

## Further reading

- [Typography and layout](/design/typography-and-layout), [Design tokens](/design/tokens), [Colour reference](/design/colour)
- [Figma file map](/design/figma)
- Gallery: [Type scale](/library/index.html#/foundations/type)
- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md), sections 2.6 to 2.11
