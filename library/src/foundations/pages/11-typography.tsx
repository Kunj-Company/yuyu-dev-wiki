import { useState } from "react";
import globalsCss from "@/app/globals.css?raw";
import { cn } from "@/lib/cn";
import { CodeBlock, CopyButton, Section, tokens } from "../lib";
import { fontStackLines, themeValue } from "../colour-utils";

export const meta = {
  slug: "typography",
  title: "Typography",
  description: "The 16 Figma text styles next to the Tailwind classes that implement them, the three font families, and install snippets.",
  order: 11,
};

/* ---------- Read the type scale out of globals.css ---------- */

type Rule = { size?: string; lineHeight?: string; letterSpacing?: string; weight?: string; family?: string; extra: string };
type Scale = Record<string, { base: Rule; wide: Rule; text: string }>;

function declarations(body: string): Rule {
  const get = (p: string) => body.match(new RegExp(`${p}:\\s*([^;]+);`))?.[1].trim();
  return {
    size: get("font-size"),
    lineHeight: get("line-height"),
    letterSpacing: get("letter-spacing"),
    weight: get("font-weight"),
    family: get("font-family"),
    extra: body.match(/text-transform:\s*([^;]+);/) ? "uppercase" : "",
  };
}

const scale: Scale = (() => {
  const css = globalsCss.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Scale = {};
  for (const m of css.matchAll(/^\s*\.text-([\w-]+)\s*\{([^}]*)\}/gm)) {
    const [, name, body] = m;
    const rule = declarations(body);
    if (!out[name]) out[name] = { base: rule, wide: {} as Rule, text: `.text-${name} { ${body.trim().replace(/\s+/g, " ")} }` };
    else out[name].wide = rule;
  }
  return out;
})();

/** The scale CSS exactly as written in globals.css (desktop sizes override from 640px). */
const scaleCss = (() => {
  const names = Object.keys(scale);
  const base = names.map((n) => scale[n].text).join("\n");
  const wide = names
    .filter((n) => scale[n].wide.size)
    .map((n) => `  .text-${n} { font-size: ${scale[n].wide.size}; }`)
    .join("\n");
  return `/* Type scale: mobile sizes first, desktop from 640px. */\n${base}\n\n@media (min-width: 640px) {\n${wide}\n}\n`;
})();

/* Figma style name -> code class. null = no named class in code. */
const CLASS_OF: Record<string, string | null> = {
  "Display/XL": "text-display-xl",
  "Display/L": "text-display-l",
  "Display/M": "text-display-m",
  "Heading/H1": "text-h1",
  "Heading/H2": "text-h2",
  "Heading/H3": "text-h3",
  "Heading/H4": "text-h4",
  "Text/Body L": "text-body-l",
  "Text/Body": "text-body",
  "Text/Body UI": "text-body-ui",
  "Text/Body UI Strong": null,
  "Text/Label": "text-label",
  "Text/Button": null,
  "Text/Caption": "text-caption",
  "Text/Overline": "text-overline",
  "Code/Mono": "text-mono",
};

const NOTE_OF: Record<string, string> = {
  "Text/Body UI Strong": "No named class. Use text-body-ui with font-semibold.",
  "Text/Button": "No named class. The Button component sets font-semibold and its own size per size (sm 14px, md 15px, lg 17px).",
};

const SAMPLE: Record<string, string> = {
  "Display/XL": "Every event, one ticket",
  "Display/L": "Every event, one ticket",
  "Display/M": "Every event, one ticket",
  "Heading/H1": "Invite someone to your team",
  "Heading/H2": "Invite someone to your team",
  "Heading/H3": "Invite someone to your team",
  "Heading/H4": "Invite someone to your team",
  "Text/Body L": "Yuyu is where hosts publish an event, take registrations and check people in at the door.",
  "Text/Body": "Yuyu is where hosts publish an event, take registrations and check people in at the door.",
  "Text/Body UI": "Guests get a ticket by email as soon as they register.",
  "Text/Body UI Strong": "Guests get a ticket by email as soon as they register.",
  "Text/Label": "Event name",
  "Text/Button": "Register now",
  "Text/Caption": "Last updated 3 minutes ago",
  "Text/Overline": "Venue",
  "Code/Mono": "yy_live_4f9a2c · GET /api/v1/events",
};

