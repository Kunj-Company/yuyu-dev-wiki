import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const meta = { title: "With icons", description: "startIcon and endIcon are decorative and sized to 18 px." };

export default function WithIcons() {
  return (
    <>
      <Button variant="primary" startIcon={<Plus />}>New event</Button>
      <Button variant="secondary" endIcon={<ArrowRight />}>Continue</Button>
    </>
  );
}
