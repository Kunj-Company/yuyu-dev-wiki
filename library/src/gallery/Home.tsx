import { Card } from "@/components/ui/display";
import { SOURCE_COMMIT, grouped, docs, foundations } from "../registry";

export function Home() {
  return (
    <div className="max-w-5xl">
      <p className="text-overline uppercase text-ink-muted">Yuyu design system</p>
      <h1 className="mt-2 text-display-l">Component library</h1>
      <p className="mt-4 max-w-2xl text-body-l text-ink-secondary">
        Every reusable Yuyu component, rendered live with the real design tokens. Each page has runnable examples, the code to copy, and the props. Use the toggle in the top bar to check light and dark, and the toggle on each example to preview a single block in dark.
      </p>
      <p className="mt-3 text-sm text-ink-muted">
        {docs.length} components, vendored from <code className="font-mono">twilighty-abhi/yuyu</code> @ <code className="font-mono">{SOURCE_COMMIT}</code>.
      </p>
      <section className="mt-10">
        <h2 className="text-h3">Foundations</h2>
        <p className="mt-1 text-ink-secondary">Colour, type, spacing, logos and brand assets, with values to copy and files to download.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {foundations.map((f) => (
            <a key={f.slug} href={`#/foundations/${f.slug}`} className="rounded-xl focus-visible:outline-none">
              <Card padding="sm" className="h-full transition-colors hover:bg-subtle">
                <h3 className="text-title">{f.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-ink-secondary">{f.description}</p>
              </Card>
            </a>
          ))}
        </div>
      </section>
      {grouped.map(({ group, items }) => (
        <section key={group} className="mt-10">
          <h2 className="text-h3">{group}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => (
              <a key={d.slug} href={`#/${d.slug}`} className="rounded-xl focus-visible:outline-none">
                <Card padding="sm" className="h-full transition-colors hover:bg-subtle">
                  <h3 className="text-title">{d.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-secondary">{d.description}</p>
                </Card>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
