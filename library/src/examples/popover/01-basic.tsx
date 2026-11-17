import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/menu";

export const meta = {
  title: "Basic popover",
  description: "A small panel of rich content anchored to a trigger. Click outside or press Escape to close.",
};

export default function BasicPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Refund policy</Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <p className="text-body-ui font-semibold">Refunds</p>
        <p className="mt-1 text-body-ui text-ink-secondary">Attendees can request a refund up to 48 hours before the event starts.</p>
      </PopoverContent>
    </Popover>
  );
}
