import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { execFileSync } from "node:child_process";

// Source repository these docs describe.
const REPO = "https://github.com/twilighty-abhi/yuyu";

// Set VITEPRESS_BASE=/repo-name/ when hosting under a sub-path (e.g. GitHub Pages).
const BASE = process.env.VITEPRESS_BASE || "/";

// The Yuyu commit these docs were last verified against. Update it whenever the wiki is re-verified.
const SOURCE_COMMIT = "b223291f04a46d9adad5800523a00e33d7ede930";

// Git details of this wiki, read once at build time (dev server: at start-up) and shown on the home page.
const git = (...args: string[]) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
const [hash = "", shortHash = "", committedAt = "", author = "", subject = ""] = git("log", "-1", "--format=%H%x1f%h%x1f%cI%x1f%an%x1f%s").split("\x1f");
const wikiRepo = git("remote", "get-url", "origin")
  .replace(/^git@github\.com:/, "https://github.com/")
  .replace(/\.git$/, "");
const BUILD_INFO = {
  wiki: {
    hash,
    shortHash,
    committedAt,
    author,
    subject,
    // A dirty tree means the build includes edits that are not committed yet.
    dirty: git("status", "--porcelain") !== "",
    url: wikiRepo.startsWith("https://") ? `${wikiRepo}/commit/${hash}` : "",
  },
  source: { hash: SOURCE_COMMIT, shortHash: SOURCE_COMMIT.slice(0, 7), url: `${REPO}/commit/${SOURCE_COMMIT}` },
  builtAt: new Date().toISOString(),
};

type Item = [label: string, link: string];
const group = (text: string, items: Item[], collapsed = false) => ({
  text,
  collapsed,
  items: items.map(([label, link]) => ({ text: label, link })),
});

const start: Item[] = [
  ["Yuyu for developers", "/start/overview"],
  ["Local setup", "/start/local-setup"],
  ["Development workflow", "/start/workflow"],
  ["Codebase tour", "/start/codebase-tour"],
];

const architecture: Item[] = [
  ["Overview", "/architecture/overview"],
  ["Mutation cores", "/architecture/mutation-cores"],
  ["Data model", "/architecture/data-model"],
  ["Auth & sessions", "/architecture/auth-and-sessions"],
  ["Tenancy & permissions", "/architecture/permissions"],
  ["Background jobs & outbox", "/architecture/background-jobs"],
  ["Realtime check-in", "/architecture/realtime"],
  ["Frontend & design system", "/architecture/frontend"],
];

const features: Item[] = [
  ["Events & websites", "/features/events-and-websites"],
  ["Registration & RSVP", "/features/registration-and-rsvp"],
  ["Tickets & check-in", "/features/tickets-and-check-in"],
  ["Teams", "/features/teams"],
  ["Hackathon judging", "/features/hackathon-judging"],
  ["Event crew", "/features/crew"],
  ["Email & broadcasts", "/features/email-and-broadcasts"],
  ["Feedback, certificates & reports", "/features/feedback-certificates-reports"],
  ["Storage & media", "/features/storage-and-media"],
  ["Super-admin & operations", "/features/super-admin"],
];

const apis: Item[] = [
  ["Machine API v1", "/api/machine-api"],
  ["Mobile API v1", "/api/mobile-api"],
  ["Organisation webhooks", "/api/webhooks"],
];

const design: Item[] = [
  ["Design principles & voice", "/design/principles"],
  ["Design tokens", "/design/tokens"],
  ["Colour reference", "/design/colour"],
  ["Typography & layout", "/design/typography-and-layout"],
  ["Type, spacing & elevation scales", "/design/scales"],
  ["Components", "/design/components"],
  ["Brand & dot-sign", "/design/brand"],
  ["Brand assets & downloads", "/design/brand-assets"],
  ["Figma file map", "/design/figma"],
  ["Use with AI agents", "/design/ai-agents"],
  ["UI patterns", "/design/patterns"],
  ["Accessibility", "/design/accessibility"],
  ["Contribute to the design system", "/design/contributing"],
];

const deploy: Item[] = [
  ["Choose a deployment path", "/deploy/overview"],
  ["Docker on a single host", "/deploy/docker"],
  ["Kubernetes with Helm", "/deploy/kubernetes"],
  ["Reverse proxy & TLS", "/deploy/reverse-proxy"],
  ["Staging environment", "/deploy/staging"],
  ["CI/CD & image publishing", "/deploy/ci-cd"],
  ["Production readiness checklist", "/deploy/production-checklist"],
  ["Operations runbook", "/deploy/operations"],
];

