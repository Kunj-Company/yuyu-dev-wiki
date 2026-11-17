"use client";

import {
  Children,
  forwardRef,
  isValidElement,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { controlClasses } from "./styles";

/**
 * Custom select for rich options (descriptions, grouped items). For plain
 * `<option>` lists use `Dropdown`, which wraps these parts.
 */
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<ElementRef<typeof SelectPrimitive.Trigger>, ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(function SelectTrigger(
  { className, children, ...props },
  ref,
) {
  return (
    <SelectPrimitive.Trigger ref={ref} className={cn(controlClasses, "flex items-center justify-between gap-2 text-left data-[placeholder]:text-ink-disabled", className)} {...props}>
      <span className="min-w-0 truncate">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden className="size-[18px] shrink-0 text-ink-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = forwardRef<ElementRef<typeof SelectPrimitive.Content>, ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(function SelectContent(
  { className, children, position = "popper", ...props },
  ref,
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={6}
        className={cn("z-[60] max-h-[min(420px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-line bg-canvas text-ink shadow-float", className)}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { description?: ReactNode }
>(function SelectItem({ className, children, description, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn("relative flex min-h-10 cursor-pointer select-none items-start gap-2 rounded-md py-2 pl-3 pr-9 text-body-ui outline-none data-[disabled]:pointer-events-none data-[disabled]:text-ink-disabled data-[highlighted]:bg-emphasis", className)}
      {...props}
    >
      <span className="min-w-0">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        {description ? <span className="block text-caption text-ink-muted">{description}</span> : null}
      </span>
      <SelectPrimitive.ItemIndicator className="absolute right-3 top-2.5">
        <Check aria-hidden className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});

export function SelectLabel({ children }: { children: ReactNode }) {
  return <SelectPrimitive.Label className="px-3 pb-1 pt-2 text-overline text-ink-muted">{children}</SelectPrimitive.Label>;
}

export function SelectSeparator() {
  return <SelectPrimitive.Separator className="my-1.5 h-px bg-line" />;
}

/* ---------- Dropdown: a drop-in replacement for <select> ---------- */

type DropdownOption = { value: string; label: ReactNode; disabled: boolean };

/** Radix items can't use "" as a value, so empty options get a stand-in. */
const EMPTY = "__yy_empty__";
const toItem = (value: string) => (value === "" ? EMPTY : value);
const fromItem = (value: string) => (value === EMPTY ? "" : value);

function collectOptions(children: ReactNode, into: DropdownOption[] = []): DropdownOption[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const element = child as ReactElement<{ value?: unknown; children?: ReactNode; disabled?: boolean }>;
    if (element.type === "option") {
      const label = element.props.children;
      const value = element.props.value ?? (typeof label === "string" ? label : "");
      into.push({ value: String(value), label, disabled: Boolean(element.props.disabled) });
    } else {
      collectOptions(element.props.children, into);
    }
  });
  return into;
}

/**
 * Styled dropdown with the same API as a native `<select>`: `<option>`
 * children, `value`/`defaultValue`, `name` and `onChange(event)` with
 * `event.target.value`. A visually hidden native select carries the value,
 * so form posts, FormData, `required` and form-level change listeners keep
 * working; the visible part is a Radix listbox in the Yuyu style.
 */
export const Dropdown = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Dropdown(
  { className, children, value, defaultValue, onChange, disabled, id, name, required, form, ...rest },
  ref,
) {
  const nativeRef = useRef<HTMLSelectElement>(null);
  useImperativeHandle(ref, () => nativeRef.current as HTMLSelectElement);
  const options = collectOptions(children);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => String(defaultValue ?? options[0]?.value ?? ""));
  const current = controlled ? String(value ?? "") : inner;
  const selected = options.find((option) => option.value === current);
  const isPlaceholder = !selected || (selected.value === "" && selected.disabled);

  const pick = (next: string) => {
    const select = nativeRef.current;
    if (!select || next === current) return;
    // Set the hidden select's value and fire a real change event, so React's
    // onChange (here and on any parent form) sees a normal select change.
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    setter?.call(select, next);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Pass ARIA wiring (from Field) to the visible trigger.
  const { "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, title, ...nativeRest } = rest;

  return (
    <>
      <select
        ref={nativeRef}
        {...nativeRest}
        name={name}
        form={form}
        required={required}
        disabled={disabled}
        value={current}
        aria-hidden
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => {
          if (!controlled) setInner(event.target.value);
          onChange?.(event);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled} />
        ))}
      </select>
      <Select value={toItem(current)} onValueChange={(next) => pick(fromItem(next))} disabled={disabled}>
        <SelectTrigger
          id={id}
          title={title}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-required={required || undefined}
          data-placeholder={isPlaceholder ? "" : undefined}
          className={className}
        >
          {selected ? selected.label : null}
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={toItem(option.value)} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
});
