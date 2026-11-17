import { useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/button";
import { Avatar, Callout, Chip, DangerZone, DateBlock, EmptyState, OrgLogo, StatTile } from "@/components/ui/display";
import { Field, Input, ReadOnlyValue } from "@/components/ui/field";
import { FilterChip, SegmentedControl } from "@/components/ui/choice";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Section, tokens } from "../lib";
import type { FoundationMeta } from "../registry";

export const meta: FoundationMeta = {
  slug: "figma-components",
  title: "Figma component map",
  description: "The 14 component families in the Figma file, their variants, and the React component and props that implement each one.",
  order: 30,
};

const FILE_URL = tokens.source.url;

type Row = { figma: string; code: string; demo?: ReactNode };
type Family = {
  react: string;
  path: string;
  /** Where the component lives, for families that are not in the gallery. */
  feature?: boolean;
  rows: Row[];
  note?: string;
};

function SegDemo() {
  const [v, setV] = useState<"a" | "b">("a");
  return (
    <SegmentedControl ariaLabel="Figma segmented control" value={v} onValueChange={setV} options={[{ value: "a", label: "Sign in" }, { value: "b", label: "Create account" }]} />
  );
}

const families: Record<string, Family> = {
  Button: {
    react: "Button",
    path: "components/ui/button.tsx",
    rows: [],
    note: "Eight Figma styles by three sizes is 24 variants. Seven styles are the variant prop; Disabled is the disabled prop on any variant. See the matrix below.",
  },
  Chip: {
    react: "Chip, FilterChip",
    path: "components/ui/display.tsx (Chip), components/ui/choice.tsx (FilterChip)",
    rows: [
      { figma: "Kind=Success", code: 'Chip tone="success"', demo: <Chip tone="success">Going</Chip> },
      { figma: "Kind=Warning", code: 'Chip tone="warning"', demo: <Chip tone="warning">Waitlist</Chip> },
      { figma: "Kind=Danger", code: 'Chip tone="danger"', demo: <Chip tone="danger">Cancelled</Chip> },
      { figma: "Kind=Accent", code: 'Chip tone="accent"', demo: <Chip tone="accent">Featured</Chip> },
      { figma: "Kind=Neutral", code: 'Chip tone="neutral" (the default)', demo: <Chip>Draft</Chip> },
      { figma: "Kind=Filter off", code: "FilterChip selected={false}", demo: <FilterChip selected={false}>This week</FilterChip> },
      { figma: "Kind=Filter on", code: "FilterChip selected", demo: <FilterChip selected>This week</FilterChip> },
    ],
    note: 'Chip also has "ink" and "outline" tones that the Figma component does not draw.',
  },
  "Date block": {
    react: "DateBlock",
    path: "components/ui/display.tsx",
    rows: [
      { figma: "State=Event", code: 'DateBlock tone="accent" (the default)', demo: <DateBlock month="MAR" day="14" /> },
      { figma: "State=Draft", code: 'DateBlock tone="draft"', demo: <DateBlock month="MAR" day="14" tone="draft" /> },
    ],
    note: 'Code also has tone="ink", a size prop (sm, md, lg), a series flag and an explicit colour prop.',
  },
  Avatar: {
    react: "Avatar, OrgLogo",
    path: "components/ui/display.tsx",
    rows: [
      { figma: "Kind=Person", code: 'Avatar tone="accent" (accent-soft tint, DESIGN.md section 3)', demo: <Avatar name="Priya Nair" tone="accent" /> },
      { figma: "Kind=User", code: 'Avatar tone="neutral" (bg-emphasis, "for users")', demo: <Avatar name="Dev Rao" /> },
      { figma: "Kind=Organisation", code: "OrgLogo (square, initials on ink)", demo: <OrgLogo name="Idli Labs" /> },
    ],
    note: "The mapping of Person and User to tones is inferred from the colours the Figma variants use and from DESIGN.md section 3. Avatar has no prop literally named after the Figma kinds.",
  },
  Field: {
    react: "Field, Input, ReadOnlyValue",
    path: "components/ui/field.tsx",
    rows: [
      {
        figma: "State=Default",
        code: "Field with helperText",
        demo: <Field label="Event name" helperText="Shown on your public page."><Input placeholder="Sunday brunch" /></Field>,
      },
      {
        figma: "State=Error",
        code: "Field error=...",
        demo: <Field label="Contact email" error="Enter a valid email address."><Input type="email" defaultValue="priya@" /></Field>,
      },
      {
        figma: "State=Read-only",
        code: "Field wrapping ReadOnlyValue",
        demo: <Field label="Account email"><ReadOnlyValue value="priya@example.com" /></Field>,
      },
    ],
    note: "The error prop also sets aria-invalid on the control.",
  },
  "Stat tile": {
    react: "StatTile",
    path: "components/ui/display.tsx",
    rows: [{ figma: "(single variant)", code: "StatTile label value hint", demo: <StatTile label="Registered" value="128" hint="12 spots left" /> }],
    note: 'Code adds tone="attention", a progress bar and an href that Figma does not draw.',
  },
  Callout: {
    react: "Callout, EmptyState, DangerZone",
    path: "components/ui/display.tsx",
    rows: [
      { figma: "Kind=Warning", code: 'Callout tone="warning"', demo: <Callout tone="warning" title="Registration closes soon">Only 4 spots are left.</Callout> },
      { figma: "Kind=Empty state", code: "EmptyState", demo: <EmptyState title="No guests yet.">Share your page to get the first sign-up.</EmptyState> },
      { figma: "Kind=Danger zone", code: "DangerZone", demo: <DangerZone title="Delete event" description="This cannot be undone." action={<Button variant="danger" size="sm">Delete</Button>} /> },
    ],
    note: 'Three Figma kinds are three code components. Callout itself also has "info", "success" and "danger" tones.',
  },
  Tab: {
    react: "Tabs, TabsList, TabsTrigger",
    path: "components/ui/tabs.tsx",
    rows: [
      {
        figma: "Selected=True / False",
        code: 'Tabs defaultValue; the active TabsTrigger has data-state="active"',
        demo: (
          <Tabs defaultValue="details">
            <TabsList aria-label="Figma tab states">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
            </TabsList>
          </Tabs>
        ),
      },
    ],
    note: "Selection is Radix state, not a prop on the trigger. TabsTrigger has an accent prop for event-themed tab rows.",
  },
  "Segmented control": {
    react: "SegmentedControl",
    path: "components/ui/choice.tsx",
    rows: [{ figma: "(single variant)", code: "SegmentedControl value onValueChange options ariaLabel", demo: <SegDemo /> }],
    note: 'Always controlled. It has size "sm" and "md".',
  },
  "Sidebar item": {
    react: "NavItem (internal to AppShell)",
    path: "components/chrome/AppShell.tsx",
    rows: [
      { figma: "Selected=True", code: "NavItem active (sets aria-current=\"page\")" },
      { figma: "Selected=False", code: "NavItem active={false}" },
    ],
    note: "NavItem is a function inside AppShell.tsx and is not exported, so it cannot be rendered on its own. Open the AppShell page to see the real sidebar.",
  },
  "Event row": {
    react: "EventRow (not exported)",
    path: "components/dashboard/home/HomeEventsPanel.tsx",
    feature: true,
    rows: [
      { figma: "Status=Published", code: "row with isDraft false: DateBlock tone=\"accent\" and a status Chip" },
      { figma: "Status=Draft", code: "row with isDraft true: dashed border, DateBlock tone=\"draft\"" },
    ],
    note: "A feature component, composed from DateBlock and Chip, used by HomeEventsPanel. Not in the gallery. The card form of an event is EventCard in components/event/EventCard.tsx.",
  },
  "Registration card": {
    react: "RegistrationCard",
    path: "components/event/RegistrationCard.tsx",
    feature: true,
    rows: [
      { figma: "State=Open", code: "no saved registration and state.open: accent Register button" },
      { figma: "State=Registered", code: "saved registration: status chip (You're in, On the waitlist, Waiting for approval) and a link button to the ticket" },
    ],
    note: "A feature component with the shadow-raised card, a progress bar and a Register dialog. Not in the gallery. It also covers closed and full states that Figma does not draw.",
  },
  Ticket: {
    react: "LiveTicketCard",
    path: "components/ticket/LiveTicket.tsx",
    feature: true,
    rows: [{ figma: "(single variant)", code: "LiveTicketCard main stub timeZone, rendered by app/ticket/[token]/page.tsx" }],
    note: "A feature component that tears the stub on check-in. It uses shadow-raised; the shadow-ticket token is used by the mock ticket in components/landing/HomePage.tsx. Not in the gallery.",
  },
  "Check-in result": {
    react: "result panel in EventCheckInClient",
    path: "components/checkin/EventCheckInClient.tsx, components/checkin/CheckInListDesk.tsx",
    feature: true,
    rows: [
      { figma: "State=Checked in", code: 'lastResult.kind "success": bg-success-solid panel with a wink DotFace' },
      { figma: "State=Waitlist", code: "CheckInListDesk result with needsForce: border-2 border-warning-solid on bg-warning-bg" },
      { figma: "State=Invalid", code: "CheckInListDesk result without needsForce: bg-danger-bg text-danger-fg" },
    ],
    note: 'The station panel in EventCheckInClient renders "success" and "already" (bg-emphasis) only. The refused results are in CheckInListDesk. Both are inline markup, not exported components, and not in the gallery.',
  },
};

