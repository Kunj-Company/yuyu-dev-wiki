#!/usr/bin/env node
// Generates the "agent kit" that lets AI coding agents use the Yuyu design system:
//   docs/public/design-system/agent-prompt.txt   copy-paste prompt (CLAUDE.md, AGENTS.md, .cursorrules, system prompt)
//   docs/public/design-system/agent-prompt-short.txt  the same rules in about 20 lines, for a chat window
//   docs/public/design-system/tokens.json       every token, light and dark, with Tailwind classes
//   docs/public/design-system/tokens.css        the CSS custom properties, ready to drop in
//   docs/public/llms.txt                        index for agents that read /llms.txt
// Everything is derived from library/src/foundations/tokens.json and the gallery catalog, so it
// cannot drift from the documented tokens and components. Run `node scripts/build-tokens.mjs` first.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "docs/public/design-system");
mkdirSync(out, { recursive: true });
const tokens = JSON.parse(readFileSync(join(root, "library/src/foundations/tokens.json"), "utf8"));
const commit = readFileSync(join(root, "library/src/vendor/SOURCE_COMMIT"), "utf8").trim();
const { transformSync } = createRequire(import.meta.url)("esbuild");

// --- component inventory from the gallery catalog ---
const catalogDir = join(root, "library/src/catalog");
const docs = [];
for (const f of readdirSync(catalogDir).filter((f) => f.endsWith(".ts"))) {
  const js = transformSync(readFileSync(join(catalogDir, f), "utf8"), { loader: "ts", format: "esm" }).code;
  const mod = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
  docs.push(...(Array.isArray(mod.default) ? mod.default : [mod.default]));
}
docs.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

// --- tokens.css ---
const decl = (mode) => tokens.colours.map((c) => `  --yy-${c.name}: ${c[mode]};`).join("\n");
const css = `/* Yuyu design tokens. Generated from the Figma file "Yuyu — Light screens" and Yuyu's tokens.css (commit ${commit}).
   Light is the default. Dark follows data-color-mode="dark", or the OS when no mode is set. */
:root,
:root[data-color-mode="light"] {
  color-scheme: light;
${decl("light")}
}

:root[data-color-mode="dark"],
.yy-dark-band {
  color-scheme: dark;
${decl("dark")}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-color-mode]) {
    color-scheme: dark;
${decl("dark").replace(/^ {2}/gm, "    ")}
  }
}

/* Event accent presets: set these on an event page root, never on Yuyu's own chrome. */
${tokens.accents.map((a) => `.yy-accent-${a.name.toLowerCase()} { --yy-accent: ${a.accent}; --yy-accent-soft: ${a.soft}; --yy-accent-text: ${a.text}; }`).join("\n")}
`;
writeFileSync(join(out, "tokens.css"), css);
writeFileSync(join(out, "tokens.json"), JSON.stringify({ ...tokens, generatedFrom: `yuyu@${commit}` }, null, 1) + "\n");

// --- the prompt ---
const colourLines = tokens.groups.map((g) => {
  const rows = tokens.colours.filter((c) => c.group === g).map((c) => {
    const cls = c.tailwind.length ? c.tailwind.map((t) => `\`${t}\``).join(", ") : "(no utility, use the variable)";
    return `- \`${c.cssVar}\`: light ${c.light}, dark ${c.dark}. Tailwind colour name: ${cls}${c.source === "figma" ? " (Figma only, not yet used in Yuyu's code)" : ""}`;
  });
  return `### ${g}\n${rows.join("\n")}`;
}).join("\n\n");

const typeMap = {
  "Display/XL": "text-display-xl", "Display/L": "text-display-l", "Display/M": "text-display-m",
  "Heading/H1": "text-h1", "Heading/H2": "text-h2", "Heading/H3": "text-h3", "Heading/H4": "text-h4",
  "Text/Body L": "text-body-l", "Text/Body": "text-body", "Text/Body UI": "text-body-ui",
  "Text/Body UI Strong": "text-body-ui font-semibold", "Text/Label": "text-label", "Text/Button": "(set by the Button component)",
  "Text/Caption": "text-caption", "Text/Overline": "text-overline", "Code/Mono": "text-mono",
};
const typeLines = tokens.type.map((t) => `- ${t.name}: ${t.family} ${t.style}, ${t.size}px desktop, line height ${t.lineHeight}. Class: \`${typeMap[t.name]}\``).join("\n");
const spaceLine = Object.entries(tokens.spacing).map(([k, v]) => `${k.replace("space-", "")}=${v}px`).join(", ");
const radiusLine = Object.entries(tokens.radius).map(([k, v]) => `${k.replace("radius-", "")}=${v === 999 ? "full" : v + "px"}`).join(", ");

