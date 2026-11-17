import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/button";

export const meta = { title: "Sizes and disabled", description: "sm is 36 px, md is 44 px." };

export default function SizesAndDisabled() {
  return (
    <>
      <IconButton label="Previous month" variant="secondary" size="sm"><ChevronLeft /></IconButton>
      <IconButton label="Next month" variant="secondary" size="sm"><ChevronRight /></IconButton>
      <IconButton label="Previous" variant="secondary"><ChevronLeft /></IconButton>
      <IconButton label="Next" variant="secondary" disabled><ChevronRight /></IconButton>
    </>
  );
}
