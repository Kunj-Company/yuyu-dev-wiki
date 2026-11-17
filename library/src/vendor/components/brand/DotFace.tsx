import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { DotGrid } from "./DotGrid";
import { FACES, type DotFaceMood } from "./patterns";

/** Moods with eyes in the top rows; the others (love, done, waiting) skip the blink. */
const BLINKING: ReadonlySet<DotFaceMood> = new Set(["happy", "cheering", "wink", "surprised", "thinking", "sleepy", "sad"]);

/**
 * Dot faces on a 7×7 grid. Happy: hello. Cheering: "You're in!". Wink:
 * checked in. Love: feedback. Done: all set. Waiting: waitlist. Surprised:
 * event full. Thinking: loading. Sleepy: empty states. Sad: errors.
 *
 * With `hover` (the default), hovering the face or any `.group` ancestor
 * ripples the dots out from the centre, blinks the eyes and lifts the face
 * (see `.yy-face` in globals.css). Mouse only; still under reduced motion.
 */
export function DotFace({
  mood,
  size = 136,
  label,
  className,
  colors,
  hover = true,
}: {
  mood: DotFaceMood;
  size?: number;
  label?: string;
  className?: string;
  colors?: Partial<Record<string, string>>;
  hover?: boolean;
}) {
  const blinks = BLINKING.has(mood);
  // 7 dots + 6 quarter-dot gaps = 8.5 dots across.
  return (
    <DotGrid
      pattern={FACES[mood]}
      dot={size / 8.5}
      label={label}
      className={cn(hover && "yy-face", className)}
      colors={colors}
      cellClassName={hover ? (cell, row) => cn("yy-face-dot", blinks && cell === "O" && row >= 1 && row <= 2 && "yy-face-eye") : undefined}
      cellStyle={hover ? (_cell, row, column) => ({ "--yy-face-delay": `${Math.round(Math.hypot(row - 3, column - 3) * 45)}ms` }) as CSSProperties : undefined}
    />
  );
}
