import type { ComponentType } from "react";

/** Metadata every Foundations page exports as `meta`. Pages live in ./pages/*.tsx. */
export type FoundationMeta = { slug: string; title: string; description: string; order: number };
export type Foundation = FoundationMeta & { Component: ComponentType };

const modules = import.meta.glob<{ default: ComponentType; meta: FoundationMeta }>("./pages/*.tsx", { eager: true });

export const foundations: Foundation[] = Object.values(modules)
  .map((m) => ({ ...m.meta, Component: m.default }))
  .sort((a, b) => a.order - b.order);

export const foundationBySlug = (slug: string) => foundations.find((f) => f.slug === slug);
