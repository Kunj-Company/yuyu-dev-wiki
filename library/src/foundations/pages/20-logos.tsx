import { useState, type ReactNode } from "react";
import { DotMark, DOT_MARK_MIN_SIZE } from "@/components/brand/DotMark";
import { DotLockup, type DotLockupLayout } from "@/components/brand/DotLockup";
import { DotGrid } from "@/components/brand/DotGrid";
import { DOT_WORDMARK, MARK } from "@/components/brand/patterns";
import { cn } from "@/lib/cn";
import { CopyButton, DownloadLink, Section, assetUrl, tokens } from "../lib";
import { AssetActions, Stage, lockupSvg, markSvg, wordmarkDotsSvg, type MarkVariant, type Theme } from "../svg-assets";
import type { FoundationMeta } from "../registry";

export const meta: FoundationMeta = {
  slug: "logos",
  title: "Logos and marks",
  description: "The Yuyu dot sign: four marks, three lockups and the dot wordmark, with the rules for using them. Copy the SVG, download it, or rasterise it at the size you need.",
  order: 20,
};

const brand = tokens.brand;

/** Export controls for one drawing: pick light or dark, then copy or download. */
function Export({ name, make, files }: { name: string; make: (theme: Theme) => string; files?: Partial<Record<Theme, string>> }) {
  const [theme, setTheme] = useState<Theme>("light");
  const file = files?.[theme];
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-caption text-ink-muted">
        <span id={`${name}-export`}>Export</span>
        <div role="group" aria-labelledby={`${name}-export`} className="inline-flex rounded-md border border-line p-0.5">
          {(["light", "dark"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)} className={cn("rounded px-2 py-0.5", theme === t ? "bg-emphasis text-ink" : "hover:text-ink")}>
              {t === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
        <span>{file ? "the shipped file" : "generated here"}</span>
      </div>
      <AssetActions name={`${name}-${theme}`} svg={file ? { url: file } : make(theme)} />
      {file ? (
        <p className="flex flex-wrap items-center gap-2 text-caption text-ink-muted">
          <code className="font-mono text-ink-secondary">{file.replace("assets/", "")}</code>
          <DownloadLink href={assetUrl(file)} filename={file.split("/").pop()}>Download the file</DownloadLink>
        </p>
      ) : null}
    </div>
  );
}

function Card({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <article className="rounded-xl border border-line bg-canvas p-4">
      <h3 className="text-h4">{title}</h3>
      {note ? <p className="mt-0.5 text-ink-secondary">{note}</p> : null}
      {children}
    </article>
  );
}

const markCards: Array<{ title: string; variant: MarkVariant; dot: "full" | "bright" | "onMarigold" | "mono"; note: string; files?: Partial<Record<Theme, string>> }> = [
  { title: "Full grid", variant: "full", dot: "full", note: "Six marigold dots and one ink base dot on 18 soft dots. 48px and up.", files: { light: "assets/brand/mark-full.svg" } },
  { title: "Bright only", variant: "bright", dot: "bright", note: "The soft dots removed. Under 48px. The shipped file is drawn on the same 120-unit grid as the full mark.", files: { light: "assets/brand/mark-bright.svg" } },
  { title: "On marigold", variant: "onMarigold", dot: "onMarigold", note: "An ink Y with deeper marigold soft dots and a white base dot, for marigold backgrounds. The export includes the marigold tile." },
  { title: "Mono", variant: "mono", dot: "mono", note: "One colour (currentColor in the component): the bright pattern in ink, or in near-white on dark.", files: { light: "assets/brand/mark-mono.svg" } },
];

function Marks() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {markCards.map((m) => (
        <Card key={m.title} title={m.title} note={m.note}>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {m.variant === "onMarigold" ? (
              <Stage theme="light" className="col-span-2 h-36 !bg-[#FFB547]" label="On marigold">
                <DotMark size={96} variant="onMarigold" label="Yuyu" />
              </Stage>
            ) : (
              (["light", "dark"] as const).map((t) => (
                <Stage key={t} theme={t} className="h-36" label={t}>
                  <DotMark size={96} variant={m.dot} label="Yuyu" />
                </Stage>
              ))
            )}
          </div>
          <Export name={`yuyu-mark-${m.variant}`} make={(t) => markSvg(m.variant, t)} files={m.files} />
        </Card>
      ))}
    </div>
  );
}

