import { Button } from "@/components/ui/button";

export const meta = { title: "Full width and asChild", description: "asChild applies button styling to a link. In Yuyu the child is usually a Next.js Link.", layout: "stack" };

export default function FullWidthAndAsChild() {
  return (
    <>
      <Button variant="primary" size="lg" fullWidth type="submit">
        Create account
      </Button>
      <Button asChild variant="secondary">
        <a href="https://example.com">Open the help centre</a>
      </Button>
    </>
  );
}
