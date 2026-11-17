import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/figtree/wght.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./styles.css";
import { Providers } from "@/components/providers";
import { App } from "./gallery/App";
import { initSearch } from "../../search/palette";

// The same search as the documentation: one index, one palette. Library results change the hash in place,
// documentation results load that page. The documentation root is one level above the library.
initSearch({
  site: "library",
  root: new URL("../", window.location.href),
  navigate: (url, entry) => {
    if (entry.site === "library") window.location.hash = url.hash;
    else window.location.assign(url);
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
