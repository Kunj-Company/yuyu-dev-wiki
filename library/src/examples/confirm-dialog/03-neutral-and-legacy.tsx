import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";

export const meta = {
  title: "Neutral action and ConfirmationDialog",
  description: "The older ConfirmationDialog wrapper with destructive={false} for an action that does not remove anything.",
};

export default function NeutralConfirm() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Send reminder email</Button>
      <ConfirmationDialog
        open={open}
        title="Send a reminder to 128 attendees?"
        message="Everyone who has not checked in will get an email now."
        confirmLabel="Send reminder"
        destructive={false}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}
