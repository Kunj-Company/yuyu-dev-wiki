import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Copy, Download, ImageDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { DOT_WORDMARK, FACE_MOODS, FACES, ICON_NAMES, ICONS, MARK, MARK_BRIGHT, MARK_ON_MARIGOLD, parsePattern, type DotFaceMood, type DotIconName } from "@/components/brand/patterns";
import { assetUrl, downloadBlob, downloadText, useCopy } from "./lib";
import { animatedFaceSvg } from "./animated-face";

/*
 * Shared SVG helpers for the Foundations pages.
 *
 * Yuyu's dot components (DotGrid) draw CSS grids of round spans, not <svg>, so
 * there is no SVG to serialise from the DOM. These helpers rebuild the same
 * drawings as real SVG from the very same pattern strings and the same
 * geometry (dot size, gap = dot/4 for marks and faces, dot/3 for icons) and
 * resolve the brand tokens to hex for light and dark. Where Yuyu ships a master
 * file (public/brand) the pages use that file; the rest is generated here.
 */

export type Theme = "light" | "dark";

/** Brand tokens resolved to hex (tokens.css: --yy-brand-*). */
export const PALETTE: Record<Theme, Record<string, string>> = {
  light: { X: "#FFB547", O: "#18181B", ".": "#E7E6E2", D: "#E8930C", W: "#FFFFFF", m: "#F0A537" },
  dark: { X: "#FFB547", O: "#F4F4F5", ".": "#2A2A2E", D: "#E8930C", W: "#FFFFFF", m: "#F0A537" },
};
const INK: Record<Theme, string> = { light: "#18181B", dark: "#F4F4F5" };
const INK_SECONDARY: Record<Theme, string> = { light: "#3F3F46", dark: "#D4D4D8" };
const MARIGOLD = "#FFB547";
const TILE_INK = "#18181B";

const n = (v: number) => String(Math.round(v * 1000) / 1000);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

type Tile = { fill: string; radius: number; pad: number; stroke?: string };
type PatternOptions = { pattern: string; dot: number; gap?: number; theme?: Theme; colors?: Record<string, string>; x?: number; y?: number };

/** The circles of a pattern as SVG markup, and the size of the grid in the same units. */
function circles({ pattern, dot, gap = dot / 4, theme = "light", colors, x = 0, y = 0 }: PatternOptions) {
  const rows = parsePattern(pattern);
  const cols = rows[0]?.length ?? 0;
  const palette = { ...PALETTE[theme], ...colors };
  const out: string[] = [];
  rows.forEach((row, r) =>
    row.forEach((cell, c) => {
      const fill = palette[cell];
      if (cell === " " || !fill) return;
      out.push(`<circle cx="${n(x + c * (dot + gap) + dot / 2)}" cy="${n(y + r * (dot + gap) + dot / 2)}" r="${n(dot / 2)}" fill="${fill}"/>`);
    }),
  );
  return { markup: out.join("\n  "), width: cols * dot + (cols - 1) * gap, height: rows.length * dot + (rows.length - 1) * gap };
}

function wrap(width: number, height: number, title: string, body: string, size?: number) {
  const px = size ? ` width="${n(size)}" height="${n((size * height) / width)}"` : ` width="${n(width)}" height="${n(height)}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg"${px} viewBox="0 0 ${n(width)} ${n(height)}" role="img" aria-label="${esc(title)}">\n  <title>${esc(title)}</title>\n  ${body}\n</svg>\n`;
}

/** A dot pattern as a standalone SVG. `tile` adds a rounded square behind it. */
export function patternSvg(opts: PatternOptions & { title: string; size?: number; tile?: Tile }) {
  const { markup, width, height } = circles({ ...opts, x: (opts.tile?.pad ?? 0) + (opts.x ?? 0), y: (opts.tile?.pad ?? 0) + (opts.y ?? 0) });
  const pad = opts.tile?.pad ?? 0;
  const W = width + pad * 2;
  const H = height + pad * 2;
  const bg = opts.tile ? `<rect width="${n(W)}" height="${n(H)}" rx="${n(opts.tile.radius)}" fill="${opts.tile.fill}"${opts.tile.stroke ? ` stroke="${opts.tile.stroke}"` : ""}/>\n  ` : "";
  return wrap(W, H, opts.title, bg + markup, opts.size);
}

