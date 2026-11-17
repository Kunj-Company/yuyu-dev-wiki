# Design principles and voice

Yuyu's design direction is called **A+ ("Commons, refined")**. This page covers the intent behind it, the voice rules for copy, and a quick guide to which pattern to reach for. The values themselves live in [Design tokens](/design/tokens), and the primary source is `docs/DESIGN.md` in the Yuyu repository (currently version 1.2).

Yuyu is a free, open-source, self-hostable platform for running free community events: no tickets, payments or ad trackers. Most organisers are volunteers and small groups, not ops teams, and most attendees open an event link on a phone. The UI is designed for them.

## Key files

| Path | Role |
| --- | --- |
| `docs/DESIGN.md` | Source of truth for tokens, components, page patterns, voice and dark mode |
| `app/styles/tokens.css` | The tokens, as `--yy-*` custom properties |
| `app/globals.css` | Tailwind 4 theme mapping and the type scale |
| `components/ui/*`, `components/brand/*`, `components/chrome/*` | The shared building blocks |
| `lib/format/datetime.ts` | The one date and time formatter |

## The five principles

1. **Welcoming, like a neighbourhood.** Plain words, generous spacing, rounded shapes, friendly type. It should never feel like an admin console.
2. **Yuyu steps back; the event leads.** Yuyu's own chrome is quiet neutrals. On event-facing pages the organiser's accent colour, cover and logo carry the identity.
3. **Bold only where it earns it.** Big tight display type and colour moments are reserved for event titles, the ticket, success states (you're in, checked in, certificate) and Yuyu's own marketing pages. Dashboards and forms stay calm.
4. **Simple for volunteers.** One obvious primary action per view. Destructive actions look different and confirm before acting.
5. **Accessible by default.** WCAG AA contrast, real form controls, keyboard access, and a layout that works at 360px wide. See [Accessibility](/design/accessibility).

## Whose colour is it?

The most common design mistake is applying the wrong identity to a surface. The rule is a split between Yuyu's chrome and the organiser's event.

| Surface | Identity | Notes |
| --- | --- | --- |
| App shell, dashboard, auth, Yuyu marketing pages | Yuyu: neutrals and ink (`--yy-primary`) | Never uses an event accent |
| Event pages, programme, session, speaker, series, feedback, ticket, organisation page | Organiser: `--yy-accent` and friends | Set per page root, see [UI patterns](/design/patterns#event-page-accent-theming) |
| An event inside the dashboard | Yuyu chrome, with the event's accent on its own date block and progress bar only | |
| Organiser logos, covers, certificates, accents | Never restyled with Yuyu's brand | The dot sign belongs to Yuyu's own surfaces only |

Organisation and event headers on public pages show the **organiser's** logo and name, not Yuyu's. "Hosted on Idlistack" appears in the footer only, never the top navigation.

## Voice and copy rules

- Plain, warm and short. Second person. Sentence case everywhere: buttons, headings, tabs.
- **Name the action.** "Register — it's free", "Save new password", "Download guest list". Not "Submit" or "OK".
- **Say what happens next.** "We'll send your ticket and the call link here."
- **Errors say what went wrong and how to fix it, without blame.** "This code isn't for Demo Summit. Try searching by name instead."
- **Never show raw internals:** no RRULE strings, no full secret URLs, no seconds in times, no `10/14/2026`.
- Use "organisation" and "organiser" (British spelling, as in the codebase).
- Recurring events are **"Series"** in the dashboard and **"Every Tuesday"** or **"Weekly"** to attendees. Don't mix "Recurring" and "Series".
- Don't over-promise legal or privacy claims beyond what the system enforces.
- No emoji in the UI.
- Destructive confirmations end with an ellipsis on the opening control ("Delete organisation…") and open a dialog.

### Dates and times

All formatting goes through `lib/format/datetime.ts`, using the **event's timezone**. Named styles include `dateBlock`, `dayLong`, `dayShort`, `time`, `timeRange`, `relativeDay` and `relativeTime`. Details of the helper are on the [Frontend](/architecture/frontend#dates-and-numbers) page. The rules for copy:

- Show the timezone abbreviation once per page or section, not on every row.
- Never show seconds and never output US `MM/DD/YYYY`.
- Use relative text for recent timestamps ("2 min ago", "Yesterday") and "13 Oct 2026" for older ones.
- Countdown timers in lists are banned. Use `relativeDay` ("Today", "Tomorrow", "In 9 days").

## When to use what

| You need to... | Use | Not |
| --- | --- | --- |
| Offer the main action in Yuyu's own UI | `Button` `primary`. One per view | Two primaries side by side |
| Offer the main action on an event page | `Button` `accent` | `primary` (it is ink, not the organiser's colour) |
| Offer a second action | `secondary` | A second `primary` |
| Offer a tertiary action (Back, Undo) | `quiet` | A coloured link |
| Confirm something destructive | `ConfirmDialog` with a `danger` confirm button | An inline "Are you sure?" |
| Show a status | `Chip` with a tone, plus a word or icon | Colour alone |
| Tell the user something needs attention | `Callout`, one per page at most | Several stacked banners |
| Show an empty list | `EmptyState` with a next step | A blank area |
| Report the result of a mutation | `useToast`, plus inline `Callout` for form errors | `alert()` |
| Choose one of a few options with consequences | Option cards (Radix radio) | A dropdown |
| Choose one of many options | `Dropdown` | The browser's native `<select>` |
| Toggle an instant setting | `SwitchRow` | A checkbox that needs a Save |
| Pick a colour | `ColorPicker` | `<input type="color">` |

More on each primitive is in [Components](/design/components), and worked examples are in [UI patterns](/design/patterns).

## Don'ts

- Gradient text or gradient buttons, hard-coded blues, floating labels or filled inputs.
- Marigold text. Marigold (`--yy-brand-marigold`) is for dots and fills only.
- Cards inside cards inside cards. Don't nest more than two rounded containers.
- Left-border accent cards, countdown timers, raw RRULE strings or URLs, colour-only status.
- White text on a light accent. `getAccentTokens` handles this for event pages.
- Restyling organiser logos, covers, certificates or accents with Yuyu's brand.
- Hard-coded hex values in components. Use a token.

::: warning
Scroll-reveal and other motion may only enhance. Content must be visible without JavaScript animation, and everything must respect `prefers-reduced-motion`. See [Accessibility](/design/accessibility#reduced-motion).
:::

## Invariants

- **Tokens, not hex.** Components get every colour, radius, shadow and focus colour from `tokens.css` through the Tailwind theme.
- **Test in light, dark and at 360px.** Dark is a full theme, not an inversion filter.
- **One primary action per view.** Destructive actions are never `primary`.
- **Yuyu chrome never wears an event accent.**
- **No external fonts, scripts or image hosts.** Fonts are self-hosted (see [Typography and layout](/design/typography-and-layout)).

## Further reading

- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md)
- [Design tokens](/design/tokens), [Components](/design/components), [Brand and dot sign](/design/brand), [Contribute to the design system](/design/contributing)
- [Frontend](/architecture/frontend)
