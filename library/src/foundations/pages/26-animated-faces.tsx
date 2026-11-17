import { useEffect, useRef, useState } from "react";
import { Play, Repeat } from "lucide-react";
import { DotFace } from "@/components/brand/DotFace";
import { DotLoader } from "@/components/brand/DotLoader";
import { FACE_MOODS, FACES, parsePattern, type DotFaceMood } from "@/components/brand/patterns";
import { Callout, EmptyState } from "@/components/ui/display";
import { cn } from "@/lib/cn";
import { CodeBlock, Section } from "../lib";
import { AssetActions, Stage, SvgImg, type Theme } from "../svg-assets";
import { BLINKING, animatedFaceSvg, rippleDelayMs } from "../animated-face";
import globalsCss from "../../vendor/app/globals.css?raw";
import type { FoundationMeta } from "../registry";

export const meta: FoundationMeta = {
  slug: "animated-faces",
  title: "Animated faces",
  description: "How Yuyu's dot faces move: the ripple, the blink and the lift. Replay each face, read the exact timings, and take an animated SVG with you.",
  order: 26,
};

const MEANING: Record<DotFaceMood, string> = {
  happy: "Hello, the default face",
  cheering: "You're in!",
  wink: "Checked in",
  love: "Loved it (feedback)",
  done: "All set",
  waiting: "On the waitlist",
  surprised: "This event is full",
  thinking: "Loading",
  sleepy: "No events yet",
  sad: "Something went wrong",
};

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The face CSS exactly as Yuyu ships it (globals.css), so the page cannot drift from the app. */
const FACE_CSS = (() => {
  const start = globalsCss.indexOf("/* Dot faces (components/brand/DotFace.tsx)");
  const end = globalsCss.indexOf("/* 404 ticket", start);
  return start === -1 || end === -1 ? "" : globalsCss.slice(start, end).trim();
})();

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A counter that re-triggers the one-shot animation: toggle the class off, then on, on the next frame. */
function usePlay(loop: boolean, nonce: number) {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number>(0);
  const play = () => {
    window.clearTimeout(timer.current);
    setPlaying(false);
    requestAnimationFrame(() => {
      setPlaying(true);
      timer.current = window.setTimeout(() => setPlaying(false), 1500);
    });
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (nonce > 0) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  useEffect(() => {
    if (!loop) return;
    play();
    const id = window.setInterval(play, 2400);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop]);
  return { playing, play };
}

function FaceTile({ mood, size, theme, loop, nonce }: { mood: DotFaceMood; size: number; theme: Theme; loop: boolean; nonce: number }) {
  const { playing, play } = usePlay(loop, nonce);
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-3">
      <Stage theme={theme} className="group min-h-[10rem] flex-1 p-4">
        <DotFace mood={mood} size={size} className={cn(playing && "yy-face-play")} label={`${label(mood)} face`} />
      </Stage>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{label(mood)}</h3>
          <p className="text-caption text-ink-secondary">{MEANING[mood]}</p>
          <p className="mt-0.5 text-caption text-ink-muted">{BLINKING.has(mood) ? "Ripple, blink and lift" : "Ripple and lift, no blink"}</p>
        </div>
        <button
          type="button"
          onClick={play}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 text-caption text-ink-secondary hover:bg-subtle hover:text-ink"
          aria-label={`Play the ${mood} face animation`}
        >
          <Play size={13} aria-hidden /> Play
        </button>
      </div>
    </article>
  );
}