const byGroup = {};
for (const d of docs) (byGroup[d.group] ||= []).push(d);
// Only list names the source file really exports as values, so every import line resolves.
const exportedValues = (src) => {
  const text = readFileSync(join(root, "library/src/vendor", src), "utf8");
  const names = new Set();
  for (const m of text.matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z0-9_]+)/g)) names.add(m[1]);
  for (const m of text.matchAll(/export\s*\{([^}]*)\}/g)) for (const n of m[1].split(",")) names.add(n.trim().split(/\s+as\s+/).pop());
  return names;
};
const componentLines = Object.entries(byGroup).map(([g, items]) =>
  `### ${g}\n` + items.map((d) => {
    const src = Array.isArray(d.source) ? d.source[0] : d.source;
    const real = exportedValues(src);
    const names = (d.exports ?? [d.name]).filter((e) => real.has(e) && /^(use[A-Z]|[A-Z][a-z])/.test(e)).slice(0, 9);
    const props = (d.props?.[0]?.items ?? []).slice(0, 7).map((p) => p.name.split(" / ")[0]).join(", ");
    const imp = names.length ? `\`import { ${names.join(", ")} } from "@/${src.replace(/\.tsx?$/, "")}"\`` : `\`@/${src.replace(/\.tsx?$/, "")}\``;
    return `- **${d.name}**: ${imp}.${props ? ` Key props: ${props}.` : ""} ${d.description.split(/(?<=\.)\s/)[0]}`;
  }).join("\n")).join("\n\n");

