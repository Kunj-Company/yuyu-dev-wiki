# Contribute to the design system

This page is the workflow for changing the design system itself: adding a token, a primitive, a brand pattern or a page pattern. The rule of thumb is to reuse first, then extend, and only then add. Every change updates the code, the tests where they exist, and `docs/DESIGN.md` in the Yuyu repository, which is the source of truth.

## Key files

| Path | Change it when |
| --- | --- |
| `app/styles/tokens.css` | You add or change a colour, shadow or other `--yy-*` token |
| `app/globals.css` | You map a token to Tailwind, add a type-scale class, or add shared keyframes |
| `lib/cn.ts` | You add a new `text-*` scale class |
| `components/ui/*` | You add or change a primitive |
| `components/brand/*` | You change the dot sign, faces, icons or loader |
| `lib/theme/accent.ts` | You change how accent colours are derived |
| `docs/DESIGN.md` | Always, for anything a future contributor needs to know |
| `tests/unit/` | You change behaviour that is pinned by a test |

## Before you start

1. Read [Design principles](/design/principles) and the relevant section of `docs/DESIGN.md`.
2. Search for an existing answer: `components/ui`, `components/chrome`, `components/brand`, and the shared-components list in DESIGN.md section 9.3.
3. Decide the smallest change that works. A new variant of a primitive beats a new primitive. A new use of a pattern beats a new pattern.
4. Make sure the change fits the identity split: Yuyu chrome is neutral and event pages carry the organiser's accent ([Principles](/design/principles#whose-colour-is-it)).

## Add a token

1. **Declare it** in `app/styles/tokens.css` with a `--yy-` prefix. Put the light value under `:root, :root[data-color-mode="light"]`.
2. **Add the dark value** in both dark blocks: `:root[data-color-mode="dark"], .yy-dark-band` and the `@media (prefers-color-scheme: dark)` block for `:root:not([data-color-mode])`. If the value is the same in both modes, you can omit it from the dark blocks, as `--yy-success-solid` does.
3. **Map it** in `@theme inline` in `app/globals.css`, for example `--color-surface-tint: var(--yy-surface-tint);`, which yields `bg-surface-tint`. Pick a name that follows the existing families (`canvas`, `ink`, `line`, `accent`).
4. **Check contrast** for any text pairing, in both modes: 4.5:1, or 3:1 for text of 24px or more.
5. **Use it** through the Tailwind class. Never write the hex in a component.
6. **Document it** in DESIGN.md section 2 with its light and dark values and its use.

If the token depends on the organiser's accent, derive it in `lib/theme/accent.ts` and add it to `accentStyle` and `.yy-accent-scope`, then extend `tests/unit/accent-tokens.test.ts`.

::: warning
Verify CSS changes with a clean build (`npm run build`). A stale `.next/cache` can serve old CSS.
:::

### Add a type-scale class

Add the class to `@layer components` in `globals.css` with its mobile size, and its size from 640px inside the `sm` media block. Then add its name to the `font-size` group in `lib/cn.ts`, or `tailwind-merge` will treat it as a colour and drop one of two conflicting classes.

## Add or change a primitive

1. **Check first.** Is there a primitive or a variant that does this? Is it really a ui concern, or a feature component that belongs next to its feature (`components/event`, `components/checkin`)?
2. **Build on Radix** when the behaviour is non-trivial (focus management, keyboard, ARIA): dialogs, menus, selects, tabs, switches. Hand-roll only for presentational pieces.
3. **Style with token classes and `cn()`**. No inline colours, no hard-coded hex, radius from the scale, `ease-yy` and the standard durations for motion.
4. **Encode the accessibility rule in the API.** Make the label a required prop (like `IconButton`'s `label` or `SegmentedControl`'s `ariaLabel`), or wire ARIA automatically (like `Field`). Use `forwardRef` for controls.
5. **Server or client?** Add `"use client"` only for state, effects or Radix. If server components need shared class strings, put them in a file without `"use client"`, like `components/ui/styles.ts`.
6. **Support both modes and 360px.** Verify light, dark and a narrow viewport. Touch targets are at least 44px.
7. **Accept `className`** and merge it last with `cn()`.
8. **Use it** in at least one real screen, so the API is proven by use.
9. **Document it** in DESIGN.md (section 4 for its behaviour, and the section 9.3 list), and on [Components](/design/components) in this wiki.

Skeleton of the usual shape:

```tsx
export const Thing = forwardRef<HTMLDivElement, ThingProps>(function Thing({ tone = "neutral", className, ...props }, ref) {
  return <div ref={ref} className={cn("rounded-lg border border-line bg-canvas", tones[tone], className)} {...props} />;
});
```

Illustrative. Compare with `Chip` and `Card` in `components/ui/display.tsx`.

## Add a brand pattern, face or icon

