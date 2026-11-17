import { useSyncExternalStore } from "react";

let pathname = "/discover";
const listeners = new Set<() => void>();

/** Demos call this to set the "current" route, e.g. to mark a nav item active. */
export function setDemoPathname(next: string) {
  pathname = next;
  listeners.forEach((l) => l());
}

export function usePathname() {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => pathname,
    () => pathname,
  );
}
export function useRouter() {
  return { push: setDemoPathname, replace: setDemoPathname, refresh() {}, back() {}, forward() {}, prefetch() {} };
}
export function useSearchParams() {
  return new URLSearchParams();
}
