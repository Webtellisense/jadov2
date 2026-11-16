import { CardSkeleton } from "@/components/ui/core";
export default function Loading() {
  return (
    <section aria-label="Loading page">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </section>
  );
}
