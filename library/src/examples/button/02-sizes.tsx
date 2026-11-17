import { Button } from "@/components/ui/button";

export const meta = { title: "Sizes", description: "Minimum heights of 36, 44 and 52 px." };

export default function Sizes() {
  return (
    <>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="primary" size="lg">Large</Button>
    </>
  );
}
