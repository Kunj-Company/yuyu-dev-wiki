import { DotIcon } from "@/components/brand/DotIcon";

export const meta = {
  title: "Sizes and colours",
  description: "size is the overall width. colors overrides pattern letters.",
};

export default function SizesAndColors() {
  return (
    <>
      <DotIcon name="date" size={36} />
      <DotIcon name="date" size={54} />
      <DotIcon name="date" size={108} label="Date" />
      <DotIcon name="certificate" size={72} colors={{ X: "#7c3aed" }} />
      <DotIcon name="lock" size={72} colors={{ X: "var(--yy-brand-marigold-deep)" }} />
    </>
  );
}
