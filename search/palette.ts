import "./palette.css";
import { createEngine, excerpt, queryWords, type Engine, type Result, type Scope } from "./engine";
import type { Entry, Kind, SearchIndexFile } from "./types";

/*
 * The search interface shared by the documentation (Vue) and the component library (React).
 * It is plain DOM, so both sites render the very same thing. A host calls initSearch once and
 * puts a <button data-yy-search> wherever it wants a trigger. "/" and Ctrl or Cmd + K open it.
 */

export type SearchHost = {
  site: "docs" | "library";
  /** Absolute URL of the documentation root (with the site base), used to resolve entry hrefs and to load the index. */
  root: URL;
  /** Open an entry. The host decides between in-place navigation and a full page load. */
  navigate(url: URL, entry: Entry): void;
};

const KIND_LABEL: Record<Kind, string> = {
  Docs: "Docs", Component: "Component", Export: "Export", Prop: "Prop", Example: "Example",
  Token: "Token", Type: "Type", Scale: "Scale", Asset: "File", Page: "Page", Figma: "Figma",
};
const TRY = ["useToast", "variant", "--yy-accent", "bg-canvas", "#FFB547", "CRON_SECRET", "mutation core", "mark-full.svg"];
const SCOPES: Array<[Scope, string]> = [["all", "All"], ["docs", "Documentation"], ["library", "Library"]];
const LIMIT = 50;

let host: SearchHost | null = null;
let engine: Engine | null = null;
let loading: Promise<Engine> | null = null;

function loadEngine(): Promise<Engine> {
  if (engine) return Promise.resolve(engine);
  if (!host) return Promise.reject(new Error("Search is not initialised."));
  loading ??= fetch(new URL("search/entries.json", host.root))
    .then((r) => {
      if (!r.ok) throw new Error(`The search index could not be loaded (${r.status}).`);
      return r.json() as Promise<SearchIndexFile>;
    })
    .then((file) => (engine = createEngine(file.entries)))
    .catch((e) => {
      loading = null; // allow a retry
      throw e;
    });
  return loading;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {}, ...children: Array<Node | string>) => {
  const node = document.createElement(tag);
  const { class: cls, ...rest } = props as Record<string, unknown>;
  if (cls) node.className = String(cls);
  for (const [k, v] of Object.entries(rest)) {
    // ARIA through attributes, which every browser supports (the reflected properties are newer).
    if (k === "role") node.setAttribute("role", String(v));
    else if (/^aria[A-Z]/.test(k)) node.setAttribute(`aria-${k.slice(4).toLowerCase()}`, String(v));
    else (node as unknown as Record<string, unknown>)[k] = v;
  }
  for (const c of children) node.append(c);
  return node;
};

/** Text with the matched words wrapped in <mark>. Built from nodes, never innerHTML, so content can't inject markup. */
function highlight(text: string, words: string[]): Array<Node | string> {
  if (!words.length) return [text];
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length);
  return text.split(new RegExp(`(${escaped.join("|")})`, "ig")).map((part, i) => (i % 2 === 1 ? el("mark", { class: "yy-s-mark" }, part) : part));
}

let uid = 0;

class Palette {
  private root: HTMLElement;
  private input: HTMLInputElement;
  private list: HTMLElement;
  private status: HTMLElement;
  private foot: HTMLElement;
  private tabs: HTMLElement;
  private body: HTMLElement;
  private results: Result[] = [];
  private active = 0;
  private scope: Scope = "all";
  private words: string[] = [];
  private returnFocus: HTMLElement | null = null;
  private id = `yy-s-${++uid}`;
  private requestId = 0;
  private opened = false;

  constructor() {
    this.input = el("input", {
      class: "yy-s-input",
      type: "text",
      placeholder: "Search pages, components, props, functions, tokens, files",
      autocomplete: "off",
      spellcheck: false,
    });
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-autocomplete", "list");
    this.input.setAttribute("aria-expanded", "false");
    this.input.setAttribute("aria-controls", `${this.id}-list`);
    this.input.setAttribute("aria-label", "Search");
    this.input.setAttribute("autocapitalize", "off");
    this.input.addEventListener("input", () => this.update());

    const clear = el("button", { class: "yy-s-clear", type: "button", ariaLabel: "Clear search" }, "×");
    clear.addEventListener("click", () => {
      this.input.value = "";
      this.update();
      this.input.focus();
    });
    const head = el("div", { class: "yy-s-head" }, el("span", { class: "yy-s-glass", ariaHidden: "true" } as never, "⌕"), this.input, clear, el("kbd", { class: "yy-s-kbd" }, "Esc"));

    this.tabs = el("div", { class: "yy-s-tabs", role: "tablist", ariaLabel: "Where to search" } as never);
    this.list = el("ul", { class: "yy-s-list", id: `${this.id}-list`, role: "listbox", ariaLabel: "Results" } as never);
    this.body = el("div", { class: "yy-s-body" }, this.list);
    this.status = el("span", { class: "yy-s-count", ariaLive: "polite" } as never);
    this.foot = el(
      "div",
      { class: "yy-s-foot" },
      this.status,
      el("span", { class: "yy-s-hints" }, el("span", {}, el("kbd", {}, "↑↓"), " move"), el("span", {}, el("kbd", {}, "Enter"), " open"), el("span", {}, el("kbd", {}, "Esc"), " close")),
    );

    const dialog = el("div", { class: "yy-s-dialog", role: "dialog", ariaModal: "true", ariaLabel: "Search the Yuyu documentation and component library" } as never, head, this.tabs, this.body, this.foot);
    dialog.addEventListener("keydown", (e) => this.onKey(e));
    this.root = el("div", { class: "yy-s-overlay" }, dialog);
    this.root.hidden = true;
    this.root.addEventListener("mousedown", (e) => e.target === this.root && this.close());
    document.body.append(this.root);
  }