const lockupCards: Array<{ title: string; layout: DotLockupLayout; note: string; files?: Partial<Record<Theme, string>> }> = [
  { title: "Horizontal", layout: "horizontal", note: "Headers and app shells. Shown at the lg master size (mark 60, text 54).", files: { light: "assets/brand/lockup-horizontal.svg", dark: "assets/brand/lockup-horizontal-dark.svg" } },
  { title: "Stacked", layout: "stacked", note: "Square spaces. Mark 72, text 38." },
  { title: "Tagline", layout: "tagline", note: "Marketing. Adds \"Free events, run by communities\"; the tagline line is live text in Figtree 600." },
];

function Lockups() {
  return (
    <div className="grid gap-4">
      {lockupCards.map((l) => (
        <Card key={l.title} title={l.title} note={l.note}>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(["light", "dark"] as const).map((t) => (
              <Stage key={t} theme={t} className="h-40 overflow-x-auto px-3" label={t}>
                <DotLockup layout={l.layout} size="lg" />
              </Stage>
            ))}
          </div>
          <Export name={`yuyu-lockup-${l.layout}`} make={(t) => lockupSvg(l.layout, t)} files={l.files} />
        </Card>
      ))}
      <Card title="Dot wordmark" note={'"YUYU" spelled in dots, for posters, merch and stage screens. Not for UI headers.'}>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(["light", "dark"] as const).map((t) => (
            <Stage key={t} theme={t} className="h-32 overflow-x-auto px-3" label={t}>
              <DotGrid pattern={DOT_WORDMARK} dot={6} gap={2} label="YUYU" />
            </Stage>
          ))}
        </div>
        <Export name="yuyu-wordmark-dots" make={wordmarkDotsSvg} files={{ light: "assets/brand/wordmark-dots.svg" }} />
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------- rules */

const dot = 12; // 72px mark: dot = 72 / 6

function ClearSpace() {
  const step = dot + dot / 4;
  return (
    <Stage theme="light" className="h-40">
      <div className="relative" style={{ padding: step }}>
        <div aria-hidden className="absolute inset-0 border border-dashed border-[#d4d3ce]" />
        <div aria-hidden className="absolute left-0 top-0 h-full bg-[#FFB54722]" style={{ width: step }} />
        <div aria-hidden className="absolute right-0 top-0 h-full bg-[#FFB54722]" style={{ width: step }} />
        <div aria-hidden className="absolute left-0 top-0 w-full bg-[#FFB54722]" style={{ height: step }} />
        <div aria-hidden className="absolute bottom-0 left-0 w-full bg-[#FFB54722]" style={{ height: step }} />
        <DotMark size={72} variant="full" />
      </div>
      <span className="absolute bottom-1.5 right-2 text-caption text-[#5f5e5a]">1 step = {step}px at 72px</span>
    </Stage>
  );
}

function SizeScale() {
  const sizes = [16, 24, 32, 40, 47, 48, 64];
  return (
    <Stage theme="light" className="h-40 gap-4 overflow-x-auto px-3">
      {sizes.map((s) => (
        <figure key={s} className="flex shrink-0 flex-col items-center gap-2">
          <DotMark size={s} variant="auto" label={`Yuyu at ${s}px`} />
          <figcaption className="text-caption text-[#5f5e5a]">
            {s}
            {s === DOT_MARK_MIN_SIZE ? <span className="block text-[11px]">min</span> : s === 47 ? <span className="block text-[11px]">bright</span> : s === 48 ? <span className="block text-[11px]">full</span> : null}
          </figcaption>
        </figure>
      ))}
    </Stage>
  );
}

