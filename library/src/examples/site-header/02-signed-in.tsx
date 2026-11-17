import { useEffect } from "react";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { setDemoSession } from "../../shims/useAuthSession";

export const meta = {
  title: "Signed in",
  description: "Features is hidden; Account, Sign out and Dashboard appear.",
  layout: "full",
};

export default function SignedIn() {
  useEffect(() => {
    setDemoSession("signed-in");
    return () => setDemoSession("guest");
  }, []);
  return (
    <div className="m-4 h-[140px] overflow-hidden rounded-xl border border-line bg-canvas" style={{ transform: "translateZ(0)" }}>
      <SiteHeader />
    </div>
  );
}
