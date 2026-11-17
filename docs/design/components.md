# Components

::: tip Live examples
Every component on this page has runnable examples, copyable code and props in the [Component library](/library/index.html).
:::

The primitives in `components/ui/*` are what every screen is built from. They wrap Radix UI where behaviour is non-trivial, style with Tailwind token classes, and encode the accessibility rules of the design system. Reach for these before writing markup. This page is a catalogue: purpose, key props, variants, a real usage snippet and the main do and don't for each.

## Key files

| File | Exports |
| --- | --- |
| `button.tsx` | `Button`, `IconButton`, `buttonClasses` |
| `spinner.tsx` | `Spinner` |
| `field.tsx` | `Field`, `Input`, `Textarea`, `PrefixInput`, `ReadOnlyValue`, `PasswordInput`, `SearchInput`, `Dropdown`, `controlClasses` |
| `select.tsx` | `Dropdown`, `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectValue`, `SelectLabel`, `SelectSeparator` |
| `styles.ts` | `controlClasses`, kept free of `"use client"` so server components can import it |
| `choice.tsx` | `Checkbox`, `CheckboxField`, `CheckboxCard`, `RadioGroup`, `Radio`, `RadioCard`, `Switch`, `SwitchRow`, `SegmentedControl`, `FilterChip` |
| `dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogClose`, `DialogContent`, `DialogHeader`, `DialogBody`, `DialogFooter`, `ConfirmDialog` |
| `menu.tsx` | `Menu*`, `Tooltip`, `TooltipProvider`, `Popover*` |
| `tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `NavTabs`, `Accordion`, `AccordionItem`, `useActiveTabIntoView`, `activeTabScrollTarget` |
| `table.tsx` | `Table`, `THead`, `TBody`, `TR`, `TH`, `TD` |
| `display.tsx` | `Chip`, `Card`, `CardHeader`, `Callout`, `EmptyState`, `DangerZone`, `Avatar`, `OrgLogo`, `DateBlock`, `ProgressBar`, `StatTile`, `Skeleton`, `PageHeader`, `SectionHeading`, `SettingsRow`, `DetailList`, `initials` |
| `page-number-pager.tsx` | `PageNumberPager` |
| `use-load-more-focus.ts` | `useLoadMoreFocus` |
| `color-picker.tsx` | `ColorPicker` |
| `avatar-image.tsx`, `themed-image.tsx`, `github-mark.tsx` | `AvatarImage`, `ThemedImage`, the GitHub glyph |

Related components outside `ui`: `useToast` and `ToastProvider` in `components/feedback/ToastProvider.tsx`, `ConfirmationDialog` in `components/feedback/ConfirmationDialog.tsx`, and the brand set on [Brand and dot sign](/design/brand).

::: tip
DESIGN.md section 9.3 lists some names that map onto different files here: a status chip is `Chip` with a tone, `SearchField` is `SearchInput`, `PasswordField` is `PasswordInput`, and `EventCard`, `EventRow`, `RegistrationCard` and similar are feature components outside `components/ui`.
:::

## Buttons

### Button

Pill-shaped (`rounded-full`), weight 600. The default variant is `secondary` and the default size is `md`.

| Prop | Values | Notes |
| --- | --- | --- |
| `variant` | `primary`, `accent`, `secondary`, `quiet`, `danger`, `dangerQuiet`, `inverse` | See below |
| `size` | `sm` (min 36px), `md` (min 44px), `lg` (min 52px) | `quiet` variants use tighter horizontal padding |
| `loading`, `loadingLabel` | boolean, string | Disables the button, sets `aria-busy`, swaps content for a `Spinner` and the label (or the children) |
| `startIcon`, `endIcon` | node | Wrapped in `aria-hidden`, SVGs sized to 18px |
| `fullWidth` | boolean | |
| `asChild` | boolean | Renders the child (a `Link`) with button styling through Radix `Slot` |

`type` defaults to `"button"`, so a button inside a form never submits by accident. Pass `type="submit"` explicitly.

| Variant | Look | When |
| --- | --- | --- |
| `primary` | `bg-primary text-on-primary` | One per view: Save, Create, Sign in |
| `accent` | `bg-accent text-on-accent` | Event-facing primary: Register, Send feedback |
| `secondary` | Canvas, 1px `border-line-strong` | Second action: Cancel, Share |
| `quiet` | Text only, underline on hover | Tertiary: Back, Undo |
| `danger` | Canvas, 1.5px danger border and text | Delete organisation… |
| `dangerQuiet` | Danger text only | Revoke, Turn off station |
| `inverse` | `bg-on-inverse text-inverse` | On ink bands |

Disabled `primary`, `accent` and `inverse` use `bg-emphasis` with `text-ink-muted`, so they remain readable. `buttonClasses({ variant, size, fullWidth, className })` returns the class string for links that cannot use `asChild`.

```tsx
<Button type="submit" variant="primary" disabled={pending} loading={pending}>
  Save
