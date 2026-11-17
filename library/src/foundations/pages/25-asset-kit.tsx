import { useMemo, useState } from "react";
import { strToU8, zipSync, type Zippable } from "fflate";
import { Archive, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, downloadBlob, tokens } from "../lib";
import { fetchBytes, formatBytes, generatedAssets, useFileSizes } from "../svg-assets";
import type { FoundationMeta } from "../registry";

export const meta: FoundationMeta = {
  slug: "asset-kit",
  title: "Download the asset kit",
  description: "Everything downloadable from the Brand foundations in one place: shipped brand files, fonts and licences, illustrations, and SVGs generated for the marks, lockups, faces and icons. Download it all, or one category at a time.",
  order: 25,
};

type Category = "Logos" | "Icons and faces" | "Illustrations" | "Fonts";
const CATEGORIES: Category[] = ["Logos", "Icons and faces", "Illustrations", "Fonts"];
const ZIP_NAME: Record<Category, string> = { Logos: "yuyu-logos", "Icons and faces": "yuyu-icons-and-faces", Illustrations: "yuyu-illustrations", Fonts: "yuyu-fonts" };

type Entry = { category: Category; zipPath: string; source: "Shipped file" | "Generated"; label: string; url?: string; text?: string };

const BRAND_FILES = [
  "mark-full.svg", "mark-bright.svg", "mark-mono.svg", "lockup-horizontal.svg", "lockup-horizontal-dark.svg", "wordmark-dots.svg",
  "app-icon.svg", "apple-touch-icon.svg", "apple-touch-icon.png", "maskable.svg", "maskable-512.png", "favicon-16.svg", "favicon-32.svg",
  "icon-192.png", "icon-512.png", "og-default.svg", "og-default.png", "email-lockup.png",
];
const FONT_FILES = ["BricolageGrotesque-ExtraBold.ttf", "Figtree-Regular.ttf", "Figtree-Bold.ttf", "OFL-BricolageGrotesque.txt", "OFL-Figtree.txt"];
const illustrations = import.meta.glob("/public/assets/illustrations/*.svg", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const ENTRIES: Entry[] = [
  ...BRAND_FILES.map<Entry>((f) => ({ category: "Logos", zipPath: `logos/shipped/${f}`, source: "Shipped file", label: f, url: `assets/brand/${f}` })),
  ...generatedAssets().map<Entry>((g) => ({
    category: g.group,
    zipPath: g.group === "Logos" ? `logos/generated/${g.path.split("/").pop()}` : `icons-and-faces/${g.path}`,
    source: "Generated",
    label: g.label,
    text: g.svg,
  })),
  ...Object.entries(illustrations).map<Entry>(([p, svg]) => ({ category: "Illustrations", zipPath: `illustrations/${p.split("/").pop()}`, source: "Shipped file", label: p.split("/").pop()!, text: svg })),
  ...FONT_FILES.map<Entry>((f) => ({ category: "Fonts", zipPath: `fonts/${f}`, source: "Shipped file", label: f, url: `assets/fonts/${f}` })),
].sort((a, b) => a.zipPath.localeCompare(b.zipPath));

const SHIPPED_URLS = ENTRIES.flatMap((e) => (e.url ? [e.url] : []));
const textBytes = (e: Entry) => (e.text ? strToU8(e.text).byteLength : undefined);
const today = () => new Date().toISOString().slice(0, 10);

function readme(scope: string, entries: Entry[]) {
  const r = tokens.brand.rules;
  const lines = (title: string, items: readonly string[]) => [`${title}`, ...items.map((i) => `  - ${i}`), ""];
  const counts = CATEGORIES.map((c) => `  ${c}: ${entries.filter((e) => e.category === c).length} files`).filter((l) => !l.endsWith(" 0 files"));
  return [
    `Yuyu brand kit (${scope})`,
    `Built ${today()} in the browser from the Yuyu component gallery, Foundations.`,
    "",
    "What is inside",
    ...counts,
    "",
    "  logos/shipped         the SVG and PNG masters Yuyu ships in public/brand",
    "  logos/generated       marks, lockups, dot wordmark, app icon themes and the social avatar, drawn from the dot patterns",
    "  icons-and-faces       the 10 dot faces and 13 dot icons, light and dark, as SVG",
    "  illustrations         the landing page dot artwork; -dark files are the dark theme twins",
    "  fonts                 static TTFs and their SIL OFL licence texts",
    "",
    "Generated files are rebuilt from the same patterns the Yuyu components use (components/brand/patterns.ts); colours are the brand tokens as hex.",
    "The generated stacked and horizontal lockups outline the wordmark; the tagline lockup's last line is live text in Figtree 600.",
    "",
    ...lines("Construction", r.Construction),
    ...lines("Space and size", r["Space and size"]),
    ...lines("Colours", r.Colours),
    ...lines("Don't", r["Don't"]),
    "The dot sign belongs to Yuyu's own surfaces only. Never restyle an organiser's logo, cover or accent colour with it.",
    "",
    "Fonts and licences: see LICENSE-ATTRIBUTION.txt.",
    "",
  ].join("\n");
}

const ATTRIBUTION = [
  "Licence and attribution",
  "",
  "Fonts (SIL Open Font License 1.1, texts included in fonts/)",
  "  Bricolage Grotesque  Copyright 2022 The Bricolage Grotesque Project Authors (https://github.com/ateliertriay/bricolage)",
  "  Figtree              Copyright 2022 The Figtree Project Authors (https://github.com/erikdkennedy/figtree)",
  "  JetBrains Mono       SIL OFL 1.1, by JetBrains. Not included in this kit; install it with @fontsource/jetbrains-mono and read https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt",
  "",
  "The OFL lets you use, embed and redistribute these fonts, including in commercial work, as long as the licence text travels with them and the fonts are not sold on their own.",
  "",
  "Yuyu brand artwork (dot sign, lockups, dot faces and icons, illustrations, app icons)",
  "  Yuyu's own identity, for Yuyu's own surfaces. No licence to use it for other products is granted by this kit.",
  "",
].join("\n");

type Progress = { state: "idle" | "working" | "done" | "error"; done: number; total: number; failed: string[]; bytes?: number };

async function build(scope: string, name: string, entries: Entry[], onProgress: (done: number) => void) {
  const files: Zippable = {};
  const failed: string[] = [];
  let done = 0;
  const queue = [...entries];
  const worker = async () => {
    for (let e = queue.shift(); e; e = queue.shift()) {
      try {
        const data = e.text !== undefined ? strToU8(e.text) : await fetchBytes(e.url!);
        const raw = /\.(png|ttf)$/.test(e.zipPath);
        files[`${name}/${e.zipPath}`] = [data, { level: raw ? 0 : 6 }];
      } catch {
        failed.push(e.zipPath);
      }
      onProgress(++done);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  if (failed.length) return { failed };
  files[`${name}/README.txt`] = strToU8(readme(scope, entries));
  if (entries.some((e) => e.category === "Fonts") || scope === "everything") files[`${name}/LICENSE-ATTRIBUTION.txt`] = strToU8(ATTRIBUTION);
  const zip = zipSync(files);
  return { failed, blob: new Blob([zip as BlobPart], { type: "application/zip" }) };
}

function ZipButton({ scope, name, entries, primary }: { scope: string; name: string; entries: Entry[]; primary?: boolean }) {
  const [p, setP] = useState<Progress>({ state: "idle", done: 0, total: entries.length, failed: [] });
  const run = async () => {
    setP({ state: "working", done: 0, total: entries.length, failed: [] });
    try {
      const { failed, blob } = await build(scope, name, entries, (done) => setP((s) => ({ ...s, done })));
      if (failed.length || !blob) setP({ state: "error", done: entries.length, total: entries.length, failed });
      else {
        downloadBlob(`${name}.zip`, blob);
        setP({ state: "done", done: entries.length, total: entries.length, failed: [], bytes: blob.size });
      }
    } catch {
      setP({ state: "error", done: 0, total: entries.length, failed: ["Could not build the zip in this browser."] });
    }
  };
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Button variant={primary ? "primary" : "secondary"} size={primary ? "lg" : "md"} loading={p.state === "working"} loadingLabel={`Zipping ${p.done} of ${p.total}`} startIcon={primary ? <Archive /> : <Download />} onClick={run}>
        {primary ? "Download all (.zip)" : `${scope} (.zip)`}
      </Button>
      <div aria-live="polite" className="text-caption text-ink-secondary">
        {p.state === "working" ? (
          <div className="flex items-center gap-2"><progress max={p.total} value={p.done} className="h-1.5 w-40 accent-[var(--yy-brand-marigold-deep)]" aria-label={`Zipping ${scope}`} />{p.done} / {p.total}</div>
        ) : p.state === "done" ? (
          `Downloaded ${name}.zip: ${p.total} files, ${formatBytes(p.bytes ?? 0)}.`
        ) : p.state === "error" ? (
          <span role="alert" className="text-danger-fg">Could not fetch {p.failed.length} {p.failed.length === 1 ? "file" : "files"} ({p.failed.slice(0, 3).join(", ")}{p.failed.length > 3 ? ", ..." : ""}). Nothing was downloaded. Press the button to try again.</span>
        ) : (
          `${entries.length} files`
        )}
      </div>
    </div>
  );
}

function Manifest() {
  const sizes = useFileSizes(SHIPPED_URLS);
  const sizeOf = (e: Entry) => (e.url ? sizes[e.url] : textBytes(e));
  return (
    <div className="space-y-3">
      {CATEGORIES.map((c) => {
        const list = ENTRIES.filter((e) => e.category === c);
        const known = list.map(sizeOf);
        const total = known.every((s) => typeof s === "number") ? formatBytes(known.reduce<number>((a, s) => a + (s as number), 0)) : "...";
        const generated = list.filter((e) => e.source === "Generated").length;
        return (
          <details key={c} className="rounded-xl border border-line bg-canvas">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className="text-h4">{c}</span>
              <span className="text-caption text-ink-secondary">{list.length} files · {total} · {list.length - generated} shipped, {generated} generated</span>
            </summary>
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[34rem] text-left text-caption">
                <thead className="bg-subtle text-ink-muted">
                  <tr><th className="px-3 py-2 font-semibold">Path in the zip</th><th className="px-3 py-2 font-semibold">Source</th><th className="px-3 py-2 text-right font-semibold">Size</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {list.map((e) => {
                    const s = sizeOf(e);
                    return (
                      <tr key={e.zipPath}>
                        <td className="px-3 py-1.5"><code className="font-mono text-ink">{e.zipPath}</code></td>
                        <td className="px-3 py-1.5 text-ink-secondary">{e.source}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-ink-secondary">{typeof s === "number" ? formatBytes(s) : s === null ? "unavailable" : "..."}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default function AssetKit() {
  const byCategory = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c, ENTRIES.filter((e) => e.category === c)])) as Record<Category, Entry[]>, []);
  return (
    <>
      <Section title="Download" description="Zips are built in your browser: shipped files are fetched from this site, generated SVGs are written out, and a README.txt and a licence and attribution note are added.">
        <div className="rounded-xl border border-line bg-subtle p-4 sm:p-5">
          <ZipButton scope="everything" name="yuyu-brand-kit" entries={ENTRIES} primary />
          <p className="mt-4 text-caption text-ink-muted">Or one category at a time:</p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <ZipButton key={c} scope={c} name={ZIP_NAME[c]} entries={byCategory[c]} />
            ))}
          </div>
        </div>
      </Section>
      <Section title="What is in the kit" description="Every file, where it comes from and how big it is. Shipped files are the originals from Yuyu; generated files are written by this site from the dot patterns (the components render CSS grids, so there is no SVG to copy from them).">
        <Manifest />
      </Section>
    </>
  );
}
