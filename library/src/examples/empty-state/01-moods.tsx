import { EmptyState } from "@/components/ui/display";

export const meta = { title: "Dot-face moods", description: "On Yuyu's own screens: sleepy for empty lists, sad for errors, done for completed.", layout: "stack" };

export default function Moods() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <EmptyState mood="sleepy" title="No events yet">Events you host will show up here.</EmptyState>
      <EmptyState mood="sad" title="Something went wrong">We could not load your events.</EmptyState>
      <EmptyState mood="done" title="All caught up">Nothing left to review.</EmptyState>
      <EmptyState mood="thinking" title="No results">Try a different search.</EmptyState>
      <EmptyState mood="cheering" title="You are in!">See you there.</EmptyState>
      <EmptyState mood="waiting" title="On the waitlist">We will email you if a spot opens.</EmptyState>
    </div>
  );
}