</Button>
```

From `components/series/EditSeriesForm.tsx`.

**Do** name the action and keep the width stable while loading. **Don't** use `primary` for a destructive action, or put two `primary` buttons in one view.

### IconButton

A round icon-only button. The `label` prop is required and becomes both `aria-label` and `title`, which is how the accessible-name rule is enforced in the type system.

| Prop | Values |
| --- | --- |
| `label` | Required string |
| `variant` | `quiet` (default), `secondary`, `danger`, `primary` |
| `size` | `sm` (36px), `md` (44px, default) |

```tsx
<IconButton label="Previous month" variant="secondary" size="sm" onClick={prevMonth}><ChevronLeft /></IconButton>
```

From `components/org/OrgEventsContainer.tsx`. `tests/unit/frontend-boundaries.test.ts` asserts this exact label and that `button.tsx` renders `aria-label={label}`.

### Spinner

A decorative SVG spinner. Pair it with visible text such as "Saving…". It is `aria-hidden` unless you pass `label`, in which case it gets `role="status"`.

## Form fields

### Field

Wraps a single control with its label, helper text and error. It clones the child to add `id`, `aria-invalid`, `aria-describedby` and `required`, so the wiring is automatic.

| Prop | Notes |
| --- | --- |
| `label` | Always shown above the field. No floating labels |
| `optional` | Adds a muted "Optional" after the label |
| `helperText` | Muted caption under the control |
| `error` | Replaces the helper. Danger text with an icon, and `aria-invalid` on the control |
| `hideLabel` | Visually hidden but still the accessible name |
| `required`, `id` | Forwarded to the control |

```tsx
<Field label="Capacity per occurrence" optional>
  <Input name="capacity" type="number" min={1} inputMode="numeric" defaultValue={series.capacity ?? ""} />
</Field>
```

From `EditSeriesForm.tsx`. The child must be a single element that accepts `id`.

### Input, Textarea and variants

All share `controlClasses` from `styles.ts`: 1px `border-line-strong`, `rounded-md`, 16px text, `px-3.5 py-[11px]`, a hover border, the focus ring in `--yy-focus`, `aria-invalid` turning the border danger, and a `bg-subtle` disabled or read-only look.

| Component | Purpose |
| --- | --- |
| `Input` | Text input. `forwardRef` |
| `Textarea` | `rows` defaults to 4, `min-h-24`, vertical resize |
| `PrefixInput` | A grey prefix segment joined to the input, for example a URL prefix. Takes a `prefix` prop |
| `ReadOnlyValue` | Value with a lock icon and an optional `action` (for example Copy) |
| `PasswordInput` | Show and hide toggle inside the border. The toggle has `aria-label` and `aria-pressed` |
| `SearchInput` | Pill field with a leading search icon and a clear button. The clear button appears when `onClear` is given and there is a value |

### Dropdown, Select

`Dropdown` is a drop-in replacement for a native `<select>`: `<option>` children, `value` or `defaultValue`, `name`, `required`, and `onChange(event)` with `event.target.value`. It renders the Yuyu listbox (a Radix `Select`) and keeps a visually hidden native select for form posts, `FormData` and form-level change listeners. Empty-string options are supported.

```tsx
<Field label="Audience">
  <Dropdown name="privacyType" defaultValue={series.privacyType}>
    <option value={EventPrivacyType.PUBLIC}>Public</option>
    <option value={EventPrivacyType.HIDDEN_LINK}>Hidden link</option>
  </Dropdown>
