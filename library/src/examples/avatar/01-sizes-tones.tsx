import { Avatar } from "@/components/ui/display";

export const meta = { title: "Sizes and tones", description: "Initials come from the name: first and last word." };

export default function SizesTones() {
  return (
    <>
      <Avatar name="Ada Lovelace" size="xs" />
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Ada Lovelace" size="md" />
      <Avatar name="Ada Lovelace" size="lg" />
      <Avatar name="Ada Lovelace" size="xl" />
      <Avatar name="Grace Hopper" tone="accent" />
      <Avatar name="Linus" tone="success" />
      <Avatar name="Margaret Hamilton" tone="warning" />
      <Avatar name="Alan Turing" tone="ink" />
    </>
  );
}
