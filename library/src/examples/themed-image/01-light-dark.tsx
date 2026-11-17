import { ThemedImage } from "@/components/ui/themed-image";

const dot = (fill: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="${bg}"/><circle cx="24" cy="24" r="10" fill="${fill}"/></svg>`);

export const meta = { title: "Light and dark twins", description: "Toggle Dark preview above to see the dark asset replace the light one." };

export default function LightDark() {
  return (
    <ThemedImage src={dot("#f5b83d", "#fff4d6")} darkSrc={dot("#f5b83d", "#2a2a2a")} width={48} height={48} alt="Yuyu dot" />
  );
}
