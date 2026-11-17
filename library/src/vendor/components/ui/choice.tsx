"use client";

import { forwardRef, useId, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

/* ---------- Checkbox ---------- */

export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] border-line-strong bg-canvas transition-colors duration-[120ms] ease-yy hover:border-ink-muted disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-on-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-on-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {props.checked === "indeterminate" ? <Minus aria-hidden className="size-3.5" strokeWidth={3} /> : <Check aria-hidden className="size-3.5" strokeWidth={3} />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

/** Checkbox with a label (and optional description) on the right; the whole row is clickable. */
export function CheckboxField({
  label,
  description,
  className,
  id,
  ...props
}: ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { label: ReactNode; description?: ReactNode }) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Checkbox id={controlId} aria-describedby={description ? `${controlId}-desc` : undefined} className="mt-0.5" {...props} />
      <label htmlFor={controlId} className="min-w-0 cursor-pointer select-none text-body-ui text-ink">
        {label}
        {description ? <span id={`${controlId}-desc`} className="block text-caption text-ink-muted">{description}</span> : null}
      </label>
    </div>
  );
}

/** Option with a description, selected with a 1.5px ink border (API scopes, audience pickers). */
export function CheckboxCard({
  label,
  description,
  className,
  id,
  ...props
}: ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { label: ReactNode; description?: ReactNode }) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <label
      htmlFor={controlId}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-canvas p-4 transition-colors duration-[180ms] ease-yy hover:bg-subtle has-[[data-state=checked]]:border-[1.5px] has-[[data-state=checked]]:border-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
        className,
      )}
    >
      <Checkbox id={controlId} className="mt-0.5" {...props} />
      <span className="min-w-0">
        <span className="block text-label text-ink">{label}</span>
        {description ? <span className="block text-caption text-ink-muted">{description}</span> : null}
      </span>
    </label>
  );
}

/* ---------- Radio ---------- */

export const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>>(function RadioGroup(
  { className, ...props },
  ref,
) {
  return <RadioGroupPrimitive.Root ref={ref} className={cn("flex flex-col gap-2.5", className)} {...props} />;
});

export function Radio({
  value,
  label,
  description,
  id,
  disabled,
  className,
}: {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <RadioGroupPrimitive.Item
        id={controlId}
        value={value}
        disabled={disabled}
        className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-strong bg-canvas hover:border-ink-muted disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary"
      >
        <RadioGroupPrimitive.Indicator className="block size-2.5 rounded-full bg-primary" />
      </RadioGroupPrimitive.Item>
      <label htmlFor={controlId} className="min-w-0 cursor-pointer select-none text-body-ui text-ink">
        {label}
        {description ? <span className="block text-caption text-ink-muted">{description}</span> : null}
      </label>
    </div>
  );
}

/** Compact option card (e.g. a 1–5 rating); use inside RadioGroup with a row/grid className. */
export function RadioCard({ value, label, description, disabled, className }: { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean; className?: string }) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      disabled={disabled}
      className={cn(
        "flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-line bg-canvas px-3 py-3 text-center transition-colors duration-[180ms] ease-yy hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[1.5px] data-[state=checked]:border-accent data-[state=checked]:bg-accent-soft",
        className,
      )}
    >
      <span className="break-words text-[17px] font-bold leading-tight text-ink">{label}</span>
      {description ? <span className="text-caption text-ink-muted">{description}</span> : null}
    </RadioGroupPrimitive.Item>
  );
}

/* ---------- Switch ---------- */

export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>>(function Switch(
  { className, ...props },
  ref,
) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-line-strong transition-colors duration-[180ms] ease-yy disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-[22px] translate-x-[3px] rounded-full bg-canvas shadow-segment transition-transform duration-[180ms] ease-yy data-[state=checked]:translate-x-[23px]" />
    </SwitchPrimitive.Root>
  );
});

/** Label + description on the left, switch on the right, whole row clickable. */
export function SwitchRow({
  label,
  description,
  className,
  id,
  ...props
}: ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & { label: ReactNode; description?: ReactNode }) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <label htmlFor={controlId} className="min-w-0 flex-1 cursor-pointer select-none">
        <span className="block text-label text-ink">{label}</span>
        {description ? <span className="block text-caption text-ink-muted">{description}</span> : null}
      </label>
      <Switch id={controlId} {...props} />
    </div>
  );
}

/* ---------- Segmented control ---------- */

type SegmentedOption<T extends string> = { value: T; label: ReactNode; icon?: ReactNode; ariaLabel?: string };

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  size = "md",
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => next && onValueChange(next as T)}
      aria-label={ariaLabel}
      className={cn("inline-flex rounded-full bg-muted p-1", className)}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          aria-label={option.ariaLabel}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold text-ink-muted transition-[background-color,color,box-shadow] duration-[180ms] ease-yy hover:text-ink data-[state=on]:bg-canvas data-[state=on]:text-ink data-[state=on]:shadow-segment [&_svg]:size-4",
            size === "sm" ? "min-h-8 px-3 text-[13px]" : "min-h-9 px-4 text-sm",
          )}
        >
          {option.icon}
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}

/* ---------- Filter chip ---------- */

export const FilterChip = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }>(function FilterChip(
  { selected, className, children, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors duration-[180ms] ease-yy [&_svg]:size-4",
        selected ? "border-[1.5px] border-primary bg-primary text-on-primary" : "border-line-strong bg-canvas text-ink-secondary hover:bg-subtle hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
