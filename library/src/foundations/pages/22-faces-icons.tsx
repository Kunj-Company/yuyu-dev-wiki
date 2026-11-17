import { useEffect, useState } from "react";
import { DotFace } from "@/components/brand/DotFace";
import { DotIcon } from "@/components/brand/DotIcon";
import { DotLoader } from "@/components/brand/DotLoader";
import { DotGrid } from "@/components/brand/DotGrid";
import { FACE_MOODS, ICON_NAMES, MARK, type DotFaceMood, type DotIconName } from "@/components/brand/patterns";
import { cn } from "@/lib/cn";
import { Section, assetUrl, tokens } from "../lib";
import { AssetActions, Stage, faceSvg, iconSvg, type Theme } from "../svg-assets";
import type { FoundationMeta } from "../registry";

export const meta: FoundationMeta = {
  slug: "faces-and-icons",
  title: "Dot faces and icons",
  description: "Ten dot faces that carry meaning, thirteen spot icons, and the dot motion elements. Live components, with SVG and PNG exports.",
  order: 22,
};

const MEANING: Record<DotFaceMood, string> = {
  happy: "Hello, the default face",
  cheering: "You're in!",
  wink: "Checked in",
  love: "Loved it (feedback)",
  done: "All set",
  waiting: "On the waitlist",
  surprised: "This event is full",
  thinking: "Loading",
  sleepy: "No events yet",
  sad: "Something went wrong",
};

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

