import { useState } from "react";
import { CalendarDays, List, Map } from "lucide-react";
import { SegmentedControl } from "@/components/ui/choice";

export const meta = { title: "With icons", description: "Icon-only segments need an ariaLabel each." };

export default function Icons() {
  const [view, setView] = useState("list");

  return (
    <>
      <SegmentedControl
        ariaLabel="View"
        value={view}
        onValueChange={setView}
        options={[
          { value: "list", label: "List", icon: <List className="size-4" /> },
          { value: "calendar", label: "Calendar", icon: <CalendarDays className="size-4" /> },
        ]}
      />
      <SegmentedControl
        ariaLabel="View, icons only"
        value={view}
        onValueChange={setView}
        options={[
          { value: "list", label: null, icon: <List className="size-4" />, ariaLabel: "List" },
          { value: "calendar", label: null, icon: <CalendarDays className="size-4" />, ariaLabel: "Calendar" },
          { value: "map", label: null, icon: <Map className="size-4" />, ariaLabel: "Map" },
        ]}
      />
    </>
  );
}
