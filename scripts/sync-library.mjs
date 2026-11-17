#!/usr/bin/env node
// Vendors the reusable Yuyu components into library/src/vendor so the gallery
// builds without a Yuyu checkout. Usage: YUYU_SRC=../yuyu node scripts/sync-library.mjs
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, process.env.YUYU_SRC || "../yuyu");
const out = join(root, "library/src/vendor");

if (!existsSync(join(src, "components/ui"))) {
  console.error(`Yuyu source not found at ${src}. Set YUYU_SRC to the repository root.`);
  process.exit(1);
}

// Paths are relative to the Yuyu repository root and keep their layout, so the
// "@/..." alias in library/vite.config.ts resolves exactly as it does in Yuyu.
const entries = [
  "components/ui",
  "components/brand",
  "components/chrome/AppShell.tsx",
  "components/chrome/ColorModeToggle.tsx",
  "components/chrome/EventContextHeader.tsx",
  "components/chrome/OrganiserChrome.tsx",
  "components/chrome/SiteFooter.tsx",
  "components/chrome/SiteHeader.tsx",
  "components/feedback/ToastProvider.tsx",
  "components/feedback/ConfirmationDialog.tsx",
  "components/help/mdx.tsx",
  "components/providers.tsx",
  "lib/cn.ts",
  "lib/colorMode.ts",
  "lib/sidebar.ts",
  "lib/openSource.ts",
  "lib/pagination.ts",
  "lib/theme",
  "lib/help/text.ts",
  "app/styles/tokens.css",
  "app/globals.css",
];

rmSync(out, { recursive: true, force: true });
for (const entry of entries) {
  const to = join(out, entry);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(join(src, entry), to, { recursive: true });
}

// Brand files, illustrations and the self-hosted fonts, served by the gallery as downloads.
const assetsOut = join(root, "library/public/assets");
rmSync(assetsOut, { recursive: true, force: true });
for (const [from, to, filter] of [
  ["public/brand", "brand", (f) => !f.includes("idlistack") && !f.includes("/fonts")],
  ["public/brand/fonts", "fonts", () => true],
  ["public/landing", "illustrations", (f) => f.endsWith(".svg")],
]) {
  mkdirSync(join(assetsOut, to), { recursive: true });
  cpSync(join(src, from), join(assetsOut, to), { recursive: true, filter: (f) => (f === join(src, from) ? true : !statSync(f).isDirectory() && filter(f)) });
}

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: src }).toString().trim();
} catch {}
writeFileSync(join(out, "SOURCE_COMMIT"), `${commit}\n`);
console.log(`Vendored ${entries.length} entries from ${src} @ ${commit} into ${out}`);
