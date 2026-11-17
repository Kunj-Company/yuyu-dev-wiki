import { Card } from "@/components/ui/display";

export const meta = { title: "Padding and element", description: "Four paddings. Use as=\"section\" or \"article\" for landmarks.", layout: "stack" };

export default function Padding() {
  return (
    <>
      <Card padding="sm">Small padding</Card>
      <Card padding="md">Medium padding (default)</Card>
      <Card padding="lg" as="section" aria-label="Large card">Large padding, rendered as a section</Card>
      <Card padding="none">
        <div className="border-b border-line p-4">Padding none: you control the insets</div>
        <div className="p-4 text-ink-muted">Useful for lists and tables that run edge to edge.</div>
      </Card>
    </>
  );
}
