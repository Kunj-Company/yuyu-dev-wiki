"use client";

import { Moon, Sun } from "lucide-react";
import { useAppColorMode } from "@/components/providers";
import { IconButton } from "@/components/ui/button";

export function ColorModeToggle({ variant = "quiet", size = "md" }: { variant?: "quiet" | "secondary"; size?: "sm" | "md" }) {
  const { mode, toggleColorMode } = useAppColorMode();
  const label = `Switch to ${mode === "dark" ? "light" : "dark"} mode`;
  return (
    <IconButton
      label={label}
      variant={variant}
      size={size}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        toggleColorMode({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
    >
      {/* Both icons stay mounted and cross-rotate, so the swap reads as one motion. */}
      <span aria-hidden className="relative inline-flex size-[18px]">
        <Sun className={`yy-mode-icon absolute inset-0 ${mode === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} />
        <Moon className={`yy-mode-icon absolute inset-0 ${mode === "dark" ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
      </span>
    </IconButton>
  );
}