function Gallery() {
  const [size, setSize] = useState(96);
  const [theme, setTheme] = useState<Theme>("light");
  const [loop, setLoop] = useState(false);
  const [nonce, setNonce] = useState(0);
  const noMotion = reduced();
  return (
    <>
      {noMotion ? (
        <Callout tone="info" title="Reduced motion is on">
          Your system asks for less motion, so the faces stay still, as they do in Yuyu. Turn it off in your system settings to see the animation.
        </Callout>
      ) : null}
      <div className="sticky top-0 z-10 -mx-1 mb-4 mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-canvas/95 px-3 py-2 backdrop-blur">
        <button type="button" onClick={() => setNonce((n) => n + 1)} className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-on-primary hover:opacity-90">
          <Play size={14} aria-hidden /> Play all
        </button>
        <button
          type="button"
          aria-pressed={loop}
          onClick={() => setLoop((v) => !v)}
          className={cn("inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-semibold", loop ? "border-transparent bg-inverse text-on-inverse" : "border-line-strong text-ink hover:bg-subtle")}
        >
          <Repeat size={14} aria-hidden /> Loop
        </button>
        <label className="flex items-center gap-2 text-caption text-ink-secondary">
          Size
          <input type="range" min={48} max={160} step={4} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-32 accent-[var(--yy-brand-marigold-deep)]" />
          <span className="w-12 font-mono">{size}px</span>
        </label>
        <div role="group" aria-label="Stage theme" className="inline-flex rounded-md border border-line p-0.5 text-caption">
          {(["light", "dark"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)} className={cn("rounded px-2.5 py-0.5", theme === t ? "bg-emphasis text-ink" : "text-ink-secondary hover:text-ink")}>
              {label(t)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FACE_MOODS.map((m) => (
          <FaceTile key={m} mood={m} size={size} theme={theme} loop={loop} nonce={nonce} />
        ))}
      </div>
      <p className="mt-3 text-caption text-ink-muted">In the app the same motion starts when you hover the face with a mouse. Press Play here to see it without one.</p>
    </>
  );
}

/** The ripple delay of every dot, so the "out from the centre" order is visible. */
function DelayMap() {
  const [mood, setMood] = useState<DotFaceMood>("happy");
  const rows = parsePattern(FACES[mood]);
  return (
    <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
      <div>
        <label className="text-caption text-ink-secondary" htmlFor="delay-mood">Face</label>
        <select id="delay-mood" value={mood} onChange={(e) => setMood(e.target.value as DotFaceMood)} className="mt-1 block rounded-md border border-line-strong bg-canvas px-2 py-1 text-sm">
          {FACE_MOODS.map((m) => (
            <option key={m} value={m}>{label(m)}</option>
          ))}
        </select>
        <table className="mt-3 border-separate border-spacing-1 text-center font-mono text-[11px]">
          <caption className="sr-only">Ripple delay in milliseconds for each dot of the {mood} face</caption>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className={cn("h-8 w-10 rounded", cell === " " ? "" : cell === "O" ? "bg-inverse text-on-inverse" : "bg-tint-peach text-ink")}>
                    {cell === " " ? "" : rippleDelayMs(r, c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="max-w-md text-sm text-ink-secondary">
        Each dot waits <code className="font-mono">round(hypot(row − 3, column − 3) × 45)</code> ms before it pulses, counted from the centre of the 7 by 7 grid. The middle dot goes first and the corners go last (about 191ms later). Ink dots, the eyes and mouth, are dark. The eyes (ink dots in rows 1 and 2) also blink on the faces that have eyes up there.
      </p>
    </div>
  );
}

const SPEC: Array<[string, string]> = [
  ["Trigger", "Hovering the face, or any ancestor with the group class (a card), with a mouse. Touch screens and keyboards do not start it."],
  ["Ripple", "Every dot scales to 1.16 and back over 560ms (ease cubic-bezier(0.45, 0, 0.2, 1)), starting from the centre outwards with a 45ms step per grid distance (table above)."],
  ["Blink", "The eyes (ink dots in rows 1 and 2) squash to 15% height and back over 900ms. Happy, Cheering, Wink, Surprised, Thinking, Sleepy and Sad blink. Love, Done and Waiting do not."],
  ["Lift", "The whole face rises 4px and tilts −4° with a springy 320ms ease (cubic-bezier(0.34, 1.4, 0.64, 1)), then settles back when the pointer leaves."],
  ["Reduced motion", "Nothing moves. The CSS only applies when the system does not ask for reduced motion."],
  ["Opt out", "Pass hover={false} where a face must stay still. The class and the per-dot styles are not added at all."],
  ["Accessibility", "Faces carry meaning, but keep the words beside them. Pass label to expose a face as an image. Otherwise it is decorative."],
];

function Spec() {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[560px] text-left text-sm">
        <tbody>
          {SPEC.map(([k, v]) => (
            <tr key={k} className="border-t border-line first:border-t-0">
              <th scope="row" className="w-36 bg-subtle px-3 py-2 align-top font-semibold">{k}</th>
              <td className="px-3 py-2 text-ink-secondary">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InCards() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {([
        ["sleepy", "No events yet", "Create your first event to see it here."],
        ["sad", "We couldn't load this", "Check your connection and try again."],
        ["cheering", "You're in!", "We've sent your ticket to your email."],
      ] as const).map(([mood, title, body]) => (
        <div key={mood} className="group rounded-2xl border border-line bg-canvas p-2">
          <EmptyState mood={mood} title={title}>{body}</EmptyState>
        </div>
      ))}
    </div>
  );
}

const APPEARS: Array<[string, string]> = [
  ["Empty states", "EmptyState takes a mood: Sleepy for empty lists, Sad for errors and not found, Cheering for “You're in”, Wink for checked in, Waiting for the waitlist, Thinking for loading."],
  ["Dashboard home greeting", "Happy normally, Cheering during an event, Sleepy when nothing is planned."],
  ["Activity feed", "One line per sign-up, waitlist join, check-in or feedback, each with a mood face."],
  ["Who makes Yuyu", "A 64px Happy face in the maker card."],
  ["Not on organiser surfaces", "The organisation page and the event schedule do not show faces. The 404 page has a companion instead of a face."],
];

function AnimatedExport() {
  const [mood, setMood] = useState<DotFaceMood>("happy");
  const [theme, setTheme] = useState<Theme>("light");
  const svg = animatedFaceSvg(mood, theme);
  return (
    <>
    <div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        <Stage theme={theme} className="aspect-square">
          <SvgImg svg={svg} className="w-3/4" alt={`${label(mood)} face, animated`} />
        </Stage>
        <AssetActions name={`yuyu-face-${mood}-animated`} svg={svg} className="mt-2" pngSizes={[128, 256, 512]} />
        <p className="mt-1 text-caption text-ink-muted">The PNG is the first frame.</p>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="anim-mood" className="text-caption text-ink-secondary">Face</label>
            <select id="anim-mood" value={mood} onChange={(e) => setMood(e.target.value as DotFaceMood)} className="mt-1 block rounded-md border border-line-strong bg-canvas px-2 py-1 text-sm">
              {FACE_MOODS.map((m) => (
                <option key={m} value={m}>{label(m)}</option>
              ))}
            </select>
          </div>
          <div role="group" aria-label="Theme" className="inline-flex rounded-md border border-line p-0.5 text-caption">
            {(["light", "dark"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)} className={cn("rounded px-2.5 py-0.5", theme === t ? "bg-emphasis text-ink" : "text-ink-secondary hover:text-ink")}>
                {label(t)}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm text-ink-secondary">
          A single SVG file that loops the ripple, blink and lift on a 2.8 second cycle, with the keyframes inside the file. It animates when used as an image (<code className="font-mono">&lt;img src="face.svg"&gt;</code>), in slides, docs and emails that allow SVG. It matches the app's geometry and timings. It is generated here and is not a file Yuyu ships.
        </p>
        <div className="mt-3">
          <CodeBlock code={svg} filename={`yuyu-face-${mood}-animated.svg`} />
        </div>
      </div>
    </div>
    <Callout tone="warning" title="Reduced motion" className="mt-4">
      The file stills itself for people who prefer reduced motion when it is inlined in HTML or opened on its own. Browsers do not pass that setting into an SVG used as an image, so in an <code className="font-mono">&lt;img&gt;</code> it always plays. Where motion is unwelcome, use the static face from <a href="#/foundations/faces-and-icons" className="underline underline-offset-4">Dot faces and icons</a>.
    </Callout>
    </>
  );
}

const REACT_USAGE = `import { DotFace } from "@/components/brand/DotFace";

// Animates on hover (mouse only). Wrap in a "group" card to animate when the card is hovered.
<div className="group rounded-2xl border border-line p-6">
  <DotFace mood="cheering" size={96} label="Cheering face" />
</div>

// A face that must stay still:
<DotFace mood="sleepy" size={64} hover={false} />

// Through EmptyState (the usual way): Sleepy, Sad, Cheering, Wink, Waiting, Thinking
<EmptyState mood="sleepy" title="No events yet">Create your first event to see it here.</EmptyState>`;

export default function AnimatedFaces() {
  return (
    <>
      <Section title="See it move" description="Ten faces, one motion. Press Play on a face, Play all, or turn on Loop. With a mouse you can also just hover a face.">
        <Gallery />
      </Section>

      <Section title="How it moves" description="The exact motion, from components/brand/DotFace.tsx and the .yy-face rules in globals.css.">
        <Spec />
        <h3 className="mt-8 text-h4">Ripple order</h3>
        <p className="mb-3 mt-1 text-sm text-ink-secondary">Delay in milliseconds before each dot pulses.</p>
        <DelayMap />
      </Section>

      <Section title="In a card" description="Faces animate when any group ancestor is hovered, so a whole card can wake its face. Hover a card.">
        <InCards />
      </Section>

      <Section title="Where faces appear" description="Faces carry meaning, not decoration. They are always live DotFace grids, never images.">
        <ul className="divide-y divide-line rounded-xl border border-line">
          {APPEARS.map(([k, v]) => (
            <li key={k} className="grid gap-1 p-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <span className="font-semibold">{k}</span>
              <span className="text-sm text-ink-secondary">{v}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Loading: the hopping dots" description="DotLoader is three dots, two marigold and one ink, hopping left to right in turn on a 1.2 second loop with a 160ms stagger. With reduced motion the dots rest on the baseline.">
        <div className="flex flex-wrap items-center gap-8 rounded-xl border border-line p-6">
          <DotLoader size={48} label="Loading" />
          <DotLoader size={32} label="Loading" />
          <Stage theme="dark" className="p-6"><DotLoader size={48} label="Loading" /></Stage>
        </div>
      </Section>

      <Section title="Take it with you" description="Use the component in React, copy the CSS for another stack, or download an animated SVG.">
        <h3 className="text-h4">React</h3>
        <div className="mt-2"><CodeBlock code={REACT_USAGE} language="tsx" /></div>
        <h3 className="mt-8 text-h4">CSS</h3>
        <p className="mb-2 mt-1 text-sm text-ink-secondary">Copied from Yuyu's globals.css. Add the face class to the grid root, a face-dot class to every dot, and a face-eye class to the eyes, with the per-dot delay as a custom property (the component sets all of this for you).</p>
        <CodeBlock code={FACE_CSS} filename="dot-face-motion.css" />
        <h3 className="mt-8 text-h4">Animated SVG</h3>
        <div className="mt-3"><AnimatedExport /></div>
      </Section>
    </>
  );
}
