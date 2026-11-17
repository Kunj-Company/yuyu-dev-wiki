"use client";

import { useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Pipette, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { getAccentTokens, normalizeAccentHex } from "@/lib/theme/accent";
import { hexToHsv, hsvToHex, nudgeHsv, type Hsv } from "@/lib/theme/colorSpace";
import { IconButton } from "./button";
import { Input } from "./field";
import { Popover, PopoverContent, PopoverTrigger } from "./menu";

type EyeDropperResult = { sRGBHex: string };
type EyeDropperCtor = new () => { open: () => Promise<EyeDropperResult> };

const noSubscribe = () => () => {};
const HUE_TRACK = "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)";

/**
 * Custom colour picker (never the browser's own): a saturation/brightness
 * area, a hue slider, a hex box, the system eyedropper where available, and
 * a live sample of how buttons and links will look with the colour. The
 * trigger is passed in, so it can sit in a row of preset chips.
 */
export function ColorPicker({
  value,
  defaultColor,
  onChange,
  trigger,
  label = "Custom colour",
}: {
  /** "#RRGGBB", or "" for the default. */
  value: string;
  defaultColor: string;
  onChange: (hex: string) => void;
  trigger: ReactNode;
  label?: string;
}) {
  const current = normalizeAccentHex(value, defaultColor);
  // Keep HSV locally so the hue survives greys and blacks (where hex loses it).
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(current) ?? { h: 0, s: 0, v: 0 });
  const [hexText, setHexText] = useState(current);
  // The system eyedropper exists in Chromium browsers only; false while server rendering.
  const canEyedrop = useSyncExternalStore(noSubscribe, () => "EyeDropper" in window, () => false);

  // Follow outside changes (a preset chip, discard) without fighting our own edits.
  const [seen, setSeen] = useState(current);
  if (current !== seen) {
    setSeen(current);
    setHexText(current);
    if (hsvToHex(hsv) !== current) setHsv(hexToHsv(current) ?? hsv);
  }

  const apply = (next: Hsv) => {
    setHsv(next);
    const hex = hsvToHex(next);
    setHexText(hex);
    setSeen(hex);
    onChange(hex);
  };

  const applyHex = (raw: string) => {
    const hex = normalizeAccentHex(raw.startsWith("#") ? raw : `#${raw}`, "");
    if (!hex) return false;
    const next = hexToHsv(hex);
    if (next) {
      setHsv(next);
      setSeen(hex);
      onChange(hex);
    }
    return true;
  };

  const eyedrop = async () => {
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
    if (!Ctor) return;
    try {
      const result = await new Ctor().open();
      if (applyHex(result.sRGBHex)) setHexText(normalizeAccentHex(result.sRGBHex));
    } catch {
      // Cancelled with Escape: keep the current colour.
    }
  };

  const tokens = getAccentTokens(hsvToHex(hsv), "light");
  const hexValid = Boolean(normalizeAccentHex(hexText.startsWith("#") ? hexText : `#${hexText}`, ""));

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent aria-label={label} className="flex w-[min(288px,calc(100vw-32px))] flex-col gap-3.5 p-3.5">
        <SaturationArea hsv={hsv} onChange={apply} />

        <SliderPrimitive.Root
          value={[hsv.h]}
          min={0}
          max={359}
          step={1}
          onValueChange={([h]) => apply({ ...hsv, h: h ?? 0 })}
          aria-label="Hue"
          className="relative flex h-5 w-full touch-none select-none items-center"
        >
          <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full" style={{ background: HUE_TRACK }}>
            <SliderPrimitive.Range className="absolute h-full" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            aria-label="Hue"
            className="block size-5 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,.25),0_1px_3px_rgba(0,0,0,.3)] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{ backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1 }) }}
          />
        </SliderPrimitive.Root>

        <div className="flex items-center gap-2">
          <span aria-hidden className="size-10 shrink-0 rounded-lg border border-line" style={{ backgroundColor: hsvToHex(hsv) }} />
          <Input
            aria-label="Hex colour"
            aria-invalid={!hexValid}
            value={hexText}
            onChange={(event) => {
              setHexText(event.target.value);
              applyHex(event.target.value.trim());
            }}
            onBlur={() => setHexText(hsvToHex(hsv))}
            maxLength={7}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 py-2 font-mono uppercase"
          />
          {canEyedrop ? (
            <IconButton label="Pick a colour from the screen" variant="secondary" size="sm" onClick={eyedrop}>
              <Pipette />
            </IconButton>
          ) : null}
        </div>

        {/* How guests will see it: the button and link colours, contrast-adjusted like the event page. */}
        <div className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-3 py-2.5">
          <span
            className="inline-flex min-h-8 items-center rounded-full px-3.5 text-[13px] font-semibold"
            style={{ backgroundColor: tokens["--yy-accent"], color: tokens["--yy-on-accent"] }}
          >
            Register
          </span>
          <span className="text-[13px] font-semibold underline underline-offset-2" style={{ color: tokens["--yy-accent-text"] }}>
            Event link
          </span>
        </div>
        {tokens["--yy-accent-text"] !== tokens["--yy-accent"] ? (
          <p className="-mt-1.5 text-caption text-ink-muted">Text and links use a darker shade so they stay readable.</p>
        ) : null}

        <button
          type="button"
          onClick={() => onChange("")}
          disabled={!value}
          className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ink-secondary hover:text-ink disabled:opacity-50"
        >
          <RotateCcw aria-hidden className="size-4" />
          Use the default colour
        </button>
      </PopoverContent>
    </Popover>
  );
}

/** The 2D saturation (x) × brightness (y) area, with pointer and arrow-key control. */
function SaturationArea({ hsv, onChange }: { hsv: Hsv; onChange: (hsv: Hsv) => void }) {
  const area = useRef<HTMLDivElement>(null);

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = area.current?.getBoundingClientRect();
    if (!rect) return;
    const s = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const v = Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height));
    onChange({ h: hsv.h, s, v });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange(nudgeHsv(hsv, move[0], move[1]));
  };

  return (
    <div
      ref={area}
      role="slider"
      tabIndex={0}
      aria-label="Saturation and brightness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsv.s * 100)}
      aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%. Arrow keys adjust; hold Shift for bigger steps.`}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        fromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event);
      }}
      className="relative h-40 w-full cursor-crosshair touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      style={{
        backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1 }),
        backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
      }}
    >
      <span
        aria-hidden
        className={cn("pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,.3),0_1px_3px_rgba(0,0,0,.35)]")}
        style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hsvToHex(hsv) }}
      />
    </div>
  );
}
