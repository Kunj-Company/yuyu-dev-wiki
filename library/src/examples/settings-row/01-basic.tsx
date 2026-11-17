import { SettingsRow } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "Rows", description: "Label column on the left, controls on the right. Stacks on mobile.", layout: "stack" };

export default function Basic() {
  return (
    <div>
      <SettingsRow title="Event name" description="Shown on the public page and in emails.">
        <input defaultValue="Hack Night" className="h-11 w-full max-w-sm rounded-lg border border-line-strong bg-canvas px-3 text-body-ui" aria-label="Event name" />
      </SettingsRow>
      <SettingsRow title="Visibility" description="Control who can find this event.">
        <p className="text-body-ui text-ink-secondary">Public. Anyone with the link can register.</p>
      </SettingsRow>
      <SettingsRow title="Save">
        <Button variant="primary">Save changes</Button>
      </SettingsRow>
    </div>
  );
}
