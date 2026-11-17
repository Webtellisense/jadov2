"use client";
import { useHydrated } from "@/lib/use-hydrated";
export function WorkspaceRetry() {
  const ready = useHydrated();
  return (
    <button
      className="button"
      type="button"
      disabled={!ready}
      onClick={() => window.location.reload()}
    >
      Try again
    </button>
  );
}
