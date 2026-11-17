import { Field, PasswordInput } from "@/components/ui/field";

export const meta = { title: "Basic", description: "The eye button toggles visibility.", layout: "stack" };

export default function Basic() {
  return (
    <div className="w-full max-w-sm">
      <Field label="Password" helperText="At least 8 characters.">
        <PasswordInput autoComplete="new-password" defaultValue="hunter2hunter2" />
      </Field>
    </div>
  );
}
