import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { CopyButton, Section, downloadText } from "../lib";
import { Stage, formatBytes, svgDataUri } from "../svg-assets";
import type { FoundationMeta } from "../registry";

export const meta: FoundationMeta = {
  slug: "illustrations",
  title: "Illustrations",
  description: "The dot artwork from Yuyu's landing page: icons, step art, swatches and ticket details. Light and dark twins are shown together.",
  order: 23,
};

// The listing comes from the folder at build time, so it cannot drift from the files.
const files = import.meta.glob("/public/assets/illustrations/*.svg", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

type Variant = { file: string; svg: string; w: number; h: number; bytes: number };
type Item = { base: string; group: string; light?: Variant; dark?: Variant };

function variant(file: string, svg: string): Variant {
  const vb = svg.match(/viewBox="[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)"/);
  return { file, svg, w: vb ? Number(vb[1]) : 0, h: vb ? Number(vb[2]) : 0, bytes: new Blob([svg]).size };
}

const ITEMS: Item[] = (() => {
  const map = new Map<string, Item>();
  for (const [path, svg] of Object.entries(files)) {
    const file = path.split("/").pop()!;
    const stem = file.replace(/\.svg$/, "");
    const isDark = stem.endsWith("-dark");
    const base = isDark ? stem.slice(0, -5) : stem;
    const item = map.get(base) ?? { base, group: base.split("-")[0] };
    item[isDark ? "dark" : "light"] = variant(file, svg);
    map.set(base, item);
  }
  return [...map.values()].sort((a, b) => a.base.localeCompare(b.base));
})();

const GROUPS = [...new Set(ITEMS.map((i) => i.group))];
const FILE_COUNT = Object.keys(files).length;

function Actions({ v }: { v: Variant }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <CopyButton value={v.svg} label="Copy SVG" title={`Copy the SVG source of ${v.file}`} />
      <button type="button" onClick={() => downloadText(v.file, v.svg, "image/svg+xml")} className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 text-caption text-ink-secondary hover:bg-subtle hover:text-ink">
        <Download size={13} aria-hidden /> Download
      </button>
    </div>
  );
}

function Preview({ v, theme }: { v: Variant; theme: "light" | "dark" }) {
  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Stage theme={theme} className="h-32 p-3">
        <img src={svgDataUri(v.svg)} alt="" draggable={false} className="max-h-full max-w-full object-contain" style={{ width: v.w ? Math.min(v.w, 96 * Math.max(1, v.w / v.h)) : undefined, height: "auto" }} />
      </Stage>
      <figcaption className="min-w-0">
        <code className="block truncate font-mono text-caption text-ink" title={v.file}>{v.file}</code>
        <span className="text-caption text-ink-muted">{v.w} × {v.h} · {formatBytes(v.bytes)}</span>
      </figcaption>
      <Actions v={v} />
    </figure>
  );
}

function Tile({ item }: { item: Item }) {
  const both = item.light && item.dark;
  return (
    <article className={cn("flex gap-3 rounded-xl border border-line bg-canvas p-3", both ? "sm:col-span-2" : "")}>
      {item.light ? <Preview v={item.light} theme="light" /> : null}
      {item.dark ? <Preview v={item.dark} theme="dark" /> : null}
    </article>
  );
}

export default function Illustrations() {
  const [group, setGroup] = useState<string>("all");
  const [query, setQuery] = useState("");
  const shown = useMemo(() => ITEMS.filter((i) => (group === "all" || i.group === group) && i.base.includes(query.trim().toLowerCase())), [group, query]);
  const count = (g: string) => ITEMS.filter((i) => i.group === g).reduce((n, i) => n + (i.light ? 1 : 0) + (i.dark ? 1 : 0), 0);
  return (
    <>
      <Section title={`${FILE_COUNT} illustrations`} description="Static dot artwork for Yuyu's own pages (the landing page). Each light drawing has a -dark twin where the colours change; they are swapped in the product by ThemedImage. Single drawings are shown on a light stage.">
        <div className="sticky top-0 z-10 -mx-1 mb-4 space-y-2 rounded-xl border border-line bg-canvas/95 p-3 backdrop-blur">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by group">
            {["all", ...GROUPS].map((g) => (
              <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(g)} className={cn("rounded-full border px-3 py-1 text-caption", group === g ? "border-ink bg-ink text-canvas" : "border-line text-ink-secondary hover:bg-subtle")}>
                {g === "all" ? `All (${FILE_COUNT})` : `${g}- (${count(g)})`}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-caption text-ink-secondary">
            Search
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. check-in" className="w-56 max-w-full rounded-md border border-line bg-canvas px-2 py-1 text-body text-ink" />
            <span aria-live="polite">{shown.length} {shown.length === 1 ? "drawing" : "drawings"}</span>
          </label>
        </div>
        {shown.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((i) => <Tile key={i.base} item={i} />)}
          </div>
        ) : (
          <p className="text-ink-secondary">Nothing matches that filter.</p>
        )}
      </Section>
    </>
  );
}
