import { Bell, Pencil, Trash2, Plus } from "lucide-react";
import { IconButton } from "@/components/ui/button";

export const meta = { title: "Variants", description: "Hover a quiet button to see its background. The label is the accessible name and tooltip." };

export default function Variants() {
  return (
    <>
      <IconButton label="Notifications"><Bell /></IconButton>
      <IconButton label="Edit" variant="secondary"><Pencil /></IconButton>
      <IconButton label="Delete" variant="danger"><Trash2 /></IconButton>
      <IconButton label="Add" variant="primary"><Plus /></IconButton>
    </>
  );
}
