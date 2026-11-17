import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const meta = {
  title: "Basic tabs",
  description: "Uncontrolled with defaultValue. Left and right arrow keys move between tabs.",
  layout: "stack" as const,
};

export default function BasicTabs() {
  return (
    <Tabs defaultValue="details">
      <TabsList aria-label="Event sections">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
      </TabsList>
      <TabsContent value="details">Name, date, venue and description.</TabsContent>
      <TabsContent value="tickets">Ticket types and capacity.</TabsContent>
      <TabsContent value="orders">Everyone who has bought a ticket.</TabsContent>
    </Tabs>
  );
}
