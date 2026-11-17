import { CalendarX } from "lucide-react";
import { EmptyState } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "With a next step", description: "Organiser-facing surfaces leave the face out and may use an icon.", layout: "stack" };

export default function WithAction() {
  return (
    <>
      <EmptyState mood="sleepy" title="No upcoming events" action={<Button variant="primary">Create an event</Button>}>
        Create your first event to start collecting registrations.
      </EmptyState>
      <EmptyState icon={<CalendarX />} title="Nothing scheduled" action={<><Button variant="secondary">Import</Button><Button variant="primary">Add session</Button></>}>
        Add sessions to build the schedule.
      </EmptyState>
      <EmptyState title="No guests match your filters" />
    </>
  );
}
