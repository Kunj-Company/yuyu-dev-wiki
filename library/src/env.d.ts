/// <reference types="vite/client" />
declare const __SOURCE_COMMIT__: string;
declare module "mdx/types" {
  export type MDXComponents = Record<string, unknown>;
}

declare module "*.txt?raw" {
  const content: string;
  export default content;
}
