"use client";
import { useState, useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Copy, Share2, MapPin, X } from "lucide-react";
import { Button, ButtonLink } from "./ui/core";
import type { BusinessRecord } from "@/lib/discovery";
import { useHydrated } from "@/lib/use-hydrated";
import { useComparison } from "./comparison-context";

export function CompareToggle({ id, name }: { id: string; name: string }) {
  const { ids, pending, limitId, toggle } = useComparison();
  const ready = useHydrated();
  return (
    <div>
      <label className="check-label">
        <input
          type="checkbox"
          disabled={!ready || pending}
          checked={ids.includes(id)}
          onChange={() => toggle(id)}
          aria-label={`Compare ${name}`}
        />
        Compare
      </label>
      {limitId === id && (
        <p className="form-error small" role="alert">
          You can compare up to three businesses. Remove one first.
        </p>
      )}
    </div>
  );
}
export function CompareTray({
  businesses,
  prefix,
}: {
  businesses: Pick<BusinessRecord, "id" | "name">[];
  prefix: string;
}) {
  const params = useSearchParams(),
    path = usePathname();
  const { ids, pending, clear } = useComparison();
  if (!ids.length || path.endsWith("/compare")) return null;
  const names = ids
    .map((id) => businesses.find((b) => b.id === id)?.name)
    .filter(Boolean);
  const query = new URLSearchParams(params);
  query.set("ids", ids.join(","));
  return (
    <aside className="compare-tray" aria-label="Selected businesses">
      <p>
        {ids.length} selected
        <span className="sr-only">: {names.join(", ")}</span>
      </p>
      <ButtonLink href={`${prefix}/compare?${query}`} variant="primary">
        Compare ({ids.length})
      </ButtonLink>
      <button
        disabled={pending}
        className="icon-button"
        aria-label="Clear comparison"
        onClick={clear}
      >
        <X aria-hidden="true" />
      </button>
    </aside>
  );
}
export function ShareButton({
  label = "Copy link",
  whatsapp = false,
}: {
  label?: string;
  whatsapp?: boolean;
}) {
  const [status, setStatus] = useState("");
  return (
    <span className="share-control">
      <Button
        variant={whatsapp ? "whatsapp" : "secondary"}
        onClick={async () => {
          if (whatsapp) {
            window.open(
              `https://wa.me/?text=${encodeURIComponent(window.location.href)}`,
              "_blank",
              "noopener,noreferrer",
            );
            return;
          }
          try {
            await navigator.clipboard.writeText(window.location.href);
            setStatus("Link copied.");
          } catch {
            setStatus(
              "Couldn't copy. Select the address in your browser to share it.",
            );
          }
        }}
      >
        {whatsapp ? <Share2 aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {label}
      </Button>
      {status && (
        <span role="status" className="small">
          {status}
        </span>
      )}
    </span>
  );
}
export function AreaPicker({
  next,
  prefix,
  current = "",
}: {
  next: string;
  prefix: string;
  current?: string;
}) {
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState(false);
  const [suggested, setSuggested] = useState(current);
  return (
    <div className="stack">
      <Button
        disabled={pending}
        onClick={() => {
          if (!navigator.geolocation) {
            setFeedback(
              "Location isn't available in this browser. Choose your area below.",
            );
            return;
          }
          setPending(true);
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const nearUyo =
                Math.abs(latitude - 5.0377) < 0.15 &&
                Math.abs(longitude - 7.9128) < 0.15;
              setSuggested(nearUyo ? "Uyo" : "");
              setFeedback(
                nearUyo
                  ? "Suggested area: Uyo. Confirm below to continue."
                  : "We couldn't match your location to a launch area. Choose an area below.",
              );
              setPending(false);
            },
            () => {
              setFeedback(
                "Location wasn't shared. You can still choose your area below.",
              );
              setPending(false);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
          );
        }}
      >
        <MapPin aria-hidden="true" />
        {pending ? "Finding your area…" : "Use my current location"}
      </Button>
      <p className="small muted">
        We only use your location to suggest an area. Your coordinates are not
        saved.
      </p>
      {feedback && (
        <p className="notice" role="status">
          {feedback}
        </p>
      )}
      <p className="muted">or choose an area</p>
      <form
        action={new URL(next || prefix || "/", "https://jado.invalid").pathname}
        className="form-stack"
      >
        {[
          ...new URL(next || prefix || "/", "https://jado.invalid")
            .searchParams,
        ]
          .filter(([k]) => k !== "area")
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        <label htmlFor="area-choice">City or area</label>
        <select
          id="area-choice"
          name="area"
          value={suggested}
          onChange={(e) => setSuggested(e.target.value)}
          required
        >
          <option value="" disabled>
            Choose your area
          </option>
          <option value="Uyo">Uyo, Akwa Ibom</option>
          <option value="Eket">Eket, Akwa Ibom</option>
        </select>
        <Button type="submit">Explore this area</Button>
      </form>
      <p className="caption muted">
        Choosing an area doesn&apos;t say where you live. You can change it at
        any time.
      </p>
    </div>
  );
}
const prefSubscribe = (fn: () => void) => {
  window.addEventListener("jado-preferences", fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener("jado-preferences", fn);
    window.removeEventListener("storage", fn);
  };
};
function prefSnapshot() {
  try {
    return (
      localStorage.getItem("jado-data-saver") ??
      ((navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData
        ? "true"
        : "false")
    );
  } catch {
    return "false";
  }
}
export function DataSaver() {
  const value = useSyncExternalStore(
    prefSubscribe,
    prefSnapshot,
    () => "false",
  );
  const [error, setError] = useState("");
  useEffect(() => {
    document.documentElement.dataset.saver = value;
  }, [value]);
  return (
    <>
      <label className="data-saver">
        <input
          type="checkbox"
          role="switch"
          checked={value === "true"}
          onChange={(e) => {
            try {
              localStorage.setItem("jado-data-saver", String(e.target.checked));
              window.dispatchEvent(new Event("jado-preferences"));
            } catch {
              setError("Your browser couldn't save this preference.");
            }
          }}
        />
        Data saver<span className="small muted">Defer decorative media</span>
      </label>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
export function RefreshButton() {
  return (
    <Button variant="secondary" onClick={() => window.location.reload()}>
      Refresh
    </Button>
  );
}
