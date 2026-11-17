import { useState } from "react";
import { CheckboxCard } from "@/components/ui/choice";

export const meta = { title: "CheckboxCard", description: "A bordered option with a description; selected cards get a 1.5px primary border.", layout: "stack" };

export default function Card() {
  const [scopes, setScopes] = useState<string[]>(["read"]);
  const toggle = (scope: string, on: boolean) => setScopes(on ? [...scopes, scope] : scopes.filter((item) => item !== scope));

  return (
    <div className="grid w-full max-w-sm gap-3">
      <CheckboxCard label="Read events" description="List your events and registrations." checked={scopes.includes("read")} onCheckedChange={(value) => toggle("read", value === true)} />
      <CheckboxCard label="Write events" description="Create and edit events." checked={scopes.includes("write")} onCheckedChange={(value) => toggle("write", value === true)} />
      <CheckboxCard label="Manage billing" description="Not available on your plan." disabled />
    </div>
  );
}
