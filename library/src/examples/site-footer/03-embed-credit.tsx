import { EmbedCredit } from "@/components/chrome/SiteFooter";

export const meta = {
  title: "EmbedCredit",
  description: "Credit under an embedded event, inside the organiser's iframe. The link opens Yuyu in a new tab.",
  layout: "full",
};

export default function EmbedCreditDemo() {
  return (
    <div className="m-4 overflow-hidden rounded-xl border border-line bg-canvas">
      <EmbedCredit />
    </div>
  );
}
