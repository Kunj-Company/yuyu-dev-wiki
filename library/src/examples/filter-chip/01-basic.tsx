import { useState } from "react";
import { FilterChip } from "@/components/ui/choice";

export const meta = { title: "Multi-select filters", description: "FilterChip is stateless; the parent flips selected." };

export default function Basic() {
  const [active, setActive] = useState<string[]>(["Free"]);
  const toggle = (name: string) => setActive(active.includes(name) ? active.filter((item) => item !== name) : [...active, name]);

  return (
    <>
      {["Free", "This weekend", "Online", "Near me"].map((name) => (
        <FilterChip key={name} selected={active.includes(name)} onClick={() => toggle(name)}>
          {name}
        </FilterChip>
      ))}
    </>
  );
}