</Field>
```

For options with descriptions or groups, use `Select`, `SelectTrigger`, `SelectContent` and `SelectItem` (with a `description` prop) directly.

**Don't** use a native `<select>` or `<input type="color">`. Every dropdown in the app goes through `Dropdown`.

### ColorPicker

A custom colour popover for the event accent: saturation and brightness area, hue slider, hex box, the system eyedropper where the browser has one (Chromium), and a live sample of how buttons and links look with the colour, using `getAccentTokens`. It takes a `trigger` node so it can sit in a row of preset chips.

| Prop | Notes |
| --- | --- |
| `value` | `#RRGGBB`, or an empty string for the default |
| `defaultColor` | Fallback colour |
| `onChange` | Called with a hex string |
| `trigger` | The element that opens the popover |
| `label` | Defaults to "Custom colour" |

## Choice controls

All built on Radix. Selected states use `border-primary` and `bg-primary`; the one exception is `RadioCard`, which uses the accent.

| Component | Purpose | Notes |
| --- | --- | --- |
| `Checkbox` | Bare 20px checkbox | Supports `indeterminate` |
| `CheckboxField` | Checkbox with `label` and `description`; the whole row is clickable | |
| `CheckboxCard` | Option with a description, 1.5px primary border when checked | API scopes, audience pickers |
| `RadioGroup` and `Radio` | Radio list with `value`, `label`, `description` | |
| `RadioCard` | Compact card for a choice such as a 1 to 5 rating | Checked: 1.5px `border-accent` and `bg-accent-soft`. Use inside `RadioGroup` with a grid class |
| `Switch` | 48 by 28 toggle | |
| `SwitchRow` | Label and description on the left, switch on the right, whole row clickable | For instant settings |
| `SegmentedControl` | Pill track with a raised selected segment. `value`, `onValueChange`, `options`, required `ariaLabel`, `size` `sm` or `md` | Sign in or Create account, List or Calendar |
| `FilterChip` | Pill toggle with `aria-pressed`. Takes `selected` | Filters |

```tsx
<SwitchRow label="Required" description="Guests must answer before they can register." checked={draft.required} onCheckedChange={(required) => set({ required })} />
```

From `components/registration/QuestionEditor.tsx`.

## Feedback and status

### Chip

A small pill for a status or label. Long labels truncate to one line. Pass `wrap` when every word matters.

| Prop | Values |
| --- | --- |
| `tone` | `neutral` (default), `success`, `warning`, `danger`, `accent`, `ink`, `outline` |
| `size` | `sm`, `md` (default) |
| `icon` | Node, rendered `aria-hidden` |
| `wrap` | Allows multi-line labels |

Keep to one word where possible (Going, Waitlist, Draft, Published, Free). A chip's colour never carries meaning alone: the label is the status.

### Callout

A banner with an icon, an optional bold title, body and an optional action. One per page at most.

| Prop | Values |
| --- | --- |
| `tone` | `info` (default), `warning`, `success`, `danger` |
| `title`, `children`, `action` | Content |
| `role` | `alert` or `status`, for announcing |

```tsx
{error ? <Callout tone="danger" role="alert">{error}</Callout> : null}
```

From `components/series/CreateSeriesDialog.tsx`.

### EmptyState

A bordered card for an empty list, an error or a not-found message.

| Prop | Notes |
| --- | --- |
| `title` | Short label |
| `children` | One line of explanation, capped at `max-w-md` |
| `action` | Next step buttons |
| `mood` | A `DotFaceMood`. On Yuyu's own screens only |
| `icon` | Alternative to a face |

Give an empty state a next step. Organiser-facing surfaces such as the org page and event schedule leave `mood` out.

### ProgressBar and StatTile

`ProgressBar` takes `value`, `max`, `tone` (`accent`, `ink`, `success`, `warning`) and `label`. It renders `role="progressbar"` with the value attributes, and the fill animates its width over 360ms.

