"use client";
import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { comparisonIds } from "@/lib/discovery";
const Context = createContext<{
  ids: string[];
  pending: boolean;
  limitId: string;
  toggle: (id: string) => void;
  clear: () => void;
} | null>(null);
export function ComparisonProvider({ children }: { children: ReactNode }) {
  const router = useRouter(),
    path = usePathname(),
    params = useSearchParams();
  let source: string[] = [];
  try {
    source = comparisonIds(params.get("ids") || "");
  } catch {
    /* The screen renders an explicit invalid-selection state. */
  }
  const [ids, optimistic] = useOptimistic(
    source,
    (_: string[], next: string[]) => next,
  );
  const [pending, startTransition] = useTransition();
  const [limitId, setLimit] = useState("");
  function update(nextIds: string[]) {
    setLimit("");
    const query = new URLSearchParams(params);
    if (nextIds.length) query.set("ids", nextIds.join(","));
    else query.delete("ids");
    startTransition(() => {
      optimistic(nextIds);
      router.replace(`${path}?${query}`, { scroll: false });
    });
  }
  return (
    <Context
      value={{
        ids,
        pending,
        limitId,
        toggle(id) {
          if (pending) return;
          if (!ids.includes(id) && ids.length >= 3) {
            setLimit(id);
            return;
          }
          update(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
        },
        clear() {
          if (!pending) update([]);
        },
      }}
    >
      {children}
    </Context>
  );
}
export function useComparison() {
  const context = useContext(Context);
  if (!context)
    throw new Error("Comparison controls require the application provider.");
  return context;
}
export function SelectedIdsInput() {
  const { ids } = useComparison();
  return <input type="hidden" name="ids" value={ids.join(",")} />;
}
