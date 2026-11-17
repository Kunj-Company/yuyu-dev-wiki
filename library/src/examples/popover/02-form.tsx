import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/menu";

export const meta = {
  title: "Controlled with a form",
  description: "Control open to close the popover after the action; focus moves into the content on open.",
};

export default function PopoverForm() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary">Add promo code</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            setCode("");
          }}
        >
          <Field label="Promo code">
            <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="EARLYBIRD" />
          </Field>
          <Button type="submit" variant="primary" size="sm" disabled={!code}>Apply</Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
