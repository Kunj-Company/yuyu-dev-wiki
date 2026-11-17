#!/usr/bin/env node
// Builds the single search index used by the documentation AND the component library:
//   docs/public/search/entries.json
// Sources: every Markdown page in docs/ (split into sections at headings, code included) and the
// library's components, props, examples, tokens and files (library/src/search/entries.ts, loaded
// through Vite so it can use import.meta.glob). Run after `library:sync` and `build-tokens`.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(root, "docs");

const DIR_LABEL = {
  start: "Get started", architecture: "Architecture", features: "Feature modules", api: "APIs", guides: "How-to guides",
  design: "Design system", deploy: "Deploy and operate", build: "Build on Yuyu", reference: "Reference",
};
const MAX_TEXT = 4000;

// ---- Markdown pages --------------------------------------------------------------------------
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === ".vitepress" || name === "public" || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (name.endsWith(".md")) yield p;
  }
}

/** The same anchor VitePress gives a heading (@mdit-vue/shared slugify), with its -1, -2 suffixes for repeats. */
const rControl = /[\u0000-\u001f]/g;
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\;:"'“”‘’<>,.?/]+/g;
function slugify(str) {
  return str
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(rControl, "")
    .replace(rSpecial, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^(\d)/, "_$1")
    .toLowerCase();
}

const inline = (s) =>
  s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:]|$)/g, "$1$2")
    .trim();

function cleanBody(lines) {
  const out = [];
  let fence = null;
  for (const raw of lines) {
    const f = /^\s*(```+|~~~+)/.exec(raw);
    if (f) {
      fence = fence ? (raw.trim().startsWith(fence) ? null : fence) : f[1];
      continue; // fence markers themselves are not content
    }
    if (fence) {
      out.push(raw.trim());
      continue;
    }
    if (/^\s*:::/.test(raw) || /^\s*<<</.test(raw) || /^\s*<!--/.test(raw)) continue;
    if (/^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(raw) && raw.includes("-")) continue; // table separator row
    let line = raw.replace(/^\s*>\s?/, "").replace(/^\s*([-*+]|\d+\.)\s+/, "");
    line = line.replace(/\|/g, " ");
    out.push(inline(line));
  }
  return out.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/** Names someone might type verbatim: the contents of inline code and the identifiers inside it. */
function keywordsOf(lines, heading) {
  const found = new Set();
  const consider = (s) => {
    for (const m of s.matchAll(/[A-Za-z_$#-][\w./:#$-]*[A-Za-z0-9_]/g)) if (m[0].length >= 3 && m[0].length <= 60) found.add(m[0]);
  };
  consider(heading);
  let fence = false;
  for (const l of lines) {
    if (/^\s*(```|~~~)/.test(l)) fence = !fence;
    if (fence) continue;
    for (const m of l.matchAll(/`([^`]+)`/g)) {
      const span = m[1].trim();
      if (span.length <= 60 && !/\s/.test(span)) found.add(span);
      consider(span);
    }
  }
  return [...found].slice(0, 60).join(" ");
}

const docEntries = [];
for (const file of [...walk(docsDir)].sort()) {
  const rel = relative(docsDir, file).replace(/\\/g, "/");
  const url = rel === "index.md" ? "" : rel.replace(/\.md$/, "").replace(/\/index$/, "/");
  const dirLabel = DIR_LABEL[rel.split("/")[0]] ?? "Documentation";
  let src = readFileSync(file, "utf8");
  if (src.startsWith("---")) {
    const end = src.indexOf("\n---", 3);
    if (end !== -1) src = src.slice(end + 4);
  }
  const lines = src.split("\n");
  const sections = [];
  let current = { level: 0, heading: "", lines: [] };
  let fence = false;
  for (const l of lines) {
    if (/^\s*(```+|~~~+)/.test(l)) fence = !fence;
    const h = !fence && /^(#{1,6})\s+(.*?)\s*$/.exec(l);
    if (h) {
      sections.push(current);
      current = { level: h[1].length, heading: h[2].replace(/\s*\{#[^}]+\}\s*$/, ""), lines: [] };
    } else current.lines.push(l);
  }
  sections.push(current);

  const pageTitle = inline(sections.find((s) => s.level === 1)?.heading ?? (rel === "index.md" ? "Yuyu Documentation" : rel));
  const slugCounts = new Map();
  const stack = []; // ancestors by level
  for (const s of sections) {
    if (s.level === 0) {
      const body = cleanBody(s.lines);
      if (body && rel === "index.md") docEntries.push({ kind: "Docs", site: "docs", title: pageTitle, context: dirLabel, href: url, keywords: "", text: body.slice(0, MAX_TEXT) });
      continue;
    }
    const title = inline(s.heading);
    while (stack.length && stack[stack.length - 1].level >= s.level) stack.pop();
    const ancestors = stack.filter((a) => a.level > 1).map((a) => a.title);
    stack.push({ level: s.level, title });
    const base = slugify(title);
    const n = slugCounts.get(base) ?? 0;
    slugCounts.set(base, n + 1);
    const anchor = n === 0 ? base : `${base}-${n}`;
    const body = cleanBody(s.lines);
    if (!title) continue;
    const isTop = s.level === 1;
    docEntries.push({
      kind: "Docs",
      site: "docs",
      title,
      context: isTop ? `${dirLabel}` : [dirLabel, pageTitle, ...ancestors].join(" › "),
      href: isTop ? url : `${url}#${anchor}`,
      keywords: keywordsOf(s.lines, s.heading),
      text: body.slice(0, MAX_TEXT),
    });
  }
}

// ---- Library entries, loaded through Vite ------------------------------------------------------
const server = await createServer({
  configFile: join(root, "library/vite.config.ts"),
  server: { middlewareMode: true, watch: null },
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
});
let libEntries;
try {
  libEntries = (await server.ssrLoadModule("/src/search/entries.ts")).entries;
} finally {
  await server.close();
}

const commit = readFileSync(join(root, "library/src/vendor/SOURCE_COMMIT"), "utf8").trim();
const entries = [...docEntries, ...libEntries];
const outDir = join(docsDir, "public/search");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entries.json"), JSON.stringify({ version: 1, generatedFrom: `yuyu@${commit}`, entries }));

const byKind = {};
for (const e of entries) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
const size = statSync(join(outDir, "entries.json")).size;
console.log(`search index: ${entries.length} entries (${(size / 1024).toFixed(0)} KB) ${JSON.stringify(byKind)}`);