const FAMILY_VAR: Record<string, string> = {
  "Bricolage Grotesque": "var(--font-display)",
  Figtree: "var(--font-sans)",
  "JetBrains Mono": "var(--font-mono)",
};

type TypeStyle = (typeof tokens.type)[number];

/** Figma's letterSpacingPx field holds percent (-3.5 on Display/XL), which is em / 100 in CSS. */
const em = (t: TypeStyle) => t.letterSpacingPx / 100;
const emText = (v: number) => (v === 0 ? "0" : `${v}em`);
const px = (s?: string) => (s ? Number(s.replace("px", "")) : undefined);

function codeSpec(t: TypeStyle) {
  const cls = CLASS_OF[t.name];
  const r = cls ? scale[cls.replace("text-", "")] : undefined;
  return r ? { cls, base: r.base, wide: r.wide } : null;
}

/** Compare the Figma style with the desktop value of its code class. */
function differences(t: TypeStyle): string[] {
  const spec = codeSpec(t);
  if (!spec) return [];
  const out: string[] = [];
  const size = px(spec.wide.size ?? spec.base.size);
  if (size !== t.size) out.push(`size ${t.size}px vs ${size}px`);
  const lh = Number(spec.base.lineHeight);
  if (lh !== t.lineHeight) out.push(`line height ${t.lineHeight} vs ${lh}`);
  const ls = spec.base.letterSpacing ? Number(spec.base.letterSpacing.replace("em", "")) : 0;
  if (Math.abs(ls - em(t)) > 1e-9) out.push(`tracking ${emText(em(t))} vs ${emText(ls)}`);
  if (spec.base.weight && Number(spec.base.weight) !== t.weight) out.push(`weight ${t.weight} vs ${spec.base.weight}`);
  return out;
}

