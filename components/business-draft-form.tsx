"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DraftDetails } from "@/lib/business-draft";
import { useHydrated } from "@/lib/use-hydrated";
export function BusinessDraftForm({
  id,
  initial,
  version = 1,
  readOnly = false,
  identityLocked = false,
}: {
  id?: string;
  initial?: DraftDetails;
  version?: number;
  readOnly?: boolean;
  identityLocked?: boolean;
}) {
  const ready = useHydrated(),
    router = useRouter();
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false),
    [revision, setRevision] = useState(version);
  const fields = [
    ["name", "Business name", 120],
    ["category", "Business category", 100],
    ["location", "City / area", 200],
    ["serviceArea", "Service area", 200],
    ["address", "Street address (if any)", 300],
    ["phone", "Phone (optional)", 40],
    ["website", "Website (HTTPS, optional)", 500],
    ["contactEmail", "Contact email (optional)", 254],
    ["description", "About your business", 2000],
  ] as const;
  return (
    <form
      method="post"
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (readOnly) return;
        setPending(true);
        setMessage("");
        setFailed(false);
        const values = Object.fromEntries(new FormData(e.currentTarget));
        try {
          const response = await fetch(
            id ? `/api/my-business/${id}` : "/api/my-business",
            {
              method: id ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                id ? { version: revision, details: values } : values,
              ),
            },
          );
          const result = await response.json();
          if (!response.ok) {
            setFailed(true);
            setMessage(result.message || "Could not save. Try again.");
            return;
          }
          if (!id) {
            router.push(`/my-business/${result.id}`);
            router.refresh();
          } else {
            setRevision(result.version);
            setMessage("Draft saved. Your business remains private.");
            router.refresh();
          }
        } catch {
          setFailed(true);
          setMessage(
            "Could not connect. Your unsaved details are still here. Try again.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      {fields.map(([key, label, max]) => (
        <div className="form-stack" key={key}>
          <label htmlFor={`draft-${key}`}>{label}</label>
          {key === "description" ? (
            <textarea
              readOnly={
                readOnly ||
                (identityLocked &&
                  [
                    "name",
                    "category",
                    "location",
                    "address",
                    "phone",
                    "website",
                  ].includes(key))
              }
              id={`draft-${key}`}
              name={key}
              maxLength={max}
              defaultValue={initial?.[key] || ""}
              rows={5}
            />
          ) : (
            <input
              readOnly={
                readOnly ||
                (identityLocked &&
                  [
                    "name",
                    "category",
                    "location",
                    "address",
                    "phone",
                    "website",
                  ].includes(key))
              }
              id={`draft-${key}`}
              name={key}
              type={
                key === "website"
                  ? "url"
                  : key === "contactEmail"
                    ? "email"
                    : "text"
              }
              maxLength={max}
              required={key === "name"}
              minLength={key === "name" ? 2 : undefined}
              defaultValue={initial?.[key] || ""}
            />
          )}
        </div>
      ))}
      <p className="small muted">
        These are provisional details supplied by you. They are not synced from
        Google.{" "}
        {identityLocked &&
          "A Google identity has been selected; provisional identity fields are now locked. Jado About and supplementary contact fields remain editable."}
      </p>
      {message && <p role={failed ? "alert" : "status"}>{message}</p>}
      <button
        className="button"
        disabled={readOnly || !ready || pending}
        type="submit"
      >
        {pending ? "Saving…" : id ? "Save draft" : "Create private draft"}
      </button>
    </form>
  );
}
