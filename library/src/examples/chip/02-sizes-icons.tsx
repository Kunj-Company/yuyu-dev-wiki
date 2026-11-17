import { CheckCircle2, Clock } from "lucide-react";
import { Chip } from "@/components/ui/display";

export const meta = { title: "Sizes and icons", description: "Use sm in dense rows. Icons are decorative and sized for you." };

export default function SizesAndIcons() {
  return (
    <>
      <Chip size="sm" tone="success">Checked in</Chip>
      <Chip size="md" tone="success">Checked in</Chip>
      <Chip tone="success" icon={<CheckCircle2 />}>Confirmed</Chip>
      <Chip tone="warning" icon={<Clock />}>Pending review</Chip>
    </>
  );
}
