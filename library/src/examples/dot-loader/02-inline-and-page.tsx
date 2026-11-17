import { DotLoader, PageLoader } from "@/components/brand/DotLoader";

export const meta = {
  title: "In a panel, and PageLoader",
  description: "PageLoader is position: fixed over the whole viewport, so it is contained here in a transformed box.",
  layout: "stack",
};

export default function InlineAndPage() {
  return (
    <>
      <div className="flex h-32 items-center justify-center rounded-xl border border-line bg-subtle">
        <DotLoader label="Loading events" />
      </div>
      <div className="relative h-40 overflow-hidden rounded-xl border border-line" style={{ transform: "translateZ(0)" }}>
        <PageLoader label="Loading page" />
      </div>
    </>
  );
}
