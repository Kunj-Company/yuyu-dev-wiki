import { useSyncExternalStore } from "react";

type State = { status: "loading"; data: null } | { status: "unauthenticated"; data: null } | { status: "authenticated"; data: { user: { name: string; email: string; image: string | null } } };

let state: State = { status: "unauthenticated", data: null };
const listeners = new Set<() => void>();

/** Demos switch between a guest and a signed-in person with this. */
export function setDemoSession(next: "guest" | "signed-in") {
  state = next === "guest" ? { status: "unauthenticated", data: null } : { status: "authenticated", data: { user: { name: "Asha Rao", email: "asha@example.org", image: null } } };
  listeners.forEach((l) => l());
}

export function useAuthSession(): State {
  return useSyncExternalStore((cb) => (listeners.add(cb), () => listeners.delete(cb)), () => state, () => state);
}
