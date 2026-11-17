import { Skeleton } from "@/components/ui/display";

export const meta = { title: "Shapes", description: "Skeleton has no size of its own: pass height and width." };

export default function Shapes() {
  return (
    <>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-28 rounded-full" />
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="h-16 w-24" />
    </>
  );
}
