import { StatTile } from "@/components/ui/display";

export const meta = { title: "Progress, attention and link", description: "attention is for numbers that mean someone has to act.", layout: "stack" };

export default function ProgressAttention() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatTile label="Capacity" value="38 / 50" progress={{ value: 38, max: 50 }} />
      <StatTile label="Outlier scores" value="4" tone="attention" hint="Far from the other judges" />
      <StatTile label="Pending approvals" value="7" href="#approvals" hint="Open the queue" progress={{ value: 7, max: 20, tone: "warning" }} />
    </div>
  );
}
