import { useState } from "react";
import { PageNumberPager } from "@/components/ui/page-number-pager";

export const meta = { title: "Controlled pager", description: "A window of up to seven numbers around the current page.", layout: "stack" };

export default function Basic() {
  const [page, setPage] = useState(5);
  return <PageNumberPager label="Invite pages" page={page} totalPages={20} onPage={setPage} />;
}
