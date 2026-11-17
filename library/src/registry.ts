import type { ComponentDoc, Example, ExampleMeta } from "./types";
import { GROUPS } from "./types";

const docModules = import.meta.glob<{ default: ComponentDoc | ComponentDoc[] }>("./catalog/*.ts", { eager: true });
const exampleModules = import.meta.glob<{ default: React.ComponentType; meta: ExampleMeta }>("./examples/*/*.tsx", { eager: true });
const exampleSources = import.meta.glob<string>("./examples/*/*.tsx", { eager: true, query: "?raw", import: "default" });

export const docs: ComponentDoc[] = Object.values(docModules)
  .flatMap((m) => (Array.isArray(m.default) ? m.default : [m.default]))
  .sort((a, b) => a.name.localeCompare(b.name));

const examplesBySlug = new Map<string, Example[]>();
for (const path of Object.keys(exampleModules).sort()) {
  const [, slug, file] = path.match(/\.\/examples\/([^/]+)\/([^/]+)\.tsx$/)!;
  const mod = exampleModules[path];
  const list = examplesBySlug.get(slug) ?? [];
  list.push({ ...mod.meta, id: file, Component: mod.default, code: stripMeta(exampleSources[path]) });
  examplesBySlug.set(slug, list);
}

/** Shows the snippet a developer would copy: drop the gallery-only `meta` export. */
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
  return (source.slice(0, start) + source.slice(end + 1)).replace(/\n{3,}/g, "\n\n").trim();
}

export const examplesFor = (slug: string) => examplesBySlug.get(slug) ?? [];
export const docBySlug = (slug: string) => docs.find((d) => d.slug === slug);
export const grouped = GROUPS.map((group) => ({ group, items: docs.filter((d) => d.group === group) })).filter((g) => g.items.length > 0);
export const SOURCE_COMMIT = __SOURCE_COMMIT__;

export { foundations, foundationBySlug } from "./foundations/registry";
