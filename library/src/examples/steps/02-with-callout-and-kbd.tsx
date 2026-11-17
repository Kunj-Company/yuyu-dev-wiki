import { Callout, Kbd, Steps } from "@/components/help/mdx";

export const meta = {
  title: "Steps with a callout and keys",
  description: "Steps can sit between callouts and contain Kbd, as in a guide article.",
  layout: "stack",
};

export default function WithCalloutAndKbd() {
  return (
    <div>
      <Callout kind="permission">
        <p>Organisers and check-in helpers.</p>
      </Callout>
      <Steps>
        <ol>
          <li>Open the check-in screen.</li>
          <li>Press <Kbd>/</Kbd> to focus the search box.</li>
          <li>Press <Kbd>Enter</Kbd> to check a guest in.</li>
        </ol>
      </Steps>
    </div>
  );
}
