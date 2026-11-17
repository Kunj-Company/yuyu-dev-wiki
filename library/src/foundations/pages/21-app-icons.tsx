import type { ReactNode } from "react";
import { DotMark } from "@/components/brand/DotMark";
import { CodeBlock, CopyButton, DownloadLink, Section, assetUrl } from "../lib";
import { AssetActions, Stage, SvgImg, appIconSvg, avatarSvg, formatBytes, useFileSizes, type AppIconTheme } from "../svg-assets";
import type { FoundationMeta } from "../registry";

export const meta: FoundationMeta = {
  slug: "app-icons",
  title: "App icons, favicons and social",
  description: "The shipped icon, favicon, PWA, share-card and email files, how Yuyu wires them, and the Figma app icon themes drawn from the same dot pattern.",
  order: 21,
};

type FileRow = { file: string; dims: string; purpose: string; svg?: boolean; yuyu: string };
const B = "assets/brand/";
const FILES: Record<string, FileRow> = {
  "app-icon.svg": { file: "app-icon.svg", dims: "180 × 180", svg: true, yuyu: "public/brand/app-icon.svg", purpose: "Master for the Ink app icon. icon-192.png and icon-512.png are rasterised from it, and so is the 48px frame of favicon.ico." },
  "icon-192.png": { file: "icon-192.png", dims: "192 × 192", yuyu: "/brand/icon-192.png", purpose: "Web manifest icon, purpose any." },
  "icon-512.png": { file: "icon-512.png", dims: "512 × 512", yuyu: "/brand/icon-512.png", purpose: "Web manifest icon, purpose any." },
  "maskable.svg": { file: "maskable.svg", dims: "512 × 512", svg: true, yuyu: "public/brand/maskable.svg", purpose: "Full-bleed ink square with the mark inside the safe zone, so any launcher mask can crop it." },
  "maskable-512.png": { file: "maskable-512.png", dims: "512 × 512", yuyu: "/brand/maskable-512.png", purpose: "Web manifest icon, purpose maskable." },
  "apple-touch-icon.svg": { file: "apple-touch-icon.svg", dims: "180 × 180", svg: true, yuyu: "public/brand/apple-touch-icon.svg", purpose: "Master for the iOS home screen icon." },
  "apple-touch-icon.png": { file: "apple-touch-icon.png", dims: "180 × 180", yuyu: "/brand/apple-touch-icon.png", purpose: "iOS home screen icon: a full ink square with no transparency (iOS rounds the corners). Copied to app/apple-icon.png." },
  "favicon-32.svg": { file: "favicon-32.svg", dims: "32 × 32", svg: true, yuyu: "public/brand/favicon-32.svg", purpose: "Bright dots only, white base dot, on an ink tile. Copied to app/icon.svg." },
  "favicon-16.svg": { file: "favicon-16.svg", dims: "16 × 16", svg: true, yuyu: "public/brand/favicon-16.svg", purpose: "Pixel-aligned 2px dots on an ink tile. Used for the 16px frame of favicon.ico." },
  "og-default.svg": { file: "og-default.svg", dims: "1200 × 630", svg: true, yuyu: "public/brand/og-default.svg", purpose: "Master of the default share card." },
  "og-default.png": { file: "og-default.png", dims: "1200 × 630", yuyu: "/brand/og-default.png", purpose: "Default social card (Open Graph and Twitter) for Yuyu's own pages. Event pages set their own image." },
  "email-lockup.png": { file: "email-lockup.png", dims: "365 × 108", yuyu: "/brand/email-lockup.png", purpose: "Email header: hosted PNG, never inline SVG. Rasterised at 3× for 36px-tall display; use it with width, height and alt=\"Yuyu\"." },
};

