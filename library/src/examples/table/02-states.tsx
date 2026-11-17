import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export const meta = { title: "Loading and empty", description: "Fill the body with skeleton rows while loading; use one spanning cell for empty.", layout: "stack" };

export default function States() {
  return (
    <>
      <Table label="Loading invites">
        <THead>
          <TR><TH>Email</TH><TH>Sent</TH></TR>
        </THead>
        <TBody>
          {[0, 1, 2].map((row) => (
            <TR key={row}>
              <TD><Skeleton className="h-4 w-48" /></TD>
              <TD><Skeleton className="h-4 w-20" /></TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <Table label="Empty invites">
        <THead>
          <TR><TH>Email</TH><TH>Sent</TH></TR>
        </THead>
        <TBody>
          <TR>
            <TD colSpan={2} className="py-8 text-center text-ink-muted">
              <p>No invites yet.</p>
              <Button className="mt-3" size="sm" variant="primary">Send invites</Button>
            </TD>
          </TR>
        </TBody>
      </Table>
    </>
  );
}
