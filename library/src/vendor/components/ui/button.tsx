import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "accent" | "secondary" | "quiet" | "danger" | "dangerQuiet" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-[180ms] ease-yy active:scale-[0.98] disabled:pointer-events-none aria-disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:opacity-90",
  accent: "bg-accent text-on-accent hover:opacity-90",
  secondary: "border border-line-strong bg-canvas text-ink hover:bg-subtle",
  quiet: "text-ink-secondary hover:text-ink hover:underline underline-offset-4",
  danger: "border-[1.5px] border-danger-fg bg-canvas text-danger-fg hover:bg-danger-bg",
  dangerQuiet: "text-danger-fg hover:underline underline-offset-4",
  inverse: "bg-on-inverse text-inverse hover:opacity-90",
};

const disabledVariants: Partial<Record<ButtonVariant, string>> = {
  primary: "disabled:bg-emphasis disabled:text-ink-muted aria-disabled:bg-emphasis aria-disabled:text-ink-muted",
  accent: "disabled:bg-emphasis disabled:text-ink-muted aria-disabled:bg-emphasis aria-disabled:text-ink-muted",
  secondary: "disabled:text-ink-muted aria-disabled:text-ink-muted",
  danger: "disabled:border-line-strong disabled:text-ink-muted",
  inverse: "disabled:bg-emphasis disabled:text-ink-muted",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-[7px] text-sm",
  md: "min-h-11 px-[18px] py-2.5 text-[15px]",
  lg: "min-h-[52px] px-6 py-3.5 text-[17px]",
};

const quietSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-1.5 text-sm",
  md: "min-h-11 px-2 text-[15px]",
  lg: "min-h-[52px] px-2.5 text-[17px]",
};

export function buttonClasses(options: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  const { variant = "secondary", size = "md", fullWidth = false, className } = options;
  const quiet = variant === "quiet" || variant === "dangerQuiet";
  return cn(base, variants[variant], disabledVariants[variant], quiet ? quietSizes[size] : sizes[size], fullWidth && "w-full", className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** Render the child element (e.g. a Next.js <Link>) with button styling. */
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", fullWidth, loading = false, loadingLabel, startIcon, endIcon, asChild = false, className, children, disabled, type, ...props },
  ref,
) {
  const classes = buttonClasses({ variant, size, fullWidth, className });
  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <button ref={ref} type={type ?? "button"} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? (
        <>
          <Spinner className="size-4" />
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        <>
          {startIcon ? <span aria-hidden className="inline-flex shrink-0 [&>svg]:size-[18px]">{startIcon}</span> : null}
          {children}
          {endIcon ? <span aria-hidden className="inline-flex shrink-0 [&>svg]:size-[18px]">{endIcon}</span> : null}
        </>
      )}
    </button>
  );
});

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: icon-only buttons must be named for assistive technology. */
  label: string;
  variant?: "quiet" | "secondary" | "danger" | "primary";
  size?: "sm" | "md";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "quiet", size = "md", className, children, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-[180ms] ease-yy disabled:pointer-events-none disabled:text-ink-disabled [&_svg]:size-[18px]",
        size === "sm" ? "size-9" : "size-11",
        variant === "quiet" && "text-ink-secondary hover:bg-emphasis hover:text-ink",
        variant === "secondary" && "border border-line-strong bg-canvas text-ink hover:bg-subtle",
        variant === "danger" && "text-danger-fg hover:bg-danger-bg",
        variant === "primary" && "bg-primary text-on-primary hover:opacity-90",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
