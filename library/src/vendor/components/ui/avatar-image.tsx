"use client";

import { useState, type ReactNode } from "react";

/**
 * A profile photo that falls back to initials if it fails to load (a missing
 * Gravatar, a deleted upload, or an image blocked by the content policy),
 * instead of showing the browser's broken-image icon.
 */
export function AvatarImage({ src, fallback }: { src: string; fallback: ReactNode }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- user images are served by the app's own upload route
    <img src={src} alt="" className="size-full object-cover" onError={() => setFailedSrc(src)} />
  );
}
