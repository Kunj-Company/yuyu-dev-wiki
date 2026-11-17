import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Chip } from "@/components/ui/display";
import { cn } from "@/lib/cn";
import { GITHUB_URL } from "@/lib/openSource";
import type { ComponentDoc, Example, PropDoc } from "../types";
import { docBySlug, examplesFor, SOURCE_COMMIT } from "../registry";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative border-t border-line bg-subtle">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(code).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 text-caption text-ink-secondary hover:text-ink"
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre tabIndex={0} className="overflow-x-auto p-4 pr-24 font-mono text-[13px] leading-relaxed text-ink"><code>{code}</code></pre>
    </div>
  );
}

function ExampleBlock({ example }: { example: Example }) {
  const [dark, setDark] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const { Component } = example;
  return (
    <section className="mt-8" id={example.id}>
      <h3 className="text-h4">{example.title}</h3>
      {example.description ? <p className="mt-1 max-w-2xl text-sm text-ink-secondary">{example.description}</p> : null}
      <div className="mt-3 overflow-hidden rounded-xl border border-line">
        <div className="flex items-center justify-end gap-1 border-b border-line bg-subtle px-2 py-1.5 text-caption">
          <button type="button" aria-pressed={dark} onClick={() => setDark((v) => !v)} className={cn("rounded-md px-2 py-1", dark ? "bg-inverse text-on-inverse" : "text-ink-secondary hover:text-ink")}>
            Dark preview
          </button>
          <button type="button" aria-pressed={showCode} onClick={() => setShowCode((v) => !v)} className={cn("rounded-md px-2 py-1", showCode ? "bg-muted text-ink" : "text-ink-secondary hover:text-ink")}>
            {showCode ? "Hide code" : "Show code"}
          </button>
        </div>
        <div className={cn("bg-canvas p-6 text-ink", dark && "yy-dark-band", example.layout === "full" ? "p-0" : "", example.layout === "stack" ? "flex flex-col gap-4" : "")}>
          {example.layout === "inline" || !example.layout ? <div className="flex flex-wrap items-center gap-3"><Component /></div> : <Component />}
        </div>
        {showCode ? <CodeBlock code={example.code} /> : null}
      </div>
    </section>
  );
}

function PropsTable({ items }: { items: PropDoc[] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-subtle text-caption uppercase text-ink-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Prop</th>
            <th className="px-3 py-2 font-semibold">Type</th>
            <th className="px-3 py-2 font-semibold">Default</th>
            <th className="px-3 py-2 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.name} id={`prop-${p.name.split(" / ")[0].replace(/[^A-Za-z0-9_-]/g, "")}`} className="border-t border-line align-top">
              <td className="px-3 py-2 font-mono text-[13px]">{p.name}{p.required ? <span className="text-danger-fg" title="Required"> *</span> : null}</td>
              <td className="px-3 py-2 font-mono text-[13px] text-ink-secondary">{p.type}</td>
              <td className="px-3 py-2 font-mono text-[13px] text-ink-muted">{p.default ?? "–"}</td>
              <td className="px-3 py-2 text-ink-secondary">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocPage({ doc }: { doc: ComponentDoc }) {
  const examples = examplesFor(doc.slug);
  const sources = Array.isArray(doc.source) ? doc.source : [doc.source];
  return (
    <article className="max-w-4xl">
      <p className="text-overline uppercase text-ink-muted">{doc.group}</p>
      <h1 className="mt-1 text-display-m">{doc.name}</h1>
      <p className="mt-3 max-w-2xl text-body-l text-ink-secondary">{doc.description}</p>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-6">
        <dt className="text-ink-muted">Source</dt>
        <dd className="flex flex-wrap gap-x-4 gap-y-1">
          {sources.map((s) => (
            <a key={s} href={`${GITHUB_URL}/blob/${SOURCE_COMMIT}/${s}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[13px] underline-offset-4 hover:underline">
              {s}
              <ExternalLink size={12} aria-hidden />
            </a>
          ))}
        </dd>
        {doc.exports?.length ? (
          <>
            <dt className="text-ink-muted">Exports</dt>
            <dd className="flex flex-wrap gap-1.5">
              {doc.exports.map((e) => (
                <Chip key={e} tone="outline" size="sm">
                  <span className="font-mono">{e}</span>
                </Chip>
              ))}
            </dd>
          </>
        ) : null}
        <dt className="text-ink-muted">Import</dt>
        <dd className="font-mono text-[13px]">
          {`import { ${(doc.exports?.length ? doc.exports.slice(0, 4) : [doc.name]).join(", ")}${doc.exports && doc.exports.length > 4 ? ", …" : ""} } from "@/${sources[0].replace(/\.tsx?$/, "")}";`}
        </dd>
      </dl>

      {examples.length ? <h2 className="mt-10 text-h3">Examples</h2> : <p className="mt-10 text-ink-muted">No examples yet.</p>}
      {examples.map((e) => (
        <ExampleBlock key={e.id} example={e} />
      ))}

      {doc.props?.length ? <h2 className="mt-12 text-h3">Props</h2> : null}
      {doc.props?.map((table, i) => (
        <div key={i} className="mt-4">
          {table.title ? <h3 className="text-h4">{table.title}</h3> : null}
          <PropsTable items={table.items} />
        </div>
      ))}

      {doc.notes?.length ? (
        <>
          <h2 className="mt-12 text-h3">Usage notes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-secondary">
            {doc.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      ) : null}

      {doc.related?.length ? (
        <p className="mt-10 text-sm text-ink-secondary">
          Related:{" "}
          {doc.related.map((slug, i) => {
            const r = docBySlug(slug);
            return r ? (
              <span key={slug}>
                {i > 0 ? ", " : ""}
                <a href={`#/${slug}`} className="underline underline-offset-4 hover:text-ink">{r.name}</a>
              </span>
            ) : null;
          })}
        </p>
      ) : null}
    </article>
  );
}
