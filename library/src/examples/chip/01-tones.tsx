import { Chip } from "@/components/ui/display";

export const meta = { title: "Tones", description: "The label is the status. Colour only reinforces it." };

export default function Tones() {
  return (
    <>
      <Chip>Draft</Chip>
      <Chip tone="success">Going</Chip>
      <Chip tone="warning">Waitlist</Chip>
      <Chip tone="danger">Cancelled</Chip>
      <Chip tone="accent">Published</Chip>
      <Chip tone="ink">Host</Chip>
      <Chip tone="outline">Free</Chip>
    </>
  );
}