`StatTile` is a label over a large Bricolage number (32px), with optional `hint`, `progress` and an `href` (renders a `Link`). `tone="attention"` gives the warm "needs you" tint.

```tsx
<StatTile label="Outlier scores" value={initial.outliers.total} tone={initial.outliers.total > 0 ? "attention" : "default"} hint="Far from the other judges" />
```

From `components/event-dashboard/panels/JudgingPanelProgress.tsx`.

### Skeleton

An `aria-hidden` pulsing block (`bg-muted`). For route-level loading use `PageLoader` from the brand set instead.

### Toast

Not in `ui`, but part of the same set. `useToast()` returns `showToast(message, severity?, action?, durationMs?)`. Severities are `success`, `error`, `info` and `warning`; `action` is an optional single `{ label, onClick }` such as Undo; the default duration is 5000ms. Errors use `role="alert"` with `aria-live="assertive"`, everything else is polite. The provider is mounted in `components/providers.tsx`.

## Surfaces and display

| Component | Purpose | Key props |
| --- | --- | --- |
| `Card` | Canvas, 1px border, `rounded-lg` | `padding`: `none`, `sm`, `md` (default), `lg`. `as`: `div`, `section`, `article` |
| `CardHeader` | Title (`text-title`), description and action | `titleAs`: `h2`, `h3`, `h4` |
| `DangerZone` | 1.5px `border-danger-border` card for destructive settings | `title`, `description`, `action`, `children` |
| `PageHeader` | Kicker, `h1`, description, actions | |
| `SectionHeading` | `text-h4` heading with description and action | `as`: `h2` or `h3` |
| `SettingsRow` | Label column and field column, divider between rows | `title`, `description` |
| `DetailList` | `dl` of label (overline) and value pairs | `items` |
| `DateBlock` | The signature date tile | `month`, `day`, `tone` (`accent`, `draft`, `ink`), `color` (validated hex), `size` (`sm`, `md`, `lg`), `series` |
| `Avatar` | Photo or 1 to 2 initials on a tint | `size` `xs` to `xl`, `tone` |
| `OrgLogo` | Square logo, initials on ink as fallback | `size` `sm` to `xl` |
| `AvatarImage` | Image that falls back to initials if it fails to load | `src`, `fallback` |
| `ThemedImage` | Light and dark asset pair, switched in CSS | `src`, `darkSrc`, `width`, `height` |

`DateBlock` is `aria-hidden`, so put the date in text next to it. `Avatar` adds an `sr-only` name when `name` is given.

## Dialogs, menus and overlays

### Dialog

Radix dialog with Yuyu styling: `rounded-2xl`, `shadow-float`, a rgba(17, 17, 19, 0.48) overlay, and an in-place open animation (`yy-dialog-in`, 240ms, fading opacity from 0 to 1 while moving from `translateY(8px) scale(0.98)` to none).

| Part | Notes |
| --- | --- |
| `DialogContent` | `size`: `sm` 480px (default), `md` 640px, `lg` 860px, `xl` 1100px. `hideClose` removes the corner close button, which is an `IconButton` labelled "Close" |
| `DialogHeader` | `title` (`text-h3`) and optional `description`. Always renders a `DialogDescription`; with none given it renders the title as `sr-only` |
| `DialogBody` | Scrolls inside the dialog |
| `DialogFooter` | Stacks on phones (secondary under primary), right-aligned from `sm` |

### ConfirmDialog

The standard confirmation for consequential actions. It renders with `role="alertdialog"` and no corner close button.

| Prop | Default |
| --- | --- |
| `open`, `onConfirm`, `onCancel` | Required |
| `title`, `message` | Header text |
| `confirmLabel` | `"Delete"` |
| `cancelLabel` | `"Cancel"` |
| `destructive` | `true`: confirm button is `danger`. `false`: `primary` |
| `loading` | Disables Cancel and shows the pending state on the confirm button |
| `confirmText` | When set, the confirm button stays disabled until the user types that exact text (for example an organisation name) |
| `children` | Extra body content |

