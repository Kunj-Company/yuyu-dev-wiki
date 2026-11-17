import { ColorModeToggle } from "@/components/chrome/ColorModeToggle";

export const meta = {
  title: "Variants and sizes",
  description: "Click to switch the whole app between light and dark. The toggle reveals the new mode from the button.",
};

export default function Variants() {
  return (
    <>
      <ColorModeToggle />
      <ColorModeToggle variant="secondary" />
      <ColorModeToggle size="sm" />
      <ColorModeToggle variant="secondary" size="sm" />
    </>
  );
}
