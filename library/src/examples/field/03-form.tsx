import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropdown, Field, Input, Textarea } from "@/components/ui/field";

export const meta = { title: "A small form", description: "Required fields, a dropdown, a textarea and a submit button.", layout: "stack" };

export default function Form() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && !name.trim() ? "Give the event a name." : undefined;

  return (
    <form
      className="grid w-full max-w-sm gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field label="Event name" required error={error}>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Audience">
        <Dropdown defaultValue="public">
          <option value="public">Public</option>
          <option value="private">Invite only</option>
        </Dropdown>
      </Field>
      <Field label="Description" optional>
        <Textarea rows={3} />
      </Field>
      <Button type="submit" variant="primary">Create event</Button>
    </form>
  );
}
