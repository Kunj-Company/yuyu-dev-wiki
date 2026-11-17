import { useState } from "react";
import { cn } from "@/lib/cn";
import { Callout } from "@/components/ui/display";
import { Download } from "lucide-react";
import { assetUrl, CodeBlock, CopyButton, DownloadLink, downloadText, Section } from "../lib";
import fullPrompt from "../../../../docs/public/design-system/agent-prompt.txt?raw";
import shortPrompt from "../../../../docs/public/design-system/agent-prompt-short.txt?raw";

export const meta = {
  slug: "agent-kit",
  title: "Use with AI agents",
  description: "A prompt to paste into your coding agent, plus the tokens as JSON and CSS, so agents build with Yuyu's design system instead of guessing.",
  order: 40,
};

const targets = [
  { tool: "Claude Code", file: "CLAUDE.md", note: "Repository root, or import it from CLAUDE.md." },
  { tool: "AGENTS.md readers (Codex, Gemini CLI and others)", file: "AGENTS.md", note: "Repository root." },
  { tool: "Cursor", file: "yuyu-design-system.mdc", note: "Put it in .cursor/rules/." },
  { tool: "GitHub Copilot", file: "copilot-instructions.md", note: "Put it in .github/." },
];

const files = [
  { name: "tokens.json", href: "design-system/tokens.json", what: "Every colour (light and dark) with its CSS variable and Tailwind class, event accents, type, spacing, radius, shadows, component map" },
  { name: "tokens.css", href: "design-system/tokens.css", what: "CSS custom properties for light, dark and the event accent presets" },
  { name: "agent-prompt.txt", href: "design-system/agent-prompt.txt", what: "The full prompt, as a file" },
  { name: "agent-prompt-short.txt", href: "design-system/agent-prompt-short.txt", what: "The short prompt, as a file" },
  { name: "llms.txt", href: "llms.txt", what: "Index of the documentation for agents" },
];

// The docs site serves these next to /library/, so they are one level up from the gallery.
const docsFile = (path: string) => new URL(`../${path}`, new URL(assetUrl(""), window.location.href)).href;

export default function AgentKit() {
  const [tab, setTab] = useState<"full" | "short">("full");
  const prompt = tab === "full" ? fullPrompt : shortPrompt;
  return (
    <>
      <Callout tone="info" title="Replace <DOCS_URL>">
        Both prompts link to the tokens and components with a <code className="font-mono">&lt;DOCS_URL&gt;</code> placeholder. Replace it with the address where this documentation is hosted before you paste.
      </Callout>

      <Section title="The prompt" description="Paste it into the file your tool reads on every task. Use the short one for a chat window.">
        <div role="tablist" aria-label="Prompt length" className="mb-3 inline-flex rounded-full border border-line bg-subtle p-1 text-sm">
          {(["full", "short"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("rounded-full px-4 py-1.5 font-semibold", tab === t ? "bg-canvas text-ink shadow-segment" : "text-ink-secondary hover:text-ink")}
            >
              {t === "full" ? `Full (${Math.round(fullPrompt.length / 1024)} KB)` : "Short"}
            </button>
          ))}
        </div>
        <CodeBlock wrap code={prompt} filename={tab === "full" ? "agent-prompt.txt" : "agent-prompt-short.txt"} />
      </Section>

      <Section title="Where it goes">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-subtle text-caption uppercase text-ink-muted">
              <tr><th className="px-3 py-2">Tool</th><th className="px-3 py-2">File</th><th className="px-3 py-2">Note</th><th className="px-3 py-2"><span className="sr-only">Download</span></th></tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.tool} className="border-t border-line">
                  <td className="px-3 py-2">{t.tool}</td>
                  <td className="px-3 py-2 font-mono text-[13px]">{t.file}</td>
                  <td className="px-3 py-2 text-ink-secondary">{t.note}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => downloadText(t.file, fullPrompt)}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-line bg-canvas px-2 py-1 text-caption text-ink-secondary hover:bg-subtle hover:text-ink"
                    >
                      <Download size={13} aria-hidden /> Full prompt as {t.file}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Machine-readable files" description="Agents that can fetch URLs should read these instead of scraping pages. They are regenerated on every build.">
        <ul className="divide-y divide-line rounded-xl border border-line">
          {files.map((f) => {
            const url = docsFile(f.href);
            return (
              <li key={f.name} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[13px] font-semibold">{f.name}</p>
                  <p className="text-sm text-ink-secondary">{f.what}</p>
                </div>
                <CopyButton value={url} label="Copy URL" />
                <DownloadLink href={url} filename={f.name} />
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}
