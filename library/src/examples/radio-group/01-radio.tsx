import { useState } from "react";
import { Radio, RadioGroup } from "@/components/ui/choice";

export const meta = { title: "Radio rows", description: "Controlled group with descriptions and a disabled option.", layout: "stack" };

export default function Rows() {
  const [audience, setAudience] = useState("public");

  return (
    <RadioGroup value={audience} onValueChange={setAudience} aria-label="Audience" className="w-full max-w-sm">
      <Radio value="public" label="Public" description="Anyone with the link can register." />
      <Radio value="private" label="Invite only" description="Only guests you invite." />
      <Radio value="org" label="Organisation" description="Requires an upgrade." disabled />
    </RadioGroup>
  );
}
