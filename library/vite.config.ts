import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const commit = readFileSync(here("src/vendor/SOURCE_COMMIT"), "utf8").trim();

// The gallery is its own app so Tailwind's CSS can't leak into the VitePress theme.
// It builds into docs/public/library and is served by the wiki at /library/.
export default defineConfig({
  root: here("."),
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      // In dev the library is served from its own root. Serve the shared search index (built into the
      // documentation's public folder) where the palette looks for it, as the production site does.
      name: "yuyu-search-index",
      configureServer(server) {
        server.middlewares.use("/search/entries.json", (_req, res) => {
          const file = here("../docs/public/search/entries.json");
          if (!existsSync(file)) {
            res.statusCode = 404;
            return res.end("Run npm run search-index first.");
          }
          res.setHeader("Content-Type", "application/json");
          res.end(readFileSync(file));
        });
      },
    },
  ],
  define: { __SOURCE_COMMIT__: JSON.stringify(commit) },
  resolve: {
    alias: [
      { find: "next/link", replacement: here("src/shims/next-link.tsx") },
      { find: "next/navigation", replacement: here("src/shims/next-navigation.ts") },
      { find: "next-auth/react", replacement: here("src/shims/next-auth-react.ts") },
      { find: "@/components/auth/useAuthSession", replacement: here("src/shims/useAuthSession.ts") },
      { find: "@/lib/appShell", replacement: here("src/shims/appShell.ts") },
      { find: "@/content/help/screenshots.json", replacement: here("src/shims/screenshots.json") },
      { find: /^@\//, replacement: here("src/vendor") + "/" },
    ],
  },
  build: { outDir: here("../docs/public/library"), emptyOutDir: true, chunkSizeWarningLimit: 2000 },
  server: { port: 5174, fs: { allow: [here("..")] } },
});
