import { ProgressBar } from "@/components/ui/display";

export const meta = { title: "Tones", layout: "stack" };

export default function Tones() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ProgressBar value={60} max={100} label="Accent" />
      <ProgressBar value={45} max={100} tone="ink" label="Ink" />
      <ProgressBar value={80} max={100} tone="success" label="Success" />
      <ProgressBar value={92} max={100} tone="warning" label="Warning" />
    </div>
  );
}
