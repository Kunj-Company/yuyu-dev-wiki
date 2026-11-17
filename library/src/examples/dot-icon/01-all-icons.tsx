import { DotIcon } from "@/components/brand/DotIcon";
import { ICON_NAMES } from "@/components/brand/patterns";

export const meta = {
  title: "All icons",
  description: "Every name in ICON_NAMES at the 54px master size. Ink dots follow the theme.",
  layout: "stack",
};

export default function AllIcons() {
  return (
    <div className="grid grid-cols-3 gap-6 sm:grid-cols-5 lg:grid-cols-7">
      {ICON_NAMES.map((name) => (
        <figure key={name} className="flex flex-col items-center gap-2">
          <DotIcon name={name} />
          <figcaption className="text-caption text-ink-muted">{name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
