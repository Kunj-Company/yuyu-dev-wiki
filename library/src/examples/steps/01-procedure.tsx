import { Steps } from "@/components/help/mdx";

export const meta = {
  title: "Numbered procedure",
  description: "Steps wraps an ordered list. The numbering style comes from the .help-steps rule in globals.css.",
  layout: "stack",
};

export default function Procedure() {
  return (
    <Steps>
      <ol>
        <li>Open your organisation in the dashboard.</li>
        <li>Choose <strong>New event</strong>.</li>
        <li>Fill in the title, date and venue.</li>
        <li>Press <strong>Publish</strong>.</li>
      </ol>
    </Steps>
  );
}
