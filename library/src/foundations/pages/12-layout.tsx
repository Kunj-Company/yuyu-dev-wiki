import { useState } from "react";
import { cn } from "@/lib/cn";
import { CodeBlock, CopyButton, Section, tokens } from "../lib";
import { hex8ToRgba, shadowNames, shadowsCodeDark, themeValue } from "../colour-utils";

export const meta = {
  slug: "layout",
  title: "Spacing, radius and elevation",
  description: "The spacing scale, corner radii, shadows, breakpoints, motion easing and page widths, from the Figma file and Yuyu's CSS.",
  order: 12,
};

/* ---------- Radius: use per class is from docs/design/tokens.md ---------- */

const RADIUS_USE: Record<string, string> = {
  "radius-sm": "Inline code buttons, tiny controls",
  "radius-md": "Inputs, date block, nav items, menu items",
  "radius-lg": "Cards, list rows, tables, stat tiles, menus, callouts",
  "radius-xl": "Feature cards, registration card, cover image, option cards",
  "radius-2xl": "Dialogs, hero panels, ticket, account cards",
  "radius-3xl": "Largest hero panels and CTA bands",
  "radius-full": "All buttons, chips, segmented controls, search fields, avatars",
};

const SHADOW_USE: Record<string, string> = {
  raised: "Event registration card, auth card",
  float: "Menus, popovers, dialogs, toasts",
  ticket: "Ticket stub",
  segment: "Selected segment, switch thumb (code only)",
};

const figmaShadow = (layers: { color: string; y: number; blur: number }[]) => layers.map((l) => `0 ${l.y}px ${l.blur}px ${hex8ToRgba(l.color)}`).join(", ");

const codeRadii = Object.entries(Object.fromEntries(["sm", "md", "lg", "xl", "2xl", "3xl"].map((k) => [`radius-${k}`, Number(themeValue(`--radius-${k}`)?.replace("px", ""))])));

