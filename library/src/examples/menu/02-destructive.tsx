import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";

export const meta = {
  title: "Destructive item",
  description: "danger colours the item. Keep it last, after a separator, and confirm the action in a dialog.",
};

export default function DestructiveMenu() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="secondary" endIcon={<ChevronDown />}>Manage</Button>
      </MenuTrigger>
      <MenuContent align="start">
        <MenuItem icon={<Pencil />} onSelect={() => {}}>Rename</MenuItem>
        <MenuSeparator />
        <MenuItem danger icon={<Trash2 />} onSelect={() => {}}>Delete event</MenuItem>
      </MenuContent>
    </Menu>
  );
}