function Controls({ size, setSize, theme, setTheme }: { size: number; setSize: (n: number) => void; theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-canvas/95 px-3 py-2 backdrop-blur">
      <label className="flex items-center gap-2 text-caption text-ink-secondary">
        Size
        <input type="range" min={32} max={160} step={4} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-36 accent-[var(--yy-brand-marigold-deep)]" />
        <span className="w-12 font-mono">{size}px</span>
      </label>
      <div role="group" aria-label="Stage theme" className="inline-flex rounded-md border border-line p-0.5 text-caption">
        {(["light", "dark"] as const).map((t) => (
          <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)} className={cn("rounded px-2.5 py-0.5", theme === t ? "bg-emphasis text-ink" : "text-ink-secondary hover:text-ink")}>
            {label(t)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tile({ theme, title, caption, children, actions }: { theme: Theme; title: string; caption?: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-3">
      <Stage theme={theme} className="min-h-[9rem] flex-1 p-4">{children}</Stage>
      <div>
        <h3 className="font-semibold">{title}</h3>
        {caption ? <p className="text-caption text-ink-secondary">{caption}</p> : null}
      </div>
      {actions}
    </article>
  );
}

const grid = "grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3";

/** Compare the code's lists with the names Figma defines. */
function Parity() {
  const figmaFaces = tokens.brand.faces.map(slug);
  const figmaIcons = tokens.brand.icons.map(slug);
  const diff = (code: readonly string[], figma: string[]) => ({ onlyCode: code.filter((c) => !figma.includes(c)), onlyFigma: figma.filter((f) => !code.includes(f)) });
  const faces = diff(FACE_MOODS, figmaFaces);
  const icons = diff(ICON_NAMES, figmaIcons);
  const orderOk = (a: readonly string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  const ok = (d: ReturnType<typeof diff>) => d.onlyCode.length === 0 && d.onlyFigma.length === 0;
  const line = (what: string, d: ReturnType<typeof diff>, code: readonly string[], figma: string[]) =>
    ok(d)
      ? `${what}: ${code.length} in code, ${figma.length} in Figma, same names${orderOk(code, figma) ? " and order" : ""}.`
      : `${what}: mismatch. Only in code: ${d.onlyCode.join(", ") || "none"}. Only in Figma: ${d.onlyFigma.join(", ") || "none"}.`;
  return (
    <div role="note" className="mt-3 rounded-xl border border-line bg-subtle p-3 text-caption text-ink-secondary">
      <p className="font-semibold text-ink">Code against Figma</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        <li>{line("Faces", faces, FACE_MOODS, figmaFaces)}</li>
        <li>{line("Icons", icons, ICON_NAMES, figmaIcons)}</li>
        <li>Code and Figma use the same name for each icon (<code className="font-mono">check-in</code> is Figma&apos;s &quot;Check-in&quot;). This is checked live from <code className="font-mono">ICON_NAMES</code> and <code className="font-mono">FACE_MOODS</code>.</li>
      </ul>
    </div>
  );
}

function Faces({ size, theme }: { size: number; theme: Theme }) {
  return (
    <div className={grid}>
      {FACE_MOODS.map((m) => (
        <Tile key={m} theme={theme} title={label(m)} caption={MEANING[m]} actions={<AssetActions name={`yuyu-face-${m}-${theme}`} svg={faceSvg(m, theme)} pngSizes={[64, 128, 256, 512]} />}>
          <DotFace mood={m} size={size} label={`${label(m)} face: ${MEANING[m]}`} />
        </Tile>
      ))}
    </div>
  );
}

function Icons({ size, theme }: { size: number; theme: Theme }) {
  return (
    <div className={grid}>
      {ICON_NAMES.map((name: DotIconName) => (
        <Tile key={name} theme={theme} title={tokens.brand.icons.find((i) => slug(i) === name) ?? label(name)} caption={`DotIcon name="${name}"`} actions={<AssetActions name={`yuyu-icon-${name}-${theme}`} svg={iconSvg(name, theme)} pngSizes={[54, 108, 216, 512]} defaultPng={216} />}>
          <DotIcon name={name} size={size} label={`${name} icon`} />
        </Tile>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ motion */

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** The Y lighting up with the arms first, then down the stem to the host dot. */
function lit(step: number) {
  return MARK.split("|").map((row, r) => (r <= step ? row : row.replace(/[XO]/g, "."))).join("|");
}

function YLoader({ theme }: { theme: Theme }) {
  const [step, setStep] = useState(5);
  useEffect(() => {
    if (reduced()) return;
    let s = 0;
    setStep(0);
    const id = window.setInterval(() => {
      s = (s + 1) % 7;
      setStep(Math.min(s, 5));
    }, 280);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Stage theme={theme} className="h-40">
      <DotGrid pattern={lit(step)} dot={16} label="Loading: the Y lights up, arms first" />
    </Stage>
  );
}

function ProgressRow({ theme }: { theme: Theme }) {
  const [n, setN] = useState(3);
  const total = 8;
  const pattern = Array.from({ length: total }, (_, i) => (i < n ? "X" : ".")).join("");
  return (
    <div>
      <Stage theme={theme} className="h-40">
        <DotGrid pattern={pattern} dot={20} label={`Progress: ${n} of ${total}`} />
      </Stage>
      <label className="mt-2 flex items-center gap-2 text-caption text-ink-secondary">
        Lit dots
        <input type="range" min={0} max={total} value={n} onChange={(e) => setN(Number(e.target.value))} className="accent-[var(--yy-brand-marigold-deep)]" />
        <span className="font-mono">{n} / {total}</span>
      </label>
    </div>
  );
}

function Motion({ theme }: { theme: Theme }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-h4">DotLoader (in code)</h3>
        <p className="mt-0.5 text-ink-secondary">Three dots, two marigold and one ink, hopping left to right in turn. <code className="font-mono">role=&quot;status&quot;</code> with a screen-reader label; still under reduced motion.</p>
        <Stage theme={theme} className="mt-3 h-40"><DotLoader size={72} /></Stage>
      </article>
      <article className="rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-h4">The Y lights up (Figma loader)</h3>
        <p className="mt-0.5 text-ink-secondary">Figma&apos;s loader lights the Y arms first, then down the stem to the host dot. Drawn here from <code className="font-mono">DotGrid</code> and the mark pattern; Yuyu&apos;s code does not implement this one (its <code className="font-mono">DotLoader</code> is the three hopping dots). Static under reduced motion.</p>
        <div className="mt-3"><YLoader theme={theme} /></div>
      </article>
      <article className="rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-h4">Dot progress row</h3>
        <p className="mt-0.5 text-ink-secondary">A row of marigold dots filling over soft ones, a one-row <code className="font-mono">DotGrid</code> pattern. Yuyu ships a static version as the landing illustration <a className="underline" href={assetUrl("assets/illustrations/hero-dot-progress.svg")}>hero-dot-progress.svg</a> (and a dark twin).</p>
        <div className="mt-3"><ProgressRow theme={theme} /></div>
      </article>
    </div>
  );
}

export default function FacesAndIcons() {
  const [size, setSize] = useState(96);
  const [theme, setTheme] = useState<Theme>("light");
  return (
    <>
      <Controls size={size} setSize={setSize} theme={theme} setTheme={setTheme} />
      <Section title="Faces" description="Faces carry meaning, not decoration. Choose by what the moment says, and keep words beside the face. They are always live DotFace grids in the product; hover a tile to see the ripple, blink and lift (the full motion spec, replay controls and animated SVGs are on the Animated faces page). Exports are SVG built from the same patterns.">
        <Faces size={size} theme={theme} />
      </Section>
      <Section title="Icons" description="Thirteen spot icons on a 7 by 7 grid (dot, with a gap of a third of a dot). Ink dots follow the theme; marigold marks the highlight.">
        <Icons size={size} theme={theme} />
        <Parity />
      </Section>
      <Section title="Motion" description="The loader and progress elements. Faces and icons stay still under reduced motion.">
        <Motion theme={theme} />
      </Section>
    </>
  );
}
