import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import { h } from "vue";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/figtree/wght.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./yuyu.css";
import BuildInfo from "./BuildInfo.vue";
import RoadmapBoard from "./RoadmapBoard.vue";
import ContributorsList from "./ContributorsList.vue";
import { initSearch } from "../../../search/palette";

// The search trigger. The shared palette finds any [data-yy-search] element and opens on click.
const SearchTrigger = () =>
  h("button", { class: "yy-search-trigger", type: "button", "data-yy-search": "", "aria-label": "Search the documentation and component library", "aria-keyshortcuts": "/ Control+K Meta+K" }, [
    h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "aria-hidden": "true" }, [h("circle", { cx: 11, cy: 11, r: 7 }), h("path", { d: "m20 20-3.5-3.5" })]),
    h("span", { class: "yy-search-label" }, "Search"),
    h("kbd", "/"),
  ]);

// The Yuyu theme: the product's own tokens, fonts and shapes on top of the default VitePress layout.
const theme: Theme = {
  ...DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      "nav-bar-content-before": () => h(SearchTrigger),
      "home-features-after": () => h(BuildInfo),
    }),
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);
    ctx.app.component("RoadmapBoard", RoadmapBoard);
    ctx.app.component("ContributorsList", ContributorsList);
    if (typeof window === "undefined") return;

    // The library is a separate app served as static files, not a VitePress page, so links into it must load
    // normally. VitePress shortens /library/index.html to /library/, and the dev server answers /library/ with
    // its own "not found" page, so always go to the real index.html, keeping any #route.
    const isLibrary = (to: string) => /\/library(\/|$)/.test(to.split(/[?#]/)[0]);
    const libraryUrl = (to: string) => {
      const url = new URL(to, window.location.href);
      url.pathname = url.pathname.replace(/\/library(\/(index\.html)?)?$/, "/library/index.html");
      return url.href;
    };
    ctx.router.onBeforeRouteChange = (to) => {
      if (isLibrary(to)) {
        window.location.assign(libraryUrl(to));
        return false;
      }
    };
    const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
    initSearch({
      site: "docs",
      root: new URL(base, window.location.origin),
      navigate: (url, entry) => (entry.site === "docs" ? ctx.router.go(url.pathname + url.search + url.hash) : window.location.assign(libraryUrl(url.href))),
    });
  },
};

export default theme;
