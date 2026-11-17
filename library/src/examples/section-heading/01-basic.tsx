import { SectionHeading } from "@/components/ui/display";

export const meta = { title: "Heading with description", layout: "stack" };

export default function Basic() {
  return (
    <>
      <SectionHeading title="Upcoming" />
      <SectionHeading title="Team" description="People who can edit this event." />
    </>
  );
}