function StyleRow({ t, render }: { t: TypeStyle; render: "figma" | "code" }) {
  const spec = codeSpec(t);
  const diff = differences(t);
  const mobile = spec && spec.wide.size ? spec.base.size : null;
  const sampleStyle = {
    fontFamily: FAMILY_VAR[t.family],
    fontSize: t.size,
    fontWeight: t.weight,
    lineHeight: t.lineHeight,
    letterSpacing: `${em(t)}em`,
    textTransform: t.name === "Text/Overline" ? ("uppercase" as const) : undefined,
  };
  return (
    <li id={`style-${t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="border-t border-line py-5 first:border-t-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="text-title">{t.name}</h4>
        <div className="flex flex-wrap gap-1">
          {spec ? <CopyButton value={spec.cls!} label={<span className="font-mono">{spec.cls}</span>} /> : <span className="rounded-md border border-dashed border-line px-2 py-1 text-caption text-ink-muted">no named class</span>}
          {spec ? <CopyButton value={`font-family: ${FAMILY_VAR[t.family]}; font-size: ${t.size}px; font-weight: ${t.weight}; line-height: ${t.lineHeight}; letter-spacing: ${emText(em(t))};`} label="Copy CSS" /> : null}
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl bg-subtle p-4 text-ink">
        {render === "code" && spec ? (
          <p className={cn(spec.cls, "break-words")}>{SAMPLE[t.name]}</p>
        ) : (
          <p className="break-words" style={sampleStyle}>{SAMPLE[t.name]}</p>
        )}
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-caption sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-ink">Figma spec</dt>
          <dd className="font-mono text-ink-secondary">
            {t.family} {t.style} {t.weight} · {t.size}px · line height {t.lineHeight} · tracking {t.letterSpacingPx}%
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Code</dt>
          <dd className="font-mono text-ink-secondary">
            {spec ? (
              <>
                {spec.cls}: {spec.wide.size ?? spec.base.size} from 640px{mobile ? `, ${mobile} below` : ", same below 640px"} · line height {spec.base.lineHeight} · tracking {spec.base.letterSpacing ?? "0"}
                {spec.base.extra ? ` · ${spec.base.extra}` : ""}
              </>
            ) : (
              NOTE_OF[t.name] ?? "No named class."
            )}
          </dd>
        </div>
      </dl>
      {spec ? (
        <p className="mt-1 text-caption text-ink-muted">
          {diff.length === 0 ? "Figma and code agree on desktop size, line height, weight and tracking." : `Differs from code: ${diff.join("; ")}.`}
        </p>
      ) : null}
    </li>
  );
}

const INSTALL = `npm install @fontsource-variable/bricolage-grotesque @fontsource-variable/figtree @fontsource/jetbrains-mono`;

const IMPORTS = `// app/layout.tsx
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/figtree/wght.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";`;

const STACKS = `:root {
${fontStackLines.map((l) => `  ${l}`).join("\n")}
}

body {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.6;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 800;
}

code, kbd, samp, pre {
  font-family: var(--font-mono);
}`;

const CHARSET = {
  Uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  Lowercase: "abcdefghijklmnopqrstuvwxyz",
  Numerals: "0123456789",
  Punctuation: "& @ # % ! ? . , : ; ' \" ( ) [ ] { } / \\ - – — + = < > * _ ~ $ € £",
};

const FAMILIES = [
  {
    name: "Bricolage Grotesque",
    cls: "font-display",
    css: "var(--font-display)",
    use: "Display and headings. Variable font with optical size, weight 800 is the only weight in use.",
    weights: [800],
    figma: "Display/XL to Heading/H4",
    stack: themeValue("--font-display"),
  },
  {
    name: "Figtree",
    cls: "font-sans",
    css: "var(--font-sans)",
    use: "Body and UI text. Variable weight font, used at 400, 600 and 700.",
    weights: [400, 600, 700],
    figma: "Text/Body L to Text/Overline",
    stack: themeValue("--font-sans"),
  },
  {
    name: "JetBrains Mono",
    cls: "font-mono",
    css: "var(--font-mono)",
    use: "Codes, IDs, endpoints and scopes. Static 400 and 500 files.",
    weights: [400, 500],
    figma: "Code/Mono (400)",
    stack: themeValue("--font-mono"),
  },
];

export default function TypographyPage() {
  const [render, setRender] = useState<"figma" | "code">("figma");
  const mismatches = tokens.type.filter((t) => differences(t).length);
  const codeOnly = Object.keys(scale).filter((n) => !Object.values(CLASS_OF).includes(`text-${n}`));

  return (
    <>
      <Section id="scale" title="Type scale" description="Sixteen text styles in Figma. Samples render at the Figma desktop size, which is what the code classes use from 640px up.">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Render samples with">
          <span className="text-label">Render with</span>
          {(["figma", "code"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={render === m}
              onClick={() => setRender(m)}
              className={cn("rounded-full border px-3 py-1.5 text-label", render === m ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-canvas text-ink-secondary hover:bg-subtle")}
            >
              {m === "figma" ? "Figma spec (fixed size)" : "Code class (responsive)"}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-line bg-subtle p-3 text-body-ui text-ink-secondary">
          <p className="font-semibold text-ink">Reading the tracking values</p>
          <p className="mt-1">
            Figma stores tracking as a percentage of the font size and the exported field is named <code>letterSpacingPx</code>, but the values are percent: Display/XL is <b>-3.5</b>, which is <b>-3.5%</b>, which is exactly <code>-0.035em</code> in <code>text-display-xl</code> (about -2.7px at 76px). The same holds for every style, for example Overline 6 is <code>0.06em</code>. Line heights are unitless multipliers in both. This page converts Figma tracking to em by dividing by 100.
          </p>
          <p className="mt-2">
            {mismatches.length === 0
              ? "Checked against globals.css: every style that has a named class matches on desktop size, line height, weight and tracking."
              : `Differences found: ${mismatches.map((t) => t.name).join(", ")}.`}{" "}
            Below 640px the display, heading and lead sizes shrink (shown per style). {codeOnly.length ? `Code also defines ${codeOnly.map((n) => `text-${n}`).join(", ")}, which Figma does not have.` : ""}
          </p>
        </div>

        <ul className="mt-4">
          {tokens.type.map((t) => (
            <StyleRow key={t.name} t={t} render={render} />
          ))}
        </ul>

        <div className="mt-2 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-left text-body-ui">
            <caption className="border-b border-line bg-subtle px-3 py-2 text-left text-label">Sizes that change below 640px</caption>
            <thead>
              <tr className="text-caption text-ink-muted">
                <th className="px-3 py-2 font-semibold">Class</th>
                <th className="px-3 py-2 font-semibold">Below 640px</th>
                <th className="px-3 py-2 font-semibold">From 640px</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scale)
                .filter(([, r]) => r.wide.size)
                .map(([n, r]) => (
                  <tr key={n} className="border-t border-line">
                    <td className="px-3 py-2 font-mono text-[13px]">text-{n}</td>
                    <td className="px-3 py-2 font-mono text-[13px]">{r.base.size}</td>
                    <td className="px-3 py-2 font-mono text-[13px]">{r.wide.size}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-caption text-ink-muted">All other classes keep the same size at every width.</p>
      </Section>

      <Section id="families" title="Font families" description="Three self-hosted families, loaded through Fontsource.">
        <ul className="grid gap-3 lg:grid-cols-3">
          {FAMILIES.map((f) => (
            <li key={f.name} className="overflow-hidden rounded-xl border border-line bg-canvas">
              <div className="bg-subtle p-4" style={{ fontFamily: f.css }}>
                <p className="text-[56px] leading-none" style={{ fontWeight: f.weights[f.weights.length - 1] }}>Aa</p>
                <div className="mt-3 space-y-1 text-[17px]">
                  {f.weights.map((w) => (
                    <p key={w} style={{ fontWeight: w }}>{w} · Every event, one ticket</p>
                  ))}
                </div>
              </div>
              <div className="space-y-2 p-3">
                <h4 className="text-title">{f.name}</h4>
                <p className="text-body-ui text-ink-secondary">{f.use}</p>
                <p className="text-caption text-ink-muted">Figma styles: {f.figma}</p>
                <div className="flex flex-wrap gap-1">
                  <CopyButton value={f.cls} label={<span className="font-mono">{f.cls}</span>} />
                  <CopyButton value={f.stack ?? ""} label="Copy stack" title={`Copy ${f.stack}`} />
                </div>
                <p className="break-all font-mono text-[12px] text-ink-muted">{f.stack}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="charset" title="Character set" description="Every glyph group in each family, at 24px.">
        <div className="space-y-4">
          {FAMILIES.map((f) => (
            <div key={f.name} className="rounded-xl border border-line p-4" style={{ fontFamily: f.css }}>
              <h4 className="font-sans text-label text-ink-muted">{f.name}</h4>
              <div className="mt-2 space-y-2 text-[24px] leading-snug" style={{ fontWeight: f.weights.includes(400) ? 400 : 800 }}>
                {Object.entries(CHARSET).map(([k, v]) => (
                  <p key={k} className="break-words">
                    <span className="sr-only">{k}: </span>
                    {v}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="install" title="Install and use" description="Fonts are imported once in the root layout. There is no font CDN at runtime.">
        <div className="space-y-4">
          <CodeBlock language="shell" code={INSTALL} />
          <CodeBlock filename="layout.tsx" language="tsx" code={IMPORTS} />
          <CodeBlock filename="fonts.css" language="css" code={STACKS} />
          <CodeBlock filename="type-scale.css" language="css" code={scaleCss} />
        </div>
      </Section>
    </>
  );
}
