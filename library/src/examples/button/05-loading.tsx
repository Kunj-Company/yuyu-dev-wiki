import { useState } from "react";
import { Button } from "@/components/ui/button";

export const meta = { title: "Loading", description: "loading disables the button, sets aria-busy and shows a spinner with the label." };

export default function Loading() {
  const [pending, setPending] = useState(false);

  function save() {
    setPending(true);
    setTimeout(() => setPending(false), 1800);
  }

  return (
    <>
      <Button variant="primary" loading={pending} loadingLabel="Saving…" onClick={save}>
        Save changes
      </Button>
      <Button variant="secondary" loading>Publishing</Button>
    </>
  );
}
