import { useState } from "react";
import { Dropdown, Field } from "@/components/ui/field";

export const meta = { title: "Controlled", description: "onChange receives a normal change event.", layout: "stack" };

export default function Controlled() {
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  return (
    <div className="w-full max-w-sm">
      <Field label="Time zone" helperText={`Selected: ${timezone}`}>
        <Dropdown value={timezone} onChange={(event) => setTimezone(event.target.value)}>
          <option value="Asia/Kolkata">India (IST)</option>
          <option value="Europe/London">London (GMT)</option>
          <option value="America/New_York">New York (ET)</option>
        </Dropdown>
      </Field>
    </div>
  );
}
