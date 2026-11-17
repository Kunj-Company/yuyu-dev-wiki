import { DotGrid } from "@/components/brand/DotGrid";

export const meta = {
  title: "Custom pattern, gap and colours",
  description: "Write your own pattern string. Gap defaults to a quarter of the dot.",
};

export default function Custom() {
  return (
    <>
      <DotGrid pattern="X.X.X|.D.D.|X.W.X|.D.D.|X.X.X" dot={16} />
      <DotGrid pattern="XXXXX|X...X|X.O.X|X...X|XXXXX" dot={16} gap={8} />
      <DotGrid pattern="OXO|XOX|OXO" dot={20} colors={{ X: "#7c3aed", O: "#c4b5fd" }} />
    </>
  );
}
