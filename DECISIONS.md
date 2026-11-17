# Decisions

Decisions made while building and maintaining the Yuyu developer wiki, newest first. Each entry says what was decided and why, so the reasoning is not lost.

## 2026-11-17

### Deploy on Cloudflare Pages from Git, and remove the GitHub Pages workflow

- **Decision:** The wiki is hosted on Cloudflare Pages, built by Cloudflare from Git (build command `npm run build`, output `docs/.vitepress/dist`, `NODE_VERSION=22`, no `VITEPRESS_BASE`). `wrangler.toml` and `npm run deploy:cloudflare` cover manual deploys. `docs/public/_headers` sets security headers and immutable caching for `/assets/*` only. `.github/workflows/deploy.yml` was deleted.
- **Why:** The GitHub Pages workflow failed on every push because Pages was never enabled on the repository, and Cloudflare was the chosen host. The headers file is kept to two rules because mid-path wildcards in `_headers` were not verified.
- **Not done:** The repository is not yet connected in the Cloudflare dashboard, and nothing has been deployed. No Cloudflare deploy workflow was added, as it would need secrets. The old workflow is in git history (`git show e2985c7:.github/workflows/deploy.yml`).

### The home page version card never reads the git remote

- **Decision:** The "Documentation version" card shows the last wiki commit (hash, author, date in IST and UTC, message), the Yuyu commit verified against, and the build time. The wiki repo URL is a fixed constant (`WIKI_REPO_URL` overrides it), and the Yuyu commit is the `SOURCE_COMMIT` constant in `docs/.vitepress/config.mts`.
- **Why:** A CI checkout's remote URL can carry credentials, and this value is published on a public page. IST is shown first because that is the maintainer's time zone, with UTC beside it. The dev server reads git once at start-up, so restart it to refresh the hash.

### Upcoming features come from Yuyu's own list, with priorities as a suggestion

- **Decision:** `/roadmap` is a read-only kanban board (High, Medium, Low) built from Yuyu's `docs/FUTURE_PHASES.md`, with the cards in `docs/.vitepress/theme/roadmap.json`. The priorities are this wiki's own judgement, and the page says so.
- **Why:** Yuyu's list has no ranking, and nothing may be invented. High means security, privacy and gaps in features that already ship. Medium means planned work with a clear need. Low means nice to have, or only if organisers ask.

### Contributors are people with commits, read from GitHub

- **Decision:** `/contributors` lists people with commits across `yuyu`, `yuyu-android`, `yuyu-ios` and this wiki. `npm run contributors` refreshes `contributors.json`, using `GITHUB_TOKEN` or the `gh` login because some repositories are private.
- **Why:** Membership of the `Kunj-Company` organisation does not show contribution. GitHub shows 2 people with commits (twilighty-abhi, 787 commits, and praveen902012, 1 commit), not the 3 expected. No third person was added, because that would be invented.

### Mobile app downloads carry an alpha warning, and iOS has no build

- **Decision:** `/build/download-apps` links the public Android repository and its two releases (`v0.1.0` and the rolling pre-release), with a prominent "alpha, not stable, use at your own risk" warning that is repeated on the mobile apps page. For iOS it says plainly that the repository is private and no build has been published.
- **Why:** Only Android has downloadable builds. The iOS release workflow builds an unsigned `.ipa` only on a version tag, and none has been released. Whether the Android release APK is signed with a real key was not confirmed, so the page makes no claim about it.

### Navigation regrouped into six items

- **Decision:** The top bar is now Get started, Product, Build, Design, Deploy and Reference. Product holds the feature list, feature modules, downloads, roadmap, changelog and contributors. Build holds Understand, Integrate and Extend groups.
- **Why:** Nine top-level items, with the newest added piecemeal, were crowded. The groups follow what a reader wants to do.

### Wide tables scroll sideways

- **Decision:** `.vp-doc table` uses `display: block; overflow-x: auto` in `yuyu.css`.
- **Why:** The theme forced `display: table; overflow: hidden`, which overrode VitePress's own behaviour, so wide tables (such as the testing reference) overflowed under the page outline.

### The changelog is a digest of Yuyu's, not a copy

- **Decision:** `/changelog` condenses Yuyu's `CHANGELOG.md` per release for developers, links the upstream file as the authority, and ends with a "Changes to this wiki" table taken from git history. A missing migration (`20261024020000_judging_results_announced`) was added so the table lists all 13 in the 2026-10-27 release.
- **Why:** Copying would drift. A digest with links to wiki pages is more useful and cheaper to keep right.

### Every page was checked against the Yuyu source, then fixed

- **Decision:** All wiki pages were fact-checked and proofread against Yuyu at commit `b223291` by seven read-only agents (about 2,000 claims). Three confirmed errors and the imprecise claims were fixed: the `--s3-endpoint` requirement, the outbox worker singleton, the footer wording, the schema-drift commands and others. Items that cannot be checked from the repository (Figma counts, iOS internals, derived accent colours) were left as they are.
- **Why:** The wiki claims to match the source. The `.env.example` comment in Yuyu that calls `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` a "build arg" is stale in Yuyu itself, not in the wiki.

## Open items

- Connect the repository to Cloudflare Pages, then check the live site, including the nav dropdowns and table scrolling in a browser.
- Decide whether to remove `/features/feature-list` ("What Yuyu can do"). The request for an upcoming-features board suggested the feature list may not have been wanted, so it was kept pending an answer.
- The iOS repository is private. Offering an iOS build means making it public or publishing a release.
- If a third contributor is expected, find out who it is. They appear on the page only once they have commits.
