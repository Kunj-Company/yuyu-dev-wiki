import { useState, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import tokens from "./tokens.json";

export { tokens };

/** URL of a file under library/public (works on any sub-path because the build uses a relative base). */
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

/** Copy text and report success for a moment. */
export function useCopy(timeout = 1400) {
  const [done, setDone] = useState<string | null>(null);
  const copy = (text: string, key = text) => {
    const finish = () => {
      setDone(key);
      window.setTimeout(() => setDone((v) => (v === key ? null : v)), timeout);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(finish, finish);
    else {
      const el = Object.assign(document.createElement("textarea"), { value: text });
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
      finish();
    }
  };
  return { copy, isDone: (key: string) => done === key };
}

/** Save text (SVG, CSS, JSON) as a file in the browser. */
export function downloadText(filename: string, text: string, type = "text/plain") {
  downloadBlob(filename, new Blob([text], { type }));
}
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Small "Copy" pill. `label` is the visible text, `value` is what lands on the clipboard. */
export function CopyButton({ value, label = "Copy", className, title }: { value: string; label?: ReactNode; className?: string; title?: string }) {
  const { copy, isDone } = useCopy();
  const done = isDone(value);
  return (
    <button
      type="button"
      title={title ?? `Copy ${value}`}
      onClick={() => copy(value)}
      className={cn("inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 text-caption text-ink-secondary hover:bg-subtle hover:text-ink", className)}
    >
      {done ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      <span>{done ? "Copied" : label}</span>
      <span className="sr-only" aria-live="polite">{done ? "Copied to clipboard" : ""}</span>
    </button>
  );
}

export function DownloadLink({ href, filename, children, className }: { href: string; filename?: string; children?: ReactNode; className?: string }) {
  return (
    <a href={href} download={filename ?? href.split("/").pop()} className={cn("inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 text-caption text-ink-secondary hover:bg-subtle hover:text-ink", className)}>
      <Download size={13} aria-hidden />
      {children ?? "Download"}
    </a>
  );
}

/** A code block with a copy button, for CSS, JSON and snippets. */
export function CodeBlock({ code, filename, language, wrap }: { code: string; filename?: string; language?: string; wrap?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-subtle px-3 py-1.5 text-caption text-ink-muted">
        <span className="font-mono">{filename ?? language ?? ""}</span>
        <span className="flex gap-1">
          <CopyButton value={code} />
          {filename ? (
            <button type="button" onClick={() => downloadText(filename, code)} className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 text-caption text-ink-secondary hover:bg-subtle hover:text-ink">
              <Download size={13} aria-hidden /> Download
            </button>
          ) : null}
        </span>
      </div>
      <pre tabIndex={0} className={cn("max-h-[28rem] overflow-auto bg-canvas p-4 font-mono text-[13px] leading-relaxed text-ink", wrap && "whitespace-pre-wrap break-words")}><code>{code}</code></pre>
    </div>
  );
}

/** Heading block used inside Foundations pages. */
export function Section({ id, title, description, children }: { id?: string; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mt-12 first:mt-8">
      <h2 className="text-h3">{title}</h2>
      {description ? <p className="mt-1 max-w-2xl text-ink-secondary">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