`ConfirmationDialog` in `components/feedback/ConfirmationDialog.tsx` is a thin wrapper with the same defaults and a `title: string, message: string` shape, used by older callers.

```tsx
<ConfirmationDialog
  open={deleteOpen}
  title="Delete event series?"
  message={`Delete “${series.title}” and its generated occurrences? This cannot be undone.`}
  confirmLabel="Delete series"
  loading={pending}
  onCancel={() => setDeleteOpen(false)}
  onConfirm={deleteSeries}
/>
```

From `EditSeriesForm.tsx`. Name the confirm button for the action ("Delete series"), not "OK".

### Menu, Tooltip, Popover

- `Menu`, `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuGroup`, `MenuLabel`, `MenuSeparator` wrap Radix dropdown menu. `MenuItem` takes `danger`, `icon` and `description`, and works with `asChild` for links. Items are at least 40px tall; put danger items last.
- `Tooltip` takes `content`, `side` and a trigger child, with a 300ms delay. Mount a `TooltipProvider` once (done in `providers.tsx`). Never put essential information only in a tooltip.
- `Popover`, `PopoverTrigger`, `PopoverContent` (`rounded-lg`, `shadow-float`) back the colour picker and similar panels.

## Navigation

### Tabs

`Tabs`, `TabsList`, `TabsTrigger` and `TabsContent` wrap Radix tabs as underline tabs: a 2px underline on the active tab, ink in the app, or the accent when `TabsTrigger` has `accent`. Triggers are at least 44px tall.

`TabsList` adds scroll behaviour: when tabs overflow it shows a faded arrow on each side that has hidden tabs, and the active tab is scrolled into view inside its row (never the page) by `useActiveTabIntoView`. The hint buttons are skipped in the tab order so arrow-key navigation is unchanged. `activeTabScrollTarget` is the pure helper behind it and is unit-tested.

`NavTabs` is the link-based version for route navigation. It takes `items` (`href`, `label`, `active`) and a required `label` for the `nav` landmark, and sets `aria-current="page"` on the active link.

`Accordion` and `AccordionItem` (`value`, `title`) wrap Radix accordion.

### PageNumberPager

Previous, page numbers and Next, as buttons with 44px targets, for lists that fetch numbered pages through Server Actions. It renders nothing for a single page, names its `nav` through the required `label`, and uses `aria-current` on the current page. Page windows come from `lib/pagination.ts`.

### useLoadMoreFocus

A hook for "Load more" lists. It returns `{ listId, beforeLoadMore }`: put `id={listId}` on the element whose direct children are the rows, call `beforeLoadMore()` in the button's click handler, and pass the rendered row count. After new rows render, focus moves to the first new row, unless the user has already moved focus elsewhere. This keeps keyboard and screen-reader users in place when the button disappears.

## Tables

`Table` wraps a `table` in a rounded, bordered container that scrolls horizontally on its own. When you pass `label`, the wrapper becomes a focusable `role="region"` with that name, so keyboard users can scroll it. `THead`, `TBody`, `TR`, `TH` and `TD` give the standard look: a `bg-subtle` header, 13px muted headers with `scope="col"`, 12px cell padding and `border-emphasis` row separators.

```tsx
<Table label="Ranked projects">
```

From `components/event-dashboard/panels/JudgingPanelResults.tsx`. Always pass `label` for a table that can overflow. A person cell is an avatar, a name and the email once.

## Invariants

- **`IconButton` always has a `label`.** Never put a bare `<button>` with only an icon in the UI.
- **Server components import class strings from `styles.ts`**, not from client modules, because a server component importing a plain value from a client module receives a client reference.
- **Every control has a visible label** (`Field`, or `hideLabel` for the rare case) and error text linked through `aria-describedby`.
- **Compose with `cn()`** and token classes. Don't add inline colours.
- **Don't fork a primitive for one screen.** Extend the primitive or add a variant. See [Contribute to the design system](/design/contributing).

## Further reading

- [Design tokens](/design/tokens), [UI patterns](/design/patterns), [Accessibility](/design/accessibility), [Brand and dot sign](/design/brand)
- [Frontend](/architecture/frontend), [Testing](/reference/testing)
- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md), section 4
