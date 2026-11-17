import { useState } from "react";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useLoadMoreFocus } from "@/components/ui/use-load-more-focus";

export const meta = { title: "Load more with focus handling", description: "useLoadMoreFocus moves focus to the first new row, so keyboard users are not dropped back to the document.", layout: "stack" };

const everyone = Array.from({ length: 12 }, (_, index) => `Guest ${index + 1}`);

export default function LoadMore() {
  const [count, setCount] = useState(4);
  const { listId, beforeLoadMore } = useLoadMoreFocus(count);
  const rows = everyone.slice(0, count);
  return (
    <>
      <Table label="Guests">
        <THead>
          <TR><TH>Name</TH></TR>
        </THead>
        <TBody id={listId}>
          {rows.map((name) => (
            <TR key={name}><TD>{name}</TD></TR>
          ))}
        </TBody>
      </Table>
      {count < everyone.length ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => {
              beforeLoadMore();
              setCount((current) => current + 4);
            }}
          >
            Load more
          </Button>
        </div>
      ) : null}
    </>
  );
}
