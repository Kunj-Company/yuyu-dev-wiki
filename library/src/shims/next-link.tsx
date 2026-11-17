import { forwardRef, type AnchorHTMLAttributes } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string | { pathname?: string }; prefetch?: boolean; scroll?: boolean; replace?: boolean };

/** Gallery stand-in for next/link: renders an anchor that never navigates away from the demo. */
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch: _p, scroll: _s, replace: _r, onClick, ...rest }, ref) {
  const target = typeof href === "string" ? href : href.pathname ?? "#";
  return (
    <a
      ref={ref}
      href={target}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !target.startsWith("http")) event.preventDefault();
      }}
      {...rest}
    />
  );
});
export default Link;
