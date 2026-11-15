"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { safeReturnPath } from "@/lib/navigation";

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="form-stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setPending(true);
        const form = new FormData(event.currentTarget);
        try {
          const response = await fetch("/api/auth/sign-in/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: form.get("email"),
              password: form.get("password"),
            }),
          });
          if (!response.ok) {
            setError(
              response.status === 429
                ? "Too many attempts. Please wait a minute and try again."
                : "Sign-in failed. Check your details or try again later.",
            );
            return;
          }
          router.replace(safeReturnPath(next));
          router.refresh();
        } catch {
          setError("Could not connect. Please try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={128}
      />
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="muted fine">
        Registration and Google sign-in are not open yet.
      </p>
    </form>
  );
}
