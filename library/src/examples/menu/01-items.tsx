import { Copy, MoreHorizontal, Pencil, Share2 } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";

export const meta = {
  title: "Items with icons and descriptions",
  description: "The trigger is an IconButton with a label. Arrow keys move, Enter or Space selects, Escape closes.",
};

export default function MenuItems() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton label="Event actions" variant="secondary">
          <MoreHorizontal />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={<Pencil />} onSelect={() => {}}>Edit event</MenuItem>
        <MenuItem icon={<Copy />} description="Copies the settings, not the orders" onSelect={() => {}}>Duplicate</MenuItem>
        <MenuItem icon={<Share2 />} onSelect={() => {}}>Share link</MenuItem>
        <MenuItem disabled>Archive (unavailable)</MenuItem>
      </MenuContent>
    </Menu>
  );
}
