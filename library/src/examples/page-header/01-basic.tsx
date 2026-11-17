import { PageHeader } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "Title, description and actions", layout: "stack" };

export default function Basic() {
  return (
    <PageHeader
      title="Events"
      description="Everything your organisation is hosting, past and upcoming."
      actions={<><Button variant="secondary">Import</Button><Button variant="primary">New event</Button></>}
    />
  );
}
