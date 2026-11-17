import { Spinner } from "@/components/ui/spinner";

export const meta = { title: "With text or a label", description: "Decorative next to visible text; pass label for a standalone spinner." };

export default function WithText() {
  return (
    <>
      <span className="inline-flex items-center gap-2 text-body-ui text-ink-secondary">
        <Spinner className="size-4" />
        Saving…
      </span>
      <Spinner label="Loading guests" className="size-6" />
    </>
  );
}
