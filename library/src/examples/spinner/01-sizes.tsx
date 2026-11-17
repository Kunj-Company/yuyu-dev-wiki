import { Spinner } from "@/components/ui/spinner";

export const meta = { title: "Sizes and colour", description: "It uses currentColor and size-5 by default." };

export default function Sizes() {
  return (
    <>
      <Spinner className="size-4" />
      <Spinner />
      <Spinner className="size-8" />
      <Spinner className="size-8 text-accent" />
    </>
  );
}
