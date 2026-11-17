import { useState } from "react";
import { ColorPicker } from "@/components/ui/color-picker";

const presets = ["#2563eb", "#16a34a", "#dc2626", "#9333ea"];

export const meta = { title: "Preset chips with a custom colour", description: "The trigger sits in a row of preset swatches.", layout: "stack" };

export default function Presets() {
  const [color, setColor] = useState("#2563eb");

  return (
    <div className="flex items-center gap-2">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          aria-label={preset}
          aria-pressed={color === preset}
          onClick={() => setColor(preset)}
          className="size-9 rounded-full border border-line-strong aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2"
          style={{ backgroundColor: preset }}
        />
      ))}
      <ColorPicker
        value={color}
        defaultColor="#2563eb"
        onChange={setColor}
        trigger={
          <button type="button" aria-label="Custom colour" className="size-9 rounded-full border border-line-strong" style={{ backgroundColor: color }} />
        }
      />
    </div>
  );
}
