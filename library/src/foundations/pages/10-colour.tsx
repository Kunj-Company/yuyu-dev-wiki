import { useMemo, useState, type CSSProperties } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/display";
import { cn } from "@/lib/cn";
import { CopyButton, CodeBlock, Section, tokens } from "../lib";
import { SOURCE_LABEL, colours, contrast, coloursCss, coloursJson, utilities, wcagLevel, type ColourToken } from "../colour-utils";

export const meta = {
  slug: "colour",
  title: "Colour",
  description: "Every Yuyu colour token in light and dark, with hex values, CSS variables, Tailwind utilities, contrast ratios and the four event accent presets.",
  order: 10,
};

const SOURCE_TONE = { both: "success", code: "neutral", figma: "accent" } as const;

function SourceBadge({ source }: { source: ColourToken["source"] }) {
  return <Chip size="sm" tone={SOURCE_TONE[source]}>{SOURCE_LABEL[source]}</Chip>;
}

/** Text colour (black or white) with the better contrast against a hex background. */
const readable = (bg: string) => (contrast(bg, "#FFFFFF") >= contrast(bg, "#18181B") ? "#FFFFFF" : "#18181B");

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex h-20 flex-1 flex-col justify-end p-2" style={{ background: hex, color: readable(hex) }}>
      <span className="text-overline uppercase opacity-80">{label}</span>
      <span className="font-mono text-[12px]">{hex}</span>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="w-12 shrink-0 text-caption text-ink-muted">{label}</span>
      <CopyButton value={value} label={<span className="font-mono">{value}</span>} className="min-w-0 max-w-full truncate" />
    </div>
  );
}

function ColourCard({ c }: { c: ColourToken }) {
  const same = c.light === c.dark;
  return (
    <li id={`token-${c.name}`} className="overflow-hidden rounded-xl border border-line bg-canvas">
      <div className="flex">
        <Swatch hex={c.light} label="Light" />
        <Swatch hex={c.dark} label="Dark" />
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h4 className="text-title font-mono text-[14px]">{c.name}</h4>
          <SourceBadge source={c.source} />
        </div>
        {same ? <p className="text-caption text-ink-muted">Same value in light and dark.</p> : null}
        <CopyRow label="Light" value={c.light} />
        {!same ? <CopyRow label="Dark" value={c.dark} /> : null}
        <CopyRow label="Var" value={c.cssVar} />
        {utilities(c).map((u) => (
          <CopyRow key={u} label="Class" value={u} />
        ))}
        {c.tailwind.length === 0 ? <p className="text-caption text-ink-muted">No Tailwind utility in code yet.</p> : null}
      </div>
    </li>
  );
}

/* ---------- Text on surface ---------- */

const TEXTS = ["text", "text-secondary", "text-muted"];
const SURFACES = ["bg-canvas", "bg-subtle", "bg-muted"];
const byName = (n: string) => colours.find((c) => c.name === n)!;

