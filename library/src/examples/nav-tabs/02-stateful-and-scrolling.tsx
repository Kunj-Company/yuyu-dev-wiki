import { useState } from "react";
import { NavTabs } from "@/components/ui/tabs";

export const meta = {
  title: "Derived active state, many items",
  description: "In the app, compute active from usePathname(). Here local state stands in, and the row scrolls on narrow widths.",
  layout: "stack" as const,
};

const PAGES = ["Overview", "Tickets", "Orders", "Attendees", "Check-in", "Badges", "Emails", "Reports", "Settings"];

export default function StatefulNavTabs() {
  const [current, setCurrent] = useState("Overview");
  return (
    <div className="max-w-md" onClickCapture={(event) => {
      const link = (event.target as HTMLElement).closest("a");
      if (link) {
        event.preventDefault();
        setCurrent(link.textContent ?? "Overview");
      }
    }}>
      <NavTabs
        label="Event admin"
        items={PAGES.map((p) => ({ href: `/events/42/${p.toLowerCase()}`, label: p, active: p === current }))}
      />
    </div>
  );
}
