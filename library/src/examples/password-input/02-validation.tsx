import { useState } from "react";
import { Field, PasswordInput } from "@/components/ui/field";

export const meta = { title: "With validation", description: "Error text replaces the helper text once the value is too short.", layout: "stack" };

export default function Validation() {
  const [value, setValue] = useState("abc");

  return (
    <div className="w-full max-w-sm">
      <Field label="New password" error={value.length < 8 ? "Use at least 8 characters." : undefined}>
        <PasswordInput autoComplete="new-password" value={value} onChange={(event) => setValue(event.target.value)} />
      </Field>
    </div>
  );
}
