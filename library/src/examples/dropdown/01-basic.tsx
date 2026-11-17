import { Dropdown, Field } from "@/components/ui/field";

export const meta = { title: "Basic and placeholder", description: "A disabled option with an empty value acts as the placeholder.", layout: "stack" };

export default function Basic() {
  return (
    <div className="grid w-full max-w-sm gap-5">
      <Field label="Audience">
        <Dropdown defaultValue="public">
          <option value="public">Public</option>
          <option value="private">Invite only</option>
          <option value="org">Members of my organisation</option>
        </Dropdown>
      </Field>
      <Field label="Category">
        <Dropdown defaultValue="">
          <option value="" disabled>Choose a category</option>
          <option value="food">Food and drink</option>
          <option value="music">Music</option>
        </Dropdown>
      </Field>
    </div>
  );
}
