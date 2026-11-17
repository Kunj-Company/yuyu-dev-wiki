import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const meta = {
  title: "Many tabs scrolling",
  description: "The row scrolls sideways, fades an arrow on each hidden side, and keeps the active tab in view. Narrow the window to see it.",
  layout: "stack" as const,
};

const SECTIONS = ["Overview", "Tickets", "Orders", "Attendees", "Check-in", "Badges", "Emails", "Promo codes", "Reports", "Settings"];

export default function ManyTabs() {
  const [tab, setTab] = useState("Settings");
  return (
    <div className="max-w-sm">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Event admin">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((s) => (
          <TabsContent key={s} value={s}>{s} panel</TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
