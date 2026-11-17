import { cn } from "@/lib/cn";

/**
 * A static design asset with a dark-theme twin (dot icons, the logo). Both are
 * rendered and CSS shows the one that matches the colour mode or a `.yy-dark-band`.
 */
export function ThemedImage({ src, darkSrc, alt = "", width, height, className }: { src: string; darkSrc: string; alt?: string; width: number; height: number; className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG design assets from /public */}
      <img src={src} alt={alt} width={width} height={height} className={cn("yy-img-light shrink-0", className)} draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG design assets from /public */}
      <img src={darkSrc} alt={alt} width={width} height={height} className={cn("yy-img-dark shrink-0", className)} draggable={false} />
    </>
  );
}
