import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";

export const meta = {
  title: "Basic dialog",
  description: "Trigger, header, body and a footer. Escape, the close button and the overlay all dismiss it.",
};

export default function BasicDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">View event details</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader title="Riverside Night Market" description="Saturday 14 June, 6:00 pm" />
        <DialogBody>
          <p className="text-body text-ink-secondary">Doors open at 5:30 pm. Bring your ticket QR code on your phone or printed.</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary">Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
