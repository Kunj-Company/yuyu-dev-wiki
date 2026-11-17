import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuGroup, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";

export const meta = {
  title: "Groups, labels and separators",
  description: "MenuLabel names a MenuGroup; MenuSeparator divides unrelated sets.",
};

export default function GroupedMenu() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="secondary" endIcon={<ChevronDown />}>Export</Button>
      </MenuTrigger>
      <MenuContent align="start">
        <MenuGroup>
          <MenuLabel>Attendees</MenuLabel>
          <MenuItem onSelect={() => {}}>CSV</MenuItem>
          <MenuItem onSelect={() => {}}>Excel</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuLabel>Orders</MenuLabel>
          <MenuItem onSelect={() => {}}>CSV</MenuItem>
          <MenuItem onSelect={() => {}}>PDF summary</MenuItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}
