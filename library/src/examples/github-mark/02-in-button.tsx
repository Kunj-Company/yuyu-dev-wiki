import { GitHubMark } from "@/components/ui/github-mark";
import { Button } from "@/components/ui/button";

export const meta = { title: "In a link button", description: "The mark is decorative: the text labels the link." };

export default function InButton() {
  return (
    <>
      <Button variant="secondary" asChild>
        <a href="https://github.com/" target="_blank" rel="noreferrer">
          <GitHubMark />
          View on GitHub
        </a>
      </Button>
      <Button variant="primary" startIcon={<GitHubMark />}>Sign in with GitHub</Button>
    </>
  );
}
