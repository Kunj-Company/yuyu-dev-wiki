import { DotMark } from "@/components/brand/DotMark";

export const meta = {
  title: "Small sizes and labels",
  description: "Bright dots under 32px use deep marigold for contrast. Pass label={null} next to a visible wordmark.",
};

export default function SmallAndLabels() {
  return (
    <>
      <DotMark size={20} />
      <DotMark size={28} />
      <span className="inline-flex items-center gap-2">
        <DotMark size={24} label={null} />
        <span className="font-display font-extrabold">yuyu</span>
      </span>
    </>
  );
}