export type MarkVariant = "full" | "bright" | "onMarigold" | "mono";

/** The four marks on the 120-unit master grid (dot 20, gap 5), like public/brand/mark-*.svg. */
export function markSvg(variant: MarkVariant, theme: Theme = "light", size?: number) {
  const base = { dot: 20, theme, title: "Yuyu", size };
  switch (variant) {
    case "full":
      return patternSvg({ ...base, pattern: MARK });
    case "bright":
      return patternSvg({ ...base, pattern: MARK_BRIGHT });
    case "mono":
      return patternSvg({ ...base, pattern: MARK_BRIGHT, colors: { X: INK[theme], O: INK[theme] } });
    case "onMarigold":
      // Ink Y on a marigold tile; the tile is part of the file so it works on any background.
      return patternSvg({ ...base, pattern: MARK_ON_MARIGOLD, theme: "light", colors: { O: TILE_INK }, tile: { fill: MARIGOLD, radius: 36, pad: 20 } });
  }
}

/** "yuyu" in Bricolage Grotesque 800 at 54px, outlined (from public/brand/lockup-horizontal.svg), so no font is needed. */
const WORD_PATH = "M14.31 9.94Q12.15 9.94 9.88 9.56Q7.61 9.18 5.59 8.45Q3.56 7.72 2.11 6.53L4.21 -1.19Q6.1 0.59 8.78 1.46Q11.45 2.32 13.93 2.32Q16.79 2.32 18.66 1.22Q20.52 0.11 21.52 -2.19Q22.52 -4.48 22.68 -7.88L22.95 -12.58L21.65 -12.58Q21.17 -9.07 19.95 -6.86Q18.74 -4.64 16.88 -3.59Q15.01 -2.54 12.47 -2.54Q9.34 -2.54 7.24 -4.1Q5.13 -5.67 4.08 -8.83Q3.02 -11.99 3.02 -16.69L3.02 -28.51L11.77 -28.51L11.77 -18.85Q11.77 -13.88 12.77 -11.74Q13.77 -9.61 15.93 -9.61Q17.06 -9.61 17.98 -10.26Q18.9 -10.91 19.55 -12.1Q20.2 -13.28 20.55 -14.98Q20.9 -16.69 20.9 -18.79L20.9 -28.51L29.59 -28.51L29.59 -7.56Q29.59 -4.16 28.97 -1.35Q28.35 1.46 27.14 3.56Q25.92 5.67 24.08 7.1Q22.25 8.53 19.82 9.23Q17.39 9.94 14.31 9.94Z M44.46 0.76Q39.39 0.76 36.82 -2.67Q34.26 -6.1 34.26 -13.12L34.26 -28.51L43 -28.51L43 -14.26Q43 -10.26 44.19 -8.29Q45.38 -6.32 47.81 -6.32Q49.27 -6.32 50.32 -7.05Q51.37 -7.78 52.1 -9.1Q52.83 -10.42 53.18 -12.15Q53.53 -13.88 53.53 -15.93L53.53 -28.51L62.23 -28.51L62.23 -11.56L62.23 0L55.32 0L55.15 -8.8L54.07 -8.8Q53.26 -5.45 52.05 -3.32Q50.83 -1.19 49 -0.22Q47.16 0.76 44.46 0.76Z M78.17 9.94Q76.01 9.94 73.74 9.56Q71.47 9.18 69.45 8.45Q67.42 7.72 65.96 6.53L68.07 -1.19Q69.96 0.59 72.63 1.46Q75.3 2.32 77.79 2.32Q80.65 2.32 82.51 1.22Q84.38 0.11 85.38 -2.19Q86.37 -4.48 86.54 -7.88L86.81 -12.58L85.51 -12.58Q85.02 -9.07 83.81 -6.86Q82.59 -4.64 80.73 -3.59Q78.87 -2.54 76.33 -2.54Q73.2 -2.54 71.09 -4.1Q68.99 -5.67 67.93 -8.83Q66.88 -11.99 66.88 -16.69L66.88 -28.51L75.63 -28.51L75.63 -18.85Q75.63 -13.88 76.63 -11.74Q77.63 -9.61 79.79 -9.61Q80.92 -9.61 81.84 -10.26Q82.76 -10.91 83.4 -12.1Q84.05 -13.28 84.4 -14.98Q84.75 -16.69 84.75 -18.79L84.75 -28.51L93.45 -28.51L93.45 -7.56Q93.45 -4.16 92.83 -1.35Q92.21 1.46 90.99 3.56Q89.78 5.67 87.94 7.1Q86.1 8.53 83.67 9.23Q81.24 9.94 78.17 9.94Z M108.32 0.76Q103.24 0.76 100.68 -2.67Q98.11 -6.1 98.11 -13.12L98.11 -28.51L106.86 -28.51L106.86 -14.26Q106.86 -10.26 108.05 -8.29Q109.24 -6.32 111.67 -6.32Q113.12 -6.32 114.18 -7.05Q115.23 -7.78 115.96 -9.1Q116.69 -10.42 117.04 -12.15Q117.39 -13.88 117.39 -15.93L117.39 -28.51L126.08 -28.51L126.08 -11.56L126.08 0L119.17 0L119.01 -8.8L117.93 -8.8Q117.12 -5.45 115.9 -3.32Q114.69 -1.19 112.85 -0.22Q111.02 0.76 108.32 0.76Z";
const WORD_SIZE = 54;
const WORD_BASELINE = 0.83; // baseline as a fraction of the font size within a leading-none line box
const WORD_INK_CENTRE = 64.1; // horizontal centre of the glyph outlines at 54px
const word = (x: number, baseline: number, size: number, theme: Theme) => `<path transform="translate(${n(x)} ${n(baseline)}) scale(${n(size / WORD_SIZE)})" fill="${INK[theme]}" d="${WORD_PATH}"/>`;

