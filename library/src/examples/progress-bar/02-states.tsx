import { ProgressBar } from "@/components/ui/display";

export const meta = { title: "Edges and capacity", description: "Values clamp to 0 and max. A max of 0 renders empty.", layout: "stack" };

export default function States() {
  const going = 38;
  const capacity = 50;
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div>
        <p className="mb-1.5 text-body-ui text-ink-secondary">{going} of {capacity} spots taken</p>
        <ProgressBar value={going} max={capacity} label="Spots taken" />
      </div>
      <div>
        <p className="mb-1.5 text-body-ui text-ink-secondary">Empty</p>
        <ProgressBar value={0} max={100} label="Empty" />
      </div>
      <div>
        <p className="mb-1.5 text-body-ui text-ink-secondary">Over capacity (clamped to full)</p>
        <ProgressBar value={120} max={100} tone="warning" label="Over capacity" />
      </div>
    </div>
  );
}
