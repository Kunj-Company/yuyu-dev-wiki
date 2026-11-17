import { Button } from "@/components/ui/button";
import { useToast } from "@/components/feedback/ToastProvider";

export const meta = {
  title: "Every tone",
  description: "Success, info and warning are announced politely; error is announced assertively.",
};

export default function ToastTones() {
  const { showToast } = useToast();
  return (
    <>
      <Button variant="secondary" onClick={() => showToast("Event published", "success")}>Success</Button>
      <Button variant="secondary" onClick={() => showToast("Tickets go on sale at 9:00 am", "info")}>Info</Button>
      <Button variant="secondary" onClick={() => showToast("Only 5 tickets left", "warning")}>Warning</Button>
      <Button variant="secondary" onClick={() => showToast("Could not save changes. Try again.", "error")}>Error</Button>
    </>
  );
}