  open(initial = "") {
    if (this.opened) return this.input.focus();
    this.opened = true;
    this.returnFocus = document.activeElement as HTMLElement | null;
    this.root.hidden = false;
    document.documentElement.classList.add("yy-s-lock");
    this.input.value = initial;
    this.scope = "all";
    this.input.focus();
    this.update();
    // Warm the index while the person starts typing.
    loadEngine().then(() => this.update(), () => this.update());
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.root.hidden = true;
    document.documentElement.classList.remove("yy-s-lock");
    this.returnFocus?.focus?.();
  }

  private onKey(e: KeyboardEvent) {
    const n = this.results.length;
    if (e.key === "Escape") { e.preventDefault(); this.close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); this.setActive(Math.min(this.active + 1, Math.max(n - 1, 0))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); this.setActive(Math.max(this.active - 1, 0)); }
    else if (e.key === "Home" && n && e.target === this.input && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.setActive(0); }
    else if (e.key === "End" && n && e.target === this.input && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.setActive(n - 1); }
    else if (e.key === "Enter" && this.results[this.active] && !(e.target as HTMLElement).closest(".yy-s-tabs, .yy-s-chip, .yy-s-clear")) { e.preventDefault(); this.go(this.results[this.active]); }
    else if (e.key === "Tab") {
      // Keep focus in the dialog: cycle through the input, the scope tabs and the clear button.
      const stops = [...this.root.querySelectorAll<HTMLElement>(".yy-s-input, .yy-s-clear:not([hidden]), .yy-s-tab")];
      const i = stops.indexOf(document.activeElement as HTMLElement);
      const next = stops[(i + (e.shiftKey ? -1 : 1) + stops.length) % stops.length];
      e.preventDefault();
      next?.focus();
    }
  }

  private go(r: Result) {
    if (!host) return;
    const url = new URL(r.entry.href, host.root);
    this.close();
    host.navigate(url, r.entry);
  }

  private setActive(i: number) {
    this.active = i;
    this.list.querySelectorAll<HTMLElement>(".yy-s-item").forEach((li, idx) => {
      li.setAttribute("aria-selected", String(idx === i));
      if (idx === i) li.scrollIntoView({ block: "nearest" });
    });
    this.input.setAttribute("aria-activedescendant", this.results[i] ? `${this.id}-${i}` : "");
  }

  private update() {
    const id = ++this.requestId;
    const q = this.input.value;
    const clear = this.root.querySelector<HTMLElement>(".yy-s-clear");
    if (clear) clear.hidden = !q;
    this.words = queryWords(q);
    this.list.replaceChildren();
    this.input.setAttribute("aria-expanded", "false");

    if (!engine) {
      // Index still loading or failed.
      loadEngine().then(
        () => id === this.requestId && this.update(),
        (err: Error) => id === this.requestId && this.message("Search is unavailable", err.message, true),
      );
      this.tabs.replaceChildren();
      this.status.textContent = "";
      if (!loading) return;
      return this.message("Loading search…", "This takes a moment the first time.", false);
    }

    this.renderTabs(q);
    if (!q.trim()) return this.empty();
    this.results = engine.search(q, this.scope, LIMIT);
    if (!this.results.length) return this.none(q);
    this.input.setAttribute("aria-expanded", "true");
    const frag = document.createDocumentFragment();
    this.results.forEach((r, i) => frag.append(this.item(r, i)));
    this.list.append(frag);
    this.status.textContent = `${this.results.length}${this.results.length === LIMIT ? "+" : ""} result${this.results.length === 1 ? "" : "s"}`;
    this.setActive(0);
  }

  private renderTabs(q: string) {
    this.tabs.replaceChildren(
      ...SCOPES.map(([scope, label]) => {
        const count = q.trim() && engine ? engine.counts[scope](q) : null;
        const tab = el("button", { class: "yy-s-tab", type: "button", role: "tab" } as never, label, count !== null ? el("span", { class: "yy-s-tabcount" }, String(count)) : "");
        tab.setAttribute("aria-selected", String(this.scope === scope));
        tab.addEventListener("click", () => {
          this.scope = scope;
          this.update();
          this.input.focus();
        });
        return tab;
      }),
    );
  }

  private item(r: Result, i: number) {
    const { entry } = r;
    const snippet = entry.kind === "Docs" || entry.kind === "Example" ? excerpt(entry.text, this.words) : null;
    const text = el("span", { class: "yy-s-text" },
      el("span", { class: "yy-s-titleline" }, el("span", { class: "yy-s-title" }, ...highlight(entry.title, this.words)), r.exact ? el("span", { class: "yy-s-exact" }, "exact") : ""),
      el("span", { class: "yy-s-context" }, ...highlight(entry.context, this.words)),
      snippet ? el("span", { class: "yy-s-snippet" }, ...highlight(snippet, this.words)) : "",
    );
    const li = el("li", { class: "yy-s-item", id: `${this.id}-${i}`, role: "option" } as never,
      el("span", { class: `yy-s-kind yy-s-kind-${entry.kind.toLowerCase()}` }, KIND_LABEL[entry.kind]),
      text,
      el("span", { class: "yy-s-site" }, entry.site === "library" ? "Library" : "Docs"),
    );
    li.setAttribute("aria-selected", "false");
    li.addEventListener("mousemove", () => this.active !== i && this.setActive(i));
    li.addEventListener("click", () => this.go(r));
    return li;
  }

  private empty() {
    this.results = [];
    this.status.textContent = "Start typing";
    const chips = TRY.map((t) => {
      const b = el("button", { class: "yy-s-chip", type: "button" }, t);
      b.addEventListener("click", () => {
        this.input.value = t;
        this.update();
        this.input.focus();
      });
      return b;
    });
    this.list.replaceChildren(
      el("li", { class: "yy-s-help" },
        el("p", {}, `Search ${engine?.count.toLocaleString() ?? ""} things across the documentation and the component library: pages and their code, components, every export and prop, example code, colour and type tokens, CSS variables, Tailwind classes, hex codes and files.`),
        el("p", { class: "yy-s-overline" }, "Try"),
        el("div", { class: "yy-s-chips" }, ...chips),
      ),
    );
  }

  private none(q: string) {
    this.status.textContent = "No results";
    this.list.replaceChildren(
      el("li", { class: "yy-s-help", role: "status" } as never,
        el("p", { class: "yy-s-strong" }, `Nothing matches “${q}”${this.scope !== "all" ? ` in ${SCOPES.find(([s]) => s === this.scope)?.[1]}` : ""}.`),
        el("p", {}, "Try fewer or shorter words, part of a name (“toast” finds useToast), or a hex code, CSS variable or class."),
      ),
    );
  }

  private message(title: string, body: string, retry: boolean) {
    this.results = [];
    const parts: Node[] = [el("p", { class: "yy-s-strong" }, title), el("p", {}, body)];
    if (retry) {
      const b = el("button", { class: "yy-s-chip", type: "button" }, "Try again");
      b.addEventListener("click", () => this.update());
      parts.push(b);
    }
    this.list.replaceChildren(el("li", { class: "yy-s-help", role: "status" } as never, ...parts));
  }
}

