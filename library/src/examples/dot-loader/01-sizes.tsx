import { DotLoader } from "@/components/brand/DotLoader";

export const meta = {
  title: "Sizes",
  description: "size is the overall width in px. With reduced motion the dots sit still.",
};

export default function Sizes() {
  return (
    <>
      <DotLoader size={32} />
      <DotLoader size={48} />
      <DotLoader size={96} />
    </>
  );
}
