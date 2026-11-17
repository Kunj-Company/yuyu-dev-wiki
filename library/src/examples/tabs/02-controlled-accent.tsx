import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const meta = {
  title: "Controlled with accent underline",
  description: "Use value and onValueChange to sync with state or the URL. accent switches the active underline to the accent colour.",
  layout: "stack" as const,
};

export default function ControlledTabs() {
  const [tab, setTab] = useState("upcoming");
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList aria-label="Events">
        <TabsTrigger value="upcoming" accent>Upcoming</TabsTrigger>
        <TabsTrigger value="past" accent>Past</TabsTrigger>
        <TabsTrigger value="drafts" accent>Drafts</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">3 upcoming events.</TabsContent>
      <TabsContent value="past">12 past events.</TabsContent>
      <TabsContent value="drafts">1 draft.</TabsContent>
    </Tabs>
  );
}
