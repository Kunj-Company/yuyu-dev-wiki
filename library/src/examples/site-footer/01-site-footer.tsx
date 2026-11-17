import { useEffect } from "react";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { setDemoSession } from "../../shims/useAuthSession";

export const meta = {
  title: "SiteFooter, signed out",
  description: "Lockup, tagline, public links, GitHub and the hosting credit.",
  layout: "full",
};

export default function SiteFooterDemo() {
  useEffect(() => setDemoSession("guest"), []);
  return (
    <div className="m-4 overflow-hidden rounded-xl border border-line bg-canvas">
      <SiteFooter />
    </div>
  );
}
