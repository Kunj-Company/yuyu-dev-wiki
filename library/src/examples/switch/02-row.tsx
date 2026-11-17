import { useState } from "react";
import { SwitchRow } from "@/components/ui/choice";

export const meta = { title: "SwitchRow", description: "Settings that take effect immediately.", layout: "stack" };

export default function Row() {
  const [required, setRequired] = useState(false);
  const [waitlist, setWaitlist] = useState(true);

  return (
    <div className="grid w-full max-w-md gap-5">
      <SwitchRow label="Required" description="Guests must answer before they can register." checked={required} onCheckedChange={setRequired} />
      <SwitchRow label="Waitlist" description="Let guests join when the event is full." checked={waitlist} onCheckedChange={setWaitlist} />
      <SwitchRow label="Public guest list" description="Managed by your plan." disabled />
    </div>
  );
}
