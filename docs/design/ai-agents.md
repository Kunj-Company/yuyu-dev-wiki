# Use the design system with AI agents

Coding agents write better Yuyu UI when they are told the rules and given the real tokens. This page gives you a prompt to paste, and machine-readable files an agent can fetch. All of it is generated from the same data as the rest of this section, so it stays in step with the tokens and components.

## Quick start

1. Copy the **full prompt** below into the file your tool reads on every task.
2. Replace `<DOCS_URL>` with the address where this documentation is hosted.
3. Ask for UI as usual. The agent should reach for tokens and `components/ui` instead of hard-coding values.

| Tool | Where to put the prompt |
| --- | --- |
| Claude Code | `CLAUDE.md` in the repository root, or a file it imports |
| Codex, Gemini CLI and other `AGENTS.md` readers | `AGENTS.md` in the repository root |
| Cursor | A rule in `.cursor/rules/` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| A chat window or a system prompt | The short prompt below, plus a link to the tokens |

::: tip Copy it in one click
The [Component library](/library/index.html#/foundations/agent-kit) has the same prompts with copy and download buttons.
:::

## Machine-readable files

Agents that can fetch URLs should read these instead of scraping pages.

| File | What it holds |
| --- | --- |
| [`/design-system/tokens.json`](/design-system/tokens.json) | Every colour with light and dark values, CSS variable and Tailwind class, the four event accents, the type scale, spacing, radius, shadows, the Figma component map and the brand data |
| [`/design-system/tokens.css`](/design-system/tokens.css) | The CSS custom properties for light, dark and the event accent presets, ready to drop in |
| [`/design-system/agent-prompt.txt`](/design-system/agent-prompt.txt) | The full prompt below, as a file |
| [`/design-system/agent-prompt-short.txt`](/design-system/agent-prompt-short.txt) | The short prompt, as a file |
| [`/search/entries.json`](/search/entries.json) | The search index: every documentation section and every library component, prop, example, token and file, as one flat list with a location for each |
| [`/llms.txt`](/llms.txt) | An index of this documentation for agents that look for `llms.txt` |

## Short prompt

For a chat window or a quick task. It points the agent at the tokens and states the eight rules that matter most.

<<< @/public/design-system/agent-prompt-short.txt{md}

## Full prompt

This is the file to keep in your repository. It has the hard rules, the voice and copy rules, when to use which component, every colour token with its Tailwind class and both mode values, the type classes, spacing, radius and elevation, the brand rules, and the component list with import paths and key props.

<<< @/public/design-system/agent-prompt.txt{md}

## Keeping it current

The prompt and files are regenerated on every build from `library/src/foundations/tokens.json` and the component catalog. After you change Figma or Yuyu:

```bash
npm run library:sync   # re-vendor Yuyu's components, tokens and assets
npm run agent-kit      # rebuild tokens.json, then the prompt, tokens.css and llms.txt
```

If you edit values in Figma, update `library/src/foundations/figma.json` first. See [Figma file map](/design/figma).

## Further reading

- [Design principles and voice](/design/principles), [Design tokens](/design/tokens), [Colour reference](/design/colour), [Components](/design/components)
- [Contribute to the design system](/design/contributing)