function Ban({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-1.5">
      <Stage theme="light" className="aspect-square">
        <div aria-hidden className="flex h-full w-full items-center justify-center">{children}</div>
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-[135%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#b91c1c]" />
      </Stage>
      <figcaption className="text-caption text-ink-secondary">{label}</figcaption>
    </figure>
  );
}

function Donts() {
  const size = 60;
  const d = size / 6;
  const grid = (extra: { colors?: Record<string, string>; className?: string; cellStyle?: (cell: string) => React.CSSProperties | undefined }) => (
    <DotGrid pattern={MARK} dot={d} colors={extra.colors} className={extra.className} cellStyle={extra.cellStyle ? (cell) => extra.cellStyle!(cell) : undefined} />
  );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Ban label={brand.rules["Don't"][0]}>{grid({ className: "[&>span]:!rounded-none" })}</Ban>
      <Ban label={brand.rules["Don't"][1]}><span className="inline-flex rotate-[24deg] skew-x-6">{grid({})}</span></Ban>
      <Ban label={brand.rules["Don't"][2]}>{grid({ colors: { X: "#b9aeff", O: "#7ee8c4" } })}</Ban>
      <Ban label={brand.rules["Don't"][3]}>{grid({ colors: { ".": "#FFB547" } })}</Ban>
      <Ban label={brand.rules["Don't"][4]}>
        <span className="inline-flex drop-shadow-[0_6px_6px_rgba(0,0,0,0.45)]">
          {grid({ cellStyle: (cell) => (cell === "X" ? { backgroundImage: "linear-gradient(135deg,#FFB547,#c2410c)", boxShadow: "0 0 0 1.5px #18181B" } : undefined) })}
        </span>
      </Ban>
    </div>
  );
}

function RuleList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-2 space-y-1 text-ink-secondary">
      {items.map((i) => (
        <li key={i} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-marigold" />{i}</li>
      ))}
    </ul>
  );
}

function Construction() {
  return (
    <Stage theme="light" className="mt-3 h-40">
      <div className="flex items-center gap-6">
        <DotMark size={96} variant="full" label="Yuyu, construction" />
        <ol className="space-y-1 text-caption text-[#3f3f46]">
          <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-[#FFB547]" /> 6 marigold dots draw the Y</li>
          <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-[#18181B]" /> 1 ink dot, the host</li>
          <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-[#E7E6E2]" /> 18 soft dots</li>
        </ol>
      </div>
    </Stage>
  );
}

function Rules() {
  const r = brand.rules;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Construction"><RuleList items={r.Construction} /><Construction /></Card>
      <Card title="Space and size">
        <RuleList items={r["Space and size"]} />
        <p className="mt-3 text-caption text-ink-muted">Clear space, one dot-step on every side (the shaded band):</p>
        <div className="mt-1"><ClearSpace /></div>
        <p className="mt-3 text-caption text-ink-muted">Real <code className="font-mono">DotMark</code> sizes with <code className="font-mono">variant=&quot;auto&quot;</code>: 16px is the floor, 47px is bright only, 48px is the full grid. Under 32px the bright dots switch to deep marigold so they stay visible on white.</p>
        <div className="mt-1"><SizeScale /></div>
      </Card>
      <Card title="Colours"><RuleList items={r.Colours} /></Card>
      <Card title="Don't">
        <RuleList items={r["Don't"]} />
        <div className="mt-3"><Donts /></div>
      </Card>
    </div>
  );
}

function Colours() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {brand.colours.map((c) => (
        <li key={c.name} className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3">
          <span aria-hidden className="size-12 shrink-0 rounded-full border border-line" style={{ background: c.hex }} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{c.name}</p>
            <p className="text-caption text-ink-secondary">{c.use}</p>
          </div>
          <CopyButton value={c.hex} label={c.hex} title={`Copy ${c.name} ${c.hex}`} className="font-mono" />
        </li>
      ))}
    </ul>
  );
}

export default function Logos() {
  return (
    <>
      <Section title="Marks" description="The dot sign is a 5 by 5 grid of round dots that draws a Y. Each mark below is the real DotMark component; the export buttons use the shipped master when Yuyu has one and an SVG generated from the same pattern otherwise.">
        <Marks />
      </Section>
      <Section title="Lockups and wordmark" description="Mark plus the lowercase wordmark in Bricolage Grotesque 800, tracking -3%. The exported wordmark is outlined, so it needs no font. PNG exports are transparent.">
        <Lockups />
      </Section>
      <Section title="Usage rules" description="From the Figma page Brand, Dot sign, and Yuyu's design notes. The dot sign belongs to Yuyu's own surfaces only; never restyle an organiser's logo, cover or accent with it.">
        <Rules />
      </Section>
      <Section title="Brand colours" description="Marigold is for dots and fills, never text.">
        <Colours />
      </Section>
    </>
  );
}
