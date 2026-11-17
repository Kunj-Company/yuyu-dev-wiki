import { RadioCard, RadioGroup } from "@/components/ui/choice";

export const meta = { title: "RadioCard with captions", layout: "stack" };

export default function CardDescriptions() {
  return (
    <RadioGroup defaultValue="monthly" aria-label="Billing" className="grid w-full max-w-sm grid-cols-2 gap-3">
      <RadioCard value="monthly" label="Monthly" description="₹499 / month" />
      <RadioCard value="yearly" label="Yearly" description="₹4,990 / year" />
    </RadioGroup>
  );
}
