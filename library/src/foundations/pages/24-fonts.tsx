import type { ReactNode } from "react";
import { CodeBlock, DownloadLink, Section, assetUrl } from "../lib";
import { formatBytes, useFileSizes } from "../svg-assets";
import type { FoundationMeta } from "../registry";

export const meta: FoundationMeta = {
  slug: "fonts",
  title: "Fonts",
  description: "Bricolage Grotesque, Figtree and JetBrains Mono: roles, weights, specimens, licences, the shipped TTFs and the install snippets.",
  order: 24,
};

const F = "assets/fonts/";
const TTFS = [
  { file: "BricolageGrotesque-ExtraBold.ttf", family: "Bricolage Grotesque", weight: 800, style: "ExtraBold" },
  { file: "Figtree-Regular.ttf", family: "Figtree", weight: 400, style: "Regular" },
  { file: "Figtree-Bold.ttf", family: "Figtree", weight: 700, style: "Bold" },
];
const LICENCES = [
  { file: "OFL-BricolageGrotesque.txt", name: "Bricolage Grotesque" },
  { file: "OFL-Figtree.txt", name: "Figtree" },
];

/** The shipped TTFs, registered under their own names so the specimen below proves the files work. */
const FACE_CSS = TTFS.map((t) => `@font-face { font-family: "Yuyu TTF ${t.family} ${t.style}"; font-weight: ${t.weight}; src: url(${assetUrl(F + t.file)}) format("truetype"); font-display: swap; }`).join("\n");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 &?!@#%";

function Family({ name, role, weights, source, children, specimen }: { name: string; role: ReactNode; weights: ReactNode; source: ReactNode; children?: ReactNode; specimen: ReactNode }) {
  return (
    <article className="rounded-xl border border-line bg-canvas p-4 sm:p-5">
      <h3 className="text-h3">{name}</h3>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-ink-secondary sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="text-overline uppercase text-ink-muted">Role</dt>
        <dd>{role}</dd>
        <dt className="text-overline uppercase text-ink-muted">Weights</dt>
        <dd>{weights}</dd>
        <dt className="text-overline uppercase text-ink-muted">Loaded as</dt>
        <dd>{source}</dd>
      </dl>
      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-subtle p-4">{specimen}</div>
      {children}
    </article>
  );
}

const code = (s: string) => <code className="font-mono text-[0.92em]">{s}</code>;

function Specimens() {
  return (
    <div className="grid gap-4">
      <Family
        name="Bricolage Grotesque"
        role="Display and headings: the lowercase yuyu wordmark and every heading from Display XL to H4 in the Figma type scale."
        weights={<>800 (ExtraBold) everywhere in the design. The variable font covers 200 to 800 with an optical-size axis.</>}
        source={<>The Fontsource variable package, family {code('"Bricolage Grotesque Variable"')} (CSS file {code("opsz.css")}). A static ExtraBold TTF ships for the report PDF.</>}
        specimen={
          <div className="font-display font-extrabold">
            <p className="text-[clamp(2.25rem,8vw,4.75rem)] leading-[0.98] tracking-[-0.035em]">Free events, run by communities</p>
            <p className="mt-3 text-[30px] leading-tight tracking-[-0.01em]">Your next event, sorted</p>
            <p className="mt-1 text-[20px]">{ALPHABET}</p>
            <p className="mt-3 text-[40px] tracking-[-0.03em]">yuyu</p>
          </div>
        }
      />
      <Family
        name="Figtree"
        role="Text and UI: body copy, labels, buttons, tables and form fields."
        weights={<>Regular 400 (body), Medium 500, SemiBold 600 (labels, strong UI) and Bold 700 (buttons, titles). The variable font covers 300 to 900.</>}
        source={<>The Fontsource variable package, family {code('"Figtree Variable"')} (CSS file {code("wght.css")}). Static Regular and Bold TTFs ship for the report PDF; SemiBold and Medium exist only through the variable font.</>}
        specimen={
          <div className="font-sans">
            <p className="text-[19px] leading-[1.6]">Register in a minute and get a ticket with a QR code. Doors open at 6:30, and the first talk starts at 7.</p>
            <ul className="mt-3 space-y-1 text-[17px]">
              {[400, 500, 600, 700].map((w) => (
                <li key={w} style={{ fontWeight: w }}>{w}: The quick brown fox jumps over the lazy dog</li>
              ))}
            </ul>
            <p className="mt-2 text-[15px] text-ink-secondary">{ALPHABET}</p>
          </div>
        }
      />
      <Family
        name="JetBrains Mono"
        role="Code and data: codes, IDs, URLs, keys and the requested path on the 404 page."
        weights={<>Regular 400 and Medium 500: the two weights Yuyu imports.</>}
        source={<>Fontsource static weights ({code("@fontsource/jetbrains-mono/400.css")} and {code("500.css")}), family {code('"JetBrains Mono"')}. No TTF or licence text for it is shipped in this kit.</>}
        specimen={
          <div className="font-mono">
            <p className="text-[13px] leading-[1.5]">GET /api/v1/events?status=published</p>
            <p className="mt-2 text-[20px]">YUYU-7K3Q-2M9X</p>
            <p className="mt-1 text-[15px] font-medium">0123456789 {"{ }"} [ ] =&gt; ===</p>
            <p className="mt-1 text-[15px]">{ALPHABET}</p>
          </div>
        }
      />
    </div>
  );
}

