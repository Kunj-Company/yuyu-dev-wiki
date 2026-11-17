import { useState } from "react";
import { Switch } from "@/components/ui/choice";

export const meta = { title: "Bare switch", description: "Always give a bare switch an aria-label." };

export default function Bare() {
  const [on, setOn] = useState(true);

  return (
    <>
      <Switch aria-label="Notifications" checked={on} onCheckedChange={setOn} />
      <Switch aria-label="Off" />
      <Switch aria-label="Disabled on" disabled defaultChecked />
      <Switch aria-label="Disabled off" disabled />
    </>
  );
}