1. Add the pattern string to `components/brand/patterns.ts` (a face to `FACES` and `FACE_MOODS`, an icon to `ICONS` and `ICON_NAMES`). Faces and icons are 7 by 7, and every row must be the same width.
2. Use only the existing letters (`X`, `O`, `.`, `D`, `W`, `m`) or extend `DOT_COLORS` with a brand token.
3. Faces carry meaning. State what the new mood means and where it is used. If it has eyes in the top rows and should blink, add it to `BLINKING` in `DotFace.tsx`.
4. Extend `tests/unit/brand-dot-grid.test.ts`. It already iterates every face and icon to check the grid size, so a malformed pattern fails there.
5. If the change affects the logo, update the masters in `public/brand/`, run `npm run brand:generate`, and commit both masters and outputs.
6. Update DESIGN.md section 2.3 and [Brand and dot sign](/design/brand).

## Add a pattern

A pattern is a repeatable assembly of primitives, such as the event dashboard's tabs or the "form plus ActionResult plus toast" flow.

1. Build it first in the one place that needs it. Extract only when a second use appears.
2. Follow the existing conventions: Server Components by default, panels rendered on the server, `ActionResult` handled with `useToast` ([UI patterns](/design/patterns)).
3. If it affects layout across pages, record the spec in DESIGN.md section 5, including the states (empty, loading, error) and the mobile behaviour.
4. Add it to [UI patterns](/design/patterns) here when it is reusable.

## Checklist

Copy this into your pull request description.

- [ ] Reused an existing token, primitive or pattern where possible
- [ ] No hard-coded hex values. Light and dark both defined
- [ ] Works in light mode, dark mode and at 360px, with no horizontal page scroll
- [ ] One primary action per view. Destructive actions confirm
- [ ] Controls have visible labels. Icon-only buttons use `IconButton` with a `label`
- [ ] Focus is visible, keyboard works, status is not colour alone
- [ ] Animation respects `prefers-reduced-motion` and never hides content
- [ ] Contrast checked (4.5:1, or 3:1 for 24px and above), including organiser accents on event pages
- [ ] Copy follows the voice rules: sentence case, names the action, no raw internals
- [ ] Event accent used only inside `yy-accent-scope`. Yuyu chrome left neutral
- [ ] Tests added or updated
- [ ] `docs/DESIGN.md` updated (and the version line at the end if the change is substantial)
- [ ] Help article updated if user-visible behaviour changed (`content/help/`)
- [ ] This wiki's design pages updated if tokens, primitives or rules changed

## Tests to run

| Change | Run |
| --- | --- |
| Anything | `npm run lint` and `npm run test:unit` |
| Accent derivation | `npx vitest run tests/unit/accent-tokens.test.ts tests/unit/color-space.test.ts` |
| Brand components | `npx vitest run tests/unit/brand-dot-grid.test.ts` |
| Chrome, skip link, reduced motion | `npx vitest run tests/unit/frontend-boundaries.test.ts tests/unit/chrome-switch.test.ts` |
| A new `loading.tsx` | `npx vitest run tests/unit/dashboard-loading-boundaries.test.ts` |
| CSS or layout | `npm run build` (a clean build), then check the page in a browser |
| User-visible flows | `npm run test:e2e` |

Primitives in `components/ui` mostly have no dedicated unit tests. Several are covered indirectly by the boundary tests above, and one helper, `activeTabScrollTarget`, has its own test. If you add logic to a primitive, extract it as a pure function and test that, as `tabs.tsx` does. More on the test setup is in [Testing](/reference/testing).

## What to update

| You changed | Update |
| --- | --- |
| A token | `tokens.css`, `globals.css`, DESIGN.md section 2, [Design tokens](/design/tokens) |
| A primitive | The component, DESIGN.md section 4 and 9.3, [Components](/design/components) |
| The dot sign | `components/brand`, `public/brand`, DESIGN.md section 2.3, [Brand and dot sign](/design/brand) |
| A rule about accessibility | DESIGN.md section 7, [Accessibility](/design/accessibility) |
| Voice or copy rules | DESIGN.md section 6, [Design principles](/design/principles) |
| The frontend architecture | [Frontend](/architecture/frontend) |

## Invariants

- **Tokens are the single source of truth.** If a value isn't a token, it doesn't belong in a component.
- **Reuse, then extend, then add.**
- **Accessibility lives in the primitive**, not in each caller.
- **Docs change with code.** `docs/DESIGN.md` is read by contributors and agents before they touch the UI.
- **Never weaken the security invariants** while changing the UI: no external scripts, fonts or image hosts, and inline styles only where the CSP allows them.

## Further reading

- [Design principles](/design/principles), [Design tokens](/design/tokens), [Components](/design/components), [Brand and dot sign](/design/brand), [UI patterns](/design/patterns), [Accessibility](/design/accessibility)
- [Frontend](/architecture/frontend#making-changes), [Contributing upstream](/build/contributing), [Testing](/reference/testing)
- [DESIGN.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DESIGN.md)
