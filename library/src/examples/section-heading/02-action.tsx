import { SectionHeading } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "With an action and h3 level", layout: "stack" };

export default function WithAction() {
  return (
    <>
      <SectionHeading title="Recent events" action={<Button size="sm" variant="quiet">View all</Button>} />
      <SectionHeading as="h3" title="Speakers" description="Shown on the schedule." action={<Button size="sm" variant="secondary">Add speaker</Button>} />
    </>
  );
}
