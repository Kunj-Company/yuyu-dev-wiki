import { Card, CardHeader } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "Card with header", description: "CardHeader gives a title, helper text and actions.", layout: "stack" };

export default function Basic() {
  return (
    <Card>
      <CardHeader
        title="Event details"
        description="Shown on the public event page."
        action={<Button size="sm" variant="secondary">Edit</Button>}
      />
      <p className="text-body-ui text-ink-secondary">Hack Night, every first Thursday at the community hall.</p>
    </Card>
  );
}
