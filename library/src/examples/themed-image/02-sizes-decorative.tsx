import { ThemedImage } from "@/components/ui/themed-image";

const asset = (bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="${bg}"/><path d="M10 28 20 10l10 18z" fill="#fff"/></svg>`);

export const meta = { title: "Sizes and decorative use", description: "Leave alt empty for decorative art. className applies to both images." };

export default function SizesDecorative() {
  return (
    <>
      <ThemedImage src={asset("#1f6feb")} darkSrc={asset("#58a6ff")} width={24} height={24} />
      <ThemedImage src={asset("#1f6feb")} darkSrc={asset("#58a6ff")} width={48} height={48} />
      <ThemedImage src={asset("#1f6feb")} darkSrc={asset("#58a6ff")} width={72} height={72} className="rounded-xl" />
    </>
  );
}
