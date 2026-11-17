/** One searchable thing. The index is a flat array of these, shared by the wiki and the component library. */
export type Site = "docs" | "library";

export type Kind = "Docs" | "Component" | "Export" | "Prop" | "Example" | "Token" | "Type" | "Scale" | "Asset" | "Page" | "Figma";

export type Entry = {
  kind: Kind;
  /** Which site the entry lives on, so the right site can navigate in place. */
  site: Site;
  title: string;
  /** Second line: where it lives (breadcrumb, source file, values). */
  context: string;
  /** Location relative to the documentation root, for example "design/colour#colour-tokens" or "library/index.html#/button?to=prop-variant". */
  href: string;
  /** Terms someone may type verbatim: names, CSS variables, classes, hex codes. They rank highest. */
  keywords: string;
  /** Everything else, including code. Also the source of the excerpt shown under a result. */
  text: string;
};

export type SearchIndexFile = { version: 1; generatedFrom: string; entries: Entry[] };
