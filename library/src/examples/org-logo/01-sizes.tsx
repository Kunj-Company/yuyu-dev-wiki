import { OrgLogo } from "@/components/ui/display";

export const meta = { title: "Sizes with initials fallback", description: "Without an image the logo shows initials on ink." };

export default function Sizes() {
  return (
    <>
      <OrgLogo name="Hack Club" size="sm" />
      <OrgLogo name="Hack Club" size="md" />
      <OrgLogo name="Hack Club" size="lg" />
      <OrgLogo name="Hack Club" size="xl" />
    </>
  );
}
