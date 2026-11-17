import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/feedback/ToastProvider";

export const meta = {
  title: "Form dialog with footer actions",
  description: "Cancel sits first in the DOM order on desktop and last on mobile; the primary action closes the dialog after saving.",
};

export default function FormDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { showToast } = useToast();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">Invite a teammate</Button>
      </DialogTrigger>
      <DialogContent size="md">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            showToast(`Invite sent to ${name}`, "success");
            setName("");
          }}
        >
          <DialogHeader title="Invite a teammate" description="They will get an email with a link to join your organisation." />
          <DialogBody>
            <Field label="Email address">
              <Input type="email" value={name} onChange={(event) => setName(event.target.value)} placeholder="sam@example.com" required />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="primary">Send invite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
