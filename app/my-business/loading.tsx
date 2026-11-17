import { CardSkeleton } from "@/components/ui/core";
export default function Loading() {
  return (
    <div
      className="narrow"
      role="status"
      aria-label="Loading business workspace"
    >
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
