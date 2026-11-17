import { DotFace } from "@/components/brand/DotFace";

export const meta = {
  title: "Sizes and hover",
  description: "Default size is 136. hover={false} turns the ripple off. The last face reacts when its group is hovered.",
};

export default function SizesAndHover() {
  return (
    <>
      <DotFace mood="happy" size={48} />
      <DotFace mood="cheering" size={96} />
      <DotFace mood="sleepy" size={136} />
      <DotFace mood="wink" size={96} hover={false} />
      <div className="group flex items-center gap-3 rounded-xl border border-line p-3">
        <DotFace mood="surprised" size={64} />
        <span className="text-sm text-ink-secondary">Hover this card</span>
      </div>
    </>
  );
}
