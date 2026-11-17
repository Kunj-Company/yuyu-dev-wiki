import { DotMark } from "@/components/brand/DotMark";

export const meta = {
  title: "Sizes",
  description: "Auto switches from bright dots to the full grid at 48px. Anything under 16px is clamped to 16px.",
};

export default function Sizes() {
  return (
    <>
      {[16, 24, 32, 48, 72, 120].map((size) => (
        <DotMark key={size} size={size} />
      ))}
    </>
  );
}
