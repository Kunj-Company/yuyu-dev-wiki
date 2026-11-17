import { Callout } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "With an action and a live role", description: "Use role=\"alert\" for errors raised by an action, role=\"status\" for passive updates.", layout: "stack" };

export default function ActionsRoles() {
  return (
    <>
      <Callout tone="warning" title="Your event is a draft" action={<Button size="sm" variant="primary">Publish</Button>}>
        Nobody can see it until you publish.
      </Callout>
      <Callout tone="danger" role="alert">Could not send invites. Try again in a moment.</Callout>
      <Callout tone="info" role="status">Syncing with your calendar…</Callout>
    </>
  );
}
