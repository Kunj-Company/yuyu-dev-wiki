# Colour reference

Every colour in Yuyu is a `--yy-*` custom property with a light and a dark value. This page lists all 42 of them in one place, merged from two sources: the Figma file "Yuyu — Light screens" and Yuyu's own `tokens.css`. The tables are generated from `library/src/foundations/tokens.json`, so they match what the [Component library](/library/index.html#/foundations/colour) shows. For how the tokens are used, see [Design tokens](/design/tokens).

::: tip Source column
**Figma and code** means the token exists in both and the values agree. **Figma only** and **Code only** mark tokens that exist in one source. The comparison is on the [Figma vs code](#figma-vs-code) section below.
:::

Each swatch is decorative. The hex value next to it is the real data.

## Light and dark

Light values are under `:root` and `:root[data-color-mode="light"]`. Dark values are under `:root[data-color-mode="dark"]` and `.yy-dark-band`, and are mirrored in a `prefers-color-scheme: dark` media query, so the operating-system preference works with no cookie. In Figma the same switch is the **Color** variable collection with Light and Dark modes. The mechanism is described on [Design tokens](/design/tokens#light-and-dark).

Tokens whose light and dark hex are identical (the `solid` status colours, `accent` and `on-accent`, marigold, mint and lavender) keep their colour in both modes.

## Surfaces

Page, card and fill backgrounds. `bg-canvas` is the page; the others step up in emphasis.

| Token | CSS variable | Tailwind (typical) | Light | Dark | Source |
| --- | --- | --- | --- | --- | --- |
| `bg-canvas` | `--yy-bg-canvas` | `bg-canvas` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFFFFF;vertical-align:-2px;margin-right:6px"></span>`#FFFFFF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#111113;vertical-align:-2px;margin-right:6px"></span>`#111113` | Figma and code |
| `bg-emphasis` | `--yy-bg-emphasis` | `bg-emphasis` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#EFEEEA;vertical-align:-2px;margin-right:6px"></span>`#EFEEEA` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#2A2A2E;vertical-align:-2px;margin-right:6px"></span>`#2A2A2E` | Figma and code |
| `bg-muted` | `--yy-bg-muted` | `bg-muted` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F4F4F2;vertical-align:-2px;margin-right:6px"></span>`#F4F4F2` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#232326;vertical-align:-2px;margin-right:6px"></span>`#232326` | Figma and code |
| `bg-subtle` | `--yy-bg-subtle` | `bg-subtle` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FAFAF9;vertical-align:-2px;margin-right:6px"></span>`#FAFAF9` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` | Figma and code |
| `bg-track` | `--yy-bg-track` | `bg-track` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F0EFEB;vertical-align:-2px;margin-right:6px"></span>`#F0EFEB` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#2A2A2E;vertical-align:-2px;margin-right:6px"></span>`#2A2A2E` | Figma and code |

## Borders

Hairlines and control outlines.

| Token | CSS variable | Tailwind (typical) | Light | Dark | Source |
| --- | --- | --- | --- | --- | --- |
| `border` | `--yy-border` | `border-line`, `divide-line` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E7E6E2;vertical-align:-2px;margin-right:6px"></span>`#E7E6E2` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#2A2A2E;vertical-align:-2px;margin-right:6px"></span>`#2A2A2E` | Figma and code |
| `border-strong` | `--yy-border-strong` | `border-line-strong`, `divide-line-strong` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#D4D3CE;vertical-align:-2px;margin-right:6px"></span>`#D4D3CE` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#3F3F46;vertical-align:-2px;margin-right:6px"></span>`#3F3F46` | Figma and code |

## Text

Four steps of text colour. Muted is the lightest allowed for readable content.

| Token | CSS variable | Tailwind (typical) | Light | Dark | Source |
| --- | --- | --- | --- | --- | --- |
| `text` | `--yy-text` | `text-ink` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F4F4F5;vertical-align:-2px;margin-right:6px"></span>`#F4F4F5` | Figma and code |
| `text-disabled` | `--yy-text-disabled` | `text-ink-disabled` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#A1A09A;vertical-align:-2px;margin-right:6px"></span>`#A1A09A` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#71717A;vertical-align:-2px;margin-right:6px"></span>`#71717A` | Figma and code |
| `text-muted` | `--yy-text-muted` | `text-ink-muted` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#5F5E5A;vertical-align:-2px;margin-right:6px"></span>`#5F5E5A` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#A1A1AA;vertical-align:-2px;margin-right:6px"></span>`#A1A1AA` | Figma and code |
| `text-secondary` | `--yy-text-secondary` | `text-ink-secondary` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#3F3F46;vertical-align:-2px;margin-right:6px"></span>`#3F3F46` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#D4D4D8;vertical-align:-2px;margin-right:6px"></span>`#D4D4D8` | Figma and code |

## Primary and inverse

Yuyu's own primary action is ink, not a hue, and it inverts in dark mode.

| Token | CSS variable | Tailwind (typical) | Light | Dark | Source |
| --- | --- | --- | --- | --- | --- |
| `inverse-surface` | `--yy-inverse-surface` | `bg-inverse` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#1C1C1F;vertical-align:-2px;margin-right:6px"></span>`#1C1C1F` | Figma and code |
| `on-inverse` | `--yy-on-inverse` | `text-on-inverse`, `bg-on-inverse` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFFFFF;vertical-align:-2px;margin-right:6px"></span>`#FFFFFF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F4F4F5;vertical-align:-2px;margin-right:6px"></span>`#F4F4F5` | Code only |
| `on-primary` | `--yy-on-primary` | `text-on-primary` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFFFFF;vertical-align:-2px;margin-right:6px"></span>`#FFFFFF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` | Figma and code |
| `primary` | `--yy-primary` | `bg-primary`, `text-primary` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F4F4F5;vertical-align:-2px;margin-right:6px"></span>`#F4F4F5` | Figma and code |

## Brand

The dot sign's colours, plus the peach highlight and tint. The mint and lavender families exist only in Figma.

| Token | CSS variable | Tailwind (typical) | Light | Dark | Source |
| --- | --- | --- | --- | --- | --- |
| `brand-dot-base` | `--yy-brand-dot-base` | `bg-brand-dot-base` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F4F4F5;vertical-align:-2px;margin-right:6px"></span>`#F4F4F5` | Code only |
| `brand-dot-off` | `--yy-brand-dot-off` | `bg-brand-dot-off` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E7E6E2;vertical-align:-2px;margin-right:6px"></span>`#E7E6E2` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#2A2A2E;vertical-align:-2px;margin-right:6px"></span>`#2A2A2E` | Code only |
| `brand-lavender` | `--yy-brand-lavender` | none yet | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#B9AEFF;vertical-align:-2px;margin-right:6px"></span>`#B9AEFF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#B9AEFF;vertical-align:-2px;margin-right:6px"></span>`#B9AEFF` | Figma only |
| `brand-marigold` | `--yy-brand-marigold` | `bg-brand-marigold` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFB547;vertical-align:-2px;margin-right:6px"></span>`#FFB547` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFB547;vertical-align:-2px;margin-right:6px"></span>`#FFB547` | Code only |
| `brand-marigold-deep` | `--yy-brand-marigold-deep` | `bg-brand-marigold-deep` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E8930C;vertical-align:-2px;margin-right:6px"></span>`#E8930C` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E8930C;vertical-align:-2px;margin-right:6px"></span>`#E8930C` | Code only |
| `brand-marigold-small` | `--yy-brand-marigold-small` | not mapped | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E8930C;vertical-align:-2px;margin-right:6px"></span>`#E8930C` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFB547;vertical-align:-2px;margin-right:6px"></span>`#FFB547` | Code only |
| `brand-mint` | `--yy-brand-mint` | none yet | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#7EE8C4;vertical-align:-2px;margin-right:6px"></span>`#7EE8C4` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#7EE8C4;vertical-align:-2px;margin-right:6px"></span>`#7EE8C4` | Figma only |
| `highlight-lavender` | `--yy-highlight-lavender` | none yet | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#DCD6FF;vertical-align:-2px;margin-right:6px"></span>`#DCD6FF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#332E5C;vertical-align:-2px;margin-right:6px"></span>`#332E5C` | Figma only |
| `highlight-mint` | `--yy-highlight-mint` | none yet | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#BDF3DF;vertical-align:-2px;margin-right:6px"></span>`#BDF3DF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#1F4D3D;vertical-align:-2px;margin-right:6px"></span>`#1F4D3D` | Figma only |
| `highlight-peach` | `--yy-highlight-peach` | `bg-highlight-peach` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FDE7C8;vertical-align:-2px;margin-right:6px"></span>`#FDE7C8` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#4A3418;vertical-align:-2px;margin-right:6px"></span>`#4A3418` | Figma and code |
| `tint-lavender` | `--yy-tint-lavender` | none yet | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F1EFFF;vertical-align:-2px;margin-right:6px"></span>`#F1EFFF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#1C1A33;vertical-align:-2px;margin-right:6px"></span>`#1C1A33` | Figma only |
| `tint-mint` | `--yy-tint-mint` | none yet | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E9FBF3;vertical-align:-2px;margin-right:6px"></span>`#E9FBF3` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#10261E;vertical-align:-2px;margin-right:6px"></span>`#10261E` | Figma only |
| `tint-peach` | `--yy-tint-peach` | `bg-tint-peach` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFF4E5;vertical-align:-2px;margin-right:6px"></span>`#FFF4E5` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#2A1F10;vertical-align:-2px;margin-right:6px"></span>`#2A1F10` | Figma and code |

`brand-marigold-small` is deliberately not mapped to a Tailwind class. `DotMark` reads it through `var(--yy-brand-marigold-small)`: deep marigold on light backgrounds, standard marigold on dark.

## Status

Always a soft background with a strong foreground, plus an icon or a word. The `solid` values do not change in dark mode.

| Token | CSS variable | Tailwind (typical) | Light | Dark | Source |
| --- | --- | --- | --- | --- | --- |
| `danger-bg` | `--yy-danger-bg` | `bg-danger-bg` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FEE2E2;vertical-align:-2px;margin-right:6px"></span>`#FEE2E2` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#3A1414;vertical-align:-2px;margin-right:6px"></span>`#3A1414` | Figma and code |
| `danger-border` | `--yy-danger-border` | `border-danger-border` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FCA5A5;vertical-align:-2px;margin-right:6px"></span>`#FCA5A5` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#7F1D1D;vertical-align:-2px;margin-right:6px"></span>`#7F1D1D` | Figma and code |
| `danger-fg` | `--yy-danger-fg` | `text-danger-fg` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#B91C1C;vertical-align:-2px;margin-right:6px"></span>`#B91C1C` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F87171;vertical-align:-2px;margin-right:6px"></span>`#F87171` | Figma and code |
| `danger-solid` | `--yy-danger-solid` | `bg-danger-solid` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#B91C1C;vertical-align:-2px;margin-right:6px"></span>`#B91C1C` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#B91C1C;vertical-align:-2px;margin-right:6px"></span>`#B91C1C` | Figma and code |
| `success-bg` | `--yy-success-bg` | `bg-success-bg` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#DCFCE7;vertical-align:-2px;margin-right:6px"></span>`#DCFCE7` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#13301F;vertical-align:-2px;margin-right:6px"></span>`#13301F` | Figma and code |
| `success-fg` | `--yy-success-fg` | `text-success-fg` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#166534;vertical-align:-2px;margin-right:6px"></span>`#166534` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#86EFAC;vertical-align:-2px;margin-right:6px"></span>`#86EFAC` | Figma and code |
| `success-solid` | `--yy-success-solid` | `bg-success-solid` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#15803D;vertical-align:-2px;margin-right:6px"></span>`#15803D` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#15803D;vertical-align:-2px;margin-right:6px"></span>`#15803D` | Figma and code |
| `warning-bg` | `--yy-warning-bg` | `bg-warning-bg` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FEF3C7;vertical-align:-2px;margin-right:6px"></span>`#FEF3C7` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#33270B;vertical-align:-2px;margin-right:6px"></span>`#33270B` | Figma and code |
| `warning-fg` | `--yy-warning-fg` | `text-warning-fg` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#92400E;vertical-align:-2px;margin-right:6px"></span>`#92400E` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FCD34D;vertical-align:-2px;margin-right:6px"></span>`#FCD34D` | Figma and code |
| `warning-solid` | `--yy-warning-solid` | `bg-warning-solid` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F59E0B;vertical-align:-2px;margin-right:6px"></span>`#F59E0B` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F59E0B;vertical-align:-2px;margin-right:6px"></span>`#F59E0B` | Figma and code |

| Status | Used for |
| --- | --- |
| Success | Going, Published, Checked in, Verified |
| Warning | Waitlist, Draft, Running late, Reminders |
| Danger | Delete, Invalid ticket, Cancelled, errors |

## Event accent

The organiser's colour. These values are Ember, the default; event pages override them (see below).

| Token | CSS variable | Tailwind (typical) | Light | Dark | Source |
| --- | --- | --- | --- | --- | --- |
| `accent` | `--yy-accent` | `bg-accent` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#C2410C;vertical-align:-2px;margin-right:6px"></span>`#C2410C` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#C2410C;vertical-align:-2px;margin-right:6px"></span>`#C2410C` | Figma and code |
| `accent-soft` | `--yy-accent-soft` | `bg-accent-soft` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FAF0EC;vertical-align:-2px;margin-right:6px"></span>`#FAF0EC` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#2A1812;vertical-align:-2px;margin-right:6px"></span>`#2A1812` | Figma and code |
| `accent-text` | `--yy-accent-text` | `text-accent-text` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#C2410C;vertical-align:-2px;margin-right:6px"></span>`#C2410C` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FB8A5B;vertical-align:-2px;margin-right:6px"></span>`#FB8A5B` | Figma and code |
| `on-accent` | `--yy-on-accent` | `text-on-accent` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFFFFF;vertical-align:-2px;margin-right:6px"></span>`#FFFFFF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFFFFF;vertical-align:-2px;margin-right:6px"></span>`#FFFFFF` | Figma and code |

## Event accent presets

Organisers pick an accent in the colour picker. Four presets are offered, and Ember is the default for new events. These are the values Figma draws in its **Event accent** collection (light mode).

| Preset | Accent | Soft | Text |
| --- | --- | --- | --- |
| Ember | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#C2410C;vertical-align:-2px;margin-right:6px"></span>`#C2410C` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FAF0EC;vertical-align:-2px;margin-right:6px"></span>`#FAF0EC` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#C2410C;vertical-align:-2px;margin-right:6px"></span>`#C2410C` |
| Iris | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#4B3FA8;vertical-align:-2px;margin-right:6px"></span>`#4B3FA8` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F1F0F8;vertical-align:-2px;margin-right:6px"></span>`#F1F0F8` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#4B3FA8;vertical-align:-2px;margin-right:6px"></span>`#4B3FA8` |
| Teal | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#0F766E;vertical-align:-2px;margin-right:6px"></span>`#0F766E` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#ECF4F3;vertical-align:-2px;margin-right:6px"></span>`#ECF4F3` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#0F766E;vertical-align:-2px;margin-right:6px"></span>`#0F766E` |
| Ink | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F4F4F2;vertical-align:-2px;margin-right:6px"></span>`#F4F4F2` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` |

The code side is `ACCENT_PRESETS` in `lib/theme/accent.ts`: Ember `#C2410C`, Iris `#4B3FA8`, Teal `#0F766E` and Ink `#18181B`. The accent hex values match Figma exactly.

## Brand dot colours

The dot sign uses five colours. Marigold fills the six lit dots of the Y, ink is the base dot, and the soft colours are the unlit dots of the 5 by 5 grid.

| Name | Hex | Use | Token |
| --- | --- | --- | --- |
| Marigold | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFB547;vertical-align:-2px;margin-right:6px"></span>`#FFB547` | The bright dots | `--yy-brand-marigold` |
| Deep marigold | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E8930C;vertical-align:-2px;margin-right:6px"></span>`#E8930C` | Dots under 32px on white | `--yy-brand-marigold-deep`, and `--yy-brand-marigold-small` on light |
| Ink | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` | Base dot, wordmark, text | `--yy-brand-dot-base` (light) |
| Soft dot | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E7E6E2;vertical-align:-2px;margin-right:6px"></span>`#E7E6E2` | Unlit dots on light | `--yy-brand-dot-off` (light) |
| Soft dot, dark | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#2A2A2E;vertical-align:-2px;margin-right:6px"></span>`#2A2A2E` | Unlit dots on dark | `--yy-brand-dot-off` (dark) |

In dark mode the base dot becomes `#F4F4F5` and the soft dots `#2A2A2E`. Marigold does not change. Construction, size and the do and don't list are on [Brand and dot sign](/design/brand) and [Brand assets](/design/brand-assets).

## Contrast guidance

::: warning Marigold is for dots and fills, never text
`#FFB547` fails contrast on white, so it is never used as a text colour. Under 32px on a light background the lit dots switch to deep marigold `#E8930C` so they stay visible. This rule is stated in the Figma "Usage rules" section and in `docs/DESIGN.md`.
:::

- Pair every status background with its own foreground (`success-bg` with `success-fg`, and so on). Do not mix families.
- Body text on `bg-canvas` uses `text-ink`, `text-ink-secondary` or `text-ink-muted`. `text-ink-disabled` is for placeholders and disabled labels only.
- On an event accent, use `text-on-accent` on `bg-accent`, and `text-accent-text` for accent-coloured text. Never put white text on a light accent, and never use the raw accent as text.
- White on the success solid `#15803D` is 5.0:1 (`docs/DESIGN.md`), so the check-in success panel text stays readable.
- Accent derivation targets a contrast of at least 4.5:1 and is computed in one place, `getAccentTokens`. See [Accessibility](/design/accessibility).

## Dark mode and event accents

Dark is a full theme, not an inversion filter. Use the dark column of every token, and add light and dark values together (both dark blocks in `tokens.css`).

Event accents sit on top of the same mechanism. `lib/theme/accent.ts` derives four tokens from the organiser's hex for each scheme:

| Token | Light | Dark |
| --- | --- | --- |
| `--yy-accent` | The accent | The accent, unchanged |
| `--yy-accent-soft` | Accent mixed 8% into white | Accent mixed 14% into `#111113` |
| `--yy-on-accent` | White if contrast with the accent is at least 4.5, otherwise ink | Same rule |
| `--yy-accent-text` | The accent, darkened towards ink until it passes 4.5:1 on canvas and on the soft tint | Starts from the accent mixed 65% towards white, then lightens until it passes against `#111113` and the soft tint |

The event page root sets eight inline variables from `accentStyle`, and the `.yy-accent-scope` class copies the pair for the current mode into the four tokens above and points `--yy-focus` at the accent text. The full walkthrough is in [Design tokens](/design/tokens#accent-colours-and-contrast) and [UI patterns](/design/patterns#event-page-accent-theming). Yuyu's own chrome never uses an event accent.

## Figma vs code

Of the 42 colour tokens, 30 exist in both sources, 6 only in Figma and 6 only in code. `scripts/build-tokens.mjs` compares every shared token in both modes and reports 0 mismatches: **all shared values agree**.

**Only in Figma** (not yet in `tokens.css`, so there is no CSS variable or Tailwind class):

| Token | Light | Dark |
| --- | --- | --- |
| `brand-lavender` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#B9AEFF;vertical-align:-2px;margin-right:6px"></span>`#B9AEFF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#B9AEFF;vertical-align:-2px;margin-right:6px"></span>`#B9AEFF` |
| `brand-mint` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#7EE8C4;vertical-align:-2px;margin-right:6px"></span>`#7EE8C4` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#7EE8C4;vertical-align:-2px;margin-right:6px"></span>`#7EE8C4` |
| `highlight-lavender` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#DCD6FF;vertical-align:-2px;margin-right:6px"></span>`#DCD6FF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#332E5C;vertical-align:-2px;margin-right:6px"></span>`#332E5C` |
| `highlight-mint` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#BDF3DF;vertical-align:-2px;margin-right:6px"></span>`#BDF3DF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#1F4D3D;vertical-align:-2px;margin-right:6px"></span>`#1F4D3D` |
| `tint-lavender` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F1EFFF;vertical-align:-2px;margin-right:6px"></span>`#F1EFFF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#1C1A33;vertical-align:-2px;margin-right:6px"></span>`#1C1A33` |
| `tint-mint` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E9FBF3;vertical-align:-2px;margin-right:6px"></span>`#E9FBF3` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#10261E;vertical-align:-2px;margin-right:6px"></span>`#10261E` |

These are the mint and lavender families: `brand-mint`, `brand-lavender`, and the highlight and tint steps for each. Peach is the only one of the three families in code.

**Only in code** (not drawn in the Figma colour variables):

| Token | Light | Dark |
| --- | --- | --- |
| `on-inverse` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFFFFF;vertical-align:-2px;margin-right:6px"></span>`#FFFFFF` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F4F4F5;vertical-align:-2px;margin-right:6px"></span>`#F4F4F5` |
| `brand-dot-base` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#18181B;vertical-align:-2px;margin-right:6px"></span>`#18181B` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#F4F4F5;vertical-align:-2px;margin-right:6px"></span>`#F4F4F5` |
| `brand-dot-off` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E7E6E2;vertical-align:-2px;margin-right:6px"></span>`#E7E6E2` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#2A2A2E;vertical-align:-2px;margin-right:6px"></span>`#2A2A2E` |
| `brand-marigold` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFB547;vertical-align:-2px;margin-right:6px"></span>`#FFB547` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFB547;vertical-align:-2px;margin-right:6px"></span>`#FFB547` |
| `brand-marigold-deep` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E8930C;vertical-align:-2px;margin-right:6px"></span>`#E8930C` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E8930C;vertical-align:-2px;margin-right:6px"></span>`#E8930C` |
| `brand-marigold-small` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#E8930C;vertical-align:-2px;margin-right:6px"></span>`#E8930C` | <span aria-hidden="true" style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:#FFB547;vertical-align:-2px;margin-right:6px"></span>`#FFB547` |

These are the marigold variants (`brand-marigold`, `-deep`, `-small`), the dot colours (`brand-dot-base`, `brand-dot-off`) and `on-inverse`. The marigold and dot colours do appear in Figma as the brand kit's colour swatches ("Brand — Dot sign"), but not as variables in the Color collection.

Two further places where the sources differ, checked by running `getAccentTokens` from `lib/theme/accent.ts`:

- **Ink preset, soft tint.** Figma draws the Ink soft tint as `#F4F4F2`. `getAccentTokens("#18181B", "light")` returns `#EDEDED`. Ember, Iris and Teal soft tints match Figma exactly.
- **Dark accent text.** `tokens.css` and the Event accent table in `docs/DESIGN.md` give Ember's dark accent text as `#FB8A5B`. The derivation for a custom accent returns different values: Ember `#D78461`, Iris `#8A82C6`, Teal `#63A6A1`, Ink `#808081`. The static value applies where no accent scope is set; the derived values apply on event pages that set the accent inline.

Neither of these is a token mismatch in `tokens.json`, but check them if you are matching a Figma frame to a live event page.

::: tip Adding a Figma-only token to code
Add it to both dark blocks of `tokens.css`, map it in `@theme inline` in `globals.css` if components need a class, then run `node scripts/build-tokens.mjs`. The workflow is on [Figma file map](/design/figma#syncing-tokens).
:::

## Further reading

- [Design tokens](/design/tokens), [Typography and layout](/design/typography-and-layout), [Scales](/design/scales)
- [Brand and dot sign](/design/brand), [Brand assets](/design/brand-assets), [Accessibility](/design/accessibility)
- [Figma file map](/design/figma)
- Gallery: [Colour](/library/index.html#/foundations/colour)
- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md), sections 2.1 to 2.5 and 8
