# Yuyu Documentation

Documentation for [twilighty-abhi/yuyu](https://github.com/twilighty-abhi/yuyu), the self-hosted platform for free events. It covers what the product does, local setup, architecture and per-module code maps, the machine and mobile APIs and webhooks, the design system and a live component library, deployment and operations runbooks, how to build on top of Yuyu, and the testing and security references.

The site is built with [VitePress](https://vitepress.dev). It has full-text search, Mermaid diagrams, maths (MathJax), and light and dark mode.

## Quick start

You need Node.js 18 or newer. 22 is recommended, and `.nvmrc` pins it.

```bash
npm install
npm run dev       # dev server with hot reload at http://localhost:5173
npm run build     # static site → docs/.vitepress/dist (fails on dead internal links, except `/library`, which is excluded via `ignoreDeadLinks`)
npm run preview   # serve the built site at http://localhost:4173
```

## Project layout

```text
docs/
├── index.md                 Home page, with a card showing the last commit and the Yuyu commit verified against
├── changelog.md             Yuyu release notes for developers, and changes to this wiki
├── roadmap.md               Upcoming features as a kanban board (data: .vitepress/theme/roadmap.json)
├── contributors.md          Current contributors (data: .vitepress/theme/contributors.json)
├── start/                   Get started: overview, local setup, workflow, codebase tour
├── architecture/            Request flow, mutation cores, data model, auth, permissions, jobs, realtime, frontend
├── features/                One page per product module: key files, flows, invariants, changes, tests
├── api/                     Machine API v1, Mobile API v1, organisation webhooks
├── guides/                  Step-by-step recipes for common changes
├── design/                  Design system: principles, tokens, typography, components, brand, patterns, accessibility
├── deploy/                  Deploy and operate: Docker, Helm, reverse proxy, staging, CI/CD, checklist, runbook
├── build/                   Build on Yuyu: fork, integrate, client apps, mobile apps, alpha app downloads, feature tutorial, contributing
├── reference/               Testing, security checklist, deployment, configuration, scripts, troubleshooting, glossary
├── public/logo.svg          Logo
└── .vitepress/config.mts    Site config: nav, sidebar, search, Mermaid, maths
```

## Writing and updating pages

- To add a page, create `docs/<section>/<slug>.md`. Then add it to the matching list at the top of `docs/.vitepress/config.mts`.
- Link between pages with absolute paths and no extension, for example `[Mutation cores](/architecture/mutation-cores)`. `npm run build` fails on a dead link (except `/library`, which `ignoreDeadLinks` excludes).
- Every claim must match the Yuyu source. The wiki was verified against commit `b223291`. When you re-verify against a newer commit, update `SOURCE_COMMIT` in `docs/.vitepress/config.mts` (it feeds the home page version card), update the commit in the "About these docs" note in `docs/start/codebase-tour.md`, and re-run `npm run library:sync`.
- Contributors: run `npm run contributors` to refresh `contributors.json` from GitHub. It needs `GITHUB_TOKEN` or a `gh auth login` session, because some repositories are private.
- Roadmap: move a card between columns, or remove it once the feature ships, by editing `docs/.vitepress/theme/roadmap.json`.
- Mermaid is strict about syntax, and a parse error shows an error box instead of the diagram. In sequence diagrams, avoid `;` and `#` in message text. In flowcharts, quote labels that contain brackets or punctuation (`A["label (x)"]`).
- VitePress treats `{{ ... }}` as Vue syntax. Wrap it in inline code or a code fence.

## Component library

`/library/` is a live gallery of every reusable Yuyu component (59 pages, about 146 runnable examples). It is a separate Vite + React + Tailwind 4 app in `library/`, so its CSS cannot leak into the VitePress theme. `npm run build` builds it into `docs/public/library/` (git-ignored) before VitePress runs.

```bash
npm run dev:library        # gallery with hot reload at http://localhost:5174
npm run build:library      # build only the gallery
npm run typecheck:library  # type-check the examples
npm run library:sync       # re-vendor components from ../yuyu (YUYU_SRC=/path to override)
```

- `library/src/vendor/` is a **snapshot** of Yuyu's components, tokens and styles, so CI builds without the Yuyu repo. `SOURCE_COMMIT` there records the commit. Re-run `library:sync` when Yuyu's UI changes.
- `library/src/shims/` stands in for Next.js and auth (`next/link`, `next/navigation`, `useAuthSession`).
- **Foundations** (colour, type, spacing, logos, icons, illustrations, fonts, asset-kit zip, the Figma component map, and the AI-agent kit) are pages in `library/src/foundations/pages/`. Their data comes from the Figma file "Yuyu — Light screens" (`library/src/foundations/figma.json`) merged with Yuyu's own tokens by `npm run agent-kit` (which runs `scripts/build-tokens.mjs`, then `scripts/gen-agent-kit.mjs`). The brand files and fonts are vendored into `library/public/assets/` by `library:sync`.
- **Agent kit:** `npm run build` also generates `docs/public/design-system/` (`tokens.json`, `tokens.css`, the copy-paste agent prompts) and `docs/public/llms.txt`. These are git-ignored and regenerated on every build and on `npm run dev`.
- To document a component, add an entry to a file in `library/src/catalog/` (props, notes) and examples in `library/src/examples/<slug>/NN-name.tsx`. Each example exports `meta` first and a default component. Its source is what readers see and copy.

## Search

The documentation and the component library share **one search**: one index and one interface. Press `/` or `Ctrl`/`⌘` + `K` on either site, or use the Search button. Results come from both sites, with tabs for All, Documentation and Library. Documentation results open in place on the wiki, and library results open in place in the library. A result on the other site loads that site, at the right section, prop, example or token.

What it finds: every documentation section (headings, body text and code), components, every export, every prop, example code, colour and type tokens (name, CSS variable, Tailwind class, hex), spacing, radius and shadows, the Figma component map, and the brand, font and illustration files.

How it matches: names are split, so "toast" finds `useToast`, and the whole name still ranks first as an exact match. All words must match, as prefixes. Words of four or more letters tolerate a typo (one edit up to nine letters, two from ten).

| Piece | Where |
| --- | --- |
| Matching and ranking | `search/engine.ts` (MiniSearch) |
| The interface (plain DOM, so both sites render the same thing) | `search/palette.ts` and `search/palette.css` |
| The index, `docs/public/search/entries.json` | `scripts/build-search-index.mjs`, run by `npm run build` and `npm run dev`. Run `npm run search-index` to rebuild it by hand |
| Library entries (components, props, examples, tokens, files) | `library/src/search/entries.ts` |

The wiki's pages are indexed from the Markdown in `docs/`, and the library from its catalog and examples, so new pages, components and examples appear after the next build with nothing to register. A new kind of content needs an entry in one of the two generators. A site uses the palette by calling `initSearch` once and rendering a `<button data-yy-search>`: see `docs/.vitepress/theme/index.ts` and `library/src/main.tsx`.

The index is fetched in the background once the page has loaded, so the first search is instant. It is 1.3 MB, about 350 KB compressed.

## Hosting

`npm run build` produces a fully static site in `docs/.vitepress/dist`. Any static host can serve it.

| Host | Build command | Output directory |
| --- | --- | --- |
| Cloudflare Pages (used for this wiki) | `npm run build` | `docs/.vitepress/dist` (see below) |
| Vercel / Netlify | `npm run build` | `docs/.vitepress/dist` |
| Nginx / any web server | `npm run build`, then copy `dist/` to the web root | — |

**Cloudflare Pages:** the site is plain static files, so no Functions or adapter are needed.

- *With Git integration* (recommended): in the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git**, pick this repository, and use these settings:

  | Setting | Value |
  | --- | --- |
  | Framework preset | None |
  | Build command | `npm run build` |
  | Build output directory | `docs/.vitepress/dist` |
  | Root directory | leave empty |
  | Environment variable | `NODE_VERSION` = `22` (Pages also reads `.nvmrc`) |

  Do not set `VITEPRESS_BASE`: the site is served from the root of a `*.pages.dev` domain or your custom domain. Production deploys come from `main`. Other branches and pull requests get preview URLs.
- *From your machine:* run `npx wrangler login` once, then `npm run deploy:cloudflare`. It builds the site and uploads it with `wrangler pages deploy`, using `wrangler.toml` (project `yuyu-dev-wiki`, output `docs/.vitepress/dist`). Wrangler creates the project on the first deploy if it does not exist.
- `docs/public/_headers` is copied into the build and sets security headers and long-lived caching for the hashed files in `/assets/`. VitePress writes `404.html`, which Pages uses for unknown URLs.
- This repository has no deploy workflow: Cloudflare builds and deploys from Git itself. To host on GitHub Pages instead, add a workflow that runs `npm ci` and `npm run build` with `VITEPRESS_BASE=/<repo-name>/` and publishes `docs/.vitepress/dist`. The earlier version is in the git history (`git show e2985c7:.github/workflows/deploy.yml`).

If you build by hand for a sub-path, such as `https://user.github.io/yuyu-dev-wiki/`, set `VITEPRESS_BASE` to that path, with leading and trailing slashes.

To serve the build with Docker and nginx:

```bash
npm run build
docker run --rm -p 8080:80 -v "$PWD/docs/.vitepress/dist:/usr/share/nginx/html:ro" nginx:alpine
```
