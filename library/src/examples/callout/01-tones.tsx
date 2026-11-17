import { Callout } from "@/components/ui/display";

export const meta = { title: "Tones", description: "Info is the default. Pass a title for a bold first line.", layout: "stack" };

export default function Tones() {
  return (
    <>
      <Callout>Registration closes on Friday.</Callout>
      <Callout tone="success" title="Saved">Your changes are live.</Callout>
      <Callout tone="warning" title="Almost full">Only 3 spots left.</Callout>
      <Callout tone="danger" title="Payment failed">Check your card details and try again.</Callout>
    </>
  );
}
