import { Screenshot } from "@/components/help/mdx";

export const meta = {
  title: "Uncaptured screen",
  description: "In Yuyu the sizes come from content/help/screenshots.json. In this gallery that file is an empty stub and the build is production, so an unknown name renders nothing (in Yuyu's dev mode it would show a dashed placeholder).",
  layout: "stack",
};

export default function Fallback() {
  return (
    <div className="rounded-xl border border-dashed border-line p-3 text-caption text-ink-muted">
      Below this line: Screenshot name="create-event" (renders nothing here).
      <Screenshot name="create-event" alt="The New event form with title, date and venue fields" caption="The New event form." />
    </div>
  );
}
