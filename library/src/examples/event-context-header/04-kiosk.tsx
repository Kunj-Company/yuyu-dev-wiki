import { useEffect } from "react";
import { OrganiserChrome } from "@/components/chrome/OrganiserChrome";
import { setDemoPathname } from "../../shims/next-navigation";

export const meta = {
  title: "OrganiserChrome on a check-in kiosk path",
  description: "Paths shaped like /<org>/<event>/check-in render only the main element, with no header or footer.",
  layout: "full",
};

const organisation = { name: "Bengaluru Builders", slug: "blr-builders", logoUrl: null };

export default function Kiosk() {
  useEffect(() => {
    setDemoPathname("/blr-builders/rust-night/check-in");
    return () => setDemoPathname("/discover");
  }, []);
  return (
    <div className="m-4 flex h-[220px] flex-col overflow-auto rounded-xl border border-line bg-canvas p-4">
      <OrganiserChrome organisation={organisation}>
        <p className="text-ink-secondary">Kiosk content, no site chrome.</p>
      </OrganiserChrome>
    </div>
  );
}
