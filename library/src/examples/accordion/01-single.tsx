import { Accordion, AccordionItem } from "@/components/ui/tabs";

export const meta = {
  title: "Single, collapsible",
  description: "One panel open at a time, and the open one can be closed again.",
  layout: "stack" as const,
};

export default function SingleAccordion() {
  return (
    <Accordion type="single" collapsible defaultValue="refunds" className="max-w-xl">
      <AccordionItem value="refunds" title="Can I get a refund?">Yes, until 48 hours before the event starts.</AccordionItem>
      <AccordionItem value="transfer" title="Can I transfer my ticket?">Open your order and choose Transfer ticket.</AccordionItem>
      <AccordionItem value="kids" title="Do children need a ticket?">Children under 5 go free.</AccordionItem>
    </Accordion>
  );
}
