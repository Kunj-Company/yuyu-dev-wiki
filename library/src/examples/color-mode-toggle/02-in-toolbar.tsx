import { ColorModeToggle } from "@/components/chrome/ColorModeToggle";
import { Button } from "@/components/ui/button";

export const meta = {
  title: "In a toolbar",
  description: "How it sits next to other header actions, as in SiteHeader.",
};

export default function InToolbar() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
      <ColorModeToggle />
      <Button variant="secondary" size="sm">Sign in</Button>
      <Button variant="primary" size="sm">Start organising</Button>
    </div>
  );
}
