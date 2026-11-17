import { useMemo } from "react";
import { CodeBlock, Section, tokens } from "../lib";
import { colours, figmaVariablesJson, themeFile, tokensCssFile, w3cJson } from "../colour-utils";

export const meta = {
  slug: "token-exports",
  title: "Token exports",
  description: "Copy or download every token set: CSS variables, the Tailwind 4 theme, W3C design-tokens JSON and a Figma variables file.",
  order: 13,
};

export default function TokenExportsPage() {
  const files = useMemo(
    () => ({
      css: tokensCssFile(),
      theme: themeFile(),
      w3c: w3cJson(),
      figma: figmaVariablesJson(),
    }),
    [],
  );
  const figmaOnly = colours.filter((c) => c.source === "figma").map((c) => c.name);

  return (
    <>
      <Section id="overview" title="What is in each file" description={`All four files are generated in your browser from the same data as the other Foundations pages (${colours.length} colours, ${tokens.accents.length} event accents, ${tokens.type.length} text styles), so they cannot drift from what you see here.`}>
        <ul className="list-disc space-y-1 pl-5 text-body-ui text-ink-secondary">
          <li><b>tokens.css</b>: every colour as a <code>--yy-*</code> variable for light, dark and <code>prefers-color-scheme</code>, plus the shadows. Same structure as Yuyu&apos;s own file.</li>
          <li><b>theme.css</b>: the Tailwind 4 <code>@theme inline</code> block that turns those variables into utilities such as <code>bg-canvas</code> and <code>text-ink</code>.</li>
          <li><b>tokens.json</b>: platform-neutral JSON in the W3C design-tokens format, with colour, spacing, radius, shadow and typography.</li>
          <li><b>figma-variables.json</b>: a Color collection with Light and Dark modes and an Event accent collection with the four presets, ready to map onto Figma variables.</li>
        </ul>
        <p className="mt-3 max-w-2xl text-caption text-ink-muted">
          {figmaOnly.length} tokens exist only in Figma ({figmaOnly.join(", ")}). They are included in tokens.css, tokens.json and the Figma file, but not in theme.css because the code has no Tailwind utility for them yet.
        </p>
      </Section>

      <Section id="css" title="tokens.css" description="Light values under :root, dark under data-color-mode and .yy-dark-band, and a prefers-color-scheme mirror for visitors with no saved choice.">
        <CodeBlock filename="tokens.css" language="css" code={files.css} />
      </Section>

      <Section id="theme" title="Tailwind 4 theme" description="Colour lines come from each token's Tailwind names. Fonts, radius, shadows, breakpoints and the easing curve are copied from Yuyu's globals.css.">
        <CodeBlock filename="theme.css" language="css" code={files.theme} />
      </Section>

      <Section id="json" title="Design tokens JSON (W3C format)" description="Each token has $type and $value. For colours $value is the light value and the dark value sits in $extensions.mode. Dimensions are in px; tracking is converted from Figma percent to em.">
        <CodeBlock filename="tokens.json" language="json" code={files.w3c} />
      </Section>

      <Section id="figma" title="Figma variables JSON" description="Two collections. Color has modes Light and Dark and one variable per token, named Group/token. Event accent has one mode per preset (Ember, Iris, Teal, Ink) and the variables accent, accent-soft and accent-text.">
        <CodeBlock filename="figma-variables.json" language="json" code={files.figma} />
        <p className="mt-3 max-w-2xl text-caption text-ink-muted">
          This is a neutral shape for a variables plugin or script to import, generated from the token data rather than exported from Figma. The Event accent presets are light only, because the Figma file has no dark values for them.
        </p>
      </Section>
    </>
  );
}
