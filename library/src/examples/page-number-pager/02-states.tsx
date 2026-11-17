import { useState } from "react";
import { PageNumberPager } from "@/components/ui/page-number-pager";

export const meta = { title: "Few pages, loading and single page", description: "Disabled while a page loads. A single page renders nothing.", layout: "stack" };

export default function States() {
  const [page, setPage] = useState(1);
  return (
    <>
      <PageNumberPager label="Few pages" page={page} totalPages={3} onPage={setPage} />
      <PageNumberPager label="Loading" page={2} totalPages={6} disabled onPage={() => {}} />
      <div className="text-center text-caption text-ink-muted">One page renders nothing:</div>
      <PageNumberPager label="Single page" page={1} totalPages={1} onPage={() => {}} />
    </>
  );
}
