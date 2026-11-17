"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { EventContextHeader } from "./EventContextHeader";
import { EventFooter } from "./SiteFooter";

/** Venue check-in stations run as kiosks with no site chrome. */
function isKioskPath(pathname: string) {
  return /^\/[^/]+\/[^/]+\/check-in\/?$/.test(pathname);
}

export function OrganiserChrome({ organisation, children }: { organisation: { name: string; slug: string; logoUrl: string | null } | null; children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (!organisation || isKioskPath(pathname)) {
    return <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">{children}</main>;
  }
  return (
    <>
      <EventContextHeader organisation={organisation} />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <div className="mx-auto w-full max-w-[1160px] px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
      <EventFooter />
    </>
  );
}
