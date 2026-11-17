import { PrefixInput } from "@/components/ui/field";

export const meta = { title: "PrefixInput", description: "The prefix is part of the visual field but not of the value.", layout: "stack" };

export default function Prefix() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <PrefixInput prefix="yuyu.idliapps.com/" defaultValue="my-org" aria-label="Organisation address" />
      <PrefixInput prefix="https://" placeholder="example.com" aria-label="Website" aria-invalid />
    </div>
  );
}
