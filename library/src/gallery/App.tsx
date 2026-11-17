import { useEffect, useState } from "react";
import { Menu as MenuIcon, Search as SearchIcon, X } from "lucide-react";
import { ColorModeToggle } from "@/components/chrome/ColorModeToggle";
import { DotLockup } from "@/components/brand/DotLockup";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { docBySlug, docs, grouped, foundations, foundationBySlug } from "../registry";
import { DocPage } from "./DocPage";
import { Home } from "./Home";
import { FoundationPage } from "./FoundationPage";

const WIKI_URL = "../";

/** The hash is "#/route" or "#/route?to=anchor". `to` scrolls to and flashes an element after the page renders. */
function useHashRoute() {
  const read = () => {
    const raw = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
    const [route, query = ""] = raw.split("?");
    return { route, to: new URLSearchParams(query).get("to") };
  };
  const [state, setState] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setState(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return state;
}

function useScrollToAnchor(route: string, to: string | null) {
  useEffect(() => {
    if (!to) return;
    let tries = 0;
    const id = window.setInterval(() => {
      const el = document.getElementById(to);
      if (el || ++tries > 20) {
        window.clearInterval(id);
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        el.classList.add("yy-search-flash");
        window.setTimeout(() => el.classList.remove("yy-search-flash"), 2200);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [route, to]);
}

export function App() {
  const { route, to } = useHashRoute();
  const [open, setOpen] = useState(false);
  useScrollToAnchor(route, to);

  const doc = route ? docBySlug(route) : undefined;
  const foundation = route.startsWith("foundations/") ? foundationBySlug(route.slice("foundations/".length)) : undefined;

  const filtered = grouped;

  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    const title = doc?.name ?? foundation?.title;
    document.title = title ? `${title} · Yuyu Component Library` : "Yuyu Component Library";
  }, [doc, foundation]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-canvas/95 px-4 backdrop-blur md:px-6">
        <IconButton label={open ? "Close menu" : "Open menu"} className="md:hidden" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={20} /> : <MenuIcon size={20} />}
        </IconButton>
        <a href="#/" className="flex items-center gap-3" aria-label="Component library home">
          <DotLockup size="sm" label={null} />
          <span className="hidden text-sm font-semibold text-ink-secondary sm:inline">Component library</span>
        </a>
        <button
          type="button"
          data-yy-search=""
          className="yy-search-trigger ml-auto"
          aria-label="Search the documentation and component library"
          aria-keyshortcuts="/ Control+K Meta+K"
        >
          <SearchIcon size={16} aria-hidden />
          <span className="yy-search-label">Search</span>
          <kbd>/</kbd>
        </button>
        <span className="flex items-center gap-2">
          <a href={WIKI_URL} className="hidden text-sm font-medium text-ink-secondary underline-offset-4 hover:text-ink hover:underline sm:inline">
            Back to the wiki
          </a>
          <ColorModeToggle />
        </span>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <nav
          aria-label="Components"
          className={cn(
            "fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto border-r border-line bg-canvas p-4 md:sticky md:top-16 md:block md:h-[calc(100vh-4rem)] md:w-64 md:shrink-0",
            open ? "block" : "hidden",
          )}
        >
          <button type="button" data-yy-search="" className="yy-search-trigger !w-full">
            <SearchIcon size={16} aria-hidden /> <span className="yy-search-label !inline">Search</span>
            <kbd className="!inline">/</kbd>
          </button>
          <p className="mt-3 text-caption text-ink-muted">{docs.length} components</p>
            <div className="mt-5">
              <h2 className="text-overline uppercase text-ink-muted">Foundations</h2>
              <ul className="mt-2 space-y-0.5">
                {foundations.map((f) => (
                  <li key={f.slug}>
                    <a
                      href={`#/foundations/${f.slug}`}
                      aria-current={route === `foundations/${f.slug}` ? "page" : undefined}
                      className={cn("block rounded-md px-2.5 py-1.5 text-sm", route === `foundations/${f.slug}` ? "bg-muted font-semibold text-ink" : "text-ink-secondary hover:bg-subtle hover:text-ink")}
                    >
                      {f.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          {filtered.map(({ group, items }) => (
            <div key={group} className="mt-5">
              <h2 className="text-overline uppercase text-ink-muted">{group}</h2>
              <ul className="mt-2 space-y-0.5">
                {items.map((d) => (
                  <li key={d.slug}>
                    <a
                      href={`#/${d.slug}`}
                      aria-current={d.slug === route ? "page" : undefined}
                      className={cn("block rounded-md px-2.5 py-1.5 text-sm", d.slug === route ? "bg-muted font-semibold text-ink" : "text-ink-secondary hover:bg-subtle hover:text-ink")}
                    >
                      {d.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <main id="main" className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-10">
          {doc ? <DocPage key={doc.slug} doc={doc} /> : foundation ? <FoundationPage key={foundation.slug} foundation={foundation} /> : <Home />}
        </main>
      </div>
    </div>
  );
}
