import type { ComponentDoc } from "../types";

const docs: ComponentDoc[] = [
  {
    slug: "dot-mark",
    name: "DotMark",
    group: "Brand",
    source: "components/brand/DotMark.tsx",
    description: "The Yuyu dot sign: a Y drawn in dots. Use it for the logo, favicon-like spots and small brand accents.",
    exports: ["DotMark", "DotMarkVariant", "DOT_MARK_MIN_SIZE"],
    props: [
      {
        items: [
          { name: "size", type: "number", default: "32", description: "Width and height in px. Clamped up to DOT_MARK_MIN_SIZE (16)." },
          { name: "variant", type: '"auto" | "full" | "bright" | "onMarigold" | "mono"', default: '"auto"', description: "auto uses the full grid at 48px and above, bright dots below. onMarigold is for marigold backgrounds. mono paints every dot with currentColor." },
          { name: "label", type: "string | null", default: '"Yuyu"', description: "Accessible name (the mark becomes an image). Pass null when a visible wordmark already names the brand." },
          { name: "className", type: "string", description: "Extra classes on the wrapper. Display stays in classes, so utilities like hidden md:inline-flex work." },
        ],
      },
    ],
    notes: ["Bright dots under 32px switch to deep marigold (--yy-brand-marigold-small) for contrast on light backgrounds.", "DOT_MARK_MIN_SIZE is 16: smaller sizes are drawn at 16."],
    related: ["dot-lockup", "dot-grid"],
  },
  {
    slug: "dot-lockup",
    name: "DotLockup",
    group: "Brand",
    source: "components/brand/DotLockup.tsx",
    description: "The mark plus the lowercase 'yuyu' wordmark in Bricolage Grotesque 800. Horizontal for headers, stacked for square spaces, tagline for marketing.",
    exports: ["DotLockup", "DotLockupLayout", "DotLockupSize"],
    props: [
      {
        items: [
          { name: "layout", type: '"horizontal" | "stacked" | "tagline"', default: '"horizontal"', description: "Arrangement. Stacked and tagline use fixed sizes and ignore size." },
          { name: "size", type: '"sm" | "md" | "lg"', default: '"sm"', description: "Horizontal only. sm: 36px mark, 26px text (site header, app shell). md: 36 / 24 (footer). lg: 60 / 54 (Figma master)." },
          { name: "label", type: "string | null", default: '"Yuyu"', description: "Accessible name for the whole lockup. Pass null when it sits inside a link that already has an aria-label." },
          { name: "className", type: "string", description: "Extra classes on the wrapper." },
        ],
      },
    ],
    notes: ["The wordmark is live text using the self-hosted font, never text inside an SVG.", "The tagline layout shows the text 'Free events, run by communities'."],
    related: ["dot-mark", "site-header"],
  },
  {
    slug: "dot-loader",
    name: "DotLoader",
    group: "Brand",
    source: "components/brand/DotLoader.tsx",
    description: "Loading indicator: three dots (two marigold, one ink) jumping in sequence. PageLoader centres it over the viewport for route-level loading.",
    exports: ["DotLoader", "PageLoader"],
    props: [
      {
        title: "DotLoader",
        items: [
          { name: "size", type: "number", default: "48", description: "Overall width in px. Each dot is size / 4.2." },
          { name: "label", type: "string", default: '"Loading"', description: "Screen-reader text, announced politely through role=status." },
          { name: "className", type: "string", description: "Extra classes on the wrapper." },
        ],
      },
      {
        title: "PageLoader",
        items: [{ name: "label", type: "string", description: "Passed to the DotLoader (size 56). The DotLoader default applies when omitted." }],
      },
    ],
    notes: ["With prefers-reduced-motion the dots sit still.", "PageLoader is position: fixed inset-0 with pointer-events-none, so it covers the whole page. In the gallery it is contained with a transformed wrapper."],
    related: ["dot-face"],
  },
  {
    slug: "dot-face",
    name: "DotFace",
    group: "Brand",
    source: ["components/brand/DotFace.tsx", "components/brand/patterns.ts"],
    description: "Expressive faces made of dots on a 7x7 grid, used for empty states, confirmations and errors. Ten moods, each with a job.",
    exports: ["DotFace", "FACE_MOODS", "FACES", "DotFaceMood"],
    props: [
      {
        items: [
          { name: "mood", type: "DotFaceMood", required: true, description: "One of happy, cheering, wink, love, done, waiting, surprised, thinking, sleepy, sad." },
          { name: "size", type: "number", default: "136", description: "Overall width in px (a dot is size / 8.5)." },
          { name: "label", type: "string", description: "When set, the face is an image with this accessible name. Otherwise it is hidden from assistive tech." },
          { name: "className", type: "string", description: "Extra classes on the grid." },
          { name: "colors", type: "Partial<Record<string, string>>", description: "Overrides for pattern letters, for example { X: '#16a34a' }." },
          { name: "hover", type: "boolean", default: "true", description: "Ripple, blink and lift on hover of the face or any .group ancestor. Mouse only; still under reduced motion." },
        ],
      },
    ],
    notes: [
      "Intended use from the source comments: happy is hello, cheering is 'You're in!', wink is checked in, love is feedback, done is all set, waiting is the waitlist, surprised is event full, thinking is loading, sleepy is empty states, sad is errors.",
      "love, done and waiting have no blink animation on the eyes.",
    ],
    related: ["dot-icon", "dot-grid"],
  },
  {
    slug: "dot-grid",
    name: "DotGrid",
    group: "Brand",
    source: ["components/brand/DotGrid.tsx", "components/brand/patterns.ts"],
    description: "The primitive behind every dot graphic: renders a pattern string as a CSS grid of circles. Use it for custom dot art; the other brand components wrap it.",
    exports: ["DotGrid", "DOT_COLORS", "DotGridProps", "MARK", "MARK_BRIGHT", "MARK_ON_MARIGOLD", "DOT_WORDMARK"],
    props: [
      {
        items: [
          { name: "pattern", type: "string", required: true, description: 'Rows separated by "|"; each character is a cell. X marigold, O ink, "." soft, D deep marigold, W white, m soft on marigold, space is no dot.' },
          { name: "dot", type: "number", required: true, description: "Dot diameter in px." },
          { name: "gap", type: "number", default: "dot / 4", description: "Gap between dots in px." },
          { name: "colors", type: "Partial<Record<string, string>>", description: "Overrides for the letter to colour map (DOT_COLORS)." },
          { name: "label", type: "string", description: "When set, the grid is an image with this accessible name; otherwise aria-hidden." },
          { name: "className", type: "string", description: "Extra classes on the grid." },
          { name: "cellClassName", type: "(cell, row, column) => string | undefined", description: "Per-dot class names." },
          { name: "cellStyle", type: "(cell, row, column) => CSSProperties | undefined", description: "Per-dot inline styles." },
          { name: "style", type: "CSSProperties", description: "Extra inline style. Only for surfaces without the app stylesheet (global-error)." },
        ],
      },
    ],
    notes: ["Brand colour tokens follow light and dark mode; W (#FFFFFF) and m (#F0A537) are fixed.", "patterns.ts also holds the FACES and ICONS tables used by DotFace and DotIcon."],
    related: ["dot-mark", "dot-face", "dot-icon"],
  },
  {
    slug: "dot-icon",
    name: "DotIcon",
    group: "Brand",
    source: ["components/brand/DotIcon.tsx", "components/brand/patterns.ts"],
    description: "Product spot icons drawn in dots on a 7x7 grid, for feature explainers and empty states. Ink dots follow the theme; marigold marks the highlight.",
    exports: ["DotIcon", "ICON_NAMES", "ICONS", "DotIconName"],
    props: [
      {
        items: [
          { name: "name", type: "DotIconName", required: true, description: "One of date, venue, guests, time, speaker, check-in, feedback, certificate, reminder, done, page, lock, code." },
          { name: "size", type: "number", default: "54", description: "Overall width in px (a dot is size / 9, the gap a third of a dot)." },
          { name: "label", type: "string", description: "When set, the icon is an image with this accessible name; otherwise decorative." },
          { name: "className", type: "string", description: "Extra classes on the grid." },
          { name: "colors", type: "Partial<Record<string, string>>", description: "Overrides for pattern letters." },
        ],
      },
    ],
    related: ["dot-grid", "dot-face"],
  },

  {
    slug: "site-header",
    name: "SiteHeader",
    group: "Chrome",
    source: "components/chrome/SiteHeader.tsx",
    description: "Yuyu's own marketing and public header: lockup, primary links, colour-mode toggle and sign-in or dashboard actions, with a menu sheet below 1024px. Also exports YuyuWordmark, the lockup as a home link.",
    exports: ["SiteHeader", "YuyuWordmark"],
    props: [
      { title: "SiteHeader", items: [{ name: "(none)", type: "-", description: "Takes no props. Reads the pathname for the active link and the auth session for guest or signed-in actions." }] },
      {
        title: "YuyuWordmark",
        items: [
          { name: "href", type: "string", default: '"/"', description: "Link target." },
          { name: "size", type: '"sm" | "md"', default: '"sm"', description: "Passed to DotLockup." },
        ],
      },
    ],
    notes: [
      "Sticky at the top with a blurred canvas background.",
      "The Features link is guest-only and hidden once signed in.",
      "In the gallery the route and session come from shims: setDemoPathname and setDemoSession.",
    ],
    related: ["site-footer", "color-mode-toggle", "dot-lockup", "app-shell"],
  },
  {
    slug: "site-footer",
    name: "SiteFooter",
    group: "Chrome",
    source: "components/chrome/SiteFooter.tsx",
    description: "Footers for every surface: SiteFooter for Yuyu's own pages, EventFooter for event-facing pages and EmbedCredit for embedded events.",
    exports: ["SiteFooter", "EventFooter", "EmbedCredit"],
    props: [{ items: [{ name: "(none)", type: "-", description: "SiteFooter, EventFooter and EmbedCredit take no props. SiteFooter reads the pathname and auth session to add Dashboard and Account links for signed-in people." }] }],
    notes: [
      "'Hosted on Idlistack' lives in the footers, never in the top nav.",
      "EmbedCredit renders inside the organiser's iframe and opens Yuyu in a new tab.",
    ],
    related: ["site-header", "event-context-header", "dot-mark"],
  },
  {
    slug: "color-mode-toggle",
    name: "ColorModeToggle",
    group: "Chrome",
    source: "components/chrome/ColorModeToggle.tsx",
    description: "Icon button that flips the app between light and dark mode. The sun and moon cross-rotate, and the new mode is revealed from the button.",
    exports: ["ColorModeToggle"],
    props: [
      {
        items: [
          { name: "variant", type: '"quiet" | "secondary"', default: '"quiet"', description: "IconButton variant." },
          { name: "size", type: '"sm" | "md"', default: '"md"', description: "IconButton size." },
        ],
      },
    ],
    notes: ["Needs the Providers wrapper (useAppColorMode). The accessible label reads 'Switch to light mode' or 'Switch to dark mode'."],
    related: ["site-header", "event-context-header"],
  },
  {
    slug: "app-shell",
    name: "AppShell",
    group: "Chrome",
    source: "components/chrome/AppShell.tsx",
    description: "The dashboard frame: a sidebar (224px, collapsible to a 68px icon rail) with organisation switching, workspace navigation and an account menu. Below md it becomes a top bar with a menu sheet.",
    exports: ["AppShell"],
    props: [
      {
        items: [
          { name: "user", type: "ShellUser", required: true, description: "{ name: string | null; email: string | null; image: string | null }. Shown in the account menu." },
          { name: "organisations", type: "ShellOrganisation[]", required: true, description: "{ slug, name, logoUrl, role, pendingApprovals }. role is OWNER, ADMIN, MEMBER or COLLABORATOR." },
          { name: "initialCollapsed", type: "boolean", default: "false", description: "Start with the icon rail. Toggling writes a cookie (SIDEBAR_COOKIE) so the server renders the same width." },
          { name: "children", type: "ReactNode", required: true, description: "Page content, placed in a main element capped at 1200px." },
        ],
      },
    ],
    notes: [
      "The shell sizes itself with min-h-dvh and a sticky h-dvh sidebar, so it fills the viewport. The gallery contains it in a fixed-height scroll box and overrides those heights.",
      "The current organisation is read from the URL (/dashboard/<slug>/...); on /dashboard it shows the organisation list instead.",
      "Settings is for OWNER and ADMIN. Series and Members are hidden from COLLABORATOR.",
      "ShellUser and ShellOrganisation are types from lib/appShell.",
    ],
    related: ["site-header", "color-mode-toggle"],
  },
  {
    slug: "event-context-header",
    name: "EventContextHeader",
    group: "Chrome",
    source: ["components/chrome/EventContextHeader.tsx", "components/chrome/OrganiserChrome.tsx"],
    description: "Header for event-facing pages where the organiser's identity leads, not Yuyu's. OrganiserChrome wraps pages with this header and EventFooter, and drops both on check-in kiosk paths.",
    exports: ["EventContextHeader", "OrganiserChrome"],
    props: [
      {
        title: "EventContextHeader",
        items: [{ name: "organisation", type: "{ name: string; slug: string; logoUrl: string | null }", required: true, description: "Shown as logo and name, linking to /<slug>." }],
      },
      {
        title: "OrganiserChrome",
        items: [
          { name: "organisation", type: "{ name: string; slug: string; logoUrl: string | null } | null", required: true, description: "When null, only the main element renders." },
          { name: "children", type: "ReactNode", required: true, description: "Page content." },
        ],
      },
    ],
    notes: ["Kiosk paths match /<org>/<event>/check-in and render with no chrome.", "The Discover events button is hidden below the sm breakpoint."],
    related: ["site-footer", "color-mode-toggle", "app-shell"],
  },

  {
    slug: "help-callout",
    name: "Callout (help)",
    group: "Help content",
    source: "components/help/mdx.tsx",
    description: "Highlighted aside for guide articles. Four kinds: note, tip, warning and permission (who can do this). Registered as Callout in MDX.",
    exports: ["Callout", "helpMdxComponents"],
    props: [
      {
        items: [
          { name: "kind", type: '"tip" | "note" | "warning" | "permission"', default: '"note"', description: "Icon and tint. The default titles are Tip, Note, Careful and Who can do this." },
          { name: "title", type: "string", description: "Overrides the default title for the kind." },
          { name: "children", type: "ReactNode", required: true, description: "Body content." },
        ],
      },
    ],
    notes: ["Use kind=\"permission\" to state which roles can use a feature.", "A different Callout may exist in ui/; this one is the help article component."],
    related: ["steps", "kbd", "screenshot"],
  },
  {
    slug: "steps",
    name: "Steps",
    group: "Help content",
    source: "components/help/mdx.tsx",
    description: "Numbered procedure for guide articles. Wrap an ordered list in Steps.",
    exports: ["Steps"],
    props: [{ items: [{ name: "children", type: "ReactNode", required: true, description: "An ordered list (ol)." }] }],
    notes: ["Steps only adds the help-steps class; the numbered styling is the .help-steps rule in app/globals.css."],
    related: ["help-callout", "kbd", "screenshot"],
  },
  {
    slug: "kbd",
    name: "Kbd",
    group: "Help content",
    source: "components/help/mdx.tsx",
    description: "Inline keyboard key, for example Enter or Esc, in guide articles.",
    exports: ["Kbd"],
    props: [{ items: [{ name: "children", type: "ReactNode", required: true, description: "The key label." }] }],
    notes: ["One Kbd per key; write combinations as separate keys."],
    related: ["steps", "help-callout"],
  },
  {
    slug: "screenshot",
    name: "Screenshot",
    group: "Help content",
    source: "components/help/mdx.tsx",
    description: "A captured screen from public/help/<name>.png with known dimensions, lazy loaded with a border and optional caption.",
    exports: ["Screenshot"],
    props: [
      {
        items: [
          { name: "name", type: "string", required: true, description: "File name without extension; its size is looked up in content/help/screenshots.json." },
          { name: "alt", type: "string", required: true, description: "Alt text for the image." },
          { name: "caption", type: "string", description: "Optional figcaption." },
        ],
      },
    ],
    notes: [
      "Gallery limitation: screenshots.json is an empty stub here and the build runs with NODE_ENV=production, so Screenshot renders nothing. The examples show how it is called, not the image.",
      "In Yuyu, a name missing from screenshots.json shows a dashed 'Screenshot not captured yet' placeholder in development and nothing in production.",
      "Images are produced by the tests/help-screenshots capture.",
    ],
    related: ["steps", "help-callout"],
  },
];
export default docs;
