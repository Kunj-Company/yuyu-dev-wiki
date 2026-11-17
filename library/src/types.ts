import type { ComponentType } from "react";

export const GROUPS = ["Actions", "Forms", "Display", "Data", "Overlays", "Navigation", "Feedback", "Brand", "Chrome", "Help content"] as const;
export type Group = (typeof GROUPS)[number];

export type PropDoc = { name: string; type: string; default?: string; description: string; required?: boolean };

/** Metadata for one component page. Examples live in src/examples/<slug>/*.tsx. */
export type ComponentDoc = {
  slug: string;
  name: string;
  group: Group;
  /** Source file(s) in the Yuyu repository, relative to its root. */
  source: string | string[];
  /** One or two sentences: what it is for and when to use it. */
  description: string;
  /** Everything exported from the file(s) that this page covers. */
  exports?: string[];
  props?: { title?: string; items: PropDoc[] }[];
  /** Usage rules and gotchas, one per line. */
  notes?: string[];
  /** Pages that should be read next. */
  related?: string[];
};

export type ExampleMeta = { title: string; description?: string; /** Preview panel padding/layout hint. */ layout?: "inline" | "stack" | "full" };
export type Example = ExampleMeta & { id: string; Component: ComponentType; code: string };
