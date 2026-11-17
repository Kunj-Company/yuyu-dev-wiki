import { Card, Skeleton } from "@/components/ui/display";

export const meta = { title: "Loading card", description: "Match the layout of the real content.", layout: "stack" };

export default function LoadingRow() {
  return (
    <Card aria-busy="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </Card>
  );
}
