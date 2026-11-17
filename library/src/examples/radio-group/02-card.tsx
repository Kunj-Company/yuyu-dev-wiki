import { useState } from "react";
import { RadioCard, RadioGroup } from "@/components/ui/choice";

export const meta = { title: "RadioCard rating", description: "Use a grid className on the group for compact tiles. Selected tiles use the accent colour.", layout: "stack" };

export default function Card() {
  const [rating, setRating] = useState("4");

  return (
    <RadioGroup value={rating} onValueChange={setRating} aria-label="Rating" className="grid w-full max-w-sm grid-cols-5 gap-2">
      {["1", "2", "3", "4", "5"].map((value) => (
        <RadioCard key={value} value={value} label={value} />
      ))}
    </RadioGroup>
  );
}
