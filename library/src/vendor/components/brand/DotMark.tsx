import { cn } from "@/lib/cn";
import { DotGrid } from "./DotGrid";
import { MARK, MARK_BRIGHT, MARK_ON_MARIGOLD } from "./patterns";

export type DotMarkVariant = "auto" | "full" | "bright" | "onMarigold" | "mono";

/** Smallest size the mark may be drawn at. */
export const DOT_MARK_MIN_SIZE = 16;

/**
 * The Yuyu dot sign. `auto` uses the full grid at 48px and above and bright
 * dots only below; bright dots under 32px switch to deep marigold for contrast
 * on light backgrounds. Pass `label={null}` when a visible wordmark already
 * names the brand.
 */
export function DotMark({ size = 32, variant = "auto", label = "Yuyu", className }: { size?: number; variant?: DotMarkVariant; label?: string | null; className?: string }) {
  const px = Math.max(DOT_MARK_MIN_SIZE, size);
  // 5 dots + 4 gaps of a quarter dot = 6 dots across.
  const dot = px / 6;
  const resolved = variant === "auto" ? (px >= 48 ? "full" : "bright") : variant;
  const pattern = resolved === "full" ? MARK : resolved === "onMarigold" ? MARK_ON_MARIGOLD : MARK_BRIGHT;
  const colors =
    resolved === "mono"
      ? { X: "currentColor", O: "currentColor" }
      : resolved === "bright" && px < 32
        ? { X: "var(--yy-brand-marigold-small)" }
        : undefined;
  return (
    // Display stays in classes (never inline) so callers can use `hidden md:inline-flex`.
    <span className={cn("inline-flex shrink-0", className)} style={{ width: px, height: px }}>
      <DotGrid pattern={pattern} dot={dot} colors={colors} label={label ?? undefined} />
    </span>
  );
}
