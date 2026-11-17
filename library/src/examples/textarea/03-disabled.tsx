import { Textarea } from "@/components/ui/field";

export const meta = { title: "Disabled", layout: "stack" };

export default function Disabled() {
  return (
    <div className="w-full max-w-sm">
      <Textarea disabled defaultValue="This text can't be edited." aria-label="Locked notes" />
    </div>
  );
}
