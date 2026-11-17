import { useState } from "react";
import { SegmentedControl } from "@/components/ui/choice";

export const meta = { title: "Basic and sizes", description: "Always controlled; ariaLabel names the group." };

export default function Basic() {
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [size, setSize] = useState<"list" | "grid">("list");

  return (
    <>
      <SegmentedControl
        ariaLabel="Account mode"
        value={mode}
        onValueChange={setMode}
        options={[
          { value: "signin", label: "Sign in" },
          { value: "create", label: "Create account" },
        ]}
      />
      <SegmentedControl
        ariaLabel="Layout"
        size="sm"
        value={size}
        onValueChange={setSize}
        options={[
          { value: "list", label: "List" },
          { value: "grid", label: "Grid" },
        ]}
      />
    </>
  );
}
