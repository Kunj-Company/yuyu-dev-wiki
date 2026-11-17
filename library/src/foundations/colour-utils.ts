import tokens from "./tokens.json";
import tokensCssRaw from "@/app/styles/tokens.css?raw";
import globalsCssRaw from "@/app/globals.css?raw";

/* ---------- Colour maths (WCAG 2.x) ---------- */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** "AAA" at 7:1, "AA" at 4.5:1, "AA large" at 3:1, otherwise "Fail". */
export function wcagLevel(ratio: number): "AAA" | "AA" | "AA large" | "Fail" {
  return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large" : "Fail";
}

/** "#18181B0A" -> "rgba(24, 24, 27, 0.04)". Plain 6-digit hex is returned unchanged. */
export function hex8ToRgba(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 8) return `#${h}`;
  const [r, g, b] = hexToRgb(`#${h.slice(0, 6)}`);
  const a = Math.round((parseInt(h.slice(6), 16) / 255) * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* ---------- Token helpers ---------- */

export type ColourToken = Omit<(typeof tokens.colours)[number], "source"> & { source: "both" | "code" | "figma" };
export const colours: ColourToken[] = tokens.colours as ColourToken[];

/** The Tailwind utility to show for a colour: text-*, border-* or bg-*. */
export function utilityPrefix(c: Pick<ColourToken, "name" | "group">): "bg" | "text" | "border" {
  if (c.group === "Borders" || /-border$/.test(c.name)) return "border";
  if (c.group === "Text" || /^on-/.test(c.name) || /-(fg|text)$/.test(c.name)) return "text";
  return "bg";
}
export const utilities = (c: ColourToken) => c.tailwind.map((t) => `${utilityPrefix(c)}-${t}`);

export const SOURCE_LABEL = { both: "Figma and code", code: "Code only", figma: "Figma only" } as const;

/* ---------- Reading the vendored CSS ---------- */

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const tokensCss = stripComments(tokensCssRaw);

/** Declarations (`--yy-x: value`) of the first block whose selector starts with `selector`. */
function declsOf(css: string, selector: string, prefix = "--yy-"): Record<string, string> {
  const i = css.indexOf(selector);
  if (i < 0) return {};
  const open = css.indexOf("{", i);
  const close = css.indexOf("\n}", open);
  const out: Record<string, string> = {};
  for (const m of css.slice(open, close).matchAll(new RegExp(`(${prefix}[\\w-]+):\\s*([^;]+);`, "g"))) out[m[1]] = m[2].trim();
  return out;
}

export const codeLightVars = declsOf(tokensCss, ':root,\n:root[data-color-mode="light"]');
export const codeDarkVars = declsOf(tokensCss, ':root[data-color-mode="dark"],\n.yy-dark-band');

export const shadowNames = ["raised", "float", "ticket", "segment"] as const;
export const shadowsCodeDark = Object.fromEntries(shadowNames.map((n) => [n, codeDarkVars[`--yy-shadow-${n}`]])) as Record<(typeof shadowNames)[number], string>;

/** Non-colour lines of the `@theme inline` block in globals.css (fonts, radius, shadow, breakpoints, easing). */
export const themeNonColourLines: string[] = (() => {
  const css = stripComments(globalsCssRaw);
  const i = css.indexOf("@theme inline");
  const open = css.indexOf("{", i);
  const close = css.indexOf("\n}", open);
  return css
    .slice(open + 1, close)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("--") && !l.startsWith("--color-"));
})();

export const fontStackLines = themeNonColourLines.filter((l) => l.startsWith("--font-"));
export const themeValue = (name: string) => themeNonColourLines.find((l) => l.startsWith(`${name}:`))?.replace(/^[^:]+:\s*/, "").replace(/;$/, "");

/* ---------- Generators (always built from tokens.json so exports cannot drift) ---------- */

function varLines(mode: "light" | "dark", indent = "  "): string[] {
  const lines: string[] = [];
  for (const g of tokens.groups) {
    const items = colours.filter((c) => c.group === g);
    lines.push(`${indent}/* ${g} */`);
    for (const c of items) lines.push(`${indent}${c.cssVar}: ${c[mode].toLowerCase()};`);
    lines.push("");
  }
  lines.pop();
  return lines;
}

const shadowLines = (set: Record<string, string>, indent = "  ") =>
  shadowNames.map((n) => `${indent}--yy-shadow-${n}: ${set[n]};`);

const lightShadows = Object.fromEntries(shadowNames.map((n) => [n, (tokens.shadowsCode as Record<string, string>)[n]]));

/** Only the colour variables, light then dark (used by the Colour page "copy all"). */
export function coloursCss(): string {
  return [
    ":root,",
    ':root[data-color-mode="light"] {',
    ...varLines("light"),
    "}",
    "",
    ':root[data-color-mode="dark"],',
    ".yy-dark-band {",
    ...varLines("dark"),
    "}",
    "",
  ].join("\n");
}

export function coloursJson(): string {
  const out: Record<string, { light: string; dark: string }> = {};
  for (const c of colours) out[c.name] = { light: c.light, dark: c.dark };
  return JSON.stringify(out, null, 2);
}

