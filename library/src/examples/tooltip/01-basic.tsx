import { Info, Printer } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/menu";

export const meta = {
  title: "On icon buttons",
  description: "Shows on hover and keyboard focus after 300 ms. It supplements the control's own label; it does not replace it.",
};

export default function BasicTooltip() {
  return (
    <>
      <Tooltip content="Print badges">
        <IconButton label="Print badges" variant="secondary"><Printer /></IconButton>
      </Tooltip>
      <Tooltip content="Only visible to organisers">
        <IconButton label="About visibility" variant="quiet"><Info /></IconButton>
      </Tooltip>
    </>
  );
}
