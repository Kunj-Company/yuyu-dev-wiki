"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle, Eye, EyeOff, Lock, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { controlClasses } from "./styles";

export { controlClasses };

type FieldProps = {
  label: ReactNode;
  /** Shown in muted text after the label. */
  optional?: boolean;
  helperText?: ReactNode;
  error?: ReactNode;
  /** Visually hide the label but keep it for assistive technology. */
  hideLabel?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  children: ReactElement<Record<string, unknown>>;
};

/** Label above, control, then helper or error text, all wired with ids and ARIA. */
export function Field({ label, optional, helperText, error, hideLabel, className, id, required, children }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? (children.props.id as string | undefined) ?? generatedId;
  const describedBy = error || helperText ? `${controlId}-description` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        "aria-invalid": error ? true : (children.props["aria-invalid"] as boolean | undefined),
        "aria-describedby": [children.props["aria-describedby"], describedBy].filter(Boolean).join(" ") || undefined,
        required: required ?? (children.props.required as boolean | undefined),
      })
    : children;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className={cn("text-label text-ink", hideLabel && "sr-only")}>
        {label}
        {optional ? <span className="ml-1.5 font-normal text-ink-muted">Optional</span> : null}
      </label>
      {control}
      {error ? (
        <p id={describedBy} className="flex items-start gap-1.5 text-caption text-danger-fg">
          <AlertCircle aria-hidden className="mt-px size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={describedBy} className="text-caption text-ink-muted">{helperText}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlClasses, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(controlClasses, "min-h-24 resize-y", className)} {...props} />;
});

/** Every dropdown in the app uses the custom `Dropdown`, never the browser's own picker. */
export { Dropdown } from "./select";

/** Grey prefix segment joined to the input, e.g. `yuyu.idliapps.com/`. */
export const PrefixInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { prefix: string }>(function PrefixInput(
  { prefix, className, ...props },
  ref,
) {
  return (
    <div className="flex w-full overflow-hidden rounded-md border border-line-strong bg-canvas focus-within:border-[var(--yy-focus)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--yy-focus)] has-[[aria-invalid=true]]:border-danger-fg">
      <span className="flex shrink-0 items-center border-r border-line bg-muted px-3 text-[15px] text-ink-muted">{prefix}</span>
      <input ref={ref} className={cn("min-w-0 flex-1 bg-transparent px-3.5 py-[11px] text-base text-ink outline-none", className)} {...props} />
    </div>
  );
});

/** Read-only value with a lock icon (e.g. an email you can't change). */
export function ReadOnlyValue({ id, value, action }: { id?: string; value: ReactNode; action?: ReactNode }) {
  return (
    <div id={id} className="flex items-center gap-2.5 rounded-md border border-line bg-subtle px-3.5 py-[11px] text-base text-ink-secondary">
      <Lock aria-hidden className="size-4 shrink-0 text-ink-muted" />
      <span className="min-w-0 flex-1 truncate">{value}</span>
      {action}
    </div>
  );
}

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} type={visible ? "text" : "password"} className={cn(controlClasses, "pr-12", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-emphasis hover:text-ink"
      >
        {visible ? <EyeOff aria-hidden className="size-[18px]" /> : <Eye aria-hidden className="size-[18px]" />}
      </button>
    </div>
  );
});

/** Pill search field with a leading icon and a clear button. */
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { onClear?: () => void }>(function SearchInput(
  { className, onClear, value, ...props },
  ref,
) {
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);
  return (
    <div className="relative">
      <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-muted" />
      <input
        ref={ref}
        type="search"
        value={value}
        className={cn(controlClasses, "rounded-full pl-11 pr-11 [&::-webkit-search-cancel-button]:appearance-none", className)}
        {...props}
      />
      {onClear && hasValue ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-emphasis hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
});
