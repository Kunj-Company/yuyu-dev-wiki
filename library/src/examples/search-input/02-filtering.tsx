import { useState } from "react";
import { SearchInput } from "@/components/ui/field";

const events = ["Sunday brunch", "Rooftop night", "Pottery workshop", "Trivia Tuesday"];

export const meta = { title: "Filtering a list", layout: "stack" };

export default function Filtering() {
  const [query, setQuery] = useState("");
  const matches = events.filter((name) => name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="grid w-full max-w-sm gap-3">
      <SearchInput aria-label="Search events" placeholder="Search events" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery("")} />
      <ul className="text-body-ui text-ink">
        {matches.length ? matches.map((name) => <li key={name}>{name}</li>) : <li className="text-ink-muted">No events found.</li>}
      </ul>
    </div>
  );
}
