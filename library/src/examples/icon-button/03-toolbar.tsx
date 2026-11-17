import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { IconButton } from "@/components/ui/button";

export const meta = { title: "Toolbar with feedback", description: "Swap the icon and the label after an action completes." };

export default function Toolbar() {
  const [copied, setCopied] = useState(false);

  return (
    <>
      <IconButton
        label={copied ? "Copied" : "Copy link"}
        variant="secondary"
        onClick={() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check /> : <Copy />}
      </IconButton>
      <IconButton label="Share" variant="secondary"><Share2 /></IconButton>
    </>
  );
}
