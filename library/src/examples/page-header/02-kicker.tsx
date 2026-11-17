import { PageHeader } from "@/components/ui/display";

export const meta = { title: "Kicker and title only", layout: "stack" };

export default function Kicker() {
  return (
    <>
      <PageHeader kicker="Peak Makers" title="Hack Night: autumn edition" />
      <PageHeader title="Settings" />
    </>
  );
}