let palette: Palette | null = null;
let installed = false;

export function openSearch(initial = "") {
  palette ??= new Palette();
  palette.open(initial);
}

/** Call once, in the browser. Safe to call again (for example on hot reload): the last host wins. */
export function initSearch(h: SearchHost) {
  host = h;
  if (installed) return;
  installed = true;

  // Fetch and index in the background so the first search is instant. It waits for the page to finish
  // loading and for an idle moment, and starts sooner when the pointer or focus reaches a search button.
  const warm = () => void loadEngine().catch(() => undefined);
  const idle = (cb: () => void) => ("requestIdleCallback" in window ? (window as unknown as { requestIdleCallback(cb: () => void, o?: object): void }).requestIdleCallback(cb, { timeout: 4000 }) : window.setTimeout(cb, 1500));
  if (document.readyState === "complete") idle(warm);
  else window.addEventListener("load", () => idle(warm), { once: true });
  for (const type of ["pointerover", "focusin", "touchstart"] as const) {
    document.addEventListener(type, (e) => ((e.target as HTMLElement | null)?.closest?.("[data-yy-search]") ? warm() : undefined), { passive: true });
  }
  document.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement | null;
    const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const combo = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && !e.altKey;
    const slash = e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey;
    if (combo || slash) {
      e.preventDefault();
      openSearch();
    }
  });
  document.addEventListener("click", (e) => {
    const trigger = (e.target as HTMLElement | null)?.closest("[data-yy-search]");
    if (trigger) {
      e.preventDefault();
      openSearch();
    }
  });
}
