import { Field, Textarea } from "@/components/ui/field";

export const meta = { title: "Basic and rows", description: "Four rows by default; change with rows.", layout: "stack" };

export default function Basic() {
  return (
    <div className="grid w-full max-w-sm gap-5">
      <Field label="Description" helperText="Supports plain text.">
        <Textarea placeholder="Tell guests what to expect" />
      </Field>
      <Field label="Notes" optional>
        <Textarea rows={2} />
      </Field>
    </div>
  );
}
