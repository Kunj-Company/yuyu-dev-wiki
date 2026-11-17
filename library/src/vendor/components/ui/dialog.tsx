"use client";

import { forwardRef, useState, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "./button";
import { Field, Input } from "./field";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: "sm" | "md" | "lg" | "xl"; hideClose?: boolean }
>(function DialogContent({ className, children, size = "sm", hideClose = false, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(17,17,19,0.48)] data-[state=open]:animate-[yy-fade-in_180ms_ease-out]" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-canvas text-ink shadow-float focus:outline-none data-[state=open]:animate-[yy-dialog-in_240ms_cubic-bezier(0.2,0.8,0.2,1)]",
          size === "sm" && "max-w-[480px]",
          size === "md" && "max-w-[640px]",
          size === "lg" && "max-w-[860px]",
          size === "xl" && "max-w-[1100px]",
          className,
        )}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <DialogPrimitive.Close asChild>
            <IconButton label="Close" size="sm" className="absolute right-3 top-3">
              <X />
            </IconButton>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({ title, description, className }: { title: ReactNode; description?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5 px-6 pb-2 pr-14 pt-6", className)}>
      <DialogPrimitive.Title className="text-h3 text-ink">{title}</DialogPrimitive.Title>
      {description ? <DialogPrimitive.Description className="text-body-ui text-ink-secondary">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
    </div>
  );
}

export function DialogBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-3", className)}>{children}</div>;
}

export function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col-reverse gap-2.5 px-6 pb-6 pt-3 sm:flex-row sm:justify-end", className)}>{children}</div>;
}

/**
 * Confirmation for consequential actions (docs/DESIGN.md §4.15). Destructive
 * confirmations use the danger button. Pass `confirmText` to require typing a
 * value (e.g. the organisation name) before the action unlocks.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  confirmText,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const [typed, setTyped] = useState("");
  const locked = Boolean(confirmText) && typed.trim() !== confirmText;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) {
          setTyped("");
          onCancel();
        }
      }}
    >
      <DialogContent role="alertdialog" size="sm" hideClose>
        <DialogHeader title={title} description={message} />
        {children || confirmText ? (
          <DialogBody className="flex flex-col gap-3.5">
            {children}
            {confirmText ? (
              <Field label={<>Type <span className="font-mono">{confirmText}</span> to confirm</>}>
                <Input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" autoFocus />
              </Field>
            ) : null}
          </DialogBody>
        ) : null}
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setTyped("");
              onCancel();
            }}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading} disabled={locked}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