const build: Item[] = [
  ["Ways to build on Yuyu", "/build/overview"],
  ["Fork & customise", "/build/fork-and-customise"],
  ["Integrate with APIs & webhooks", "/build/integrations"],
  ["Build a client app", "/build/client-apps"],
  ["Android & iOS apps", "/build/mobile-apps"],
  ["Tutorial: add a feature end to end", "/build/feature-tutorial"],
  ["Contributing upstream", "/build/contributing"],
];

const guides: Item[] = [
  ["Add a Server Action", "/guides/add-a-server-action"],
  ["Change the schema", "/guides/change-the-schema"],
  ["Add a page or route", "/guides/add-a-page-or-route"],
  ["Add an email", "/guides/add-an-email"],
  ["Add a webhook event", "/guides/add-a-webhook-event"],
  ["Extend the APIs", "/guides/extend-the-apis"],
  ["Add configuration", "/guides/add-config"],
];

const reference: Item[] = [
  ["Testing", "/reference/testing"],
  ["Security checklist", "/reference/security-checklist"],
  ["Deployment", "/reference/deployment"],
  ["Configuration", "/reference/configuration"],
  ["Scripts", "/reference/scripts"],
  ["Troubleshooting", "/reference/troubleshooting"],
  ["Glossary", "/reference/glossary"],
];


export default withMermaid(
  defineConfig({
    title: "Yuyu Documentation",
    description: "Documentation for Yuyu, the self-hosted platform for free events: product overview, architecture, APIs, design system, component library, deployment and building on top of Yuyu.",
    base: BASE,
    cleanUrls: true,
    // Generated agent-kit files in public/ are static downloads, not pages.
    srcExclude: ["public/**"],
    // /library/ is a separate Vite app built into docs/public/library (npm run build:library).
    ignoreDeadLinks: [/^\/library/],
    lastUpdated: false,
    head: [
      ["link", { rel: "icon", type: "image/svg+xml", href: `${BASE}logo.svg` }],
      ["meta", { name: "theme-color", content: "#ffb547" }],
    ],
    markdown: {
      math: true,
      lineNumbers: false,
    },
    themeConfig: {
      logo: "/logo.svg",
      siteTitle: "Yuyu Docs",
      // Search is the shared palette in search/ (docs/.vitepress/theme/index.ts), not VitePress's local search.
      outline: { level: [2, 3], label: "On this page" },
      nav: [
        { text: "Get started", link: "/start/overview", activeMatch: "^/start/" },
        { text: "Architecture", link: "/architecture/overview", activeMatch: "^/architecture/" },
        { text: "Features", link: "/features/events-and-websites", activeMatch: "^/features/" },
        {
          text: "APIs",
          activeMatch: "^/api/",
          items: apis.map(([text, link]) => ({ text, link })),
        },
        {
          text: "Design",
          activeMatch: "^/design/",
          items: [
            { text: "Design system", link: "/design/principles" },
            { text: "Component library", link: "/library/index.html", target: "_self" },
          ],
        },
        { text: "Deploy", link: "/deploy/overview", activeMatch: "^/deploy/" },
        {
          text: "Build",
          activeMatch: "^/(build|guides)/",
          items: [
            { text: "Build on Yuyu", link: "/build/overview" },
            { text: "How-to guides", link: "/guides/add-a-server-action" },
          ],
        },
        { text: "Reference", link: "/reference/testing", activeMatch: "^/reference/" },
      ],
      sidebar: [
        group("Get started", start),
        group("Architecture", architecture),
        group("Feature modules", features),
        group("APIs & integrations", apis),
        group("How-to guides", guides),
        group("Design system", design),
        group("Deploy & operate", deploy),
        group("Build on Yuyu", build),
        group("Reference", reference),
      ],
      socialLinks: [{ icon: "github", link: REPO }],
      docFooter: { prev: "Previous", next: "Next" },
      footer: {
        message: `Documentation for <a href="${REPO}">Yuyu</a>, the self-hosted platform for free events.`,
      },
    },
    vite: {
      define: { __BUILD_INFO__: JSON.stringify(BUILD_INFO) },
      build: { chunkSizeWarningLimit: 4000 },
      optimizeDeps: { include: ["mermaid"] },
    },
    mermaid: {
      securityLevel: "strict",
      themeVariables: {
        fontFamily: "Figtree Variable, system-ui, sans-serif",
        primaryColor: "#fff4e5",
        primaryBorderColor: "#e8930c",
        primaryTextColor: "#18181b",
        lineColor: "#5f5e5a",
        secondaryColor: "#f4f4f2",
        tertiaryColor: "#fafaf9",
      },
    },
  }),
);