const prompt = `# Yuyu design system: instructions for AI coding agents

Paste this whole file into CLAUDE.md, AGENTS.md, .cursorrules, a Copilot instructions file or a system prompt. Replace <DOCS_URL> with where this documentation is hosted. Generated from Yuyu commit ${commit} and the Figma file "Yuyu — Light screens" (${tokens.source.url}).

## Your job

You are building UI for Yuyu, a free, self-hosted platform for running free community events (React 19, Next.js App Router, TypeScript, Tailwind CSS 4, Radix UI, lucide-react). Use the existing design system. Do not invent colours, sizes, components or copy styles. If something is missing, say so and propose an addition to the design system instead of hard-coding a value.

## Where the truth lives

- Machine-readable tokens: <DOCS_URL>/design-system/tokens.json (all colours, light and dark, with Tailwind classes), <DOCS_URL>/design-system/tokens.css (drop-in CSS variables).
- Live components with runnable code and props: <DOCS_URL>/library/index.html
- Written reference: <DOCS_URL>/design/principles, /design/tokens, /design/colour, /design/scales, /design/components, /design/patterns, /design/accessibility, /design/brand-assets
- Figma file: ${tokens.source.url} (pages: Design system, Brand — Dot sign)
- Source in the Yuyu repo: app/styles/tokens.css, app/globals.css, components/ui/*, components/brand/*, docs/DESIGN.md

## Hard rules

1. **Tokens, never hex.** Every colour, radius, shadow and focus colour comes from a token, through the Tailwind theme classes below. Do not write hex, rgb() or arbitrary colour values such as bg-[#fff] in components.
2. **Use the shared primitives** from components/ui before writing markup: Button, IconButton, Field, Input, Dropdown, Checkbox, Switch, Dialog, ConfirmDialog, Tabs, Table, Chip, Card, Callout, EmptyState and so on (list below). Merge class names with cn() from "@/lib/cn".
3. **Whose colour is it?** Yuyu's own surfaces (app shell, dashboard, auth, marketing) use neutrals and ink (--yy-primary) and never an event accent. Event-facing pages (event, programme, session, speaker, series, feedback, ticket, organisation page) use the organiser's accent through --yy-accent, --yy-accent-soft, --yy-on-accent and --yy-accent-text, computed with getAccentTokens from lib/theme/accent.ts. Never restyle organiser logos, covers or certificates with Yuyu's brand.
4. **One primary action per view.** On Yuyu's own UI use Button variant primary. On event pages use variant accent. A second action is secondary, a tertiary one (Back, Undo) is quiet. Destructive actions are never primary: use danger, and confirm with ConfirmDialog.
5. **Marigold is for dots and fills, never text.** It fails contrast on white.
6. **Light, dark and 360px.** Dark is a full theme (data-color-mode="dark"), not an inversion. Check every screen in light, in dark and at 360px wide. Never use dark: variants that assume the OS setting: the variant follows data-color-mode.
7. **Accessible by default.** WCAG AA contrast, real form controls, visible focus (2px outline in --yy-focus, offset 2px), full keyboard access. IconButton requires a label prop that becomes its accessible name. Status is never colour alone: pair a Chip tone with a word or icon. Respect prefers-reduced-motion. Async results use aria-live.
8. **Server Components by default.** Add "use client" only for state, effects, handlers or browser APIs. Never make permission decisions on the client.
9. **No external fonts, scripts or image hosts.** Fonts are self-hosted through Fontsource.
10. **Dates and times** go through lib/format/datetime.ts with the event's time zone. Never show seconds, never output MM/DD/YYYY, no countdown timers in lists.

## Voice and copy

Plain, warm and short. Second person. Sentence case everywhere: buttons, headings, tabs. Name the action ("Register — it's free", "Save new password", not "Submit" or "OK"). Say what happens next. Errors say what went wrong and how to fix it, without blame. Never show raw internals (RRULE strings, full secret URLs). Use "organisation" and "organiser" (British spelling). Recurring events are "Series" in the dashboard and "Every Tuesday" or "Weekly" to attendees. No emoji in the UI. Opening controls for destructive confirmations end with an ellipsis ("Delete organisation…") and open a dialog.

## When to use what

- Main action in Yuyu UI: Button primary. Main action on an event page: Button accent. Second action: secondary. Back or Undo: quiet.
- Confirm something destructive: ConfirmDialog with a danger confirm button, not an inline "Are you sure?".
- Show a status: Chip with a tone plus a word or icon.
- Something needs attention: one Callout per page at most.
- Empty list: EmptyState with a next step.
- Result of a mutation: useToast, plus an inline Callout for form errors. Never alert().
- Choose one of a few options with consequences: option cards (RadioCard). One of many: Dropdown, not the native select.
- Instant setting: SwitchRow, not a checkbox that needs Save.
- Pick a colour: ColorPicker, not input type=color.

## Don't

Gradient text or buttons, hard-coded blues, floating labels or filled inputs, cards inside cards inside cards (at most two nested rounded containers), left-border accent cards, countdown timers, raw RRULE or URLs, colour-only status, white text on a light accent, marigold text, hard-coded hex in components.

## Colour tokens (Tailwind colour name, so use bg-canvas, text-ink, border-line, bg-accent and so on)

${colourLines}

Event accent presets (set per event page root): ${tokens.accents.map((a) => `${a.name} accent ${a.accent.toUpperCase()}, soft ${a.soft.toUpperCase()}`).join("; ")}. Those are the light-mode reference values from Figma. Do not hard-code accent values: getAccentTokens in lib/theme/accent.ts derives the soft, text and dark-mode values from the accent hex with contrast checks, and its output can differ slightly from the Figma presets (for example Ink's soft tint). Organisers may pick any colour, so always go through getAccentTokens.

## Type

Fonts: Bricolage Grotesque (800) for display and headings, Figtree (400, 600, 700) for text, JetBrains Mono for code. Use the type classes, not raw font sizes. Sizes below are desktop (640px and up). Mobile sizes are smaller and handled by the classes.

${typeLines}

## Spacing, radius, elevation, breakpoints

- Spacing is the 4px Tailwind scale: ${spaceLine}.
- Radius: ${radiusLine}. Tailwind: rounded-sm 8, rounded-md 12, rounded-lg 16, rounded-xl 20, rounded-2xl 24, rounded-3xl 28 (code only). Buttons and chips are pills (rounded-full).
- Elevation is mostly flat: cards use a 1px border-line, not a shadow. Shadows: shadow-raised, shadow-float, shadow-ticket, shadow-segment.
- Breakpoints: sm 640px, md 960px, lg 1200px. Easing: ease-yy.

## Brand

The Yuyu dot sign is a 5×5 grid of circles drawing a Y: six marigold dots (${tokens.brand.colours[0].hex}) and one ink base dot (${tokens.brand.colours[2].hex}). Use the components in components/brand (DotMark, DotLockup, DotLoader, DotFace, DotGrid, DotIcon) or the files at <DOCS_URL>/library/assets/brand/. Rules: ${Object.values(tokens.brand.rules).flat().join(" ")} Dot faces express state: ${tokens.brand.faces.join(", ")}. Dot icons: ${tokens.brand.icons.join(", ")}. Faces are always live DotFace grids, never images. On hover of the face or a group ancestor (mouse only) the dots ripple out from the centre over 560ms, the eyes blink and the face lifts 4px with a -4 degree tilt. Nothing moves with reduced motion, and hover={false} keeps a face still. Do not recreate this with your own animation: use DotFace. DotLoader is three dots hopping in turn on a 1.2s loop. The dot sign belongs to Yuyu's own surfaces only.

## Components

Import paths use the "@/" alias for the repo root. Props listed are the main ones, check the live page for the rest.

${componentLines}

## Before you finish

- No hex values or arbitrary colours in the diff. No new component where a primitive exists.
- Primary action count per view is one. Destructive actions confirm.
- Checked in light, dark and at 360px. Keyboard and focus work. IconButtons have labels.
- Copy follows the voice rules. Dates use lib/format/datetime.ts.
- If you needed a token or component that does not exist, you stopped and said so.
`;
writeFileSync(join(out, "agent-prompt.txt"), prompt);

