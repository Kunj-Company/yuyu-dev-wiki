import { Dropdown, Field } from "@/components/ui/field";

export const meta = { title: "Error, disabled option and disabled", layout: "stack" };

export default function ErrorAndDisabled() {
  return (
    <div className="grid w-full max-w-sm gap-5">
      <Field label="Ticket type" error="Choose a ticket type.">
        <Dropdown defaultValue="">
          <option value="" disabled>Choose one</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="vip" disabled>VIP (sold out)</option>
        </Dropdown>
      </Field>
      <Field label="Currency">
        <Dropdown defaultValue="inr" disabled>
          <option value="inr">INR</option>
        </Dropdown>
      </Field>
    </div>
  );
}
