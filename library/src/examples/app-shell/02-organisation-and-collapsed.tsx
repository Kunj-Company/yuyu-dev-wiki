import { useEffect } from "react";
import { AppShell } from "@/components/chrome/AppShell";
import { setDemoPathname } from "../../shims/next-navigation";

export const meta = {
  title: "Inside an organisation, starting collapsed",
  description: "The organisation is read from the URL (/dashboard/<slug>). Owners and admins see Settings; collaborators do not see Series or Members. initialCollapsed starts the icon rail.",
  layout: "full",
};

const user = { name: "Asha Rao", email: "asha@example.org", image: null };

const organisations = [
  { slug: "blr-builders", name: "Bengaluru Builders", logoUrl: null, role: "OWNER", pendingApprovals: 3 },
  { slug: "design-sundays", name: "Design Sundays", logoUrl: null, role: "ADMIN", pendingApprovals: 0 },
  { slug: "robo-club", name: "Robo Club", logoUrl: null, role: "COLLABORATOR", pendingApprovals: 1 },
];

export default function OrganisationCollapsed() {
  useEffect(() => {
    setDemoPathname("/dashboard/blr-builders/members");
    return () => setDemoPathname("/discover");
  }, []);
  return (
    <div
      className="m-4 h-[520px] overflow-auto rounded-xl border border-line bg-canvas [&>div]:!min-h-[520px] [&_aside]:!h-[520px]"
      style={{ transform: "translateZ(0)" }}
    >
      <AppShell user={user} organisations={organisations} initialCollapsed>
        <h1 className="text-h3">Members</h1>
        <p className="mt-2 text-ink-secondary">Expand the sidebar with the button at the top.</p>
      </AppShell>
    </div>
  );
}
