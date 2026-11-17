import type { ComponentDoc } from "../types";

const DISPLAY = "components/ui/display.tsx";

const docs: ComponentDoc[] = [
  {
    slug: "chip",
    name: "Chip",
    group: "Display",
    source: DISPLAY,
    description: "A small status or label pill. The label is the status: colour never carries meaning alone.",
    exports: ["Chip", "ChipTone"],
    props: [
      {
        items: [
          { name: "tone", type: '"neutral" | "success" | "warning" | "danger" | "accent" | "ink" | "outline"', default: '"neutral"', description: "Colour treatment." },
          { name: "size", type: '"sm" | "md"', default: '"md"', description: "Compact or regular padding and text size." },
          { name: "icon", type: "ReactNode", description: "Decorative icon before the label (aria-hidden, sized 14px)." },
          { name: "wrap", type: "boolean", default: "false", description: "Let a long label wrap onto further lines instead of truncating." },
          { name: "className", type: "string", description: "Extra classes." },
          { name: "children", type: "ReactNode", required: true, description: "The label." },
        ],
      },
    ],
    notes: ["Keep labels to one word where possible (Going, Waitlist, Draft, Published, Free).", "Long labels truncate to one line by default; use `wrap` for user-named text such as award badges.", "Chip is not interactive. For a toggle use FilterChip."],
    related: ["callout", "avatar"],
  },
  {
    slug: "card",
    name: "Card",
    group: "Display",
    source: DISPLAY,
    description: "The bordered, rounded surface that groups related content. CardHeader adds a title row with an optional description and actions.",
    exports: ["Card", "CardHeader"],
    props: [
      {
        title: "Card",
        items: [
          { name: "padding", type: '"none" | "sm" | "md" | "lg"', default: '"md"', description: "Inner padding: none, 16px, 20px, or 24px (32px from the sm breakpoint)." },
          { name: "as", type: '"div" | "section" | "article"', default: '"div"', description: "Element to render." },
          { name: "...props", type: "HTMLAttributes<HTMLElement>", description: "Passed to the element (className, id, aria attributes)." },
        ],
      },
      {
        title: "CardHeader",
        items: [
          { name: "title", type: "ReactNode", required: true, description: "Heading text." },
          { name: "description", type: "ReactNode", description: "Muted helper line under the title." },
          { name: "action", type: "ReactNode", description: "Right-aligned actions (wraps below on narrow widths)." },
          { name: "titleAs", type: '"h2" | "h3" | "h4"', default: '"h2"', description: "Heading level, to keep the outline correct." },
          { name: "className", type: "string", description: "Extra classes on the wrapper (it carries mb-4)." },
        ],
      },
    ],
    notes: ['Use padding="none" when a Table or list should run edge to edge inside the card.', "Pick `titleAs` to match the surrounding heading outline."],
    related: ["section-heading", "settings-row", "table"],
  },
  {
    slug: "callout",
    name: "Callout",
    group: "Display",
    source: DISPLAY,
    description: "An inline banner with a tone icon, optional title, body and action. Use it for page-level notices and form errors.",
    exports: ["Callout", "CalloutTone"],
    props: [
      {
        items: [
          { name: "tone", type: '"warning" | "info" | "success" | "danger"', default: '"info"', description: "Colour and icon." },
          { name: "title", type: "ReactNode", description: "Bold first line." },
          { name: "children", type: "ReactNode", description: "Body text, shown slightly softer under a title." },
          { name: "action", type: "ReactNode", description: "Button or link on the right (below the text on mobile)." },
          { name: "role", type: '"alert" | "status"', description: "Set so the message is announced. Not set by default." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    notes: ['Use role="alert" for errors that appear after an action and role="status" for passive updates.', "The icon is hidden below the sm breakpoint."],
    related: ["empty-state", "chip"],
  },
  {
    slug: "empty-state",
    name: "EmptyState",
    group: "Display",
    source: DISPLAY,
    description: "A bordered card for an empty list, an error or a not-found message. Give it a next step.",
    exports: ["EmptyState"],
    props: [
      {
        items: [
          { name: "mood", type: "DotFaceMood", description: "Dot face shown at 48px: happy, cheering, wink, love, done, waiting, surprised, thinking, sleepy, sad." },
          { name: "icon", type: "ReactNode", description: "A 28px muted icon, for surfaces that do not use faces." },
          { name: "title", type: "ReactNode", description: "Label-weight heading." },
          { name: "children", type: "ReactNode", description: "Explanation, capped at max-w-md." },
          { name: "action", type: "ReactNode", description: "Buttons, centred and wrapping." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    notes: ["On Yuyu's own screens pass a face: sleepy for empty lists, sad for errors. Organiser-facing pages (org page, event schedule) leave `mood` out.", "mood and icon can both be passed; the face renders first."],
    related: ["callout", "skeleton"],
  },
  {
    slug: "danger-zone",
    name: "DangerZone",
    group: "Display",
    source: DISPLAY,
    description: "A red-outlined section for destructive settings such as deleting an event or an organisation.",
    exports: ["DangerZone"],
    props: [
      {
        items: [
          { name: "title", type: "ReactNode", required: true, description: "Heading in danger colour." },
          { name: "description", type: "ReactNode", description: "What will happen and whether it can be undone." },
          { name: "action", type: "ReactNode", description: "The destructive button, aligned right on wide screens." },
          { name: "children", type: "ReactNode", description: "Extra content below the header row." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    notes: ["Pair the action with a danger Button that opens a confirm dialog rather than deleting immediately."],
    related: ["settings-row", "callout"],
  },
  {
    slug: "avatar",
    name: "Avatar",
    group: "Display",
    source: ["components/ui/display.tsx", "components/ui/avatar-image.tsx"],
    description: "A round person avatar: the photo if present, otherwise one or two initials on a tint. If the photo fails to load it falls back to initials.",
    exports: ["Avatar", "initials", "AvatarImage"],
    props: [
      {
        title: "Avatar",
        items: [
          { name: "name", type: "string | null", description: "Used for initials and as a screen-reader label." },
          { name: "src", type: "string | null", description: "Photo URL. Falls back to initials when missing or broken." },
          { name: "size", type: '"xs" | "sm" | "md" | "lg" | "xl"', default: '"md"', description: "24, 32, 40, 56 and 80 px." },
          { name: "tone", type: '"neutral" | "accent" | "success" | "warning" | "ink"', default: '"neutral"', description: "Tint behind the initials." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
      {
        title: "initials(name, fallback?)",
        items: [
          { name: "name", type: "string | null | undefined", required: true, description: "One word gives its first two letters; several give first and last initial. Uppercased." },
          { name: "fallback", type: "string", default: '"?"', description: "Returned when the name is empty." },
        ],
      },
      {
        title: "AvatarImage (used inside Avatar)",
        items: [
          { name: "src", type: "string", required: true, description: "Image URL." },
          { name: "fallback", type: "ReactNode", required: true, description: "Rendered instead of the image if it errors." },
        ],
      },
    ],
    notes: ["The image is decorative (alt empty); the name is exposed through a visually hidden label."],
    related: ["org-logo", "chip"],
  },
  {
    slug: "org-logo",
    name: "OrgLogo",
    group: "Display",
    source: DISPLAY,
    description: "A square organisation logo with rounded corners. Falls back to initials on an ink background when there is no image.",
    exports: ["OrgLogo"],
    props: [
      {
        items: [
          { name: "name", type: "string", required: true, description: "Organisation name, used for the initials fallback." },
          { name: "src", type: "string | null", description: "Logo URL. When set, the tile uses the canvas background." },
          { name: "size", type: '"sm" | "md" | "lg" | "xl"', default: '"md"', description: "32, 40, 56 and 96 px." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    notes: ["Unlike Avatar, OrgLogo has no accessible name of its own (the image alt is empty); put the organisation name in text beside it.", "Unlike Avatar, a broken `src` does not fall back to initials."],
    related: ["avatar"],
  },
  {
    slug: "date-block",
    name: "DateBlock",
    group: "Display",
    source: DISPLAY,
    description: "A calendar-leaf tile with a coloured month header over a large day number. Used in event lists.",
    exports: ["DateBlock"],
    props: [
      {
        items: [
          { name: "month", type: "string", required: true, description: 'Month label, shown as given (pass it uppercase, e.g. "JUN").' },
          { name: "day", type: "string", required: true, description: "Day number." },
          { name: "tone", type: '"accent" | "draft" | "ink"', default: '"accent"', description: "Header colour: accent, grey for drafts, or ink." },
          { name: "color", type: "string", description: "Explicit header colour (a validated hex), such as an event's own accent. Overrides tone." },
          { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "50, 56 and 68 px wide." },
          { name: "series", type: "boolean", default: "false", description: "Shows a repeat icon instead of the day, for recurring series." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    notes: ["It is aria-hidden: always put the full date in text next to it."],
    related: ["chip", "card"],
  },
  {
    slug: "progress-bar",
    name: "ProgressBar",
    group: "Data",
    source: DISPLAY,
    description: 'A thin determinate bar with role="progressbar". The fill is clamped between 0 and 100%.',
    exports: ["ProgressBar"],
    props: [
      {
        items: [
          { name: "value", type: "number", required: true, description: "Current value." },
          { name: "max", type: "number", required: true, description: "Value that equals 100%. A max of 0 or less renders an empty bar." },
          { name: "tone", type: '"accent" | "ink" | "success" | "warning"', default: '"accent"', description: "Fill colour." },
          { name: "label", type: "string", description: "aria-label for the bar." },
          { name: "className", type: "string", description: "Extra classes, e.g. margins." },
        ],
      },
    ],
    notes: ["Show the numbers in text too; the bar is only 6px tall.", "The width animates over 360 ms."],
    related: ["stat-tile", "spinner"],
  },
  {
    slug: "stat-tile",
    name: "StatTile",
    group: "Data",
    source: DISPLAY,
    description: 'A label over a large Bricolage number, with optional hint, progress bar and link. The attention tone gives the warm "needs you" tint.',
    exports: ["StatTile"],
    props: [
      {
        items: [
          { name: "label", type: "ReactNode", required: true, description: "Small muted caption above the value." },
          { name: "value", type: "ReactNode", required: true, description: "The big number (32px)." },
          { name: "hint", type: "ReactNode", description: "Caption under the value." },
          { name: "progress", type: '{ value: number; max: number; tone?: "accent" | "ink" | "success" | "warning" }', description: "Adds a ProgressBar under the hint." },
          { name: "tone", type: '"default" | "attention"', default: '"default"', description: "attention uses the warning tint without a border." },
          { name: "href", type: "string", description: "Renders the tile as a Link with a hover state." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    notes: ["Use attention only when the number means someone has to act, for example when a count is above zero."],
    related: ["progress-bar", "card"],
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    group: "Display",
    source: DISPLAY,
    description: "A pulsing placeholder block shown while content loads. You size it with classes.",
    exports: ["Skeleton"],
    props: [{ items: [{ name: "className", type: "string", description: 'Sets the size and shape, e.g. "h-4 w-40" or "size-10 rounded-full".' }] }],
    notes: ["It is aria-hidden and has no size of its own: always pass height and width.", "Match the layout of the real content to avoid a jump."],
    related: ["spinner", "empty-state"],
  },
  {
    slug: "page-header",
    name: "PageHeader",
    group: "Display",
    source: DISPLAY,
    description: "The h1 block at the top of a page: optional kicker, title, description and a row of actions.",
    exports: ["PageHeader"],
    props: [
      {
        items: [
          { name: "title", type: "ReactNode", required: true, description: "Rendered as the page's h1." },
          { name: "kicker", type: "ReactNode", description: "Small muted line above the title, such as an organisation name." },
          { name: "description", type: "ReactNode", description: "Supporting text, max 640px wide." },
          { name: "actions", type: "ReactNode", description: "Buttons aligned to the bottom right on wide screens." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    notes: ["Use once per page. Sections below use SectionHeading."],
    related: ["section-heading", "card"],
  },
  {
    slug: "section-heading",
    name: "SectionHeading",
    group: "Display",
    source: DISPLAY,
    description: 'A heading for a section of a page, with optional description and a trailing action such as a "View all" link.',
    exports: ["SectionHeading"],
    props: [
      {
        items: [
          { name: "title", type: "ReactNode", required: true, description: "Heading text." },
          { name: "description", type: "ReactNode", description: "Muted helper line." },
          { name: "action", type: "ReactNode", description: "Trailing element, aligned to the bottom right." },
          { name: "as", type: '"h2" | "h3"', default: '"h2"', description: "Heading level." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    related: ["page-header", "card"],
  },
  {
    slug: "settings-row",
    name: "SettingsRow",
    group: "Display",
    source: DISPLAY,
    description: "A settings layout row: title and helper text on the left, the fields on the right. Stacks on mobile; rows are separated by a hairline.",
    exports: ["SettingsRow"],
    props: [
      {
        items: [
          { name: "title", type: "ReactNode", required: true, description: "Row label (an h3)." },
          { name: "description", type: "ReactNode", description: "Helper caption under the title." },
          { name: "children", type: "ReactNode", required: true, description: "Fields or controls for the right column." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    notes: ["The label column is up to 280px wide from the md breakpoint. The last row drops its bottom border."],
    related: ["danger-zone", "card"],
  },
  {
    slug: "detail-list",
    name: "DetailList",
    group: "Data",
    source: DISPLAY,
    description: "A key/value list (a dl) with overline labels on the left and values on the right. Collapses to stacked pairs on mobile.",
    exports: ["DetailList"],
    props: [
      {
        items: [
          { name: "items", type: "Array<{ label: ReactNode; value: ReactNode }>", required: true, description: "The rows, in order." },
          { name: "className", type: "string", description: "Extra classes." },
        ],
      },
    ],
    related: ["table", "settings-row"],
  },
  {
    slug: "table",
    name: "Table",
    group: "Data",
    source: ["components/ui/table.tsx", "components/ui/use-load-more-focus.ts"],
    description: 'A rounded, bordered table that scrolls inside its own box on small screens. Built from THead, TBody, TR, TH and TD. The useLoadMoreFocus hook handles focus for "Load more" lists.',
    exports: ["Table", "THead", "TBody", "TR", "TH", "TD", "useLoadMoreFocus"],
    props: [
      {
        title: "Table",
        items: [
          { name: "label", type: "string", description: "Names the scroll region and makes it keyboard-focusable (tabIndex 0). Set it so an overflowing table can be scrolled by keyboard." },
          { name: "...props", type: "HTMLAttributes<HTMLTableElement>", description: "Passed to the inner table element." },
        ],
      },
      {
        title: "THead, TBody, TR, TH, TD",
        items: [{ name: "...props", type: "native element attributes", description: 'Thin styled wrappers. TH defaults to scope="col"; TR highlights on hover; the last row has no bottom border.' }],
      },
      {
        title: "useLoadMoreFocus(count, options?)",
        items: [
          { name: "count", type: "number", required: true, description: "Number of rows currently rendered." },
          { name: "options.focus", type: '"row" | "radio"', default: '"row"', description: 'Focus the new row itself, or its role="radio" element for pickers.' },
          { name: "returns", type: "{ listId: string; beforeLoadMore: () => void }", description: "Put id={listId} on the element whose children are the rows; call beforeLoadMore() in the button's click handler." },
        ],
      },
    ],
    notes: [
      "Always pass `label` for tables that can overflow.",
      "Use TD className to align numbers (text-right, tabular-nums).",
      "useLoadMoreFocus moves focus to the first newly loaded row after a Load more press, unless focus has already moved elsewhere. Rows must be direct children of the element with the listId.",
    ],
    related: ["page-number-pager", "detail-list", "empty-state"],
  },
  {
    slug: "spinner",
    name: "Spinner",
    group: "Display",
    source: "components/ui/spinner.tsx",
    description: 'A decorative SVG spinner. Pair it with visible text such as "Saving…".',
    exports: ["Spinner"],
    props: [
      {
        items: [
          { name: "className", type: "string", description: "Override the size (default size-5) or colour (it uses currentColor)." },
          { name: "label", type: "string", description: 'When set, the spinner gets role="status" and this aria-label. Otherwise it is aria-hidden.' },
        ],
      },
    ],
    notes: ["Use Button's loading prop for buttons; use Spinner directly for other loading UI."],
    related: ["skeleton", "progress-bar"],
  },
  {
    slug: "themed-image",
    name: "ThemedImage",
    group: "Display",
    source: "components/ui/themed-image.tsx",
    description: "A static asset with a dark-theme twin (dot icons, the logo). Both images render and CSS shows the one that matches the colour mode or a .yy-dark-band.",
    exports: ["ThemedImage"],
    props: [
      {
        items: [
          { name: "src", type: "string", required: true, description: "Light-mode asset." },
          { name: "darkSrc", type: "string", required: true, description: "Dark-mode asset." },
          { name: "width", type: "number", required: true, description: "Pixel width of both images." },
          { name: "height", type: "number", required: true, description: "Pixel height of both images." },
          { name: "alt", type: "string", default: '""', description: "Alt text, applied to both. Leave empty for decorative art." },
          { name: "className", type: "string", description: "Extra classes on both images." },
        ],
      },
    ],
    notes: ["The two images are siblings of a fragment, so wrap them if you need one flex item.", "Use the Dark preview toggle above an example to see the swap."],
    related: ["github-mark"],
  },
  {
    slug: "github-mark",
    name: "GitHubMark",
    group: "Display",
    source: "components/ui/github-mark.tsx",
    description: "GitHub's mark as an inline SVG, since lucide ships no brand icons. It uses currentColor and is decorative.",
    exports: ["GitHubMark"],
    props: [{ items: [{ name: "className", type: "string", description: "Override the size (default size-4) or colour." }] }],
    notes: ["It is aria-hidden: label the surrounding link or button with text."],
    related: ["themed-image"],
  },
  {
    slug: "page-number-pager",
    name: "PageNumberPager",
    group: "Data",
    source: "components/ui/page-number-pager.tsx",
    description: "Previous, page numbers and Next for organiser lists that fetch numbered pages. A window of up to seven page numbers, with 44px touch targets. Renders nothing for a single page.",
    exports: ["PageNumberPager"],
    props: [
      {
        items: [
          { name: "label", type: "string", required: true, description: 'Names the navigation landmark, such as "Invite pages".' },
          { name: "page", type: "number", required: true, description: "Current page, 1-based." },
          { name: "totalPages", type: "number", required: true, description: "Total number of pages. 1 or less renders nothing." },
          { name: "onPage", type: "(page: number) => void", required: true, description: "Called with the requested page. Clicking the current page does nothing." },
          { name: "disabled", type: "boolean", description: "Disables every control, for example while a page is loading." },
        ],
      },
    ],
    notes: ['The current page has aria-current="page".', "It is controlled: keep `page` in state and fetch in onPage."],
    related: ["table", "button"],
  },
];
export default docs;
