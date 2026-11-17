/**
 * Event accent tokens (docs/DESIGN.md §2.5, §9.2).
 *
 * Organisers can pick any colour, so every derived value is contrast-checked.
 * The output is a plain record of CSS custom properties that callers place in
 * an inline `style` on the event page root. Only a validated `#RRGGBB` value
 * ever reaches CSS; anything else falls back to the default accent.
 */

export const DEFAULT_EVENT_ACCENT = "#C2410C"; // Ember
export const INK_ACCENT = "#18181B";

export const ACCENT_PRESETS = [
  { name: "Ember", hex: "#C2410C" },
  { name: "Iris", hex: "#4B3FA8" },
  { name: "Teal", hex: "#0F766E" },
  { name: "Ink", hex: "#18181B" },
] as const;

const LIGHT_CANVAS = "#FFFFFF";
const DARK_CANVAS = "#111113";
const INK = "#18181B";
const WHITE = "#FFFFFF";
const HEX = /^#([0-9a-f]{6})$/i;

type Rgb = [number, number, number];

export function normalizeAccentHex(value: string | null | undefined, fallback = DEFAULT_EVENT_ACCENT): string {
  const trimmed = value?.trim() ?? "";
  if (HEX.test(trimmed)) return trimmed.toUpperCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(trimmed);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase();
  return fallback;
}

function toRgb(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((channel) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function luminance(hex: string): number {
  const channels = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** sRGB colour-mix: `weight` of `a` mixed into `b`. */
export function mix(a: string, b: string, weight: number): string {
  const [ra, ga, ba] = toRgb(a);
  const [rb, gb, bb] = toRgb(b);
  return toHex([ra * weight + rb * (1 - weight), ga * weight + gb * (1 - weight), ba * weight + bb * (1 - weight)]);
}

/** Move `color` towards `target` until it reaches `ratio` against every surface, in small steps. */
function adjustUntil(color: string, target: string, surfaces: string[], ratio: number): string {
  let current = color;
  for (let step = 0; step <= 20; step += 1) {
    if (surfaces.every((surface) => contrastRatio(current, surface) >= ratio)) return current;
    current = mix(target, color, Math.min(1, (step + 1) * 0.05));
  }
  return target;
}

export type AccentScheme = "light" | "dark";

export type AccentTokens = {
  "--yy-accent": string;
  "--yy-accent-soft": string;
  "--yy-on-accent": string;
  "--yy-accent-text": string;
};

export function getAccentTokens(value: string | null | undefined, scheme: AccentScheme, fallback = DEFAULT_EVENT_ACCENT): AccentTokens {
  const accent = normalizeAccentHex(value, fallback);
  const canvas = scheme === "dark" ? DARK_CANVAS : LIGHT_CANVAS;
  const soft = mix(accent, canvas, scheme === "dark" ? 0.14 : 0.08);
  const onAccent = contrastRatio(accent, WHITE) >= 4.5 ? WHITE : INK;
  const accentText = scheme === "dark"
    ? adjustUntil(mix(accent, WHITE, 0.65), WHITE, [canvas, soft], 4.5)
    : adjustUntil(accent, INK, [canvas, soft], 4.5);
  return {
    "--yy-accent": accent,
    "--yy-accent-soft": soft,
    "--yy-on-accent": onAccent,
    "--yy-accent-text": accentText,
  };
}

/**
 * Inline style for an event page root. Light values apply directly; dark
 * values are exposed as `--yy-accent-*-dark` and swapped in by the
 * `.yy-accent-scope` rule in globals.css when dark mode is active.
 */
export function accentStyle(value: string | null | undefined, fallback = DEFAULT_EVENT_ACCENT): Record<string, string> {
  const light = getAccentTokens(value, "light", fallback);
  const dark = getAccentTokens(value, "dark", fallback);
  return {
    "--yy-accent-light": light["--yy-accent"],
    "--yy-accent-soft-light": light["--yy-accent-soft"],
    "--yy-on-accent-light": light["--yy-on-accent"],
    "--yy-accent-text-light": light["--yy-accent-text"],
    "--yy-accent-dark": dark["--yy-accent"],
    "--yy-accent-soft-dark": dark["--yy-accent-soft"],
    "--yy-on-accent-dark": dark["--yy-on-accent"],
    "--yy-accent-text-dark": dark["--yy-accent-text"],
  };
}
