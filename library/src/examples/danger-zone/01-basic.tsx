import { DangerZone } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "Basic", description: "Say what happens and whether it can be undone.", layout: "stack" };

export default function Basic() {
  return (
    <DangerZone
      title="Delete this event"
      description="Registrations and the event page are removed permanently. This cannot be undone."
      action={<Button variant="danger">Delete event</Button>}
    />
  );
}
