"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
export function AccountForm({ initialName }: { initialName: string }) {
  const ready = useHydrated();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  return (
    <form
      className="form-stack"
      method="post"
      action="/api/account/name"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        setError(false);
        try {
          const response = await fetch("/api/account/name", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          if (!response.ok) {
            setError(true);
            setMessage(
              response.status === 401
                ? "Your session has ended. Please sign in again."
                : response.status === 429
                  ? "Too many changes. Please wait a minute."
                  : response.status === 400
                    ? "Enter a name between 2 and 80 characters."
                    : "Could not save your name. Please try again.",
            );
            return;
          }
          setMessage("Name saved.");
          router.refresh();
        } catch {
          setError(true);
          setMessage("Could not connect. Please try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label htmlFor="name">Your name</label>
      <input
        id="name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        minLength={2}
        maxLength={80}
        required
        autoComplete="name"
      />
      <button type="submit" className="button" disabled={pending || !ready}>
        {pending ? "Saving…" : "Save name"}
      </button>
      {message && (
        <p
          role={error ? "alert" : "status"}
          className={error ? "form-error" : "form-success"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="button secondary"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const response = await fetch("/api/auth/sign-out", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            if (!response.ok) throw new Error("Sign-out failed");
            router.replace("/sign-in");
            router.refresh();
          } catch {
            setError("Could not sign out. Please try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
