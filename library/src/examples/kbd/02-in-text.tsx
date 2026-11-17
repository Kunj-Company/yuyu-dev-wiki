import { Kbd } from "@/components/help/mdx";

export const meta = {
  title: "Combinations in a sentence",
  description: "Join keys with a plus sign in your own markup.",
};

export default function InText() {
  return (
    <p className="text-ink-secondary">
      Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to search, or <Kbd>Esc</Kbd> to close.
    </p>
  );
}
