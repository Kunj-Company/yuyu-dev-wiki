import { Button } from "@/components/ui/button";

export const meta = { title: "Variants", description: "Seven variants. Pick by importance, not by colour." };

export default function Variants() {
  return (
    <>
      <Button variant="primary">Primary</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="quiet">Quiet</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="dangerQuiet">Danger quiet</Button>
      <div className="rounded-lg bg-inverse p-3">
        <Button variant="inverse">Inverse</Button>
      </div>
    </>
  );
}
