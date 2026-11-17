import { Button } from "@/components/ui/button";
import { useToast } from "@/components/feedback/ToastProvider";

export const meta = {
  title: "Undo action and duration",
  description: "The fourth argument sets a custom duration in ms (default 5000). Only one toast shows at a time; a new one replaces it.",
};

export default function ToastAction() {
  const { showToast } = useToast();
  return (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          showToast("Attendee removed", "info", { label: "Undo", onClick: () => showToast("Attendee restored", "success") }, 8000)
        }
      >
        Remove with undo
      </Button>
      <Button variant="secondary" onClick={() => showToast("Copied link", "success", null, 1500)}>Short toast</Button>
    </>
  );
}
