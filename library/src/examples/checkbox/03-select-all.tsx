import { useState } from "react";
import { Checkbox, CheckboxField } from "@/components/ui/choice";

const options = ["Photos", "Guest list", "Receipts"];

export const meta = { title: "Select all with indeterminate", layout: "stack" };

export default function SelectAll() {
  const [selected, setSelected] = useState<string[]>(["Photos"]);
  const all = selected.length === options.length;

  return (
    <div className="grid w-full max-w-sm gap-3">
      <div className="flex items-center gap-3 text-label text-ink">
        <Checkbox
          id="all"
          checked={all ? true : selected.length ? "indeterminate" : false}
          onCheckedChange={(value) => setSelected(value === true ? options : [])}
        />
        <label htmlFor="all">Include in export</label>
      </div>
      <div className="grid gap-3 pl-8">
        {options.map((name) => (
          <CheckboxField
            key={name}
            label={name}
            checked={selected.includes(name)}
            onCheckedChange={(value) => setSelected(value === true ? [...selected, name] : selected.filter((item) => item !== name))}
          />
        ))}
      </div>
    </div>
  );
}
