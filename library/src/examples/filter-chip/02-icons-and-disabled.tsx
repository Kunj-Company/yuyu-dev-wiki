import { MapPin, Music } from "lucide-react";
import { FilterChip } from "@/components/ui/choice";

export const meta = { title: "Icons and disabled", description: "Icons are sized to 16 px. Disabled uses the native attribute." };

export default function IconsAndDisabled() {
  return (
    <>
      <FilterChip selected><Music />Music</FilterChip>
      <FilterChip selected={false}><MapPin />Nearby</FilterChip>
      <FilterChip selected={false} disabled>Sold out</FilterChip>
    </>
  );
}
