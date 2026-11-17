import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Chip } from "@/components/ui/display";

export const meta = { title: "Basic table", description: "Pass label so the scroll region is named and keyboard-focusable.", layout: "stack" };

export default function Basic() {
  return (
    <Table label="Guests">
      <THead>
        <TR>
          <TH>Name</TH>
          <TH>Status</TH>
          <TH className="text-right">Tickets</TH>
        </TR>
      </THead>
      <TBody>
        <TR>
          <TD>Ada Lovelace</TD>
          <TD><Chip size="sm" tone="success">Going</Chip></TD>
          <TD className="text-right tabular-nums">2</TD>
        </TR>
        <TR>
          <TD>Grace Hopper</TD>
          <TD><Chip size="sm" tone="warning">Waitlist</Chip></TD>
          <TD className="text-right tabular-nums">1</TD>
        </TR>
        <TR>
          <TD>Alan Turing</TD>
          <TD><Chip size="sm">Invited</Chip></TD>
          <TD className="text-right tabular-nums">1</TD>
        </TR>
      </TBody>
    </Table>
  );
}