export type LockupLayout = "horizontal" | "stacked" | "tagline";

/**
 * Mark + wordmark with DotLockup's proportions: horizontal is the lg master
 * (mark 60, text 54, gap 16), stacked is mark 72 / text 38 / gap 14, tagline is
 * mark 60 / text 40 / gap 14. The wordmark is outlined; the tagline line is
 * live text in Figtree 600 (install Figtree, or it falls back to the system sans).
 */
export function lockupSvg(layout: LockupLayout, theme: Theme = "light") {
  const k = (s: number) => s / WORD_SIZE;
  if (layout === "horizontal") {
    const m = circles({ pattern: MARK, dot: 10, theme });
    return wrap(203, 60, "Yuyu", `${m.markup}\n  ${word(76, 47.82, 54, theme)}`);
  }
  if (layout === "stacked") {
    const W = 90;
    const m = circles({ pattern: MARK, dot: 12, theme, x: (W - 72) / 2 });
    return wrap(W, 126, "Yuyu", `${m.markup}\n  ${word(W / 2 - WORD_INK_CENTRE * k(38), 86 + WORD_BASELINE * 38, 38, theme)}`);
  }
  const m = circles({ pattern: MARK, dot: 10, theme, y: 2.5 });
  const sub = `<text x="74" y="59.4" fill="${INK_SECONDARY[theme]}" font-family="Figtree, 'Figtree Variable', system-ui, sans-serif" font-size="14" font-weight="600">Free events, run by communities</text>`;
  return wrap(300, 65, "Yuyu", `${m.markup}\n  ${word(74, WORD_BASELINE * 40, 40, theme)}\n  ${sub}`);
}

