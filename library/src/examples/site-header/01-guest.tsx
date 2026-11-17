import { useEffect } from "react";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { setDemoSession } from "../../shims/useAuthSession";

export const meta = {
  title: "Signed out",
  description: "Guests see the Features link plus Sign in and Start organising. Narrow the window below 1024px for the menu button.",
  layout: "full",
};

export default function Guest() {
  useEffect(() => setDemoSession("guest"), []);
  return (
    <div className="m-4 h-[140px] overflow-hidden rounded-xl border border-line bg-canvas" style={{ transform: "translateZ(0)" }}>
      <SiteHeader />
    </div>
  );
}