function FileList({ keys, sizes }: { keys: string[]; sizes: Record<string, number | null> }) {
  return (
    <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
      {keys.map((k) => {
        const f = FILES[k];
        const size = sizes[B + f.file];
        return (
          <li key={k} className="space-y-2 p-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <code className="font-mono text-body font-semibold">{f.file}</code>
              <span className="text-caption text-ink-muted">{f.dims}{size ? ` · ${formatBytes(size)}` : ""}</span>
            </div>
            <p className="text-caption text-ink-secondary">{f.purpose}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {f.svg ? <AssetActions name={f.file.replace(/\.svg$/, "")} svg={{ url: B + f.file }} pngSizes={[16, 32, 64, 128, 180, 192, 256, 512]} defaultPng={Number(f.dims.split(" ")[0])} /> : null}
              <DownloadLink href={assetUrl(B + f.file)} filename={f.file}>{f.svg ? "Download file" : "Download PNG"}</DownloadLink>
              <CopyButton value={f.yuyu} label="Copy path" title={`Copy ${f.yuyu}`} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function FileCard({ title, preview, keys, sizes, children }: { title: string; preview: ReactNode; keys: string[]; sizes: Record<string, number | null>; children?: ReactNode }) {
  return (
    <article className="rounded-xl border border-line bg-canvas p-4">
      <h3 className="text-h4">{title}</h3>
      <div className="mt-3">{preview}</div>
      {children}
      <FileList keys={keys} sizes={sizes} />
    </article>
  );
}

const img = (file: string, w: number, h: number, alt: string, cls = "") => <img src={assetUrl(B + file)} width={w} height={h} alt={alt} className={cls} draggable={false} />;

function Shipped() {
  const sizes = useFileSizes(Object.values(FILES).map((f) => B + f.file));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FileCard
        title="App icon (web manifest)"
        sizes={sizes}
        keys={["app-icon.svg", "icon-192.png", "icon-512.png"]}
        preview={<Stage theme="light" className="h-36 gap-4">{img("app-icon.svg", 96, 96, "Yuyu app icon")}{img("icon-192.png", 64, 64, "Yuyu app icon, 192px PNG")}</Stage>}
      />
      <FileCard
        title="Maskable icon"
        sizes={sizes}
        keys={["maskable.svg", "maskable-512.png"]}
        preview={
          <Stage theme="light" className="h-36 gap-4">
            {img("maskable.svg", 96, 96, "Maskable icon, uncropped")}
            {img("maskable.svg", 96, 96, "Maskable icon cropped to a circle", "rounded-full")}
            <span className="absolute bottom-1.5 right-2 text-caption text-[#5f5e5a]">square, circle mask</span>
          </Stage>
        }
      />
      <FileCard
        title="Apple touch icon"
        sizes={sizes}
        keys={["apple-touch-icon.svg", "apple-touch-icon.png"]}
        preview={<Stage theme="light" className="h-36">{img("apple-touch-icon.png", 90, 90, "Apple touch icon", "rounded-[22%]")}<span className="absolute bottom-1.5 right-2 text-caption text-[#5f5e5a]">shown with iOS corners</span></Stage>}
      />
      <FileCard
        title="Favicons"
        sizes={sizes}
        keys={["favicon-32.svg", "favicon-16.svg"]}
        preview={
          <Stage theme="light" className="h-36 gap-6">
            <figure className="flex flex-col items-center gap-1">{img("favicon-32.svg", 96, 96, "Favicon 32, enlarged")}<figcaption className="text-caption text-[#5f5e5a]">32, enlarged</figcaption></figure>
            <figure className="flex flex-col items-center gap-1">{img("favicon-16.svg", 96, 96, "Favicon 16, enlarged")}<figcaption className="text-caption text-[#5f5e5a]">16, enlarged</figcaption></figure>
            <figure className="flex flex-col items-center gap-1">
              <span className="flex items-end gap-1">{img("favicon-32.svg", 32, 32, "Favicon 32 at actual size")}{img("favicon-16.svg", 16, 16, "Favicon 16 at actual size")}</span>
              <figcaption className="text-caption text-[#5f5e5a]">actual size</figcaption>
            </figure>
          </Stage>
        }
      >
        <p className="mt-3 text-caption text-ink-secondary">
          <code className="font-mono">app/favicon.ico</code> in Yuyu is built by <code className="font-mono">scripts/generate-brand-assets.ts</code> from these two files at 16 and 32 plus the full-grid app icon at 48. The ICO itself is not part of this kit.
        </p>
      </FileCard>
      <FileCard
        title="Default social card"
        sizes={sizes}
        keys={["og-default.svg", "og-default.png"]}
        preview={<Stage theme="dark" className="h-auto overflow-hidden p-0">{img("og-default.png", 1200, 630, "Yuyu default share card", "h-auto w-full")}</Stage>}
      />
      <FileCard
        title="Email lockup"
        sizes={sizes}
        keys={["email-lockup.png"]}
        preview={<Stage theme="light" className="h-36">{img("email-lockup.png", 183, 54, "Yuyu")}</Stage>}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- Figma themes */

const THEMES: Array<{ id: AppIconTheme; title: string; note: string; shipped?: string }> = [
  { id: "ink", title: "Ink", note: "Shipped as app-icon.svg (the master for the PWA icons).", shipped: B + "app-icon.svg" },
  { id: "light", title: "Light", note: "Generated here from the pattern; Yuyu does not ship a light app icon." },
  { id: "marigold", title: "Marigold", note: "Generated here; the on-marigold mark pattern on a marigold tile." },
];

function Themes() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {THEMES.map((t) => (
        <article key={t.id} className="rounded-xl border border-line bg-canvas p-4">
          <h3 className="text-h4">{t.title}</h3>
          <Stage theme="light" className="mt-3 h-36">
            {t.shipped ? <img src={assetUrl(t.shipped)} width={96} height={96} alt={`${t.title} app icon`} draggable={false} /> : <SvgImg svg={appIconSvg(t.id)} width={96} height={96} alt={`${t.title} app icon`} />}
          </Stage>
          <p className="mt-2 text-caption text-ink-secondary">{t.note}</p>
          <AssetActions className="mt-2" name={`yuyu-app-icon-${t.id}`} svg={t.shipped ? { url: t.shipped } : appIconSvg(t.id)} pngSizes={[48, 96, 180, 192, 512]} defaultPng={192} />
        </article>
      ))}
    </div>
  );
}

function FaviconAndAvatar() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-h4">Favicons 32 and 16 (live)</h3>
        <p className="mt-0.5 text-ink-secondary">Bright dots only, on an ink tile. The real <code className="font-mono">DotMark</code> (bright variant) on a dark tile, at the real sizes; under 32px it picks the small-size marigold.</p>
        <Stage theme="dark" className="mt-3 h-36 gap-6 !bg-[#18181B]">
          {[32, 16].map((s) => (
            <figure key={s} className="flex flex-col items-center gap-1">
              <span className="flex items-center justify-center rounded-[25%] bg-[#18181B] ring-1 ring-[#2a2a2e]" style={{ width: s + 8, height: s + 8 }}>
                <DotMark size={s} variant="bright" label={`Favicon ${s}`} />
              </span>
              <figcaption className="text-caption text-ink-muted">{s}px</figcaption>
            </figure>
          ))}
        </Stage>
        <p className="mt-2 text-caption text-ink-secondary">Export the shipped files above (favicon-32.svg, favicon-16.svg) with SVG and PNG buttons.</p>
      </article>
      <article className="rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-h4">Social avatar (generated)</h3>
        <p className="mt-0.5 text-ink-secondary">Figma defines a social avatar; Yuyu does not ship a file for it. This one is generated here: a full-bleed ink square with the full mark in the circle-safe zone, so a platform can crop it to a circle.</p>
        <Stage theme="light" className="mt-3 h-36 gap-4">
          <SvgImg svg={avatarSvg()} width={96} height={96} alt="Social avatar" />
          <SvgImg svg={avatarSvg()} width={96} height={96} alt="Social avatar cropped to a circle" className="rounded-full" />
        </Stage>
        <AssetActions className="mt-3" name="yuyu-social-avatar" svg={avatarSvg()} pngSizes={[128, 256, 400, 512, 1024]} defaultPng={400} />
      </article>
    </div>
  );
}

/* ---------------------------------------------------------------- wiring */

const MANIFEST = `// app/manifest.ts (Yuyu)
icons: [
  { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/brand/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
],
background_color: "#FFFFFF",
theme_color: "#18181B",`;

const METADATA = `// app/layout.tsx (Yuyu)
openGraph: { siteName: "Yuyu", images: [{ url: "/brand/og-default.png", width: 1200, height: 630, alt: "Yuyu" }] },
twitter: { card: "summary_large_image", images: ["/brand/og-default.png"] },`;

const LINKS = `<!-- For a site outside Next.js: the same files as plain tags -->
<link rel="icon" href="/favicon-32.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta property="og:image" content="/og-default.png">
<meta name="twitter:card" content="summary_large_image">`;

function Wiring() {
  return (
    <div className="space-y-4">
      <ul className="max-w-3xl list-disc space-y-1 pl-5 text-ink-secondary">
        <li>The web manifest (<code className="font-mono">app/manifest.ts</code>) lists <code className="font-mono">icon-192.png</code>, <code className="font-mono">icon-512.png</code> and <code className="font-mono">maskable-512.png</code> from <code className="font-mono">public/brand/</code>.</li>
        <li><code className="font-mono">app/layout.tsx</code> sets the default Open Graph and Twitter image to <code className="font-mono">/brand/og-default.png</code> (1200 × 630) and the installed-app title through <code className="font-mono">appleWebApp</code>. It declares no <code className="font-mono">icons</code> field.</li>
        <li>The browser and iOS icons come from Next.js file conventions in <code className="font-mono">app/</code>: <code className="font-mono">icon.svg</code> (a copy of <code className="font-mono">favicon-32.svg</code>), <code className="font-mono">apple-icon.png</code> (a copy of <code className="font-mono">apple-touch-icon.png</code>) and <code className="font-mono">favicon.ico</code>. <code className="font-mono">npm run brand:generate</code> rewrites all of them.</li>
        <li>Emails use the hosted <code className="font-mono">email-lockup.png</code>; the masters are hand-written SVGs, and the PNGs are generated from them.</li>
      </ul>
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeBlock code={MANIFEST} language="ts" />
        <CodeBlock code={METADATA} language="ts" />
      </div>
      <CodeBlock code={LINKS} language="html" />
    </div>
  );
}

export default function AppIcons() {
  return (
    <>
      <Section title="Shipped files" description="Every file here exists in Yuyu's public/brand folder. Sizes are read from the files themselves.">
        <Shipped />
      </Section>
      <Section title="App icon themes" description="Figma defines three app icon themes: Ink, Light and Marigold. Each is a rounded square carrying the 5 by 5 mark on the 180 grid (dot 18, gap 6).">
        <Themes />
      </Section>
      <Section title="Favicon and avatar from the dot mark" description="Favicons use bright dots only. The avatar is a social-profile square.">
        <FaviconAndAvatar />
      </Section>
      <Section title="How Yuyu wires these files" description="Only what the code does.">
        <Wiring />
      </Section>
    </>
  );
}
