import { useState } from "react";
import { Field, Input } from "@/components/ui/field";

export const meta = { title: "Controlled with a counter", description: "Typical controlled input with a length limit in the helper text.", layout: "stack" };

export default function Controlled() {
  const [title, setTitle] = useState("Rooftop night");
  const limit = 40;

  return (
    <div className="w-full max-w-sm">
      <Field label="Title" helperText={`${title.length} of ${limit} characters`} error={title.length > limit ? "Title is too long." : undefined}>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
      </Field>
    </div>
  );
}
