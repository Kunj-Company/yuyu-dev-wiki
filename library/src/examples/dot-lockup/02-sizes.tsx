import { DotLockup } from "@/components/brand/DotLockup";

export const meta = {
  title: "Sizes",
  description: "Size applies to the horizontal layout only. Stacked and tagline use fixed sizes.",
  layout: "stack",
};

export default function Sizes() {
  return (
    <>
      <DotLockup size="sm" />
      <DotLockup size="md" />
      <DotLockup size="lg" />
    </>
  );
}
