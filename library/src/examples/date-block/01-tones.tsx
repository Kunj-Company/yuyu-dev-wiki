import { DateBlock } from "@/components/ui/display";

export const meta = { title: "Tones and sizes", description: "Accent for published, draft grey for unpublished, ink otherwise." };

export default function Tones() {
  return (
    <>
      <DateBlock month="JUN" day="14" />
      <DateBlock month="JUN" day="14" tone="draft" />
      <DateBlock month="JUN" day="14" tone="ink" />
      <DateBlock month="JUN" day="14" size="sm" />
      <DateBlock month="JUN" day="14" size="lg" />
    </>
  );
}
