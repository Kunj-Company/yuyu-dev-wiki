import { Callout, Screenshot, Steps } from "@/components/help/mdx";

export const meta = {
  title: "Inside a guide",
  description: "Typical placement: after the step it illustrates. The gallery has no captured images, so only the surrounding content shows.",
  layout: "stack",
};

export default function UsageInGuide() {
  return (
    <div>
      <Steps>
        <ol>
          <li>Open the dashboard and choose <strong>New event</strong>.</li>
        </ol>
      </Steps>
      <Screenshot name="dashboard-new-event" alt="Dashboard with the New event button highlighted" />
      <Callout kind="tip">
        <p>Alt text is required: every screenshot needs a description.</p>
      </Callout>
    </div>
  );
}
