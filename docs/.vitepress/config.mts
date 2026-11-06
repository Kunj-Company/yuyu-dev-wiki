import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// Source repository the wiki documents, and the commit it was verified against.
const REPO = "https://github.com/twilighty-abhi/yuyu";
const SOURCE_COMMIT = "b223291";

// Set VITEPRESS_BASE=/repo-name/ when hosting under a sub-path (e.g. GitHub Pages).
const BASE = process.env.VITEPRESS_BASE || "/";

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
    title: "Yuyu Developer Wiki",
    description: "Developer documentation for Yuyu, the self-hosted platform for free events: architecture, code map, APIs and how-to guides.",
    base: BASE,
    cleanUrls: true,
    lastUpdated: false,
    head: [
      ["link", { rel: "icon", type: "image/svg+xml", href: `${BASE}logo.svg` }],
      ["meta", { name: "theme-color", content: "#646cff" }],
    ],
    markdown: {
      math: true,
      lineNumbers: false,
    },
    themeConfig: {
      logo: "/logo.svg",
      siteTitle: "Yuyu Dev Wiki",
      search: { provider: "local" },
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
        { text: "Guides", link: "/guides/add-a-server-action", activeMatch: "^/guides/" },
        { text: "Reference", link: "/reference/testing", activeMatch: "^/reference/" },
      ],
      sidebar: [
        group("Get started", start),
        group("Architecture", architecture),
        group("Feature modules", features),
        group("APIs & integrations", apis),
        group("How-to guides", guides),
        group("Reference", reference),
      ],
      socialLinks: [{ icon: "github", link: REPO }],
      docFooter: { prev: "Previous", next: "Next" },
      footer: {
        message: `Verified against <a href="${REPO}/tree/${SOURCE_COMMIT}">twilighty-abhi/yuyu @ ${SOURCE_COMMIT}</a>. File paths are relative to the repository root.`,
      },
    },
    vite: {
      build: { chunkSizeWarningLimit: 4000 },
      optimizeDeps: { include: ["mermaid"] },
    },
    mermaid: {
      securityLevel: "strict",
    },
  }),
);
