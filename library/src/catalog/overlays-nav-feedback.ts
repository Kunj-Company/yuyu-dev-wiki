import type { ComponentDoc } from "../types";

const docs: ComponentDoc[] = [
  {
    slug: "dialog",
    name: "Dialog",
    group: "Overlays",
    source: "components/ui/dialog.tsx",
    description: "A modal panel built on Radix Dialog. Compose it from a trigger, content, header, body and footer.",
    exports: ["Dialog", "DialogTrigger", "DialogClose", "DialogContent", "DialogHeader", "DialogBody", "DialogFooter", "ConfirmDialog"],
    props: [
      {
        title: "Dialog, DialogTrigger, DialogClose",
        items: [
          { name: "open / defaultOpen", type: "boolean", description: "Radix Dialog.Root props. Pass open with onOpenChange to control it." },
          { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the dialog wants to open or close." },
          { name: "asChild", type: "boolean", default: "false", description: "On DialogTrigger and DialogClose: render your own element, usually a Button." },
        ],
      },
      {
        title: "DialogContent",
        items: [
          { name: "size", type: '"sm" | "md" | "lg" | "xl"', default: '"sm"', description: "Maximum width of 480, 640, 860 or 1100 px. Always at most the viewport width minus 32 px." },
          { name: "hideClose", type: "boolean", default: "false", description: "Hide the corner close button (an IconButton labelled Close)." },
          { name: "className", type: "string", description: "Merged onto the panel." },
          { name: "...Radix Content props", type: "ComponentPropsWithoutRef<Dialog.Content>", description: "For example role, onEscapeKeyDown, onInteractOutside, onOpenAutoFocus." },
        ],
      },
      {
        title: "DialogHeader",
        items: [
          { name: "title", type: "ReactNode", required: true, description: "Rendered as the accessible dialog title." },
          { name: "description", type: "ReactNode", description: "Visible description. When omitted, the title is repeated in a screen-reader-only description so the dialog always has one." },
          { name: "className", type: "string", description: "Merged onto the header." },
        ],
      },
      {
        title: "DialogBody and DialogFooter",
        items: [
          { name: "children", type: "ReactNode", required: true, description: "Body scrolls on its own when content is tall. Footer stacks actions on mobile (primary first) and right-aligns them from sm up." },
          { name: "className", type: "string", description: "Merged onto the wrapper." },
        ],
      },
    ],
    notes: [
      "Radix traps focus inside, returns it to the trigger on close, and closes on Escape and on an overlay click.",
      "DialogHeader always renders a title and a description, so Radix has no missing-description warning.",
      "The panel has focus:outline-none because the focus-managed container takes over from the global focus ring.",
      "For a form, wrap DialogHeader, DialogBody and DialogFooter in a <form className=\"flex min-h-0 flex-col\"> so the body still scrolls.",
      "Prefer ConfirmDialog for yes/no confirmations rather than composing your own.",
    ],
    related: ["confirm-dialog", "menu", "popover", "toast"],
  },
  {
    slug: "confirm-dialog",
    name: "ConfirmDialog",
    group: "Overlays",
    source: ["components/ui/dialog.tsx", "components/feedback/ConfirmationDialog.tsx"],
    description: "A small confirmation for consequential actions, destructive by default, with an optional type-to-confirm lock.",
    exports: ["ConfirmDialog", "ConfirmationDialog"],
    props: [
      {
        title: "ConfirmDialog (ui/dialog)",
        items: [
          { name: "open", type: "boolean", required: true, description: "Controlled visibility." },
          { name: "title", type: "ReactNode", required: true, description: "Dialog title." },
          { name: "message", type: "ReactNode", description: "Description under the title." },
          { name: "confirmLabel", type: "string", default: '"Delete"', description: "Label of the confirm button." },
          { name: "cancelLabel", type: "string", default: '"Cancel"', description: "Label of the cancel button." },
          { name: "destructive", type: "boolean", default: "true", description: "true uses the danger button, false uses primary." },
          { name: "loading", type: "boolean", default: "false", description: "Spinner on confirm, disables cancel, and blocks Escape and overlay dismissal." },
          { name: "confirmText", type: "string", description: "When set, shows an input and keeps confirm disabled until the trimmed value matches exactly." },
          { name: "onConfirm", type: "() => void", required: true, description: "Confirm clicked. You close the dialog yourself." },
          { name: "onCancel", type: "() => void", required: true, description: "Cancel, Escape or overlay click." },
          { name: "children", type: "ReactNode", description: "Extra content shown in the body above the type-to-confirm field." },
        ],
      },
      {
        title: "ConfirmationDialog (feedback)",
        items: [
          { name: "open, title, message, onConfirm, onCancel", type: "boolean, string, string, () => void, () => void", required: true, description: "Same meaning as above. title and message must be strings." },
          { name: "confirmLabel / cancelLabel", type: "string", default: '"Delete" / "Cancel"', description: "Button labels." },
          { name: "loading / destructive", type: "boolean", default: "false / true", description: "Passed straight through." },
        ],
      },
    ],
    notes: [
      "ConfirmationDialog is a backwards-compatible wrapper around ConfirmDialog. It forwards its props and does not expose confirmText or children. Use ConfirmDialog in new code.",
      "Renders role=\"alertdialog\" with no corner close button, so the user must choose Cancel or confirm (Escape also cancels).",
      "The type-to-confirm input is autofocused, and the typed value is cleared on cancel.",
      "Destructive confirmations use the danger button (docs/DESIGN.md section 4.15). Label the button with the action, not OK.",
      "While loading, onCancel is not called from Escape or the overlay.",
    ],
    related: ["dialog", "toast"],
  },
  {
    slug: "menu",
    name: "Menu",
    group: "Overlays",
    source: "components/ui/menu.tsx",
    description: "A dropdown action menu on Radix DropdownMenu, with icon, description and danger styling per item.",
    exports: ["Menu", "MenuTrigger", "MenuContent", "MenuItem", "MenuGroup", "MenuLabel", "MenuSeparator"],
    props: [
      {
        title: "MenuContent",
        items: [
          { name: "align", type: '"start" | "center" | "end"', default: '"end"', description: "Alignment against the trigger." },
          { name: "sideOffset", type: "number", default: "6", description: "Gap from the trigger in px." },
          { name: "className", type: "string", description: "Merged onto the panel (min-width 200 px)." },
        ],
      },
      {
        title: "MenuItem",
        items: [
          { name: "danger", type: "boolean", description: "Danger text colour for destructive actions." },
          { name: "icon", type: "ReactNode", description: "Leading icon, rendered aria-hidden at 18 px." },
          { name: "description", type: "ReactNode", description: "Secondary line under the label." },
          { name: "onSelect", type: "(event: Event) => void", description: "Radix Item prop. Fires on click, Enter or Space and then closes the menu." },
          { name: "disabled", type: "boolean", description: "Not selectable and skipped by the keyboard." },
          { name: "asChild", type: "boolean", description: "Pass a single element such as a Link; icon and label are placed inside it." },
        ],
      },
      {
        title: "Other parts",
        items: [
          { name: "Menu / MenuTrigger / MenuGroup", type: "Radix DropdownMenu Root, Trigger, Group", description: "Re-exports. Use asChild on MenuTrigger to wrap a Button or IconButton." },
          { name: "MenuLabel", type: "{ children: ReactNode }", description: "Overline heading for a group." },
          { name: "MenuSeparator", type: "no props", description: "Hairline divider." },
        ],
      },
    ],
    notes: [
      "Radix handles keyboard use: arrow keys move, type-ahead jumps, Escape closes and returns focus to the trigger.",
      "An icon-only trigger must be an IconButton so it has a name.",
      "MenuContent defaults to align=\"end\", which suits a row-end trigger; use align=\"start\" under a labelled button.",
      "Highlighted items drop the outline because the highlight background takes over.",
      "Put destructive items last, after a MenuSeparator.",
    ],
    related: ["popover", "tooltip", "dialog"],
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    group: "Overlays",
    source: "components/ui/menu.tsx",
    description: "A short ink label shown on hover or focus. Needs a TooltipProvider above it, which the app's Providers already supplies.",
    exports: ["Tooltip", "TooltipProvider"],
    props: [
      {
        items: [
          { name: "content", type: "ReactNode", required: true, description: "Tooltip content (max width 280 px)." },
          { name: "children", type: "ReactNode", required: true, description: "The trigger. Must be a single element that accepts a ref, because it is rendered asChild." },
          { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: "Preferred side. Radix flips it near the screen edge." },
        ],
      },
    ],
    notes: [
      "The delay is fixed at 300 ms and the offset at 6 px. Neither is configurable per tooltip.",
      "Shows on keyboard focus as well as hover and closes on Escape.",
      "Tooltips are not shown on touch. Never put essential information only in a tooltip, and keep the control's own accessible name.",
      "TooltipProvider is Radix Tooltip.Provider, shared so adjacent tooltips open without the delay.",
    ],
    related: ["popover", "menu"],
  },
  {
    slug: "popover",
    name: "Popover",
    group: "Overlays",
    source: "components/ui/menu.tsx",
    description: "A floating panel for small forms or explanations, anchored to a trigger, on Radix Popover.",
    exports: ["Popover", "PopoverTrigger", "PopoverAnchor", "PopoverContent"],
    props: [
      {
        title: "PopoverContent",
        items: [
          { name: "align", type: '"start" | "center" | "end"', default: '"start"', description: "Alignment against the trigger." },
          { name: "sideOffset", type: "number", default: "6", description: "Gap from the trigger in px." },
          { name: "className", type: "string", description: "Merged onto the panel. Set a width, such as w-72." },
        ],
      },
      {
        title: "Other parts",
        items: [
          { name: "Popover", type: "Radix Popover Root", description: "Accepts open, defaultOpen and onOpenChange." },
          { name: "PopoverTrigger", type: "Radix Popover Trigger", description: "Use asChild to wrap a Button." },
          { name: "PopoverAnchor", type: "Radix Popover Anchor", description: "Position the panel against another element than the trigger." },
        ],
      },
    ],
    notes: [
      "Unlike a menu, a popover holds arbitrary content. Focus moves into it on open and returns to the trigger on close.",
      "Escape and an outside click close it.",
      "Padding is 12 px and there is no default width, so give the panel one.",
      "The panel has focus:outline-none; keep a focusable control inside so focus has somewhere to land.",
    ],
    related: ["menu", "tooltip", "dialog"],
  },
  {
    slug: "tabs",
    name: "Tabs",
    group: "Navigation",
    source: "components/ui/tabs.tsx",
    description: "Underline tabs on Radix Tabs that scroll sideways on narrow screens and keep the active tab in view.",
    exports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent", "useActiveTabIntoView", "activeTabScrollTarget"],
    props: [
      {
        title: "Tabs (Radix Root)",
        items: [
          { name: "defaultValue / value", type: "string", description: "Uncontrolled or controlled active tab." },
          { name: "onValueChange", type: "(value: string) => void", description: "Called when the active tab changes." },
          { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Arrow-key direction." },
          { name: "activationMode", type: '"automatic" | "manual"', default: '"automatic"', description: "Whether focusing a tab activates it." },
        ],
      },
      {
        title: "TabsTrigger",
        items: [
          { name: "value", type: "string", required: true, description: "Matches a TabsContent value." },
          { name: "accent", type: "boolean", description: "Accent colour for the active underline instead of primary." },
          { name: "disabled", type: "boolean", description: "Not selectable." },
        ],
      },
      {
        title: "Helpers",
        items: [
          { name: "useActiveTabIntoView(node, margin?)", type: "(ref, number = 56) => void", description: "Hook that scrolls a tab row (never the page) so the active tab is visible. TabsList and NavTabs already use it." },
          { name: "activeTabScrollTarget(row, tab, margin?)", type: "(row, tab, number = 56) => number | null", description: "Pure function: the scrollLeft to apply, or null when the tab is already visible." },
        ],
      },
    ],
    notes: [
      "Give TabsList an aria-label. Radix provides role=\"tablist\", role=\"tab\", aria-selected and arrow-key navigation.",
      "Tabs are at least 44 px tall.",
      "The faded arrow buttons on overflow are tabIndex -1, so they add no tab stops; keyboard users use the arrow keys.",
      "The active tab scrolls into view on mount (instantly) and on change (smoothly unless the user prefers reduced motion).",
      "TabsContent has a 24 px top padding and no focus outline.",
      "For tabs that change the route, use NavTabs instead.",
    ],
    related: ["nav-tabs", "accordion"],
  },
  {
    slug: "nav-tabs",
    name: "NavTabs",
    group: "Navigation",
    source: "components/ui/tabs.tsx",
    description: "Underline tabs made of real links, for moving between routes. It reads as tabs but behaves as navigation.",
    exports: ["NavTabs"],
    props: [
      {
        items: [
          { name: "items", type: "Array<{ href: string; label: ReactNode; active: boolean }>", required: true, description: "One entry per link. Set active from the current pathname." },
          { name: "label", type: "string", required: true, description: "aria-label of the nav landmark." },
          { name: "className", type: "string", description: "Merged onto the nav element." },
        ],
      },
    ],
    notes: [
      "Renders <nav aria-label> with next/link anchors, and sets aria-current=\"page\" on the active one. It does not use role=\"tab\".",
      "In this gallery next/link is shimmed, so the hrefs do not navigate.",
      "Shares the scroll hints and active-into-view behaviour with Tabs.",
      "The active state is yours to compute, typically from usePathname().",
    ],
    related: ["tabs"],
  },
  {
    slug: "accordion",
    name: "Accordion",
    group: "Navigation",
    source: "components/ui/tabs.tsx",
    description: "Stacked disclosure sections on Radix Accordion, for FAQs and optional detail.",
    exports: ["Accordion", "AccordionItem"],
    props: [
      {
        title: "Accordion (Radix Root)",
        items: [
          { name: "type", type: '"single" | "multiple"', required: true, description: "One open panel at a time, or any number." },
          { name: "collapsible", type: "boolean", default: "false", description: "With type=\"single\", allow closing the open panel." },
          { name: "defaultValue / value", type: "string | string[]", description: "Open item(s). A string for single, an array for multiple." },
          { name: "onValueChange", type: "(value) => void", description: "Called when the open item(s) change." },
        ],
      },
      {
        title: "AccordionItem",
        items: [
          { name: "value", type: "string", required: true, description: "Unique id of the item." },
          { name: "title", type: "ReactNode", required: true, description: "Contents of the trigger button." },
          { name: "children", type: "ReactNode", required: true, description: "Panel content." },
          { name: "className", type: "string", description: "Merged onto the item (has a bottom border)." },
        ],
      },
    ],
    notes: [
      "The trigger is a button inside a heading. Enter or Space toggles, and Up/Down arrows, Home and End move between triggers.",
      "The chevron is aria-hidden and rotates when open.",
      "The Accordion root takes no styling of its own; set a max width on it or its container.",
    ],
    related: ["tabs"],
  },
  {
    slug: "toast",
    name: "Toast",
    group: "Feedback",
    source: "components/feedback/ToastProvider.tsx",
    description: "A transient ink message with an optional action such as Undo. ToastProvider renders it; useToast shows it.",
    exports: ["ToastProvider", "useToast"],
    props: [
      {
        title: "useToast().showToast(message, severity?, action?, durationMs?)",
        items: [
          { name: "message", type: "string", required: true, description: "Text to show." },
          { name: "severity", type: '"success" | "error" | "info" | "warning"', default: '"info"', description: "Chooses the icon and the live-region politeness." },
          { name: "action", type: "{ label: string; onClick: () => void } | null", default: "null", description: "A single action button. Clicking it runs onClick and dismisses the toast." },
          { name: "durationMs", type: "number", default: "5000", description: "Auto-dismiss delay." },
        ],
      },
      {
        title: "ToastProvider",
        items: [{ name: "children", type: "ReactNode", required: true, description: "App subtree. Already mounted by Providers." }],
      },
    ],
    notes: [
      "Only one toast is visible at a time. A new call replaces the current one.",
      "Errors use role=\"alert\" with aria-live=\"assertive\"; every other severity uses role=\"status\" with aria-live=\"polite\".",
      "Bottom-center on mobile, bottom-left from md up. Includes a Dismiss button.",
      "useToast throws if called outside ToastProvider.",
      "Never use alert(). For a form-level error also show an inline Callout.",
    ],
    related: ["confirm-dialog", "dialog"],
  },
];
export default docs;
