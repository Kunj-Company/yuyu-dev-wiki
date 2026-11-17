import { useState } from "react";
import { Accordion, AccordionItem } from "@/components/ui/tabs";

export const meta = {
  title: "Multiple, controlled",
  description: "type=\"multiple\" lets several panels stay open; value is an array.",
  layout: "stack" as const,
};

export default function MultipleAccordion() {
  const [open, setOpen] = useState<string[]>(["a"]);
  return (
    <div className="max-w-xl">
      <Accordion type="multiple" value={open} onValueChange={setOpen}>
        <AccordionItem value="a" title="Before the event">Check your email for the QR code.</AccordionItem>
        <AccordionItem value="b" title="At the door">Show the code at the scanner.</AccordionItem>
        <AccordionItem value="c" title="After the event">A receipt stays in your account.</AccordionItem>
      </Accordion>
      <p className="mt-3 text-caption text-ink-muted">{open.length} open</p>
    </div>
  );
}