/** tokens.css: same structure as Yuyu's app/styles/tokens.css, with every colour token. */
export function tokensCssFile(): string {
  const dark = (indent: string) => [...varLines("dark", indent), "", ...shadowLines(shadowsCodeDark, indent)];
  return [
    "/*",
    ` * Yuyu design tokens, generated from the Figma file "${tokens.source.file}" and Yuyu's tokens.css.`,
    " * Colour mode: data-color-mode=\"light\" | \"dark\" on <html> is an explicit choice.",
    " * With no attribute, prefers-color-scheme decides.",
    " * Marigold is for dots and fills only, never text.",
    " */",
    "",
    ":root,",
    ':root[data-color-mode="light"] {',
    "  color-scheme: light;",
    "",
    ...varLines("light"),
    "",
    "  /* Elevation */",
    ...shadowLines(lightShadows),
    "",
    "  /* Focus ring colour (event pages swap this to the accent) */",
    `  --yy-focus: ${codeLightVars["--yy-focus"] ?? "var(--yy-primary)"};`,
    "}",
    "",
    "/* .yy-dark-band keeps a section dark on light pages. */",
    ':root[data-color-mode="dark"],',
    ".yy-dark-band {",
    "  color-scheme: dark;",
    "",
    ...dark("  "),
    "}",
    "",
    "/* No explicit choice: follow the operating system. Mirrors the dark block above. */",
    "@media (prefers-color-scheme: dark) {",
    "  :root:not([data-color-mode]) {",
    "    color-scheme: dark;",
    "",
    ...dark("    "),
    "  }",
    "}",
    "",
  ].join("\n");
}

/** Tailwind 4 theme: colour utilities from tailwind[] names, the rest copied from globals.css. */
export function themeFile(): string {
  const colourLines: string[] = [];
  for (const g of tokens.groups) {
    const items = colours.filter((c) => c.group === g && c.tailwind.length);
    if (!items.length) continue;
    colourLines.push(`  /* ${g} */`);
    for (const c of items) for (const t of c.tailwind) colourLines.push(`  --color-${t}: var(${c.cssVar});`);
    colourLines.push("");
  }
  const rest = themeNonColourLines.map((l) => `  ${l}`);
  return [
    "/* Tailwind 4 theme mapped onto the Yuyu tokens. `inline` keeps utilities pointing at the live variables. */",
    '@import "tailwindcss";',
    '@import "./tokens.css";',
    "",
    '@custom-variant dark (&:where([data-color-mode="dark"], [data-color-mode="dark"] *));',
    "",
    "@theme inline {",
    ...colourLines,
    ...rest,
    "}",
    "",
  ].join("\n");
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** W3C design-tokens style JSON ($type / $value). Light is $value, dark sits in $extensions.mode. */
export function w3cJson(): string {
  const color: Record<string, Record<string, unknown>> = {};
  for (const g of tokens.groups) {
    color[slug(g)] = {};
    for (const c of colours.filter((x) => x.group === g)) {
      color[slug(g)][c.name] = {
        $type: "color",
        $value: c.light,
        $extensions: { mode: { light: c.light, dark: c.dark }, yuyu: { cssVar: c.cssVar, tailwind: c.tailwind, source: c.source } },
      };
    }
  }
  const accent: Record<string, unknown> = {};
  for (const a of tokens.accents) {
    accent[slug(a.name)] = {
      accent: { $type: "color", $value: a.accent },
      "accent-soft": { $type: "color", $value: a.soft },
      "accent-text": { $type: "color", $value: a.text },
    };
  }
  const dim = (px: number) => ({ $type: "dimension", $value: `${px}px` });
  const spacing = Object.fromEntries(Object.entries(tokens.spacing).map(([k, v]) => [k, dim(v)]));
  const radius = Object.fromEntries(Object.entries(tokens.radius).map(([k, v]) => [k, dim(v)]));
  const shadow = Object.fromEntries(
    tokens.shadows.map((s) => [
      slug(s.name.replace("Shadow/", "")),
      {
        $type: "shadow",
        $value: s.layers.map((l) => ({ color: l.color, offsetX: "0px", offsetY: `${l.y}px`, blur: `${l.blur}px`, spread: "0px" })),
      },
    ]),
  );
  const typography = Object.fromEntries(
    tokens.type.map((t) => [
      slug(t.name),
      {
        $type: "typography",
        $value: {
          fontFamily: t.family,
          fontWeight: t.weight,
          fontSize: `${t.size}px`,
          lineHeight: t.lineHeight,
          letterSpacing: `${t.letterSpacingPx / 100}em`,
        },
      },
    ]),
  );
  return JSON.stringify(
    {
      $description: `Yuyu design tokens from the Figma file "${tokens.source.file}" and Yuyu's code. Colour tokens: $value is light, $extensions.mode holds light and dark.`,
      color,
      "event-accent": accent,
      spacing,
      radius,
      shadow,
      typography,
    },
    null,
    2,
  );
}

/** Figma-variables-friendly JSON: collections with modes, one variable per token. */
export function figmaVariablesJson(): string {
  const toGroupName = (c: ColourToken) => `${c.group}/${c.name}`;
  return JSON.stringify(
    {
      source: tokens.source.url,
      collections: [
        {
          name: "Color",
          modes: ["Light", "Dark"],
          variables: colours.map((c) => ({ name: toGroupName(c), type: "COLOR", values: { Light: c.light, Dark: c.dark } })),
        },
        {
          name: "Event accent",
          modes: tokens.accents.map((a) => a.name),
          variables: (["accent", "accent-soft", "accent-text"] as const).map((v) => ({
            name: v,
            type: "COLOR",
            values: Object.fromEntries(tokens.accents.map((a) => [a.name, v === "accent" ? a.accent : v === "accent-soft" ? a.soft : a.text])),
          })),
        },
      ],
    },
    null,
    2,
  );
}
