import { DangerZone } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "Stacked zones", description: "Children render under the header row.", layout: "stack" };

export default function WithChildren() {
  return (
    <>
      <DangerZone
        title="Transfer ownership"
        description="Hand the organisation to another admin."
        action={<Button variant="dangerQuiet">Transfer</Button>}
      />
      <DangerZone title="Delete organisation" description="Removes all events, members and data.">
        <p className="mt-3 text-caption text-ink-muted">You must delete or transfer every event first.</p>
        <div className="mt-3">
          <Button variant="danger" disabled>Delete organisation</Button>
        </div>
      </DangerZone>
    </>
  );
}
