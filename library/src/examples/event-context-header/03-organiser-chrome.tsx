import { useEffect } from "react";
import { OrganiserChrome } from "@/components/chrome/OrganiserChrome";
import { setDemoPathname } from "../../shims/next-navigation";

export const meta = {
  title: "OrganiserChrome",
  description: "Wraps event-facing pages with EventContextHeader and EventFooter. Check-in kiosk paths and a null organisation render no chrome.",
  layout: "full",
};

const organisation = { name: "Bengaluru Builders", slug: "blr-builders", logoUrl: null };

export default function Chrome() {
  useEffect(() => {
    setDemoPathname("/blr-builders/rust-night");
    return () => setDemoPathname("/discover");
  }, []);
  return (
    <div className="m-4 flex h-[420px] flex-col overflow-auto rounded-xl border border-line bg-canvas">
      <OrganiserChrome organisation={organisation}>
        <h1 className="text-h3">Rust Night</h1>
        <p className="mt-2 text-ink-secondary">Event page content.</p>
      </OrganiserChrome>
    </div>
  );
}
