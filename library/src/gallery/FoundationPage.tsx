import type { Foundation } from "../foundations/registry";

export function FoundationPage({ foundation }: { foundation: Foundation }) {
  const { Component } = foundation;
  return (
    <article className="max-w-5xl">
      <p className="text-overline uppercase text-ink-muted">Foundations</p>
      <h1 className="mt-1 text-display-m">{foundation.title}</h1>
      <p className="mt-3 max-w-2xl text-body-l text-ink-secondary">{foundation.description}</p>
      <Component />
    </article>
  );
}
