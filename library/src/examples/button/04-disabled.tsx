import { Button } from "@/components/ui/button";

export const meta = { title: "Disabled", description: "Disabled filled buttons stay readable with a grey background." };

export default function Disabled() {
  return (
    <>
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="accent" disabled>Accent</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="danger" disabled>Danger</Button>
      <Button variant="quiet" disabled>Quiet</Button>
    </>
  );
}