/** "YUYU" spelled in dots (posters, merch, stage screens), dot 12 and gap 4 like public/brand/wordmark-dots.svg. */
export function wordmarkDotsSvg(theme: Theme = "light") {
  return patternSvg({ pattern: DOT_WORDMARK, dot: 12, gap: 4, theme, title: "YUYU" });
}

export const faceSvg = (mood: DotFaceMood, theme: Theme = "light", size?: number) => patternSvg({ pattern: FACES[mood], dot: 20, theme, title: `Yuyu ${mood} face`, size });
export const iconSvg = (name: DotIconName, theme: Theme = "light", size?: number) => patternSvg({ pattern: ICONS[name], dot: 18, gap: 6, theme, title: `Yuyu ${name} icon`, size });

export type AppIconTheme = "ink" | "light" | "marigold";

/** App icon on the 180 grid of public/brand/app-icon.svg: rounded square (radius 42), 114-unit mark, dot 18 and gap 6. */
export function appIconSvg(theme: AppIconTheme, size?: number) {
  const common = { dot: 18, gap: 6, title: "Yuyu", size, pattern: MARK };
  const radius = 42;
  const pad = 33;
  if (theme === "ink") return patternSvg({ ...common, theme: "dark", colors: { O: "#FFFFFF" }, tile: { fill: TILE_INK, radius, pad } });
  if (theme === "light") return patternSvg({ ...common, theme: "light", tile: { fill: "#FAFAF9", radius, pad, stroke: "#E7E6E2" } });
  return patternSvg({ ...common, pattern: MARK_ON_MARIGOLD, theme: "light", colors: { O: TILE_INK }, tile: { fill: MARIGOLD, radius, pad } });
}

/** Favicons: bright dots only, base dot white on an ink tile; pixel-aligned like favicon-32.svg (dot 4, gap 1) and favicon-16.svg (dot 2, gap 1). */
export function faviconSvg(px: 32 | 16, size?: number) {
  const tile = px === 32 ? { fill: TILE_INK, radius: 8, pad: 4 } : { fill: TILE_INK, radius: 2, pad: 1 };
  return patternSvg({ pattern: MARK_BRIGHT, dot: px === 32 ? 4 : 2, gap: 1, theme: "dark", colors: { O: "#FFFFFF" }, title: "Yuyu", size, tile });
}

/** Social avatar: full-bleed ink square (platforms crop it to a circle) with the mark inside the circle-safe zone, like maskable.svg. */
export function avatarSvg(size?: number) {
  return patternSvg({ pattern: MARK, dot: 36, gap: 12, theme: "dark", colors: { O: "#FFFFFF" }, title: "Yuyu", size, tile: { fill: TILE_INK, radius: 0, pad: 142 } });
}

/* ------------------------------------------------------------------ files */

