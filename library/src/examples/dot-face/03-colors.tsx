import { DotFace } from "@/components/brand/DotFace";

export const meta = {
  title: "Colour overrides",
  description: "colors maps pattern letters (X, O) to any CSS colour.",
};

export default function Colors() {
  return (
    <>
      <DotFace mood="love" size={96} colors={{ X: "var(--yy-brand-marigold-deep)" }} />
      <DotFace mood="done" size={96} colors={{ X: "#16a34a", O: "#14532d" }} />
      <DotFace mood="sad" size={96} colors={{ X: "#9ca3af" }} />
    </>
  );
}
