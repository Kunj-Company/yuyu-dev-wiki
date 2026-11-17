import { DetailList } from "@/components/ui/display";

export const meta = { title: "Key and value pairs", layout: "stack" };

export default function Basic() {
  return (
    <DetailList
      items={[
        { label: "Date", value: "Thursday 3 September, 18:00" },
        { label: "Venue", value: "Community Hall, 12 High Street" },
        { label: "Capacity", value: "50" },
        { label: "Organiser", value: "Peak Makers" },
      ]}
    />
  );
}
