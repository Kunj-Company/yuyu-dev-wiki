import { Input } from "@/components/ui/field";

export const meta = { title: "Types and states", description: "Plain input styling. Add aria-invalid to show the error border.", layout: "stack" };

export default function Types() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Input placeholder="Text" aria-label="Text" />
      <Input type="email" placeholder="you@example.com" aria-label="Email" />
      <Input type="number" placeholder="Capacity" aria-label="Capacity" />
      <Input defaultValue="Disabled value" disabled aria-label="Disabled" />
      <Input defaultValue="Invalid value" aria-invalid aria-label="Invalid" />
    </div>
  );
}
