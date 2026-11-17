import { useEffect } from "react";
import { SiteHeader, YuyuWordmark } from "@/components/chrome/SiteHeader";
import { setDemoPathname } from "../../shims/next-navigation";

export const meta = {
  title: "Active link and YuyuWordmark",
  description: "The link matching the current pathname gets aria-current and a filled pill. YuyuWordmark is the lockup as a home link, used on its own in auth pages.",
  layout: "full",
};

export default function ActiveLink() {
  useEffect(() => {
    setDemoPathname("/about");
    return () => setDemoPathname("/discover");
  }, []);
  return (
    <div className="m-4 flex flex-col gap-4">
      <div className="h-[140px] overflow-hidden rounded-xl border border-line bg-canvas" style={{ transform: "translateZ(0)" }}>
        <SiteHeader />
      </div>
      <div className="flex items-center gap-6 rounded-xl border border-line p-4">
        <YuyuWordmark />
        <YuyuWordmark href="/dashboard" size="md" />
      </div>
    </div>
  );
}
