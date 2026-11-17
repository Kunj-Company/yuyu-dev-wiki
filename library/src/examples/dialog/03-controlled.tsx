import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";

export const meta = {
  title: "Controlled, sizes and no close button",
  description: "Open it from state, pick a size, and use hideClose when the footer already offers the only ways out.",
};

export default function ControlledDialog() {
  const [size, setSize] = useState<"sm" | "md" | "lg" | null>(null);
  return (
    <>
      {(["sm", "md", "lg"] as const).map((s) => (
        <Button key={s} variant="secondary" onClick={() => setSize(s)}>
          Open {s}
        </Button>
      ))}
      <Dialog open={size !== null} onOpenChange={(open) => !open && setSize(null)}>
        <DialogContent size={size ?? "sm"} hideClose>
          <DialogHeader title={`Size ${size}`} description="max-width of 480, 640 or 860 px, never wider than the viewport minus 32 px." />
          <DialogBody>
            <p className="text-body text-ink-secondary">Content scrolls inside the body when the dialog is taller than the screen.</p>
          </DialogBody>
          <DialogFooter>
            <Button variant="primary" onClick={() => setSize(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
