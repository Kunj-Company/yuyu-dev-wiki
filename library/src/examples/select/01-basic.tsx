import { Field } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const meta = { title: "Items with descriptions", description: "Use Select when each option needs a second line.", layout: "stack" };

export default function Basic() {
  return (
    <div className="w-full max-w-sm">
      <Field label="Who can register?">
        <Select defaultValue="public">
          <SelectTrigger>
            <SelectValue placeholder="Choose an audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public" description="Anyone with the link">Public</SelectItem>
            <SelectItem value="members" description="Only people in your organisation">Members</SelectItem>
            <SelectItem value="invite" description="Guests you invite by email">Invite only</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
