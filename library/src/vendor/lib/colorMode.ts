export type ColorMode = "light" | "dark";

/** Browser-only preference (cookie lets the server render without a flash). */
export const COLOR_MODE_COOKIE = "yuyu.color-mode";
export const COLOR_MODE_STORAGE_KEY = "yuyu:color-mode";

export function isColorMode(value: string | undefined): value is ColorMode {
  return value === "light" || value === "dark";
}
