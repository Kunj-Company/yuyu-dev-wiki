import { useEffect } from "react";
import { AppShell } from "@/components/chrome/AppShell";
import { setDemoPathname } from "../../shims/next-navigation";

export const meta = {
  title: "Collaborator role",
  description: "A collaborator only gets the Events item: no Series, Members, Settings or public-page link.",
  layout: "full",
};

const user = { name: "Asha Rao", email: "asha@example.org", image: null };

const organisations = [
  { slug: "blr-builders", name: "Bengaluru Builders", logoUrl: null, role: "OWNER", pendingApprovals: 3 },
  { slug: "design-sundays", name: "Design Sundays", logoUrl: null, role: "ADMIN", pendingApprovals: 0 },
  { slug: "robo-club", name: "Robo Club", logoUrl: null, role: "COLLABORATOR", pendingApprovals: 1 },
];

export default function Collaborator() {
  useEffect(() => {
    setDemoPathname("/dashboard/robo-club");
    return () => setDemoPathname("/discover");
  }, []);
  return (
    <div
      className="m-4 h-[460px] overflow-auto rounded-xl border border-line bg-canvas [&>div]:!min-h-[460px] [&_aside]:!h-[460px]"
      style={{ transform: "translateZ(0)" }}
    >
      <AppShell user={user} organisations={organisations}>
        <h1 className="text-h3">Robo Club events</h1>
      </AppShell>
    </div>
  );
}
