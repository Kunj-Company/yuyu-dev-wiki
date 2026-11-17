/**
 * Class strings shared by server and client components. Kept out of
 * "use client" modules: a server component importing a plain value from a
 * client module receives a client reference instead of the value.
 */

/** Shared look for text inputs, textareas, and selects (docs/DESIGN.md §4.2). */
export const controlClasses =
  "block w-full rounded-md border border-line-strong bg-canvas px-3.5 py-[11px] text-base text-ink placeholder:text-ink-disabled transition-colors duration-[180ms] ease-yy hover:border-ink-muted focus:border-[var(--yy-focus)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yy-focus)] disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted aria-[invalid=true]:border-danger-fg read-only:bg-subtle read-only:border-line";
