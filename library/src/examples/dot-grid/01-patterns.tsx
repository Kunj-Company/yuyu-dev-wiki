import { DotGrid } from "@/components/brand/DotGrid";
import { DOT_WORDMARK, MARK } from "@/components/brand/patterns";

export const meta = {
  title: "Built-in patterns",
  description: "Rows are separated by |. X marigold, O ink, . soft, D deep marigold, W white, space is empty.",
};

export default function Patterns() {
  return (
    <>
      <DotGrid pattern={MARK} dot={14} label="Yuyu mark" />
      <DotGrid pattern={DOT_WORDMARK} dot={8} label="YUYU in dots" />
    </>
  );
}
