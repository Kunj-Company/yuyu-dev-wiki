import { Field } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const meta = { title: "Error and disabled", layout: "stack" };

export default function States() {
  return (
    <div className="grid w-full max-w-sm gap-5">
      <Field label="Venue" error="Pick a venue before publishing.">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose a venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hall">Town hall</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Organiser">
        <Select disabled defaultValue="me">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="me">Me</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
