import { useState } from "react";
import { CheckboxField } from "@/components/ui/choice";

export const meta = { title: "CheckboxField", description: "Label and optional description; the whole row is clickable.", layout: "stack" };

export default function Field() {
  const [reminders, setReminders] = useState(true);

  return (
    <div className="grid w-full max-w-sm gap-4">
      <CheckboxField label="Email me reminders" description="One day before each event you registered for." checked={reminders} onCheckedChange={(value) => setReminders(value === true)} />
      <CheckboxField label="Share my name with the host" />
      <CheckboxField label="Accept the terms" disabled />
    </div>
  );
}
