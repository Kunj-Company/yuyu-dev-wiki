#!/usr/bin/env node
// Merges Yuyu's tokens.css and globals.css (vendored) with the values read from the Figma
// file (library/src/foundations/figma.json) into library/src/foundations/tokens.json.
// Both the component library and the wiki's generated design pages read that file.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const v = (p) => join(root, "library/src/vendor", p);
const figma = JSON.parse(readFileSync(join(root, "library/src/foundations/figma.json"), "utf8"));
const css = readFileSync(v("app/styles/tokens.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const globals = readFileSync(v("app/globals.css"), "utf8");

function block(selectorStart) {
  const i = css.indexOf(selectorStart);
  const open = css.indexOf("{", i);
  const close = css.indexOf("\n}", open);
  const decls = {};
  for (const m of css.slice(open, close).matchAll(/--yy-([\w-]+):\s*([^;]+);/g)) decls[m[1]] = m[2].trim();
  return decls;
}
const codeLight = block(':root,\n:root[data-color-mode="light"]');
const codeDark = block(':root[data-color-mode="dark"],\n.yy-dark-band');

// Tailwind utility names: "--color-ink: var(--yy-text)" => text name "ink".
const tw = {};
for (const m of globals.matchAll(/--color-([\w-]+):\s*var\(--yy-([\w-]+)\);/g)) (tw[m[2]] ||= []).push(m[1]);

const HEX = /^#[0-9a-f]{6}$/i;
const names = new Set([...Object.keys(codeLight), ...Object.keys(figma.colour.light)]);
const groupOf = (n) =>
  /^bg-/.test(n) ? "Surfaces" : /^border/.test(n) ? "Borders" : /^text/.test(n) ? "Text" :
  /^(primary|on-primary|inverse-surface|on-inverse)$/.test(n) ? "Primary and inverse" :
  /^(brand|highlight|tint)-/.test(n) ? "Brand" : /^(success|warning|danger)-/.test(n) ? "Status" :
  /^(on-)?accent/.test(n) ? "Event accent" : "Other";
const order = ["Surfaces", "Borders", "Text", "Primary and inverse", "Brand", "Status", "Event accent", "Other"];

const colours = [];
for (const name of names) {
  const l = codeLight[name] ?? figma.colour.light[name];
  if (!HEX.test(l)) continue; // aliases such as --yy-focus
  const d = codeDark[name] ?? figma.colour.dark[name] ?? l;
  const inCode = name in codeLight, inFigma = name in figma.colour.light;
  const fl = figma.colour.light[name], fd = figma.colour.dark[name];
  colours.push({
    name, group: groupOf(name), cssVar: `--yy-${name}`, tailwind: tw[name] ?? [],
    light: l.toUpperCase(), dark: d.toUpperCase(),
    source: inCode && inFigma ? "both" : inCode ? "code" : "figma",
    // Where code and Figma disagree, report it instead of hiding it.
    mismatch: inCode && inFigma && ((fl && fl.toLowerCase() !== l.toLowerCase()) || (fd && codeDark[name] && fd.toLowerCase() !== codeDark[name].toLowerCase())) || undefined,
  });
}
colours.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || a.name.localeCompare(b.name));

const tokens = {
  source: figma.source,
  groups: order.filter((g) => colours.some((c) => c.group === g)),
  colours,
  accents: figma.accents,
  type: figma.type,
  spacing: figma.spacing,
  radius: figma.radius,
  shadows: figma.shadows,
  components: figma.components,
  brand: figma.brand,
  shadowsCode: { raised: codeLight["shadow-raised"], float: codeLight["shadow-float"], ticket: codeLight["shadow-ticket"], segment: codeLight["shadow-segment"] },
};
writeFileSync(join(root, "library/src/foundations/tokens.json"), JSON.stringify(tokens, null, 1) + "\n");
console.log(`${colours.length} colours (${colours.filter((c) => c.source === "figma").length} Figma-only, ${colours.filter((c) => c.source === "code").length} code-only, ${colours.filter((c) => c.mismatch).length} mismatched)`);
for (const c of colours.filter((c) => c.mismatch || c.source !== "both")) console.log(" ", c.source.padEnd(5), c.mismatch ? "MISMATCH" : "", c.name, c.light, c.dark);
