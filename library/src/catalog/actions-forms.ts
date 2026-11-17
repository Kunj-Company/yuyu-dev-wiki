import type { ComponentDoc, PropDoc } from "../types";

const radixRoot = (what: string): PropDoc[] => [
  { name: "checked / defaultChecked", type: "boolean" + (what === "checkbox" ? ' | "indeterminate"' : ""), description: "Controlled or uncontrolled state." },
  { name: "onCheckedChange", type: "(checked: " + (what === "checkbox" ? 'boolean | "indeterminate"' : "boolean") + ") => void", description: "Called when the user toggles it." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims the control and blocks interaction." },
  { name: "name / value / required", type: "string / string / boolean", description: "Passed to Radix; a hidden input is rendered inside a form." },
];

const labelled: PropDoc[] = [
  { name: "label", type: "ReactNode", required: true, description: "Text beside the control; clicking it toggles the control." },
  { name: "description", type: "ReactNode", description: "Muted helper text under the label, linked through aria-describedby where supported." },
  { name: "id", type: "string", description: "Control id. Generated with useId when omitted." },
];

const docs: ComponentDoc[] = [
  {
    slug: "button",
    name: "Button",
    group: "Actions",
    source: "components/ui/button.tsx",
    description: "The standard action control. Pill-shaped, seven variants, three sizes, with a built-in loading state and an asChild mode for links.",
    exports: ["Button", "buttonClasses", "ButtonProps", "ButtonVariant", "ButtonSize"],
    props: [
      {
        items: [
          { name: "variant", type: '"primary" | "accent" | "secondary" | "quiet" | "danger" | "dangerQuiet" | "inverse"', default: '"secondary"', description: "Visual style. Pick by importance." },
          { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Minimum heights of 36, 44 and 52 px." },
          { name: "fullWidth", type: "boolean", default: "false", description: "Adds w-full." },
          { name: "loading", type: "boolean", default: "false", description: "Disables the button, sets aria-busy and swaps the content for a Spinner plus the label." },
          { name: "loadingLabel", type: "string", description: "Text shown next to the spinner while loading. Falls back to children." },
          { name: "startIcon / endIcon", type: "ReactNode", description: "Icon before or after the label, rendered aria-hidden at 18 px." },
          { name: "asChild", type: "boolean", default: "false", description: "Render the single child (for example a Link) with button styling through Radix Slot. Loading and icons are not applied." },
          { name: "type", type: '"button" | "submit" | "reset"', default: '"button"', description: "Defaults to button so it never submits a form by accident." },
          { name: "...rest", type: "ButtonHTMLAttributes<HTMLButtonElement>", description: "Everything else goes to the element. Ref is forwarded." },
        ],
      },
    ],
    notes: [
      "Use one primary button per view. Never use primary for a destructive action; use danger.",
      "quiet and dangerQuiet are text-style buttons with smaller horizontal padding and an underline on hover.",
      "Disabled primary, accent and inverse switch to bg-emphasis with muted text so they stay readable.",
      "Use buttonClasses({ variant, size, fullWidth, className }) to style an element that cannot use asChild.",
      "Keep the label and width stable while loading; pass loadingLabel for a different message.",
    ],
    related: ["icon-button", "filter-chip"],
  },
  {
    slug: "icon-button",
    name: "IconButton",
    group: "Actions",
    source: "components/ui/button.tsx",
    description: "A round icon-only button. The label is required and becomes both aria-label and title.",
    exports: ["IconButton", "IconButtonProps"],
    props: [
      {
        items: [
          { name: "label", type: "string", required: true, description: "Accessible name; also the native tooltip (title)." },
          { name: "variant", type: '"quiet" | "secondary" | "danger" | "primary"', default: '"quiet"', description: "Quiet has no chrome until hover; secondary has an outline." },
          { name: "size", type: '"sm" | "md"', default: '"md"', description: "36 px or 44 px square." },
          { name: "children", type: "ReactNode", description: "The icon. SVG children are sized to 18 px." },
          { name: "type", type: "string", default: '"button"', description: "Defaults to button." },
          { name: "...rest", type: "ButtonHTMLAttributes<HTMLButtonElement>", description: "onClick, disabled and the rest." },
        ],
      },
    ],
    notes: ["Disabled state only recolours the icon (text-ink-disabled) and blocks pointer events.", "There is no loading prop; swap the icon for a Spinner if needed."],
    related: ["button"],
  },
  {
    slug: "field",
    name: "Field",
    group: "Forms",
    source: "components/ui/field.tsx",
    description: "Wraps one control with a label above and helper or error text below, wiring id, aria-invalid, aria-describedby and required. Also home to the plain inputs.",
    exports: ["Field", "Input", "Textarea", "PrefixInput", "ReadOnlyValue", "PasswordInput", "SearchInput", "Dropdown", "controlClasses"],
    props: [
      {
        title: "Field",
        items: [
          { name: "label", type: "ReactNode", required: true, description: "Always shown above the control. No floating labels." },
          { name: "optional", type: "boolean", description: "Appends a muted \"Optional\" after the label." },
          { name: "helperText", type: "ReactNode", description: "Muted caption under the control." },
          { name: "error", type: "ReactNode", description: "Replaces helperText with an icon and danger-coloured message, and sets aria-invalid on the control." },
          { name: "hideLabel", type: "boolean", description: "Visually hides the label (sr-only) but keeps it for assistive tech." },
          { name: "required", type: "boolean", description: "Forwarded to the control's required attribute." },
          { name: "id", type: "string", description: "Control id. Falls back to the child's id, then a generated one." },
          { name: "className", type: "string", description: "Class for the wrapper div." },
          { name: "children", type: "ReactElement", required: true, description: "Exactly one control element; Field clones it to inject id and ARIA props." },
        ],
      },
      {
        title: "PrefixInput",
        items: [
          { name: "prefix", type: "string", required: true, description: "Grey segment joined to the input, for example yuyu.idliapps.com/." },
          { name: "...rest", type: "InputHTMLAttributes<HTMLInputElement>", description: "Passed to the inner input." },
        ],
      },
      {
        title: "ReadOnlyValue",
        items: [
          { name: "value", type: "ReactNode", required: true, description: "The locked value, truncated on overflow." },
          { name: "action", type: "ReactNode", description: "Optional node on the right, for example a link to change it." },
          { name: "id", type: "string", description: "Applied to the wrapper div, so Field can label it." },
        ],
      },
    ],
    notes: [
      "Field only sets aria-describedby, aria-invalid and required on the direct child, so wrap Input, Textarea, Dropdown, Select triggers and PasswordInput directly.",
      "Error text takes priority over helper text; only one is shown.",
      "controlClasses is re-exported for custom controls that should match the inputs.",
      "Dropdown is re-exported from select.tsx; see its page.",
    ],
    related: ["input", "textarea", "password-input", "search-input", "dropdown", "select"],
  },
  {
    slug: "input",
    name: "Input",
    group: "Forms",
    source: "components/ui/field.tsx",
    description: "The single-line text input, styled with controlClasses. Plain wrapper over input; use PrefixInput when a fixed URL or unit prefix belongs to the value.",
    exports: ["Input", "PrefixInput", "ReadOnlyValue"],
    props: [
      {
        items: [
          { name: "...props", type: "InputHTMLAttributes<HTMLInputElement>", description: "Every native input attribute. Ref is forwarded." },
          { name: "className", type: "string", description: "Merged after controlClasses." },
        ],
      },
    ],
    notes: ["Input has no label or error of its own; wrap it in Field.", "aria-invalid=true switches the border to danger.", "PrefixInput and ReadOnlyValue are documented on the Field page."],
    related: ["field", "textarea", "password-input", "search-input"],
  },
  {
    slug: "textarea",
    name: "Textarea",
    group: "Forms",
    source: "components/ui/field.tsx",
    description: "Multi-line text input with the same styling as Input.",
    exports: ["Textarea"],
    props: [
      {
        items: [
          { name: "rows", type: "number", default: "4", description: "Visible rows." },
          { name: "...props", type: "TextareaHTMLAttributes<HTMLTextAreaElement>", description: "Every native textarea attribute. Ref is forwarded." },
          { name: "className", type: "string", description: "Merged after controlClasses, min-h-24 and resize-y." },
        ],
      },
    ],
    notes: ["Resizes vertically only and never shrinks below 96 px.", "Wrap in Field for the label, helper text and error."],
    related: ["field", "input"],
  },
  {
    slug: "password-input",
    name: "PasswordInput",
    group: "Forms",
    source: "components/ui/field.tsx",
    description: "A password field with a show or hide toggle inside the right edge.",
    exports: ["PasswordInput"],
    props: [
      {
        items: [
          { name: "...props", type: 'Omit<InputHTMLAttributes<HTMLInputElement>, "type">', description: "type is controlled internally. Ref is forwarded to the input." },
        ],
      },
    ],
    notes: [
      "The toggle is a button with aria-pressed and an aria-label of Show password or Hide password.",
      "Visibility is internal state; it is not exposed as a prop.",
      "Set autoComplete to current-password or new-password as appropriate.",
    ],
    related: ["field", "input"],
  },
  {
    slug: "search-input",
    name: "SearchInput",
    group: "Forms",
    source: "components/ui/field.tsx",
    description: "A pill search field with a leading icon and an optional clear button.",
    exports: ["SearchInput"],
    props: [
      {
        items: [
          { name: "value", type: "string | number | readonly string[]", description: "Used to decide whether the clear button shows. Pair with onChange for a controlled field." },
          { name: "onClear", type: "() => void", description: "When provided and the field has a value, a Clear search button appears." },
          { name: "...props", type: 'Omit<InputHTMLAttributes<HTMLInputElement>, "type">', description: "Renders type=search. Ref is forwarded." },
        ],
      },
    ],
    notes: ["Without onClear there is no clear button at all.", "Give it an aria-label or wrap it in Field with hideLabel; there is no visible label."],
    related: ["field", "input"],
  },
  {
    slug: "dropdown",
    name: "Dropdown",
    group: "Forms",
    source: "components/ui/select.tsx",
    description: "The app's replacement for a native select. Same API (option children, value, onChange(event)), rendered as the Yuyu listbox with a hidden native select behind it for form posts.",
    exports: ["Dropdown"],
    props: [
      {
        items: [
          { name: "children", type: "<option> elements", description: "Options are read from option children, including inside optgroup wrappers (groups are flattened)." },
          { name: "value / defaultValue", type: "string", description: "Controlled or uncontrolled value. Uncontrolled starts at defaultValue or the first option." },
          { name: "onChange", type: "(event: ChangeEvent<HTMLSelectElement>) => void", description: "Fires with event.target.value, like a native select." },
          { name: "name / required / form / disabled / id", type: "native attributes", description: "Applied to the hidden select; id and disabled also go to the visible trigger." },
          { name: "aria-invalid / aria-describedby / aria-label / aria-labelledby", type: "string | boolean", description: "Moved to the visible trigger. Field sets the first two." },
          { name: "className", type: "string", description: "Applied to the trigger." },
        ],
      },
    ],
    notes: [
      "A disabled option with value empty string is shown as a placeholder in muted text.",
      "Empty-string option values are supported.",
      "Option labels can be nodes, but only one line of text is shown in the trigger.",
      "For options with descriptions or groups, use Select instead.",
      "Do not use a native select anywhere in the app.",
    ],
    related: ["select", "field"],
  },
  {
    slug: "select",
    name: "Select",
    group: "Forms",
    source: "components/ui/select.tsx",
    description: "Composable Radix select parts for rich options: descriptions, groups and separators. Use Dropdown for plain option lists.",
    exports: ["Select", "SelectGroup", "SelectValue", "SelectTrigger", "SelectContent", "SelectItem", "SelectLabel", "SelectSeparator"],
    props: [
      {
        title: "Select (Radix Root)",
        items: [
          { name: "value / defaultValue", type: "string", description: "Controlled or uncontrolled selection." },
          { name: "onValueChange", type: "(value: string) => void", description: "Called with the chosen item's value." },
          { name: "disabled / name / required", type: "native", description: "Passed to Radix Select.Root." },
        ],
      },
      {
        title: "SelectTrigger",
        items: [{ name: "...props", type: "Radix Select.Trigger props", description: "Styled with controlClasses plus a chevron. Shows muted text while a SelectValue placeholder is displayed. Accepts id and aria-* from Field." }],
      },
      {
        title: "SelectContent",
        items: [{ name: "position", type: '"popper" | "item-aligned"', default: '"popper"', description: "Rendered in a portal, at least as wide as the trigger, max height 420 px." }],
      },
      {
        title: "SelectItem",
        items: [
          { name: "value", type: "string", required: true, description: "Must not be an empty string (Radix restriction)." },
          { name: "description", type: "ReactNode", description: "Caption under the item label inside the list." },
          { name: "disabled", type: "boolean", description: "Greys out the item." },
        ],
      },
      {
        title: "SelectLabel and SelectSeparator",
        items: [{ name: "children", type: "ReactNode", description: "SelectLabel takes children as an overline heading. SelectSeparator takes no props." }],
      },
    ],
    notes: [
      "SelectValue shows the selected item's text; only the item label (ItemText) is shown, not its description.",
      "Use SelectGroup with SelectLabel to group items.",
      "There is no hidden native select, so for plain forms that post FormData, prefer Dropdown.",
    ],
    related: ["dropdown", "field"],
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    group: "Forms",
    source: "components/ui/choice.tsx",
    description: "Radix checkbox in three forms: the bare box, a labelled row, and a bordered card for options with descriptions.",
    exports: ["Checkbox", "CheckboxField", "CheckboxCard"],
    props: [
      { title: "Checkbox", items: radixRoot("checkbox") },
      { title: "CheckboxField and CheckboxCard (extra props)", items: [...labelled, { name: "...props", type: "Radix Checkbox.Root props", description: "Same as Checkbox." }] },
    ],
    notes: [
      "A bare Checkbox needs its own label or aria-label.",
      "checked=\"indeterminate\" shows a minus icon.",
      "CheckboxCard is selected with a 1.5px primary border; use it for scopes or audience pickers.",
      "Disabled dims to 50% opacity.",
    ],
    related: ["radio-group", "switch"],
  },
  {
    slug: "radio-group",
    name: "RadioGroup",
    group: "Forms",
    source: "components/ui/choice.tsx",
    description: "A Radix radio group with labelled Radio rows and compact RadioCard tiles.",
    exports: ["RadioGroup", "Radio", "RadioCard"],
    props: [
      {
        title: "RadioGroup",
        items: [
          { name: "value / defaultValue", type: "string", description: "Controlled or uncontrolled selection." },
          { name: "onValueChange", type: "(value: string) => void", description: "Called with the selected value." },
          { name: "disabled / name / required", type: "native", description: "Radix Root props." },
          { name: "className", type: "string", description: "Defaults to a flex column with 10 px gap; override with a grid for RadioCard." },
        ],
      },
      {
        title: "Radio",
        items: [
          { name: "value", type: "string", required: true, description: "Value reported when selected." },
          { name: "label", type: "ReactNode", required: true, description: "Clickable label." },
          { name: "description", type: "ReactNode", description: "Muted line under the label." },
          { name: "disabled", type: "boolean", description: "Disables this option." },
          { name: "id / className", type: "string", description: "Optional." },
        ],
      },
      {
        title: "RadioCard",
        items: [
          { name: "value", type: "string", required: true, description: "Value reported when selected." },
          { name: "label", type: "ReactNode", required: true, description: "Large centred text, for example a rating." },
          { name: "description", type: "ReactNode", description: "Caption under the label." },
          { name: "disabled / className", type: "boolean / string", description: "Optional." },
        ],
      },
    ],
    notes: ["Radio and RadioCard must be inside a RadioGroup.", "Selected RadioCard uses the accent colour; Radio uses primary.", "Pass aria-label or wrap in a fieldset with a legend so the group is named."],
    related: ["checkbox", "segmented-control"],
  },
  {
    slug: "switch",
    name: "Switch",
    group: "Forms",
    source: "components/ui/choice.tsx",
    description: "A 48 by 28 toggle for settings that apply immediately, plus SwitchRow which adds the label and description.",
    exports: ["Switch", "SwitchRow"],
    props: [
      { title: "Switch", items: radixRoot("switch") },
      { title: "SwitchRow (extra props)", items: [...labelled, { name: "...props", type: "Radix Switch.Root props", description: "Same as Switch." }] },
    ],
    notes: ["A bare Switch needs an aria-label.", "SwitchRow puts the label on the left and the switch on the right; the whole label is clickable.", "Use a switch for instant effects, a checkbox for values submitted later."],
    related: ["checkbox"],
  },
  {
    slug: "segmented-control",
    name: "SegmentedControl",
    group: "Forms",
    source: "components/ui/choice.tsx",
    description: "A pill track with a raised selected segment, for switching between a few mutually exclusive views or modes.",
    exports: ["SegmentedControl"],
    props: [
      {
        items: [
          { name: "value", type: "T extends string", required: true, description: "Currently selected option value." },
          { name: "onValueChange", type: "(value: T) => void", required: true, description: "Called when another segment is chosen. Clicking the selected one does nothing." },
          { name: "options", type: "{ value: T; label: ReactNode; icon?: ReactNode; ariaLabel?: string }[]", required: true, description: "Segments. Use ariaLabel for icon-only segments." },
          { name: "ariaLabel", type: "string", required: true, description: "Names the whole group." },
          { name: "size", type: '"sm" | "md"', default: '"md"', description: "Segment heights of 32 or 36 px." },
          { name: "className", type: "string", description: "Merged onto the track." },
        ],
      },
    ],
    notes: ["Always controlled.", "Keep to two to four short options; use tabs for page-level navigation."],
    related: ["radio-group", "filter-chip"],
  },
  {
    slug: "filter-chip",
    name: "FilterChip",
    group: "Forms",
    source: "components/ui/choice.tsx",
    description: "A pill toggle button for filters. Exposes its state with aria-pressed.",
    exports: ["FilterChip"],
    props: [
      {
        items: [
          { name: "selected", type: "boolean", required: true, description: "Filled primary when true; outlined when false." },
          { name: "children", type: "ReactNode", description: "Label, optionally with a leading icon (sized to 16 px)." },
          { name: "type", type: "string", default: '"button"', description: "Defaults to button." },
          { name: "...rest", type: "ButtonHTMLAttributes<HTMLButtonElement>", description: "onClick, disabled and so on. Ref is forwarded." },
        ],
      },
    ],
    notes: ["Stateless: the parent owns selected and flips it in onClick.", "Group several chips in a flex-wrap row."],
    related: ["segmented-control", "button"],
  },
  {
    slug: "color-picker",
    name: "ColorPicker",
    group: "Forms",
    source: "components/ui/color-picker.tsx",
    description: "A custom colour popover: saturation and brightness area, hue slider, hex box, the system eyedropper where available, and a live sample of buttons and links in the chosen colour.",
    exports: ["ColorPicker"],
    props: [
      {
        items: [
          { name: "value", type: "string", required: true, description: 'Hex like "#RRGGBB", or "" to mean the default.' },
          { name: "defaultColor", type: "string", required: true, description: "Colour shown when value is empty or invalid." },
          { name: "onChange", type: "(hex: string) => void", required: true, description: "Called with a normalised hex as the user edits." },
          { name: "trigger", type: "ReactNode", required: true, description: "Element that opens the popover (wrapped in PopoverTrigger asChild), so it can sit in a row of presets." },
          { name: "label", type: "string", default: '"Custom colour"', description: "Accessible name of the popover (aria-label)." },
        ],
      },
    ],
    notes: ["Controlled only. The Use the default colour link calls onChange with an empty string, so treat \"\" as no custom colour.", "The eyedropper button appears only in browsers that provide EyeDropper (Chromium).", "Never use input type=color."],
    related: ["button"],
  },
];
export default docs;