const INSTALL = `npm install @fontsource-variable/bricolage-grotesque@5.3.0 @fontsource-variable/figtree@5.3.0 @fontsource/jetbrains-mono@5.3.0`;

const IMPORTS = `// app/layout.tsx (Yuyu)
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/figtree/wght.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";`;

const STACKS = `/* app/globals.css (Yuyu) */
--font-display: "Bricolage Grotesque Variable", ui-sans-serif, system-ui, sans-serif;
--font-sans: "Figtree Variable", system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;`;

const SELF_HOST = `/* Self-hosting the shipped TTFs (an example; Yuyu itself uses Fontsource) */
@font-face {
  font-family: "Bricolage Grotesque";
  font-weight: 800;
  src: url("/fonts/BricolageGrotesque-ExtraBold.ttf") format("truetype");
  font-display: swap;
}
@font-face {
  font-family: "Figtree";
  font-weight: 400;
  src: url("/fonts/Figtree-Regular.ttf") format("truetype");
  font-display: swap;
}
@font-face {
  font-family: "Figtree";
  font-weight: 700;
  src: url("/fonts/Figtree-Bold.ttf") format("truetype");
  font-display: swap;
}`;

function Downloads() {
  const sizes = useFileSizes([...TTFS, ...LICENCES].map((f) => F + f.file));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <style>{FACE_CSS}</style>
        <h3 className="text-h4">TrueType files</h3>
        <p className="mt-0.5 text-ink-secondary">Static instances shipped in Yuyu&apos;s <code className="font-mono">public/brand/fonts</code>, embedded in the event report PDF. Each line below is drawn with the file itself.</p>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {TTFS.map((t) => (
            <li key={t.file} className="space-y-2 p-3">
              <p className="text-[26px] leading-tight" style={{ fontFamily: `"Yuyu TTF ${t.family} ${t.style}", sans-serif`, fontWeight: t.weight }}>Hamburgefonstiv 0123</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <code className="font-mono text-body font-semibold">{t.file}</code>
                <span className="text-caption text-ink-muted">{t.family} {t.style}, {t.weight}{sizes[F + t.file] ? ` · ${formatBytes(sizes[F + t.file]!)}` : ""}</span>
                <DownloadLink href={assetUrl(F + t.file)} filename={t.file} />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-h4">Licences</h3>
        <p className="mt-0.5 text-ink-secondary">All three families are open source under the SIL Open Font License 1.1: free to use, embed and redistribute (the fonts cannot be sold on their own). Keep the licence text with any copy you ship.</p>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {LICENCES.map((l) => (
            <li key={l.file} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 p-3">
              <span className="font-semibold">{l.name}</span>
              <a className="font-mono text-caption underline underline-offset-2" href={assetUrl(F + l.file)} target="_blank" rel="noreferrer">{l.file}</a>
              <span className="text-caption text-ink-muted">{sizes[F + l.file] ? formatBytes(sizes[F + l.file]!) : ""}</span>
              <DownloadLink href={assetUrl(F + l.file)} filename={l.file} />
            </li>
          ))}
          <li className="p-3 text-ink-secondary">
            <span className="font-semibold text-ink">JetBrains Mono</span>: its OFL text is not shipped here; read it on{" "}
            <a className="underline underline-offset-2" href="https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt" target="_blank" rel="noreferrer">JetBrains&apos; repository</a>.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function Fonts() {
  return (
    <>
      <Section title="The three families" description="Specimens below use the fonts as Yuyu loads them.">
        <Specimens />
      </Section>
      <Section title="Downloads and licences">
        <Downloads />
      </Section>
      <Section title="Install and CSS" description="Yuyu loads the fonts from Fontsource with exact versions, then names them in three CSS variables.">
        <div className="space-y-4">
          <CodeBlock code={INSTALL} language="shell" />
          <CodeBlock code={IMPORTS} language="ts" />
          <CodeBlock code={STACKS} language="css" />
          <CodeBlock code={SELF_HOST} language="css" />
        </div>
      </Section>
    </>
  );
}
