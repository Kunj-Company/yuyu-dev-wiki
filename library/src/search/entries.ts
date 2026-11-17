import type { Entry } from "../../../search/types";
import type { ComponentDoc } from "../types";
import tokens from "../foundations/tokens.json";

/*
 * The library's contribution to the shared search index. It reads only data (the catalog, the example and
 * page source as text, the tokens), never components, so scripts/build-search-index.mjs can load it in Node.
 */

const catalog = import.meta.glob<{ default: ComponentDoc | ComponentDoc[] }>("../catalog/*.ts", { eager: true });
const exampleSource = import.meta.glob<string>("../examples/*/*.tsx", { eager: true, query: "?raw", import: "default" });
const pageSource = import.meta.glob<string>("../foundations/pages/*.tsx", { eager: true, query: "?raw", import: "default" });
const assetFiles = import.meta.glob("/public/assets/**/*", { query: "?url", import: "default" });

const LIB = "library/index.html#/";
const docs = Object.values(catalog).flatMap((m) => (Array.isArray(m.default) ? m.default : [m.default]));

/** First string value of `key:` in a source file, decoded. */
function field(source: string, key: string) {
  const m = new RegExp(`${key}:\\s*("(?:[^"\\\\]|\\\\.)*")`).exec(source);
  if (!m) return "";
  try {
    return JSON.parse(m[1]) as string;
  } catch {
    return m[1].slice(1, -1);
  }
}

/** The snippet readers see: the example without the gallery-only `meta` export. */
function stripMeta(source: string) {
  const start = source.indexOf("export const meta");
  if (start === -1) return source.trim();
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (; end < source.length; end++) {
    if (source[end] === "{") depth++;
    else if (source[end] === "}" && --depth === 0) break;
  }
  while (source[end + 1] === ";" || source[end + 1] === "\n") end++;
  return (source.slice(0, start) + source.slice(end + 1)).trim();
}

const entries: Entry[] = [];
const add = (e: Omit<Entry, "site">) => entries.push({ site: "library", ...e });

for (const d of docs) {
  const sources = (Array.isArray(d.source) ? d.source : [d.source]).join(" ");
  const props = d.props?.flatMap((t) => t.items) ?? [];
  add({
    kind: "Component",
    title: d.name,
    context: `${d.group} · ${sources}`,
    href: `${LIB}${d.slug}`,
    keywords: [d.name, d.slug, ...(d.exports ?? []), sources].join(" "),
    text: [d.description, ...(d.notes ?? []), ...props.map((p) => p.name)].join(" "),
  });
  for (const ex of d.exports ?? []) {
    if (ex.toLowerCase() === d.name.toLowerCase()) continue;
    add({ kind: "Export", title: ex, context: `exported by ${d.name} · ${sources}`, href: `${LIB}${d.slug}`, keywords: ex, text: d.name });
  }
  for (const p of props) {
    const name = p.name.split(" / ")[0];
    add({
      kind: "Prop",
      title: `${d.name}.${name}`,
      context: `prop of ${d.name} · ${p.type}${p.default ? ` = ${p.default}` : ""}`,
      href: `${LIB}${d.slug}?to=prop-${name.replace(/[^A-Za-z0-9_-]/g, "")}`,
      keywords: `${name} ${p.name}`,
      text: `${p.type} ${p.default ?? ""} ${p.description} ${d.name}`,
    });
  }
}

for (const [path, raw] of Object.entries(exampleSource)) {
  const [, slug, file] = /\.\.\/examples\/([^/]+)\/([^/]+)\.tsx$/.exec(path)!;
  const doc = docs.find((d) => d.slug === slug);
  if (!doc) continue;
  const title = field(raw, "title");
  add({ kind: "Example", title: `${doc.name}: ${title}`, context: `example of ${doc.name}`, href: `${LIB}${slug}?to=${file}`, keywords: title, text: `${field(raw, "description")} ${stripMeta(raw)}` });
}

for (const raw of Object.values(pageSource)) {
  const slug = field(raw, "slug");
  if (!slug) continue;
  add({ kind: "Page", title: field(raw, "title"), context: "Component library · Foundations", href: `${LIB}foundations/${slug}`, keywords: slug, text: field(raw, "description") });
}

