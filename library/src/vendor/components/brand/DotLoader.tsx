import { cn } from "@/lib/cn";

/** Two marigold dots and an ink dot, hopping left to right in turn. */
const DOTS = [
  { colour: "bg-brand-marigold", jumpDelay: 0 },
  { colour: "bg-brand-marigold", jumpDelay: 160 },
  { colour: "bg-ink", jumpDelay: 320 },
] as const;

/**
 * Loading indicator: three dots jumping in sequence. `size` is
 * the overall width. With reduced motion the dots sit still. Announces
 * `label` politely.
 */
export function DotLoader({ size = 48, label = "Loading", className }: { size?: number; label?: string; className?: string }) {
  const dot = size / 4.2;
  return (
    <span role="status" className={cn("inline-flex flex-col items-center", className)}>
      <span
        aria-hidden="true"
        className="flex items-end"
        style={{ gap: dot * 0.6, height: dot * 1.8 }}
      >
        {DOTS.map(({ colour, jumpDelay }, index) => (
          <span
            key={index}
            className={cn("yy-dot-loader-jump block shrink-0 rounded-full", colour)}
            style={{ width: dot, height: dot, animationDelay: `${jumpDelay}ms` }}
          />
        ))}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Route-level loading state: the dot loader fixed in the centre of the viewport. */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <DotLoader size={56} label={label} />
    </div>
  );
}
