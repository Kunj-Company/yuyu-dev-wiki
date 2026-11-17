import { cn } from "@/lib/cn";
import { DotMark } from "./DotMark";

export type DotLockupLayout = "horizontal" | "stacked" | "tagline";
export type DotLockupSize = "sm" | "md" | "lg";

const SIZES: Record<DotLockupSize, { mark: number; text: number; gap: number }> = {
  sm: { mark: 36, text: 26, gap: 10 }, // site header, app shell
  md: { mark: 36, text: 24, gap: 10 }, // footer
  lg: { mark: 60, text: 54, gap: 16 }, // Figma Logo/Lockup master
};

/**
 * Mark + "yuyu" in Bricolage Grotesque 800 (the self-hosted font, never inside
 * an SVG). Horizontal for headers, stacked for square spaces, tagline for
 * marketing. The lockup is one image named "Yuyu" unless `label` is null.
 */
export function DotLockup({ layout = "horizontal", size = "sm", label = "Yuyu", className }: { layout?: DotLockupLayout; size?: DotLockupSize; label?: string | null; className?: string }) {
  const s = layout === "stacked" ? { mark: 72, text: 38, gap: 14 } : layout === "tagline" ? { mark: 60, text: 40, gap: 14 } : SIZES[size];
  const wordmark = (
    <span className="font-display font-extrabold leading-none tracking-[-0.03em] text-ink" style={{ fontSize: s.text }}>
      yuyu
    </span>
  );
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      className={cn("inline-flex shrink-0", layout === "stacked" ? "flex-col items-center" : "items-center", className)}
      style={{ gap: s.gap }}
    >
      <DotMark size={s.mark} label={null} />
      {layout === "tagline" ? (
        <span aria-hidden className="flex flex-col gap-1">
          {wordmark}
          <span className="text-[14px] font-semibold text-ink-secondary">Free events, run by communities</span>
        </span>
      ) : (
        <span aria-hidden>{wordmark}</span>
      )}
    </span>
  );
}