function SpacingSection() {
  return (
    <Section id="spacing" title="Spacing scale" description="Eleven steps on a 4px base. In Tailwind, step N is N × 4px, so space-4 is p-4, gap-4 and m-4. Yuyu's CSS has no --space-* variables: the Figma tokens map onto Tailwind's own spacing scale.">
      <ul className="space-y-1.5">
        {Object.entries(tokens.spacing).map(([name, value]) => {
          const n = value / 4;
          return (
            <li key={name} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[5rem_minmax(0,1fr)_auto]">
              <div>
                <p className="font-mono text-[13px] font-semibold">{name}</p>
                <p className="text-caption text-ink-muted">{value}px</p>
              </div>
              <div className="min-w-0">
                <div className="h-6 rounded-sm bg-accent" style={{ width: value * 3 }} aria-hidden />
              </div>
              <div className="col-span-2 flex flex-wrap gap-1 sm:col-span-1">
                <CopyButton value={name} label={<span className="font-mono">{name}</span>} title={`Copy Figma token ${name}`} />
                <CopyButton value={`p-${n}`} label={<span className="font-mono">p-{n}</span>} />
                <CopyButton value={`gap-${n}`} label={<span className="font-mono">gap-{n}</span>} />
                <CopyButton value={`calc(var(--spacing) * ${n})`} label={<span className="font-mono">{value}px</span>} title={`Copy calc(var(--spacing) * ${n})`} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 max-w-2xl text-caption text-ink-muted">Bars are drawn at 3× so small steps stay visible. The last button copies <code>calc(var(--spacing) * N)</code>, the CSS form of the same value.</p>
    </Section>
  );
}

function RadiusSection() {
  const figma = tokens.radius as Record<string, number>;
  const rows = [...Object.keys(figma).filter((k) => k !== "radius-full"), ...codeRadii.map(([k]) => k).filter((k) => !(k in figma)), "radius-full"];
  return (
    <Section id="radius" title="Radius" description="Corner radii are Tailwind theme values, not --yy variables. Cards, dialogs and chips pick from this scale. Don't nest more than two rounded containers.">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((name) => {
          const key = name.replace("radius-", "");
          const px = figma[name] ?? codeRadii.find(([k]) => k === name)?.[1];
          const codeOnly = !(name in figma);
          const cls = `rounded-${key}`;
          return (
            <li key={name} className="rounded-xl border border-line bg-canvas p-3">
              <div className="flex h-24 items-center justify-center bg-subtle">
                <div className="h-16 w-24 border-2 border-ink bg-muted" style={{ borderRadius: px }} aria-hidden />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-1">
                <h4 className="font-mono text-[14px] font-semibold">{name}</h4>
                <span className="text-caption text-ink-muted">{px}px</span>
              </div>
              <p className="mt-1 text-caption text-ink-secondary">{RADIUS_USE[name]}</p>
              {codeOnly ? <p className="mt-1 text-caption text-ink-muted">In code, not in Figma.</p> : null}
              <div className="mt-2 flex flex-wrap gap-1">
                <CopyButton value={cls} label={<span className="font-mono">{cls}</span>} />
                {name !== "radius-full" ? <CopyButton value={`var(--${name})`} label={<span className="font-mono">var(--{name})</span>} /> : <CopyButton value="999px" label={<span className="font-mono">999px</span>} />}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function ShadowCard({ title, value, sub, className }: { title: string; value: string; sub?: string; className?: string }) {
  return (
    <div className={cn("rounded-xl", className)}>
      <div className="flex h-24 items-center justify-center rounded-xl bg-canvas text-caption text-ink-muted" style={{ boxShadow: value }}>
        {sub}
      </div>
      <p className="mt-3 text-label">{title}</p>
      <p className="mt-1 break-words font-mono text-[12px] text-ink-secondary">{value}</p>
      <div className="mt-2">
        <CopyButton value={`box-shadow: ${value};`} label="Copy CSS" />
      </div>
    </div>
  );
}

function ElevationSection() {
  const code = tokens.shadowsCode as Record<string, string>;
  return (
    <Section id="elevation" title="Elevation" description="Surfaces are flat by default: cards use a 1px border-line and no shadow. Shadows are for things that float. Three come from Figma, and the code adds a fourth, shadow-segment.">
      <div className="space-y-8">
        {shadowNames.map((n) => {
          const f = tokens.shadows.find((s) => s.name.toLowerCase() === `shadow/${n}`);
          return (
            <div key={n}>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="text-h4">shadow-{n}</h3>
                <CopyButton value={`shadow-${n}`} label={<span className="font-mono">shadow-{n}</span>} />
                <CopyButton value={`--yy-shadow-${n}`} label={<span className="font-mono">--yy-shadow-{n}</span>} />
              </div>
              <p className="mt-1 text-body-ui text-ink-secondary">{SHADOW_USE[n]}</p>
              <div className="mt-3 grid gap-4 rounded-xl bg-subtle p-4 sm:grid-cols-3">
                {f ? (
                  <ShadowCard title={`Figma, ${f.name}`} value={figmaShadow(f.layers)} sub="Figma layers" />
                ) : (
                  <div className="rounded-xl border border-dashed border-line p-3 text-caption text-ink-muted">Not in the Figma file.</div>
                )}
                <ShadowCard title="Code, light" value={code[n]} sub={`shadow-${n}`} />
                <div className="yy-dark-band rounded-xl bg-subtle p-3">
                  <ShadowCard title="Code, dark" value={shadowsCodeDark[n]} sub={`shadow-${n}`} />
                </div>
              </div>
              {f ? (
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-[360px] text-left text-caption">
                    <thead className="text-ink-muted">
                      <tr><th className="pr-4 font-semibold">Figma layer</th><th className="pr-4 font-semibold">Colour</th><th className="pr-4 font-semibold">Y</th><th className="font-semibold">Blur</th></tr>
                    </thead>
                    <tbody className="font-mono">
                      {f.layers.map((l, i) => (
                        <tr key={i}><td className="pr-4">{i + 1}</td><td className="pr-4">{l.color} ({hex8ToRgba(l.color)})</td><td className="pr-4">{l.y}px</td><td>{l.blur}px</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function MotionSection() {
  const [on, setOn] = useState(false);
  const [ms, setMs] = useState(180);
  const ease = themeValue("--ease-yy") ?? "";
  return (
    <Section id="motion" title="Motion" description="Motion values are not tokens. The shared piece is the easing curve; durations follow the table.">
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton value={`--ease-yy: ${ease};`} label={<span className="font-mono">--ease-yy</span>} />
        <CopyButton value="ease-yy" label={<span className="font-mono">ease-yy</span>} />
        <CopyButton value={ease} label={<span className="font-mono">{ease}</span>} />
      </div>
      <div className="mt-3 rounded-xl border border-line p-4">
        <div className="h-3 overflow-hidden rounded-full bg-track" aria-hidden>
          <div className="h-full rounded-full bg-accent" style={{ width: on ? "100%" : "8%", transition: `width ${ms}ms ${ease}` }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setOn((v) => !v)} className="rounded-full bg-primary px-4 py-2 text-label text-on-primary">Play</button>
          {[120, 180, 360].map((d) => (
            <button key={d} type="button" aria-pressed={ms === d} onClick={() => setMs(d)} className={cn("rounded-full border px-3 py-1.5 text-label", ms === d ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-canvas text-ink-secondary hover:bg-subtle")}>
              {d}ms
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[420px] text-left text-body-ui">
          <thead className="text-caption text-ink-muted"><tr><th className="px-3 py-2 font-semibold">Item</th><th className="px-3 py-2 font-semibold">Value</th></tr></thead>
          <tbody>
            {[
              ["Press", "120ms (Checkbox)"],
              ["Hover and fade", "180ms (duration-[180ms] on buttons, tabs, choice cards)"],
              ["Panels and dialogs", "240ms (yy-dialog-in, yy-toast-in)"],
              ["Success moments", "360ms (yy-success-in, ProgressBar width)"],
              ["Dialog overlay", "180ms fade (yy-fade-in)"],
              ["Colour-mode switch", "720ms reveal, 420ms cross-fade fallback"],
            ].map(([k, v]) => (
              <tr key={k} className="border-t border-line"><td className="px-3 py-2 font-semibold">{k}</td><td className="px-3 py-2 font-mono text-[13px]">{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-2xl text-caption text-ink-muted">With <code>prefers-reduced-motion: reduce</code> all transitions drop to 0.01ms.</p>
    </Section>
  );
}

function BreakpointSection() {
  const bps = ["sm", "md", "lg"].map((k) => ({ k, px: Number(themeValue(`--breakpoint-${k}`)?.replace("px", "")) }));
  const max = Math.max(...bps.map((b) => b.px)) * 1.1;
  const notes: Record<string, string> = {
    sm: "Type scale steps up. Stacked actions go inline. Side gutter becomes 24px.",
    md: "Sidebar appears, two-column layouts open.",
    lg: "Three-column editors and sticky previews.",
  };
  return (
    <Section id="breakpoints" title="Breakpoints" description="Mobile first, three breakpoints in the theme. md is 960px here, not Tailwind's default 768px. Everything must work at 360px wide with no horizontal page scroll.">
      <div className="rounded-xl border border-line p-4">
        <div className="relative h-8" aria-hidden>
          {bps.map((b) => (
            <div key={b.k} className="absolute inset-y-0 border-l-2 border-accent pl-1 font-mono text-[11px] text-ink-secondary" style={{ left: `${(b.px / max) * 100}%` }}>{b.px}</div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-track" aria-hidden />
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {bps.map((b) => (
          <li key={b.k} className="rounded-xl border border-line p-3">
            <div className="flex items-center justify-between"><h4 className="font-mono text-[14px] font-semibold">{b.k}</h4><span className="font-mono text-[13px]">{b.px}px</span></div>
            <p className="mt-1 text-caption text-ink-secondary">{notes[b.k]}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <CopyButton value={`${b.k}:`} label={<span className="font-mono">{b.k}:</span>} />
              <CopyButton value={`@media (min-width: ${b.px}px)`} label="Copy media query" />
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function WidthSection() {
  const rows = [
    ["Content max width, public pages", "1160px", "max-w-[1160px]"],
    ["Dashboard content column", "1200px", "max-w-[1200px]"],
    ["Dashboard forms", "900px or less", ""],
    ["Body copy", "about 640px", "max-w-[640px]"],
    ["Page side gutter", "16px mobile, 24px from sm", "px-4 sm:px-6"],
    ["Sidebar", "224px, or a 68px icon rail when collapsed", ""],
    ["Mobile top bar", "56px", "h-14"],
    ["Mobile menu sheet", "min(280px, 86vw)", ""],
  ];
  return (
    <Section id="widths" title="Containers and grid" description="Only values stated in Yuyu's typography and layout notes. There is no layout primitive library: layouts are plain CSS grid and flex with Tailwind utilities.">
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[480px] text-left text-body-ui">
          <thead className="text-caption text-ink-muted"><tr><th className="px-3 py-2 font-semibold">What</th><th className="px-3 py-2 font-semibold">Value</th><th className="px-3 py-2 font-semibold">Class</th></tr></thead>
          <tbody>
            {rows.map(([a, b, c]) => (
              <tr key={a} className="border-t border-line">
                <td className="px-3 py-2">{a}</td>
                <td className="px-3 py-2 font-mono text-[13px]">{b}</td>
                <td className="px-3 py-2">{c ? <CopyButton value={c} label={<span className="font-mono">{c}</span>} /> : <span className="text-ink-muted">-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="mt-6 text-h4">Common spacing by context</h3>
      <div className="mt-2 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[420px] text-left text-body-ui">
          <tbody>
            {[
              ["Inline gaps (icon and label, chips)", "6 to 10px"],
              ["Form field gap", "12 to 14px"],
              ["Card padding", "16 to 24px (dashboard 16 to 20px, public 24 to 32px)"],
              ["Section gap, dashboard", "24px"],
              ["Section gap, event page", "40 to 48px"],
              ["Section gap, marketing", "64 to 80px"],
            ].map(([a, b]) => (
              <tr key={a} className="border-t border-line first:border-t-0"><td className="px-3 py-2">{a}</td><td className="px-3 py-2 font-mono text-[13px]">{b}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="mt-6 text-h4">Layout patterns used in the code</h3>
      <div className="mt-2">
        <CodeBlock
          language="tsx"
          code={`{/* two columns from sm */}
<div className="grid gap-4 sm:grid-cols-2">…</div>

{/* settings row: label column and field column, from md */}
<div className="md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">…</div>

{/* detail list */}
<dl className="sm:grid-cols-[max-content_minmax(0,1fr)]">…</dl>

{/* public page wrapper */}
<main className="mx-auto w-full max-w-[1160px] px-4 py-8 sm:px-6 sm:py-10">…</main>`}
        />
      </div>
    </Section>
  );
}

export default function LayoutPage() {
  return (
    <>
      <SpacingSection />
      <RadiusSection />
      <ElevationSection />
      <MotionSection />
      <BreakpointSection />
      <WidthSection />
    </>
  );
}
