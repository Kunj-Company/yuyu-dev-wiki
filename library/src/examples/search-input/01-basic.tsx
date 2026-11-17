import { useState } from "react";
import { SearchInput } from "@/components/ui/field";

export const meta = { title: "With clear button", description: "The clear button appears when onClear is passed and the field has a value.", layout: "stack" };

export default function Basic() {
  const [query, setQuery] = useState("brunch");

  return (
    <div className="w-full max-w-sm">
      <SearchInput
        aria-label="Search events"
        placeholder="Search events"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
      />
    </div>
  );
}
