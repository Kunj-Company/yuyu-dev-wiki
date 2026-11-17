import { DotLockup } from "@/components/brand/DotLockup";

export const meta = {
  title: "Layouts",
  description: "Horizontal for headers, stacked for square spaces, tagline for marketing.",
};

export default function Layouts() {
  return (
    <>
      <DotLockup layout="horizontal" />
      <DotLockup layout="stacked" />
      <DotLockup layout="tagline" />
    </>
  );
}
