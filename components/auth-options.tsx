"use client";
import Link from "next/link";
import { useState } from "react";
import { safeReturnPath } from "@/lib/navigation";
import { useHydrated } from "@/lib/use-hydrated";
export function AuthOptions({
  google,
  email,
  next = "/account",
}: {
  google: boolean;
  email: boolean;
  next?: string;
}) {
  const ready = useHydrated();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div className="form-stack">
      <button
        type="button"
        className="button secondary full"
        disabled={!google || !ready || pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const response = await fetch("/api/auth/sign-in/social", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider: "google",
                callbackURL: safeReturnPath(next),
              }),
            });
            const data = await response.json();
            if (!response.ok || !data.url) throw new Error();
            window.location.assign(data.url);
          } catch {
            setError("Google sign-in could not start. Please try again.");
            setPending(false);
          }
        }}
      >
        {pending ? "Connecting…" : "Continue with Google"}
      </button>
      {!google && (
        <p className="small muted">Google sign-in is not configured.</p>
      )}
      {error && <p role="alert">{error}</p>}
      <Link href={`/register?next=${encodeURIComponent(safeReturnPath(next))}`}>
        Create an email account
      </Link>
      <Link href="/verify-email">Verify your email</Link>
      <Link href="/recover-account">Recover your account</Link>
      {!email && (
        <p className="small muted">
          Email registration, verification and recovery are unavailable until
          genuine email delivery is configured.
        </p>
      )}
    </div>
  );
}
