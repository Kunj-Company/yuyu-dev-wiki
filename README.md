# Yuyu Developer Wiki

Developer documentation for [twilighty-abhi/yuyu](https://github.com/twilighty-abhi/yuyu), the self-hosted platform for free events. It covers local setup, architecture, per-module code maps, the machine and mobile APIs, webhooks, how-to recipes, and the testing, security and deployment references.

The site is built with [VitePress](https://vitepress.dev). It has full-text search, Mermaid diagrams, maths (MathJax), and light and dark mode.

## Quick start

You need Node.js 18 or newer. 22 is recommended, and `.nvmrc` pins it.

```bash
npm install
npm run dev       # dev server with hot reload at http://localhost:5173
npm run build     # static site → docs/.vitepress/dist (fails on dead internal links)
npm run preview   # serve the built site at http://localhost:4173
```

## Project layout

```text
docs/
├── index.md                 Home page
├── start/                   Get started: overview, local setup, workflow, codebase tour
├── architecture/            Request flow, mutation cores, data model, auth, permissions, jobs, realtime, frontend
├── features/                One page per product module: key files, flows, invariants, changes, tests
├── api/                     Machine API v1, Mobile API v1, organisation webhooks
├── guides/                  Step-by-step recipes for common changes
├── reference/               Testing, security checklist, deployment, configuration, scripts, troubleshooting, glossary
├── public/logo.svg          Logo
└── .vitepress/config.mts    Site config: nav, sidebar, search, Mermaid, maths
```

## Writing and updating pages

- To add a page, create `docs/<section>/<slug>.md`. Then add it to the matching list at the top of `docs/.vitepress/config.mts`.
- Link between pages with absolute paths and no extension, for example `[Mutation cores](/architecture/mutation-cores)`. `npm run build` fails on a dead link.
- Every claim must match the Yuyu source. The wiki was verified against commit `b223291`. When you re-verify against a newer commit, update `SOURCE_COMMIT` in `config.mts`.
- Mermaid is strict about syntax, and a parse error shows an error box instead of the diagram. In sequence diagrams, avoid `;` and `#` in message text. In flowcharts, quote labels that contain brackets or punctuation (`A["label (x)"]`).
- VitePress treats `{{ ... }}` as Vue syntax. Wrap it in inline code or a code fence.

## Hosting

`npm run build` produces a fully static site in `docs/.vitepress/dist`. Any static host can serve it.

| Host | Build command | Output directory |
| --- | --- | --- |
| GitHub Pages | Included workflow: `.github/workflows/deploy.yml` | handled by the workflow |
| Vercel / Netlify / Cloudflare Pages | `npm run build` | `docs/.vitepress/dist` |
| Nginx / any web server | `npm run build`, then copy `dist/` to the web root | — |

**GitHub Pages:** push this repository to GitHub, then set **Settings → Pages → Source** to **GitHub Actions**. Each push to `main` then deploys. The workflow sets `VITEPRESS_BASE=/<repo-name>/` for project sites. Remove that line if you use a custom domain.

If you build by hand for a sub-path, such as `https://user.github.io/yuyu-wiki/`, set `VITEPRESS_BASE` to that path, with leading and trailing slashes.

To serve the build with Docker and nginx:

```bash
npm run build
docker run --rm -p 8080:80 -v "$PWD/docs/.vitepress/dist:/usr/share/nginx/html:ro" nginx:alpine
```
