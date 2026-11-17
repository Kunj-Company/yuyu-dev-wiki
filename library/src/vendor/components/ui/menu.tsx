"use client";

import { cloneElement, forwardRef, isValidElement, type ComponentPropsWithoutRef, type ElementRef, type ReactElement, type ReactNode } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";

/* ---------- Dropdown menu (docs/DESIGN.md §4.15) ---------- */

export const Menu = DropdownMenuPrimitive.Root;
export const MenuTrigger = DropdownMenuPrimitive.Trigger;
export const MenuGroup = DropdownMenuPrimitive.Group;

export const MenuContent = forwardRef<ElementRef<typeof DropdownMenuPrimitive.Content>, ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>>(function MenuContent(
  { className, sideOffset = 6, align = "end", ...props },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn("z-50 min-w-[200px] overflow-hidden rounded-lg border border-line bg-canvas p-1.5 text-ink shadow-float", className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

export const MenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { danger?: boolean; icon?: ReactNode; description?: ReactNode }
>(function MenuItem({ className, danger, icon, description, children, asChild, ...props }, ref) {
  const content = (inner: ReactNode) => (
    <>
      {icon ? <span aria-hidden className="inline-flex text-current">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        {inner}
        {description ? <span className="block text-caption text-ink-muted">{description}</span> : null}
      </span>
    </>
  );
  // With asChild (e.g. a Link), Radix needs exactly one element child, so the
  // icon and label go inside that element instead of beside it.
  const slotted = asChild && isValidElement(children) ? (children as ReactElement<{ children?: ReactNode }>) : null;
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      asChild={Boolean(slotted)}
      className={cn(
        "flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-md px-3 py-2 text-body-ui outline-none data-[disabled]:pointer-events-none data-[disabled]:text-ink-disabled data-[highlighted]:bg-emphasis [&_svg]:size-[18px] [&_svg]:shrink-0",
        danger ? "text-danger-fg" : "text-ink",
        className,
      )}
      {...props}
    >
      {slotted ? cloneElement(slotted, undefined, content(slotted.props.children)) : content(children)}
    </DropdownMenuPrimitive.Item>
  );
});

export function MenuLabel({ children }: { children: ReactNode }) {
  return <DropdownMenuPrimitive.Label className="px-3 pb-1 pt-2 text-overline text-ink-muted">{children}</DropdownMenuPrimitive.Label>;
}

export function MenuSeparator() {
  return <DropdownMenuPrimitive.Separator className="my-1.5 h-px bg-line" />;
}

/* ---------- Tooltip ---------- */

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <TooltipPrimitive.Root delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} sideOffset={6} className="z-50 max-w-[280px] rounded-md bg-inverse px-2.5 py-1.5 text-caption text-on-inverse shadow-float">
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ---------- Popover ---------- */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = forwardRef<ElementRef<typeof PopoverPrimitive.Content>, ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>>(function PopoverContent(
  { className, sideOffset = 6, align = "start", ...props },
  ref,
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn("z-50 rounded-lg border border-line bg-canvas p-3 text-ink shadow-float focus:outline-none", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
