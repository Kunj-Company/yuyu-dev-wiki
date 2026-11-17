import { useState } from "react";
import { Field, Textarea } from "@/components/ui/field";

export const meta = { title: "Controlled with error", description: "Validate while typing and surface the message through Field.", layout: "stack" };

export default function CounterAndError() {
  const [text, setText] = useState("");
  const max = 120;

  return (
    <div className="w-full max-w-sm">
      <Field
        label="Message to guests"
        helperText={`${text.length} of ${max}`}
        error={text.length > max ? `Remove ${text.length - max} characters.` : undefined}
      >
        <Textarea value={text} onChange={(event) => setText(event.target.value)} />
      </Field>
    </div>
  );
}
