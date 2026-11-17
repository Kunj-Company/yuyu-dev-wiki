import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/menu";

export const meta = {
  title: "Sides",
  description: "Pick the side with the most room; the tooltip flips if it would leave the screen.",
};

export default function TooltipSides() {
  return (
    <>
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} content={`Opens on the ${side}`} side={side}>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
    </>
  );
}
