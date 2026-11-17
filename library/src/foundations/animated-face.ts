import { FACES, parsePattern, type DotFaceMood } from "@/components/brand/patterns";
import { PALETTE, type Theme } from "./svg-assets";

/** Moods with eyes in the top rows blink on hover; love, done and waiting skip it (components/brand/DotFace.tsx). */
export const BLINKING: ReadonlySet<DotFaceMood> = new Set(["happy", "cheering", "wink", "surprised", "thinking", "sleepy", "sad"]);

/** Ripple delay of the dot at (row, column): distance from the centre of the 7 by 7 grid times 45ms, as DotFace computes it. */
export const rippleDelayMs = (row: number, column: number) => Math.round(Math.hypot(row - 3, column - 3) * 45);

const DOT = 20;
const GAP = DOT / 4;
const PAD = 12;
const LOOP_MS = 2800;
const r3 = (v: number) => String(Math.round(v * 1000) / 1000);

/**
 * A self-contained animated SVG of a dot face: the dots ripple out from the centre, the eyes blink
 * and the face lifts, then it rests, on a 2.8s loop. It follows the same geometry and the same
 * motion as the app's hover effect, drawn with CSS keyframes inside the file, so it also animates
 * when used as <img src>.
 *
 * Reduced motion: the file contains a prefers-reduced-motion rule, and it works when the SVG is
 * inlined in HTML or opened on its own. Browsers do NOT pass the viewer's setting into an SVG
 * used as an <img>, so there it always plays. Offer the static face where motion is unwelcome.
 */
export function animatedFaceSvg(mood: DotFaceMood, theme: Theme = "light") {
  const rows = parsePattern(FACES[mood]);
  const cols = rows[0].length;
  const grid = cols * DOT + (cols - 1) * GAP;
  const size = grid + PAD * 2;
  const palette = PALETTE[theme];
  const blinks = BLINKING.has(mood);
  const dots: string[] = [];
  rows.forEach((row, r) =>
    row.forEach((cell, c) => {
      const fill = palette[cell];
      if (cell === " " || !fill) return;
      const eye = blinks && cell === "O" && r >= 1 && r <= 2;
      dots.push(
        `<circle class="${eye ? "d e" : "d"}" style="animation-delay:${rippleDelayMs(r, c)}ms" cx="${r3(PAD + c * (DOT + GAP) + DOT / 2)}" cy="${r3(PAD + r * (DOT + GAP) + DOT / 2)}" r="${DOT / 2}" fill="${fill}"/>`,
      );
    }),
  );
  const title = `Yuyu ${mood} face, animated`;
  const css = `
    .f{transform-box:fill-box;transform-origin:center;animation:lift ${LOOP_MS}ms cubic-bezier(.34,1.4,.64,1) infinite}
    .d{transform-box:fill-box;transform-origin:center;animation:ripple ${LOOP_MS}ms cubic-bezier(.45,0,.2,1) infinite both}
    .e{animation:ripple ${LOOP_MS}ms cubic-bezier(.45,0,.2,1) infinite both,blink ${LOOP_MS}ms ease-in-out infinite both}
    @keyframes ripple{0%,20%,100%{scale:1}8%{scale:1.16}}
    @keyframes blink{0%,16%,26%,100%{transform:none}21%{transform:scaleY(.15)}}
    @keyframes lift{0%,60%,100%{transform:none}8%,45%{transform:translateY(-5px) rotate(-4deg)}}
    @media (prefers-reduced-motion:reduce){.f,.d,.e{animation:none}}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r3(size)}" height="${r3(size)}" viewBox="0 0 ${r3(size)} ${r3(size)}" role="img" aria-label="${title}">
  <title>${title}</title>
  <style>${css}
  </style>
  <g class="f">
  ${dots.join("\n  ")}
  </g>
</svg>
`;
}
