import { EventFooter } from "@/components/chrome/SiteFooter";

export const meta = {
  title: "EventFooter",
  description: "Compact footer for event-facing pages: the organiser leads, Yuyu steps back.",
  layout: "full",
};

export default function EventFooterDemo() {
  return (
    <div className="m-4 overflow-hidden rounded-xl border border-line bg-canvas">
      <EventFooter />
    </div>
  );
}
