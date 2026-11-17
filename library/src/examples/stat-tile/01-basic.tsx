import { StatTile } from "@/components/ui/display";

export const meta = { title: "Stat tiles", description: "A label, a big number and an optional hint.", layout: "stack" };

export default function Basic() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatTile label="Registered" value="128" hint="12 this week" />
      <StatTile label="Checked in" value="87" hint="68% of registered" />
      <StatTile label="Waitlist" value="9" />
    </div>
  );
}
