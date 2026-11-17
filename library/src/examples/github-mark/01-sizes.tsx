import { GitHubMark } from "@/components/ui/github-mark";

export const meta = { title: "Sizes", description: "Uses currentColor; size-4 by default." };

export default function Sizes() {
  return (
    <>
      <GitHubMark />
      <GitHubMark className="size-6" />
      <GitHubMark className="size-10" />
      <GitHubMark className="size-10 text-accent" />
    </>
  );
}
