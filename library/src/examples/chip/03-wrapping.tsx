import { Chip } from "@/components/ui/display";

export const meta = { title: "Truncate or wrap", description: "Long labels truncate by default. Pass wrap when every word matters.", layout: "stack" };

export default function Wrapping() {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="w-48">
        <Chip tone="accent">Best use of a slightly cursed API</Chip>
      </div>
      <div className="w-48">
        <Chip tone="accent" wrap>Best use of a slightly cursed API</Chip>
      </div>
    </div>
  );
}
