import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";

export const meta = {
  title: "Type to confirm",
  description: "confirmText locks the confirm button until the exact value is typed.",
};

export default function TypeToConfirm() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete organisation</Button>
      <ConfirmDialog
        open={open}
        title="Delete Harbour Events?"
        message="This removes every event, order and attendee. It cannot be undone."
        confirmLabel="Delete organisation"
        confirmText="Harbour Events"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}
