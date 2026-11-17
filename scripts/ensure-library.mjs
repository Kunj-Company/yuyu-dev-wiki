#!/usr/bin/env node
// `npm run dev` serves the component library from docs/public/library, which is only there after a build.
// Build it once if it is missing, so the "Component library" links work in development too.
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(join(root, "docs/public/library/index.html"))) {
  console.log("Building the component library (first run)…");
  execSync("npm run build:library", { cwd: root, stdio: "inherit" });
}
