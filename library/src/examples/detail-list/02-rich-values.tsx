import { DetailList, Chip } from "@/components/ui/display";

export const meta = { title: "Rich values", description: "Values can be any node: chips, links, muted text.", layout: "stack" };

export default function RichValues() {
  return (
    <DetailList
      items={[
        { label: "Status", value: <Chip tone="success" size="sm">Confirmed</Chip> },
        { label: "Email", value: <a className="text-accent-text underline" href="mailto:ada@example.com">ada@example.com</a> },
        { label: "Dietary", value: <span className="text-ink-muted">Not provided</span> },
      ]}
    />
  );
}
