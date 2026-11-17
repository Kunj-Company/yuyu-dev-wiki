import { Field, Input } from "@/components/ui/field";

export const meta = { title: "Label, helper text and error", description: "Field wires the id, aria-describedby and aria-invalid for you.", layout: "stack" };

export default function States() {
  return (
    <div className="grid w-full max-w-sm gap-5">
      <Field label="Event name" helperText="Shown on your public page.">
        <Input placeholder="Sunday brunch" />
      </Field>
      <Field label="Contact email" error="Enter a valid email address.">
        <Input type="email" defaultValue="priya@" />
      </Field>
      <Field label="Website" optional>
        <Input placeholder="https://" />
      </Field>
      <Field label="Search" hideLabel>
        <Input placeholder="Label is visually hidden" />
      </Field>
    </div>
  );
}
