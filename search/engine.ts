import MiniSearch from "minisearch";
import type { Entry, Kind, Site } from "./types";

/*
 * The search used by both the documentation and the component library.
 *
 * Matching rules:
 * - Identifiers are split, so "toast" finds useToast and "canvas" finds bg-canvas, while the whole
 *   identifier stays one searchable term, so "useToast" finds exactly that.
 * - All words must match (AND). Words match as prefixes. Words of four or more letters tolerate a typo
 *   (one edit up to 9 letters, two from 10), so long names cannot match loosely.
 * - Exact hits (the query equals a name, export, prop, CSS variable, class or hex code) rank first.
 */

const camelParts = (word: string) =>
  word
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/\s+/);

/** Lowercase the term, drop a leading # or --, and add the parts of camelCase and snake_case words. */
function processTerm(term: string): string[] | null {
  const raw = term.replace(/^#/, "").replace(/^-+/, "");
  if (!raw) return null;
  const parts = new Set<string>([raw.toLowerCase()]);
  for (const p of camelParts(raw)) parts.add(p.toLowerCase());
  for (const p of raw.split("_")) parts.add(p.toLowerCase());
  return [...parts].filter(Boolean);
}

const tokenize = (text: string) => text.split(/[\s,.;:()[\]{}<>"'`=|/\\!?*+~@$%^&-]+/u).filter(Boolean);
const norm = (s: string) => s.toLowerCase().replace(/^#/, "").replace(/^-+/, "").trim();

const KIND_ORDER: Kind[] = ["Component", "Export", "Prop", "Token", "Type", "Scale", "Docs", "Page", "Asset", "Figma", "Example"];

export type Result = { index: number; entry: Entry; score: number; exact: boolean };
export type Scope = "all" | Site;

export type Engine = {
  count: number;
  counts: Record<Scope, (query: string) => number>;
  search(query: string, scope?: Scope, limit?: number): Result[];
};

/** Fuzzy only where a typo is likely, and never loosely: 1 edit up to 9 letters, 2 from 10. */
const fuzzy = (term: string) => (term.length >= 4 ? 0.15 : false);

export function createEngine(entries: Entry[]): Engine {
  const mini = new MiniSearch<Entry & { id: number }>({
    fields: ["title", "keywords", "context", "text"],
    storeFields: [],
    tokenize,
    processTerm,
    searchOptions: { prefix: true, boost: { title: 6, keywords: 5, context: 2, text: 1 }, combineWith: "AND", tokenize, processTerm },
  });
  mini.addAll(entries.map((e, id) => ({ ...e, id })));

  const run = (query: string): Result[] => {
    const q = query.trim();
    if (!q) return [];
    const needle = norm(q);
    const out = mini.search(q, { fuzzy }).map((h) => {
      const entry = entries[h.id as number];
      const exact =
        entry.keywords.split(/\s+/).some((k) => norm(k) === needle) ||
        norm(entry.title) === needle ||
        norm(entry.title.split(".").pop() ?? "") === needle;
      return { index: h.id as number, entry, score: h.score, exact };
    });
    out.sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score || KIND_ORDER.indexOf(a.entry.kind) - KIND_ORDER.indexOf(b.entry.kind));
    return out;
  };

  // Searching twice for the same query (results, then the scope counts) is cheap, but cache the last one anyway.
  let last: { q: string; r: Result[] } | null = null;
  const all = (q: string) => (last && last.q === q ? last.r : (last = { q, r: run(q) }).r);

  return {
    count: entries.length,
    counts: { all: (q) => all(q).length, docs: (q) => all(q).filter((r) => r.entry.site === "docs").length, library: (q) => all(q).filter((r) => r.entry.site === "library").length },
    search: (query, scope = "all", limit = 50) => all(query).filter((r) => scope === "all" || r.entry.site === scope).slice(0, limit),
  };
}

/** The words of a query, for highlighting. */
export const queryWords = (query: string) => [...new Set(tokenize(query.trim()).map((w) => w.replace(/^#/, "")).filter(Boolean))];

/** A short excerpt of `text` around the first query word, or null when the words are not in it. */
export function excerpt(text: string, words: string[], radius = 70): string | null {
  if (!text || !words.length) return null;
  const lower = text.toLowerCase();
  let at = -1;
  for (const w of words) {
    const i = lower.indexOf(w.toLowerCase());
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return null;
  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + radius * 2);
  const cut = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "… " : ""}${cut}${end < text.length ? " …" : ""}`;
}
