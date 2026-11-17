import { DateBlock } from "@/components/ui/display";

export const meta = { title: "Event colour and series", description: "color takes an event's own accent. series swaps the day for a repeat icon." };

export default function ColorSeries() {
  return (
    <>
      <div className="flex items-center gap-3">
        <DateBlock month="SEP" day="03" color="#7c3aed" />
        <span className="text-body-ui">Thursday 3 September, 18:00</span>
      </div>
      <div className="flex items-center gap-3">
        <DateBlock month="EVERY" day="" series />
        <span className="text-body-ui">Weekly series</span>
      </div>
    </>
  );
}
