import { Callout } from "@/components/help/mdx";

export const meta = {
  title: "All kinds",
  description: "note is the default. tip, warning (labelled Careful) and permission each have their own icon and tint.",
  layout: "stack",
};

export default function Kinds() {
  return (
    <>
      <Callout kind="note">
        <p>Guests can see the public event page without signing in.</p>
      </Callout>
      <Callout kind="tip">
        <p>Duplicate a past event to reuse its programme and ticket settings.</p>
      </Callout>
      <Callout kind="warning">
        <p>Cancelling an event emails every registered guest.</p>
      </Callout>
      <Callout kind="permission">
        <p>Organisation owners and admins.</p>
      </Callout>
    </>
  );
}
