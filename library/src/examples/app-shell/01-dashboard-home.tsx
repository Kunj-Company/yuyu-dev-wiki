import { useEffect } from "react";
import { AppShell } from "@/components/chrome/AppShell";
import { setDemoPathname } from "../../shims/next-navigation";

export const meta = {
  title: "Dashboard home",
  description: "Sidebar with the organisation list and pending-approval badges. The collapse button shrinks it to an icon rail. Below the md breakpoint it becomes a top bar with a menu sheet.",
  layout: "full",
};

const user = { name: "Asha Rao", email: "asha@example.org", image: null };

const organisations = [
  { slug: "blr-builders", name: "Bengaluru Builders", logoUrl: null, role: "OWNER", pendingApprovals: 3 },
  { slug: "design-sundays", name: "Design Sundays", logoUrl: null, role: "ADMIN", pendingApprovals: 0 },
  { slug: "robo-club", name: "Robo Club", logoUrl: null, role: "COLLABORATOR", pendingApprovals: 1 },
];

export default function DashboardHome() {
  useEffect(() => {
    setDemoPathname("/dashboard");
    return () => setDemoPathname("/discover");
  }, []);
  return (
    <div
      className="m-4 h-[520px] overflow-auto rounded-xl border border-line bg-canvas [&>div]:!min-h-[520px] [&_aside]:!h-[520px]"
      style={{ transform: "translateZ(0)" }}
    >
      <AppShell user={user} organisations={organisations}>
        <h1 className="text-h3">Your organisations</h1>
        <p className="mt-2 text-ink-secondary">Page content goes here.</p>
      </AppShell>
    </div>
  );
}
