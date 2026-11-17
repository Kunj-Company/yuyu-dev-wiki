import { Checkbox } from "@/components/ui/choice";

export const meta = { title: "Bare checkbox", description: "States: unchecked, checked, indeterminate, disabled. Always give a bare box an aria-label." };

export default function Bare() {
  return (
    <>
      <Checkbox aria-label="Unchecked" />
      <Checkbox aria-label="Checked" defaultChecked />
      <Checkbox aria-label="Indeterminate" checked="indeterminate" />
      <Checkbox aria-label="Disabled" disabled />
      <Checkbox aria-label="Disabled and checked" disabled defaultChecked />
    </>
  );
}
