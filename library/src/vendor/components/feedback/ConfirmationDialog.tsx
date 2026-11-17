"use client";

import { ConfirmDialog } from "@/components/ui/dialog";

/**
 * Backwards-compatible confirmation dialog. Destructive by default (every
 * existing caller except sending an email removes or revokes something);
 * pass `destructive={false}` for a neutral primary action.
 */
export function ConfirmationDialog(props: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
}) {
  const { open, title, message, onConfirm, onCancel, confirmLabel = "Delete", cancelLabel = "Cancel", loading = false, destructive = true } = props;
  return (
    <ConfirmDialog
      open={open}
      title={title}
      message={message}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      loading={loading}
      destructive={destructive}
    />
  );
}
