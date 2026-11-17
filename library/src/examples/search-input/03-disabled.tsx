import { SearchInput } from "@/components/ui/field";

export const meta = { title: "Disabled", layout: "stack" };

export default function Disabled() {
  return (
    <div className="w-full max-w-sm">
      <SearchInput aria-label="Search" placeholder="Search is unavailable" disabled />
    </div>
  );
}
