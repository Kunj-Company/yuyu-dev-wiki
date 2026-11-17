import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";

export const meta = { title: "Basic", description: "Pass any element as the trigger. An empty value means the default colour.", layout: "stack" };

export default function Basic() {
  const [color, setColor] = useState("");

  return (
    <div className="flex items-center gap-3">
      <ColorPicker
        value={color}
        defaultColor="#2563eb"
        onChange={setColor}
        trigger={<Button variant="secondary">Pick a colour</Button>}
      />
      <code className="text-caption text-ink-muted">{color || "default"}</code>
    </div>
  );
}
