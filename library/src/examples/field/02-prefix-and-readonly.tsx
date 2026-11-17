import { Field, PrefixInput, ReadOnlyValue } from "@/components/ui/field";

export const meta = { title: "PrefixInput and ReadOnlyValue", description: "A fixed URL prefix, and a locked value with an optional action.", layout: "stack" };

export default function PrefixAndReadOnly() {
  return (
    <div className="grid w-full max-w-sm gap-5">
      <Field label="Page address" helperText="Letters, numbers and dashes.">
        <PrefixInput prefix="yuyu.idliapps.com/" defaultValue="sunday-brunch" />
      </Field>
      <Field label="Account email">
        <ReadOnlyValue value="priya@example.com" action={<a className="text-sm font-semibold underline" href="#change">Change</a>} />
      </Field>
    </div>
  );
}
