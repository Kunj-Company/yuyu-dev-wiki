import { DotGrid } from "./DotGrid";
import { ICONS, type DotIconName } from "./patterns";

/** Product spot icons on a 7×7 grid (54px master: 6px dots, 2px gaps). Ink dots follow the theme. */
export function DotIcon({ name, size = 54, label, className, colors }: { name: DotIconName; size?: number; label?: string; className?: string; colors?: Partial<Record<string, string>> }) {
  // 7 dots + 6 gaps of a third of a dot = 9 dots across.
  const dot = size / 9;
  return <DotGrid pattern={ICONS[name]} dot={dot} gap={dot / 3} label={label} className={className} colors={colors} />;
}
