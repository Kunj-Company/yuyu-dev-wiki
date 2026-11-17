# Accessibility

Accessibility is a design principle, not a final pass: WCAG AA contrast, real form controls, keyboard access, and a layout that works at 360px wide. Most of the rules are built into the primitives in `components/ui`, so using them is the main thing a contributor has to do. This page lists the rules, where they are implemented, and the tests that pin them.

## Key files

| Path | Role |
| --- | --- |
| `app/globals.css` | Global focus ring, skip link, reduced-motion rules, selection colour |
| `app/styles/tokens.css` | `--yy-focus` and contrast-checked text tokens |
| `components/ui/button.tsx` | `IconButton` with a required `label` |
| `components/ui/field.tsx` | Label, helper and error wiring |
| `components/ui/dialog.tsx` | `role="alertdialog"` confirmations, always-present dialog description |
| `components/ui/table.tsx`, `tabs.tsx`, `page-number-pager.tsx`, `use-load-more-focus.ts` | Named regions, tab hints, `aria-current`, focus after load more |
| `components/feedback/ToastProvider.tsx` | Live-region announcements |
| `lib/theme/accent.ts` | Contrast guard for organiser colours |
| `tests/unit/frontend-boundaries.test.ts`, `accent-tokens.test.ts`, `brand-dot-grid.test.ts` | Tests that enforce the rules below |

## The checklist

| Rule | How it is met |
| --- | --- |
| Text contrast is at least 4.5:1 (3:1 for text of 24px or more) | Tokens are chosen to pass. `--yy-text-muted` is the lightest allowed body text. Organiser accents go through `getAccentTokens` |
| Status is never colour alone | `Chip` and `Callout` carry a word or an icon. Status backgrounds always pair with a strong foreground |
| Every input has a label | `Field` renders a `<label htmlFor>` and wires `aria-describedby` and `aria-invalid` |
| Real controls | Interactive elements are `<button>` and `<a href>`. Tabs use Radix (`role="tab"`, `aria-selected`), toggles use `aria-pressed`, navigation uses `aria-current` |
| Visible focus on everything | One global `:focus-visible` rule plus the input styles |
| Touch targets of at least 44px | `Button` `md` is 44px, `IconButton` `md` is 44px, tabs are 44px, pager buttons are 44px. Kiosk keys are larger (the brief says at least 64px) |
| Live regions | Check-in results and toasts announce. See below |
| Works at 360px | No horizontal page scroll. Tables scroll in their own box |
| Reduced motion | See below |
| Colour mode | `prefers-color-scheme` drives the default theme, with a manual toggle |

## Focus rings

`app/globals.css` applies one rule to everything:

```css
:focus-visible {
  outline: 2px solid var(--yy-focus);
  outline-offset: 2px;
}
```

- `--yy-focus` is `--yy-primary` by default (ink in light mode, near-white in dark).
- Inside `.yy-accent-scope` it becomes `--yy-accent-text`, so event pages get an accent ring that is already contrast-checked.
- Inputs use the same colour (`focus-visible:outline-[var(--yy-focus)]`) and also change their border. `PrefixInput` uses `focus-within`.
- Never add `outline-none` without an equivalent replacement. The components that remove the default (`Dropdown` items, `MenuItem`, the dialog panel) do so because a highlighted state or a focus-managed container takes over.

## Names for icon-only controls

An icon-only button has no text, so it has no name unless you give it one. Use `IconButton`, whose `label` prop is required and is rendered as `aria-label` and `title`:

```tsx
<IconButton label="Previous month" variant="secondary" size="sm" onClick={prevMonth}><ChevronLeft /></IconButton>
```

Other conventions:

- Decorative icons are `aria-hidden`. `Button` wraps `startIcon` and `endIcon` that way.
- State toggles carry state: `PasswordInput`'s toggle has `aria-label` that flips between "Show password" and "Hide password", plus `aria-pressed`. `FilterChip` sets `aria-pressed`.
- `SegmentedControl` requires `ariaLabel` for the group, and an option may set its own `ariaLabel`.
- `NavTabs` and `PageNumberPager` require a `label` for their `nav` landmark. `Table` takes `label` for a scrollable region.
- A link that opens a new tab says so in `sr-only` text: "(opens in a new tab)".
- `Avatar` includes an `sr-only` name. `DateBlock` is `aria-hidden`, so keep the date in text beside it.
- The brand mark is an image named "Yuyu" (`role="img"`) unless a visible wordmark names it. Dot faces and icons are decorative unless given a `label`.

## Forms

- Label above the field, never floating. Optional fields say "Optional", required fields use `required`.
- Errors are linked: `Field` sets `aria-invalid` on the control and `aria-describedby` to the error or helper. The error text has an icon as well as danger colour.
- A form-level error uses `Callout tone="danger" role="alert"`. The toast also announces.
- Inputs are 16px so iOS doesn't zoom.
- `Dropdown` keeps a hidden native `select` so `required` and form posts work, and passes `aria-invalid`, `aria-describedby` and `aria-required` to the visible trigger.

## Live regions

| Where | Announcement |
| --- | --- |
| `ToastProvider` | `role="alert"` with `aria-live="assertive"` for errors. `role="status"` with `aria-live="polite"` for everything else |
| `LiveTicket` | A polite `role="status"` region announces the check-in |
| Check-in result panel (`EventCheckInClient`) | `role="status"`, which is polite |
| `DotLoader` | `role="status"` with a screen-reader label ("Loading" by default) |
| `Spinner` | `role="status"` only when given a `label`. Otherwise decorative |
| Publishing summary | `role="status"` on the live summary line |
| `DoorStationControls` | A polite, `sr-only` line while the station updates |

