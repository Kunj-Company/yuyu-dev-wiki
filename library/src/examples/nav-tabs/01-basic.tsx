import { NavTabs } from "@/components/ui/tabs";

export const meta = {
  title: "Route tabs",
  description: "Real links with aria-current=\"page\" on the active one. In this gallery next/link is shimmed, so clicking does not navigate.",
  layout: "stack" as const,
};

export default function BasicNavTabs() {
  return (
    <NavTabs
      label="Event sections"
      items={[
        { href: "/events/42", label: "Overview", active: true },
        { href: "/events/42/tickets", label: "Tickets", active: false },
        { href: "/events/42/orders", label: "Orders", active: false },
      ]}
    />
  );
}
