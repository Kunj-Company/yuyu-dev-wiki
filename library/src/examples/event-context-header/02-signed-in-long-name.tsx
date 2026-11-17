import { useEffect } from "react";
import { EventContextHeader } from "@/components/chrome/EventContextHeader";
import { setDemoSession } from "../../shims/useAuthSession";

export const meta = {
  title: "Signed in, long organisation name",
  description: "Signed-in people get a Dashboard button. Long names truncate instead of pushing the actions off screen.",
  layout: "full",
};

const organisation = { name: "The Very Long Named Community of Open Source Hobbyists", slug: "long-name", logoUrl: null };

export default function SignedIn() {
  useEffect(() => {
    setDemoSession("signed-in");
    return () => setDemoSession("guest");
  }, []);
  return (
    <div className="m-4 max-w-[560px] overflow-hidden rounded-xl border border-line bg-canvas">
      <EventContextHeader organisation={organisation} />
    </div>
  );
}
