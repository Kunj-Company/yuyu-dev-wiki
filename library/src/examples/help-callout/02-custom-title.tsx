import { Callout } from "@/components/help/mdx";

export const meta = {
  title: "Custom title and rich content",
  description: "title replaces the default label. Children can hold several paragraphs and lists.",
  layout: "stack",
};

export default function CustomTitle() {
  return (
    <>
      <Callout kind="tip" title="Before you publish">
        <p>Check these first.</p>
        <ul className="list-disc pl-5">
          <li>The venue address is correct.</li>
          <li>Capacity matches the room.</li>
        </ul>
      </Callout>
      <Callout title="Plain note with a title">
        <p>Without a kind, the callout is a note.</p>
      </Callout>
    </>
  );
}
