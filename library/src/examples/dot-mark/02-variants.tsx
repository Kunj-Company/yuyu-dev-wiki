import { DotMark } from "@/components/brand/DotMark";

export const meta = {
  title: "Variants",
  description: "Auto, full, bright, onMarigold and mono, each at 72px.",
};

export default function Variants() {
  return (
    <>
      <DotMark size={72} variant="auto" />
      <DotMark size={72} variant="full" />
      <DotMark size={72} variant="bright" />
      <span className="inline-flex rounded-2xl bg-brand-marigold p-3">
        <DotMark size={72} variant="onMarigold" />
      </span>
      <span className="text-ink-secondary">
        <DotMark size={72} variant="mono" />
      </span>
    </>
  );
}