const styles: Array<{ figma: string; variant?: ButtonVariant; disabled?: boolean }> = [
  { figma: "Primary", variant: "primary" },
  { figma: "Accent", variant: "accent" },
  { figma: "Secondary", variant: "secondary" },
  { figma: "Quiet", variant: "quiet" },
  { figma: "Danger", variant: "danger" },
  { figma: "Danger quiet", variant: "dangerQuiet" },
  { figma: "Inverse", variant: "inverse" },
  { figma: "Disabled", variant: "primary", disabled: true },
];
const sizes: Array<{ figma: string; size: ButtonSize }> = [
  { figma: "Small", size: "sm" },
  { figma: "Medium", size: "md" },
  { figma: "Large", size: "lg" },
];

const mono = "font-mono text-[12px] text-ink-secondary";

function ButtonMatrix() {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[640px] border-collapse text-left text-body-ui">
        <caption className="sr-only">Button variants: Figma style by size, rendered with the real Button component</caption>
        <thead className="bg-subtle text-label text-ink-muted">
          <tr>
            <th scope="col" className="px-3 py-2">Figma style</th>
            <th scope="col" className="px-3 py-2">Code</th>
            {sizes.map((s) => (
              <th key={s.size} scope="col" className="px-3 py-2">Size={s.figma} <span className="font-mono font-normal">size=&quot;{s.size}&quot;</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {styles.map((st) => (
            <tr key={st.figma} className="border-t border-line align-middle">
              <th scope="row" className="px-3 py-3 text-label text-ink">Style={st.figma}</th>
              <td className={`px-3 py-3 ${mono}`}>{st.disabled ? 'variant="primary" disabled' : `variant="${st.variant}"`}</td>
              {sizes.map((s) => (
                <td key={s.size} className="px-3 py-3">
                  {st.variant === "inverse" ? (
                    <span className="inline-block rounded-lg bg-inverse p-2">
                      <Button variant="inverse" size={s.size}>{st.figma}</Button>
                    </span>
                  ) : (
                    <Button variant={st.variant} size={s.size} disabled={st.disabled}>{st.figma}</Button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FamilyCard({ name, count, variants, code }: { name: string; count: number; variants: string[]; code: string | null }) {
  const f = families[name]!;
  return (
    <article className="rounded-xl border border-line bg-canvas p-4 sm:p-5" aria-labelledby={`fc-${name.replace(/\s+/g, "-")}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`fc-${name.replace(/\s+/g, "-")}`} className="text-h4">{name}</h3>
          <p className="mt-1 text-body-ui text-ink-secondary">
            Implemented by <span className="font-mono text-[13px] text-ink">{f.react}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="neutral" size="sm">{count} {count === 1 ? "variant" : "variants"}</Chip>
          {code ? (
            <a href={`#/${code}`} className="rounded-full border border-line-strong px-3 py-1 text-caption font-semibold text-ink hover:bg-subtle">
              Gallery page
            </a>
          ) : (
            <Chip tone="warning" size="sm">Feature component, not in the gallery</Chip>
          )}
        </div>
      </div>
      <p className="mt-2 break-words font-mono text-[12px] text-ink-muted">{f.path}</p>
      <p className="mt-2 text-caption text-ink-muted">
        Figma properties: {variants.length ? variants.map((v) => <code key={v} className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[12px]">{v}</code>) : "none, a single variant"}
      </p>
      {name === "Button" ? (
        <p className="mt-4 text-body-ui text-ink-secondary">See the full matrix in the next section.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-body-ui">
            <caption className="sr-only">{name}: Figma variant, code equivalent and live render</caption>
            <thead className="text-label text-ink-muted">
              <tr>
                <th scope="col" className="border-b border-line py-2 pr-3">Figma variant</th>
                <th scope="col" className="border-b border-line py-2 pr-3">Code</th>
                {f.rows.some((r) => r.demo) ? <th scope="col" className="border-b border-line py-2">Live render</th> : null}
              </tr>
            </thead>
            <tbody>
              {f.rows.map((r) => (
                <tr key={r.figma} className="align-middle">
                  <td className="border-b border-line py-3 pr-3 font-mono text-[12px] text-ink">{r.figma}</td>
                  <td className="border-b border-line py-3 pr-3 text-caption text-ink-secondary">{r.code}</td>
                  {f.rows.some((x) => x.demo) ? <td className="border-b border-line py-3"><div className="max-w-xs">{r.demo}</div></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {f.note ? <p className="mt-3 text-caption text-ink-muted">{f.note}</p> : null}
    </article>
  );
}

export default function FigmaComponents() {
  const total = tokens.components.reduce((n, c) => n + c.count, 0);
  const inGallery = tokens.components.filter((c) => c.code).length;
  return (
    <>
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-body-ui text-ink-secondary">
          <p className="text-label text-ink">{tokens.source.file}</p>
          <p>
            Pages read: {tokens.source.pages.map((p) => <span key={p} className="mr-2 rounded-full bg-muted px-2 py-0.5 text-caption">{p}</span>)}
            <span className="text-ink-muted">Read on {tokens.source.readOn}.</span>
          </p>
        </div>
        <a
          href={FILE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[15px] font-semibold text-on-primary hover:opacity-90"
        >
          Open in Figma <ExternalLink size={16} aria-hidden />
        </a>
      </div>

      <Section
        title="At a glance"
        description={`${tokens.components.length} families, ${total} Figma variants. ${inGallery} families have a gallery page; the other ${tokens.components.length - inGallery} are feature components in Yuyu's components folder.`}
      >
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left text-body-ui">
            <caption className="sr-only">The 14 Figma component families and their code</caption>
            <thead className="bg-subtle text-label text-ink-muted">
              <tr>
                <th scope="col" className="px-3 py-2">Figma component</th>
                <th scope="col" className="px-3 py-2">Variants</th>
                <th scope="col" className="px-3 py-2">Count</th>
                <th scope="col" className="px-3 py-2">React component</th>
                <th scope="col" className="px-3 py-2">Gallery</th>
              </tr>
            </thead>
            <tbody>
              {tokens.components.map((c) => (
                <tr key={c.name} className="border-t border-line align-top">
                  <th scope="row" className="px-3 py-2.5 text-label text-ink">{c.name}</th>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-ink-secondary">{c.variants.length ? c.variants.join("; ") : "single variant"}</td>
                  <td className="px-3 py-2.5">{c.count}</td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-ink">{families[c.name]?.react}</td>
                  <td className="px-3 py-2.5">
                    {c.code ? <a className="underline underline-offset-4" href={`#/${c.code}`}>{c.code}</a> : <span className="text-ink-muted">feature component</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="button-matrix" title="Button matrix" description="Every Figma style and size, rendered with the real Button. Disabled is a Figma style but a prop in code, so its row sets disabled on the primary variant.">
        <ButtonMatrix />
        <p className="mt-3 max-w-2xl text-caption text-ink-muted">
          Quiet and danger quiet are text-style buttons with tighter horizontal padding. In code, disabled also changes secondary, danger and inverse (see the Disabled example on the Button page).
        </p>
      </Section>

      <Section title="Variant mapping" description="Each Figma property value, the prop value that produces it, and a live render where the gallery component can draw it.">
        <div className="grid gap-4">
          {tokens.components.map((c) => (
            <FamilyCard key={c.name} name={c.name} count={c.count} variants={c.variants} code={c.code} />
          ))}
        </div>
      </Section>
    </>
  );
}