export async function fetchText(path: string): Promise<string> {
  const res = await fetch(assetUrl(path));
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
}
export async function fetchBytes(path: string): Promise<Uint8Array> {
  const res = await fetch(assetUrl(path));
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export const svgDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Intrinsic size from the viewBox. */
export function svgDims(svg: string) {
  const m = svg.match(/viewBox="([\d.\s-]+)"/);
  const [, , w, h] = m ? m[1].trim().split(/\s+/).map(Number) : [0, 0, 100, 100];
  return { width: w, height: h };
}

/** Rasterise an SVG string to a PNG at the given width (height follows the aspect ratio). Transparent unless `background` is set. */
export async function svgToPngBlob(svg: string, width: number, background?: string): Promise<Blob> {
  const { width: w, height: h } = svgDims(svg);
  const height = Math.max(1, Math.round((width * h) / w));
  const sized = svg.replace(/<svg\b([^>]*)>/, (_all, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, "")} width="${width}" height="${height}">`);
  const img = new Image();
  img.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("The browser could not draw this SVG."));
    img.src = svgDataUri(sized);
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed."))), "image/png"));
}

/* --------------------------------------------------------------- generated */

export type GeneratedAsset = { path: string; group: "Logos" | "Icons and faces"; label: string; svg: string };

/** Every SVG generated by this site, as real files (used by the asset kit). */
export function generatedAssets(): GeneratedAsset[] {
  const out: GeneratedAsset[] = [];
  const add = (group: GeneratedAsset["group"], path: string, label: string, svg: string) => out.push({ group, path, label, svg });
  const themes: Theme[] = ["light", "dark"];
  const variants: Array<[MarkVariant, string]> = [["full", "Full grid"], ["bright", "Bright only"], ["mono", "Mono"], ["onMarigold", "On marigold"]];
  for (const [v, label] of variants) {
    for (const t of v === "onMarigold" ? (["light"] as Theme[]) : themes) add("Logos", `logos/mark-${v}${v === "onMarigold" ? "" : `-${t}`}.svg`, `${label} mark${v === "onMarigold" ? "" : `, ${t}`}`, markSvg(v, t));
  }
  for (const layout of ["horizontal", "stacked", "tagline"] as LockupLayout[]) for (const t of themes) add("Logos", `logos/lockup-${layout}-${t}.svg`, `${layout} lockup, ${t}`, lockupSvg(layout, t));
  for (const t of themes) add("Logos", `logos/wordmark-dots-${t}.svg`, `Dot wordmark, ${t}`, wordmarkDotsSvg(t));
  for (const th of ["light", "marigold"] as AppIconTheme[]) add("Logos", `app-icons/app-icon-${th}.svg`, `App icon, ${th}`, appIconSvg(th));
  add("Logos", "app-icons/social-avatar.svg", "Social avatar", avatarSvg());
  for (const m of FACE_MOODS) for (const t of themes) add("Icons and faces", `faces/face-${m}-${t}.svg`, `${m} face, ${t}`, faceSvg(m, t));
  for (const m of FACE_MOODS) for (const t of themes) add("Icons and faces", `faces-animated/face-${m}-${t}-animated.svg`, `${m} face, ${t}, animated`, animatedFaceSvg(m, t));
  for (const name of ICON_NAMES) for (const t of themes) add("Icons and faces", `icons/icon-${name}-${t}.svg`, `${name} icon, ${t}`, iconSvg(name, t));
  return out;
}

/* ---------------------------------------------------------------------- UI */

/** CSS variables that pin the brand tokens to their light values, so a "light" stage stays light inside a dark gallery. */
const LIGHT_VARS = {
  "--yy-bg-canvas": "#ffffff",
  "--yy-bg-subtle": "#fafaf9",
  "--yy-text": "#18181b",
  "--yy-text-secondary": "#3f3f46",
  "--yy-text-muted": "#5f5e5a",
  "--yy-border": "#e7e6e2",
  "--yy-brand-dot-base": "#18181b",
  "--yy-brand-dot-off": "#e7e6e2",
  "--yy-brand-marigold-small": "#e8930c",
  colorScheme: "light",
} as CSSProperties;

/** A preview surface that is always light or always dark, whatever the page theme is. */
export function Stage({ theme, children, className, label }: { theme: Theme; children: ReactNode; className?: string; label?: string }) {
  return (
    <div
      data-stage={theme}
      className={cn("relative flex items-center justify-center overflow-hidden rounded-lg border border-line", theme === "dark" ? "yy-dark-band bg-canvas text-ink" : "bg-white text-[#18181b]", className)}
      style={theme === "light" ? LIGHT_VARS : undefined}
    >
      {label ? <span className={cn("absolute left-2 top-1.5 text-overline uppercase", theme === "dark" ? "text-[#a1a1aa]" : "text-[#5f5e5a]")}>{label}</span> : null}
      {children}
    </div>
  );
}

/** An SVG string drawn as an image. */
export function SvgImg({ svg, width, height, alt = "", className }: { svg: string; width?: number; height?: number; alt?: string; className?: string }) {
  return <img src={svgDataUri(svg)} alt={alt} width={width} height={height} className={cn("h-auto min-w-0 max-w-full", className)} draggable={false} />;
}

const pill = "inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 text-caption text-ink-secondary hover:bg-subtle hover:text-ink disabled:opacity-60";

export type SvgSource = string | { url: string } | (() => string | Promise<string>);

/**
 * Copy SVG, Download SVG and Download PNG (size selectable) for one drawing.
 * `svg` is a string, a file under library/public (`{ url }`, fetched) or a function.
 */
export function AssetActions({ name, svg, pngSizes = [64, 128, 256, 512], defaultPng = 256, pngBackground, className }: { name: string; svg: SvgSource; pngSizes?: number[]; defaultPng?: number; pngBackground?: string; className?: string }) {
  const { copy, isDone } = useCopy();
  const [size, setSize] = useState(defaultPng);
  const [busy, setBusy] = useState<null | "copy" | "svg" | "png">(null);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<{ key: string; promise: Promise<string> } | null>(null);
  const load = () => {
    const key = typeof svg === "string" ? svg : typeof svg === "function" ? "" : svg.url;
    if (!key) return Promise.resolve((svg as () => string | Promise<string>)());
    if (cache.current?.key !== key) {
      const promise = Promise.resolve(typeof svg === "string" ? svg : fetchText((svg as { url: string }).url));
      const entry = { key, promise };
      cache.current = entry;
      promise.catch(() => {
        if (cache.current === entry) cache.current = null;
      });
    }
    return cache.current.promise;
  };
  const run = async (kind: "copy" | "svg" | "png", job: (text: string) => void | Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await job(await load());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };
  const key = `svg:${name}`;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} onPointerEnter={() => void load().catch(() => undefined)}>
      <button type="button" className={pill} disabled={busy === "copy"} onClick={() => run("copy", (t) => copy(t, key))}>
        {isDone(key) ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
        {isDone(key) ? "Copied" : "Copy SVG"}
      </button>
      <button type="button" className={pill} disabled={busy === "svg"} onClick={() => run("svg", (t) => downloadText(`${name}.svg`, t, "image/svg+xml"))}>
        <Download size={13} aria-hidden /> SVG
      </button>
      <span className="inline-flex overflow-hidden rounded-md border border-line">
        <select aria-label={`PNG size for ${name}`} value={size} onChange={(e) => setSize(Number(e.target.value))} className="bg-canvas px-1 py-1 text-caption text-ink-secondary">
          {pngSizes.map((s) => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
        <button type="button" className="inline-flex items-center gap-1 border-l border-line bg-canvas px-2 py-1 text-caption text-ink-secondary hover:bg-subtle hover:text-ink disabled:opacity-60" disabled={busy === "png"} onClick={() => run("png", async (t) => downloadBlob(`${name}-${size}.png`, await svgToPngBlob(t, size, pngBackground)))}>
          <ImageDown size={13} aria-hidden /> PNG
        </button>
      </span>
      {error ? <span role="alert" className="text-caption text-danger-fg">{error}</span> : null}
    </div>
  );
}

/** Format a byte count. */
export const formatBytes = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`);

/** Byte sizes of files under library/public, fetched once (so the numbers never drift from the files). */
export function useFileSizes(paths: string[]) {
  const [sizes, setSizes] = useState<Record<string, number | null>>({});
  const key = paths.join("|");
  useEffect(() => {
    let cancelled = false;
    const queue = key ? key.split("|") : [];
    const worker = async () => {
      for (let p = queue.shift(); p; p = queue.shift()) {
        const path = p;
        let size: number | null = null;
        try {
          size = (await fetchBytes(path)).byteLength;
        } catch {
          size = null;
        }
        if (!cancelled) setSizes((s) => ({ ...s, [path]: size }));
      }
    };
    void Promise.all([worker(), worker(), worker(), worker()]);
    return () => {
      cancelled = true;
    };
  }, [key]);
  return sizes;
}
