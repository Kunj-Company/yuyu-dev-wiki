import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/feedback/ToastProvider";

export const meta = {
  title: "Destructive confirmation",
  description: "Danger button by default. The dialog stays open and locked while loading.",
};

export default function DestructiveConfirm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  return (
    <>
      <Button variant="dangerQuiet" onClick={() => setOpen(true)}>Delete ticket type</Button>
      <ConfirmDialog
        open={open}
        title="Delete this ticket type?"
        message="Existing orders keep their tickets. Nobody can buy this type again."
        confirmLabel="Delete ticket type"
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setLoading(true);
          window.setTimeout(() => {
            setLoading(false);
            setOpen(false);
            showToast("Ticket type deleted", "success");
          }, 900);
        }}
      />
    </>
  );
}
