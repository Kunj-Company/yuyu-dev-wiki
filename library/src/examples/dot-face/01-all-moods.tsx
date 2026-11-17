import { DotFace } from "@/components/brand/DotFace";
import { FACE_MOODS } from "@/components/brand/patterns";

export const meta = {
  title: "All moods",
  description: "Hover a face to ripple the dots and blink. Each mood has a job in the product.",
};

export default function AllMoods() {
  return (
    <>
      {FACE_MOODS.map((mood) => (
        <figure key={mood} className="flex flex-col items-center gap-2">
          <DotFace mood={mood} size={96} label={mood} />
          <figcaption className="text-caption text-ink-muted">{mood}</figcaption>
        </figure>
      ))}
    </>
  );
}
