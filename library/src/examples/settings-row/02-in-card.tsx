import { Card, CardHeader, SettingsRow } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "Inside a card", description: "The last row drops its bottom border.", layout: "stack" };

export default function InCard() {
  return (
    <Card>
      <CardHeader title="Notifications" />
      <SettingsRow title="Email digest" description="A weekly summary of registrations.">
        <Button variant="secondary" size="sm">Turn on</Button>
      </SettingsRow>
      <SettingsRow title="Webhooks">
        <p className="text-body-ui text-ink-muted">No webhooks configured.</p>
      </SettingsRow>
    </Card>
  );
}
