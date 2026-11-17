import { useEffect } from "react";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { setDemoSession } from "../../shims/useAuthSession";

export const meta = {
  title: "SiteFooter, signed in",
  description: "Dashboard and Account links are added in front of the public ones.",
  layout: "full",
};

export default function SiteFooterSignedIn() {
  useEffect(() => {
    setDemoSession("signed-in");
    return () => setDemoSession("guest");
  }, []);
  return (
    <div className="m-4 overflow-hidden rounded-xl border border-line bg-canvas">
      <SiteFooter />
    </div>
  );
}
