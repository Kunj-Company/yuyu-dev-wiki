import { useEffect } from "react";
import { EventContextHeader } from "@/components/chrome/EventContextHeader";
import { setDemoSession } from "../../shims/useAuthSession";

export const meta = {
  title: "Signed out",
  description: "The organiser name and logo lead; Sign in is the only account action.",
  layout: "full",
};

const organisation = { name: "Bengaluru Builders", slug: "blr-builders", logoUrl: null };

export default function Guest() {
  useEffect(() => setDemoSession("guest"), []);
  return (
    <div className="m-4 overflow-hidden rounded-xl border border-line bg-canvas">
      <EventContextHeader organisation={organisation} />
    </div>
  );
}
