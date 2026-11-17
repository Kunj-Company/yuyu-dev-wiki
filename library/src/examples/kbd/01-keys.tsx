import { Kbd } from "@/components/help/mdx";

export const meta = {
  title: "Single keys",
  description: "One Kbd per key.",
};

export default function Keys() {
  return (
    <>
      <Kbd>Enter</Kbd>
      <Kbd>Esc</Kbd>
      <Kbd>Tab</Kbd>
      <Kbd>/</Kbd>
      <Kbd>⌘</Kbd>
    </>
  );
}