Don't use `alert()`. Use `useToast` or an inline `Callout` with a `role`.

## Keyboard

- **Skip link.** `ChromeSwitch` renders `<a class="skip-link" href="#main-content">Skip to main content</a>` for all three chrome kinds, hidden until focused. `AppShell` and `OrganiserChrome` render the `<main id="main-content" tabIndex={-1}>` target it points at. A unit test pins this.
- **Radix primitives** handle dialogs (focus trap and return, Escape), menus, selects, tabs (arrow keys), switches, radios and accordions. Don't reimplement them.
- **Tabs.** Arrow keys move between tabs. The hidden scroll-hint buttons are `tabIndex={-1}` so they don't add stops. `useActiveTabIntoView` scrolls the row, never the page.
- **Tables** with a `label` are focusable regions, so keyboard users can scroll sideways.
- **Load more.** `useLoadMoreFocus` moves focus to the first new row after a "Load more", because the pressed button disables or disappears and focus would otherwise drop to the document.
- **Colour picker.** The saturation and brightness area works with arrow keys, and the hue is a Radix slider.
- **Photo editor, badge designer, calendar.** Drag interactions have keyboard equivalents (arrow keys, Shift for bigger steps). The calendar's month buttons are `IconButton`s and its day cells set `aria-pressed`.
- **Destructive dialogs** use `role="alertdialog"`. The type-to-confirm field is auto-focused.

## Contrast

- Neutral tokens are paired to pass AA: for example `--yy-text-muted` (`#5f5e5a`) on white and `#a1a1aa` on `#111113`.
- `--yy-text-disabled` is for placeholders and disabled labels only. It is not for readable content.
- Status chips pair a soft background with a strong foreground, in both modes.
- White on `--yy-success-solid` (`#15803d`) is about 5.0:1, so text on the solid check-in panel stays readable.
- **Organiser accents** can be any colour, so `getAccentTokens` computes `--yy-on-accent` and `--yy-accent-text`, and checks the text against both the canvas and the soft tint at 4.5:1. Details are on [Design tokens](/design/tokens#accent-colours-and-contrast).
- Marigold is never used for text. It is for dots and fills only.
- QR codes always sit on a white plate, in dark mode too.

::: warning
When you add a colour pairing, check both modes. Dark mode is a full theme with its own values, not an inverted copy.
:::

## Reduced motion

`app/globals.css` contains a global rule:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

On top of that:

- **Content is visible by default.** Scroll-reveal animation may only enhance, never hide content.
- `DotLoader` dots rest on the baseline. `DotFace` hover motion applies only with `(hover: hover)` and no reduced-motion preference, and faces are fully still otherwise.
- Tab scrolling, dashboard tab switching and scroll hints use instant scrolling (`behavior: "auto"`) when reduced motion is set. `AppShell`'s sidebar width transition has `motion-reduce:transition-none`.
- The colour-mode switch is instant (no circular reveal) when reduced motion is set.
- Physical-object animations have reduced versions: the live ticket stub fades instead of ripping, the 404 has no tilt, drag or stamp animation, and the About building note skips straight to the letter.
- Success moments use a single 360ms scale-in, with no confetti.
- Imperative animation sequences must be restart-safe, because React runs effects twice in development. See [Frontend](/architecture/frontend#invariants).

## Tests that enforce it

| Test | What it checks |
| --- | --- |
| `tests/unit/frontend-boundaries.test.ts` | `IconButton` renders `aria-label={label}`, and the calendar buttons are named "Previous month" and "Next month" and use `type="button"` and `aria-pressed`. The skip link target `id="main-content"` exists in `ChromeSwitch`, `AppShell` and `OrganiserChrome`. `prefers-reduced-motion` appears in `globals.css` and `NotFoundPet`. Destructive editors keep their confirmation titles. Error boundaries log only a category in production |
| `tests/unit/accent-tokens.test.ts` | Hex normalisation rejects CSS injection. For nine accents in both schemes, text colours meet 4.5:1 against canvas and soft tint, and white is never used on a light accent |
| `tests/unit/brand-dot-grid.test.ts` | The grid is decorative by default and an image when labelled. The mark is named "Yuyu" unless a wordmark does. Mark sizes follow the 48px, 32px and 16px rules. Hover motion is switchable |
| `tests/unit/chrome-switch.test.ts` | Capability pages get the site chrome, with a main landmark |
| `tests/unit/dashboard-loading-boundaries.test.ts` | `loading.tsx` only where it is safe, so access checks still produce real 404 and redirect responses |
| `tests/unit/color-space.test.ts` | The colour picker's maths, including keyboard nudges staying inside the square |

At the verified commit there is no automated axe or Lighthouse accessibility scan in `package.json`. Manual checks matter: tab through the page, test with a screen reader where the change is about structure or announcements, and view the result in light and dark and at 360px.

## Invariants

- **Use `IconButton`** for icon-only buttons. A bare icon `<button>` is a bug.
- **Use `Field`** for labelled controls.
- **Keep the global focus rule.** Don't override outlines without a replacement.
- **Never convey state by colour alone.**
- **Respect reduced motion** in every new animation, and never hide content behind it.
- **One `main-content` landmark** per page, reachable from the skip link.

## Further reading

- [Design principles](/design/principles), [Components](/design/components), [Design tokens](/design/tokens), [UI patterns](/design/patterns)
- [Frontend](/architecture/frontend), [Testing](/reference/testing)
- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md), sections 7 and 8