for (const c of tokens.colours) {
  add({
    kind: "Token",
    title: c.cssVar,
    context: `colour · light ${c.light} · dark ${c.dark}${c.tailwind.length ? ` · ${c.tailwind.map((t: string) => `bg-${t}`).join(", ")}` : ""}`,
    href: `${LIB}foundations/colour?to=token-${c.name}`,
    keywords: [c.name, c.cssVar, c.light, c.dark, ...c.tailwind.flatMap((t: string) => [t, `bg-${t}`, `text-${t}`, `border-${t}`])].join(" "),
    text: `${c.group} colour token ${c.source}`,
  });
}
for (const a of tokens.accents) add({ kind: "Token", title: `${a.name} event accent`, context: `accent ${a.accent} · soft ${a.soft}`, href: `${LIB}foundations/colour`, keywords: `${a.name} ${a.accent} ${a.soft} ${a.text}`, text: "event accent preset" });
for (const b of tokens.brand.colours) add({ kind: "Token", title: `${b.name} (brand dot colour)`, context: `${b.hex} · ${b.use}`, href: `${LIB}foundations/colour`, keywords: `${b.name} ${b.hex}`, text: b.use });

const typeClass: Record<string, string> = {
  "Display/XL": "text-display-xl", "Display/L": "text-display-l", "Display/M": "text-display-m", "Heading/H1": "text-h1", "Heading/H2": "text-h2", "Heading/H3": "text-h3", "Heading/H4": "text-h4",
  "Text/Body L": "text-body-l", "Text/Body": "text-body", "Text/Body UI": "text-body-ui", "Text/Label": "text-label", "Text/Caption": "text-caption", "Text/Overline": "text-overline", "Code/Mono": "text-mono",
};
for (const t of tokens.type) {
  add({
    kind: "Type",
    title: t.name,
    context: `${t.family} ${t.style} · ${t.size}px / ${t.lineHeight}${typeClass[t.name] ? ` · ${typeClass[t.name]}` : ""}`,
    href: `${LIB}foundations/typography?to=style-${t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    keywords: `${t.name} ${typeClass[t.name] ?? ""}`,
    text: `${t.family} ${t.style} ${t.size}px type text style`,
  });
}
for (const [k, v] of Object.entries(tokens.spacing)) add({ kind: "Scale", title: k, context: `spacing · ${v}px`, href: `${LIB}foundations/layout?to=spacing`, keywords: `${k} p-${k.replace("space-", "")}`, text: "spacing scale" });
for (const [k, v] of Object.entries(tokens.radius)) add({ kind: "Scale", title: k, context: `radius · ${v === 999 ? "full" : `${v}px`}`, href: `${LIB}foundations/layout?to=radius`, keywords: `${k} rounded-${k.replace("radius-", "")}`, text: "radius corner" });
for (const s of tokens.shadows) add({ kind: "Scale", title: s.name, context: "elevation · shadow", href: `${LIB}foundations/layout?to=elevation`, keywords: `${s.name} shadow-${s.name.split("/")[1]?.toLowerCase()}`, text: "elevation shadow" });
for (const c of tokens.components) add({ kind: "Figma", title: `${c.name} (Figma)`, context: `${c.count} variants${c.code ? ` · gallery: ${c.code}` : " · feature component"}`, href: `${LIB}foundations/figma-components`, keywords: c.name, text: c.variants.join(" ") });

for (const path of Object.keys(assetFiles)) {
  const rel = path.replace("/public/assets/", "");
  const name = rel.split("/").pop() ?? rel;
  const folder = rel.split("/")[0];
  const page = folder === "illustrations" ? "illustrations" : folder === "fonts" ? "fonts" : /icon|favicon|og-|touch|maskable|email/.test(name) ? "app-icons" : "logos";
  add({ kind: "Asset", title: name, context: `${folder} file · ${rel}`, href: `${LIB}foundations/${page}`, keywords: `${name} ${rel}`, text: `${folder} download asset` });
}

export { entries };