function Matrix({ mode }: { mode: "light" | "dark" }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[420px] text-left text-body-ui">
        <caption className="border-b border-line bg-subtle px-3 py-2 text-left text-label capitalize">{mode}</caption>
        <thead>
          <tr className="text-caption text-ink-muted">
            <th className="px-3 py-2 font-semibold">Text on surface</th>
            {SURFACES.map((s) => (
              <th key={s} className="px-3 py-2 font-semibold">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TEXTS.map((t) => (
            <tr key={t} className="border-t border-line">
              <th scope="row" className="px-3 py-2 font-mono text-[13px] font-semibold">{t}</th>
              {SURFACES.map((s) => {
                const fg = byName(t)[mode];
                const bg = byName(s)[mode];
                const ratio = contrast(fg, bg);
                const level = wcagLevel(ratio);
                return (
                  <td key={s} className="p-1.5">
                    <div className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2" style={{ background: bg, color: fg }}>
                      <span className="font-semibold">Aa</span>
                      <span className="text-right font-mono text-[12px]">
                        {ratio.toFixed(2)}:1
                        <br />
                        {level}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Event accents ---------- */

function AccentCard({ a }: { a: (typeof tokens.accents)[number] }) {
  const style = {
    "--yy-accent": a.accent,
    "--yy-accent-soft": a.soft,
    "--yy-accent-text": a.text,
    "--yy-on-accent": "#ffffff",
    "--yy-focus": a.text,
  } as CSSProperties;
  const onAccent = contrast("#FFFFFF", a.accent);
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-canvas">
      <div className="flex">
        {[
          ["accent", a.accent],
          ["soft", a.soft],
          ["text", a.text],
        ].map(([k, v]) => (
          <div key={k} className="flex h-16 flex-1 flex-col justify-end p-2" style={{ background: v, color: readable(v) }}>
            <span className="text-overline uppercase opacity-80">{k}</span>
            <span className="font-mono text-[12px]">{v}</span>
          </div>
        ))}
      </div>
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h4 className="text-title">{a.name}</h4>
          <span className="text-caption text-ink-muted">White on accent {onAccent.toFixed(2)}:1 {wcagLevel(onAccent)}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <CopyButton value={a.accent} label={`accent ${a.accent}`} />
          <CopyButton value={a.soft} label={`soft ${a.soft}`} />
          <CopyButton value={a.text} label={`text ${a.text}`} />
        </div>
        <div style={style} className="flex flex-wrap items-center gap-3 rounded-lg bg-subtle p-3">
          <Button variant="accent" size="sm">Register</Button>
          <Chip tone="accent">Open</Chip>
          <span className="rounded-full px-3 py-1 text-caption text-ink" style={{ outline: "2px solid var(--yy-focus)", outlineOffset: 2 }}>
            Focus ring
          </span>
          <a href="#/foundations/colour" onClick={(e) => e.preventDefault()} className="text-label text-accent-text underline underline-offset-4">Link</a>
        </div>
      </div>
    </li>
  );
}

export default function ColourPage() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | ColourToken["source"]>("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colours.filter((c) => {
      if (source !== "all" && c.source !== source) return false;
      if (!q) return true;
      return [c.name, c.cssVar, c.light, c.dark, c.group, ...c.tailwind, ...utilities(c)].join(" ").toLowerCase().includes(q);
    });
  }, [query, source]);

  const figmaOnly = colours.filter((c) => c.source === "figma");
  const codeOnly = colours.filter((c) => c.source === "code");

  return (
    <>
      <Section id="tokens" title="Colour tokens" description={`${colours.length} tokens in ${tokens.groups.length} groups. Each swatch shows light and dark side by side. Click any value to copy it.`}>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 basis-60">
            <span className="sr-only">Filter colours</span>
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, hex, variable or class"
              className="min-h-11 w-full rounded-full border border-line-strong bg-canvas pl-9 pr-3 text-body-ui text-ink placeholder:text-ink-muted"
            />
          </label>
          <div role="group" aria-label="Filter by source" className="flex flex-wrap gap-1">
            {(["all", "both", "code", "figma"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={source === s}
                onClick={() => setSource(s)}
                className={cn("rounded-full border px-3 py-1.5 text-label", source === s ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-canvas text-ink-secondary hover:bg-subtle")}
              >
                {s === "all" ? "All" : SOURCE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-line bg-subtle p-3 text-body-ui text-ink-secondary">
          <p className="font-semibold text-ink">Where each token comes from</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li><b>Figma and code</b>: defined in both with the same value ({colours.filter((c) => c.source === "both").length} tokens, no mismatches).</li>
            <li><b>Code only</b>: {codeOnly.map((c) => c.name).join(", ")}. The Figma file does not define them.</li>
            <li>
              <b>Figma only</b>: {figmaOnly.map((c) => c.name).join(", ")}. Figma has mint and lavender brand colours (with highlight and tint companions) that Yuyu&apos;s code does not use yet, so they have no CSS variable in the app and no Tailwind utility. The variable names shown here are the ones the generated exports use.
            </li>
          </ul>
        </div>

        <p className="mt-3 text-caption text-ink-muted" aria-live="polite">{shown.length} of {colours.length} tokens shown</p>

        {tokens.groups.map((g) => {
          const items = shown.filter((c) => c.group === g);
          if (!items.length) return null;
          return (
            <div key={g} className="mt-6">
              <h3 className="text-h4">{g}</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <ColourCard key={c.name} c={c} />
                ))}
              </ul>
            </div>
          );
        })}
        {shown.length === 0 ? <p className="mt-6 text-ink-secondary">No colour matches this filter.</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
          <span className="text-label">Export all {colours.length} tokens</span>
          <CopyButton value={coloursCss()} label="Copy as CSS variables" />
          <CopyButton value={coloursJson()} label="Copy as JSON" />
          <a href="#/foundations/token-exports" className="text-label text-ink underline underline-offset-4">More formats</a>
        </div>
      </Section>

      <Section id="contrast" title="Text on surface" description="WCAG 2.x contrast ratio of the three text tokens on the three main surfaces. AA needs 4.5:1 for body text, AAA needs 7:1.">
        <div className="grid gap-3 lg:grid-cols-2">
          <Matrix mode="light" />
          <Matrix mode="dark" />
        </div>
        <p className="mt-3 max-w-2xl text-caption text-ink-muted">
          <code>text-disabled</code> is not listed because disabled text is exempt from the contrast requirement. Marigold fails contrast on white, so it is for dots and fills only, never text.
        </p>
      </Section>

      <Section id="accents" title="Event accents" description="Each event picks one of four presets. The accent, soft and text values feed --yy-accent, --yy-accent-soft and --yy-accent-text, which the Tailwind utilities accent, accent-soft and accent-text read.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {tokens.accents.map((a) => (
            <AccentCard key={a.name} a={a} />
          ))}
        </ul>
        <p className="mt-3 max-w-2xl text-caption text-ink-muted">
          The Figma file lists the presets in light only. In code, event pages set <code>--yy-accent-*-light</code> and <code>-dark</code> inline and the <code>.yy-accent-scope</code> class picks the pair for the current mode. The previews above apply the light values directly, so in dark mode they show the light preset.
        </p>
      </Section>

      <Section id="brand" title="Brand dot colours" description="The dot sign uses five colours. The Figma file calls them out with usage notes.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.brand.colours.map((b) => (
            <li key={b.name} className="overflow-hidden rounded-xl border border-line bg-canvas">
              <div className="h-14" style={{ background: b.hex }} />
              <div className="space-y-2 p-3">
                <h4 className="text-title">{b.name}</h4>
                <p className="text-body-ui text-ink-secondary">{b.use}</p>
                <CopyButton value={b.hex} label={<span className="font-mono">{b.hex}</span>} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <CodeBlock
            language="css"
            code={[
              ...tokens.brand.colours.map((b) => `/* ${b.name}: ${b.use} */ ${b.hex}`),
              "",
              ...colours.filter((c) => c.name.startsWith("brand-dot") || c.name.startsWith("brand-marigold")).map((c) => `${c.cssVar}: ${c.light.toLowerCase()}; /* dark: ${c.dark.toLowerCase()} */`),
            ].join("\n")}
          />
        </div>
      </Section>
    </>
  );
}