// Short version for a chat window: the rules and where to fetch the tokens, without the long tables.
const short = `You are building UI for Yuyu, a free, self-hosted platform for running free community events (React 19, Next.js, TypeScript, Tailwind CSS 4, Radix UI). Follow Yuyu's design system exactly.

Fetch these before writing UI (replace <DOCS_URL> with the docs site):
- <DOCS_URL>/design-system/tokens.json: every colour (light and dark) with its Tailwind class, plus type, spacing, radius and shadows
- <DOCS_URL>/design-system/agent-prompt.txt: the full rules and component list
- <DOCS_URL>/library/index.html: live components with code and props

Rules:
1. Use tokens through Tailwind classes (bg-canvas, text-ink, border-line, bg-accent). Never write hex, rgb() or arbitrary colours.
2. Use the shared components from "@/components/ui" (Button, Field, Input, Dialog, ConfirmDialog, Chip, Callout, EmptyState, Table, Tabs...) before writing markup. Merge classes with cn().
3. Yuyu's own screens use neutrals and ink and never an event accent. Event pages use the organiser's accent (--yy-accent) via getAccentTokens.
4. One primary action per view. Destructive actions are never primary and confirm with ConfirmDialog.
5. Marigold is for dots and fills, never text. Status is never colour alone.
6. Check light, dark and 360px wide. Keyboard and focus must work. IconButton needs a label.
7. Copy: plain, warm, sentence case, name the action ("Save new password"), British spelling, no emoji.
8. If a token or component is missing, stop and say so. Do not invent one.`;
writeFileSync(join(out, "agent-prompt-short.txt"), short + "\n");

// --- llms.txt ---
const llms = `# Yuyu design system and documentation

> Yuyu is a free, self-hosted platform for running free community events. This site documents the product, architecture, APIs, design system, deployment and how to build on it. For AI agents building Yuyu UI, start with the agent prompt and the design tokens.

## For agents
- [Agent prompt](/design-system/agent-prompt.txt): copy-paste instructions for CLAUDE.md, AGENTS.md or a system prompt, with every token and component
- [Agent prompt, short](/design-system/agent-prompt-short.txt): the rules in about 20 lines
- [Design tokens (JSON)](/design-system/tokens.json): all colours light and dark, Tailwind classes, type, spacing, radius, shadows, Figma component map
- [Design tokens (CSS)](/design-system/tokens.css): drop-in CSS custom properties
- [Component library](/library/index.html): live examples, code and props for every component
- [Search index (JSON)](/search/entries.json): every documentation section and every library component, prop, example, token and file, each with a location

## Design system
- [Design principles and voice](/design/principles)
- [Design tokens](/design/tokens)
- [Colour reference](/design/colour)
- [Type, spacing and elevation scales](/design/scales)
- [Components](/design/components)
- [Brand assets and downloads](/design/brand-assets)
- [Accessibility](/design/accessibility)

## Elsewhere
- [Yuyu source](https://github.com/twilighty-abhi/yuyu)
- [Figma file](${tokens.source.url})
`;
writeFileSync(join(root, "docs/public/llms.txt"), llms);
console.log(`agent kit: prompt ${(prompt.length / 1024).toFixed(1)} KB, ${docs.length} components, ${tokens.colours.length} colours`);
