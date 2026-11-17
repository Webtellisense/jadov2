"use client";
import { useState } from "react";
import Link from "next/link";
import { useHydrated } from "@/lib/use-hydrated";
import { safeReturnPath } from "@/lib/navigation";
export function AuthFlow({
  kind,
  available,
  token = "",
  next = "/my-business",
}: {
  kind: "register" | "verify" | "recover" | "reset";
  available: boolean;
  token?: string;
  next?: string;
}) {
  const ready = useHydrated();
  const [mode, setMode] = useState(kind),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function submit(form: FormData, resend = false) {
    setBusy(true);
    setError("");
    setMessage("");
    const endpoint =
      mode === "register"
        ? "/sign-up/email"
        : mode === "recover"
          ? "/request-password-reset"
          : mode === "reset"
            ? "/reset-password"
            : resend
              ? "/email-otp/send-verification-otp"
              : "/email-otp/verify-email";
    const address = String(form.get("email") || email);
    const body =
      mode === "register"
        ? {
            name: form.get("name"),
            email: address,
            password: form.get("password"),
          }
        : mode === "recover"
          ? { email: address, redirectTo: "/reset-password" }
          : mode === "reset"
            ? { token, newPassword: form.get("password") }
            : resend
              ? { email: address, type: "email-verification" }
              : { email: address, otp: form.get("otp") };
    try {
      const response = await fetch(`/api/auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : "This request could not be completed. Check your details or try again later.",
        );
        return;
      }
      if (mode === "register") {
        setEmail(address);
        setMode("verify");
        setMessage("Check your email for your verification code.");
      } else if (mode === "recover")
        setMessage(
          "If this account is eligible, check your email for a recovery link.",
        );
      else if (mode === "reset")
        setMessage("Password changed. You can sign in with your new password.");
      else
        setMessage(
          resend
            ? "If eligible, a new code has been sent. Check your email."
            : "Email verified. Sign in to continue.",
        );
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel narrow">
      <h1>
        {mode === "register"
          ? "Create your Jado account"
          : mode === "verify"
            ? "Verify your email"
            : mode === "recover"
              ? "Recover your account"
              : "Set a new password"}
      </h1>
      {!available && (
        <p className="notice" role="status">
          Genuine email delivery is not configured. This option is unavailable;
          no verification email or code will be simulated.
        </p>
      )}
      <form
        method="post"
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(new FormData(e.currentTarget));
        }}
      >
        {mode === "register" && (
          <>
            <label htmlFor="auth-name">Your name</label>
            <input
              id="auth-name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
            />
          </>
        )}
        {mode !== "reset" && (
          <>
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        )}
        {(mode === "register" || mode === "reset") && (
          <>
            <label htmlFor="auth-password">
              Password (at least 12 characters)
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          </>
        )}
        {mode === "verify" && (
          <>
            <label htmlFor="auth-otp">Six-digit verification code</label>
            <input
              id="auth-otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </>
        )}
        <button
          className="button"
          disabled={
            !available || !ready || busy || (mode === "reset" && !token)
          }
          type="submit"
        >
          {busy
            ? "Please wait…"
            : mode === "register"
              ? "Create account"
              : mode === "verify"
                ? "Verify email"
                : mode === "recover"
                  ? "Send recovery link"
                  : "Save password"}
        </button>
        {mode === "verify" && (
          <button
            className="button secondary"
            type="button"
            disabled={!available || !ready || busy || !email}
            onClick={() => {
              const form = new FormData();
              form.set("email", email);
              void submit(form, true);
            }}
          >
            Send a new code
          </button>
        )}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
      </form>
      <Link
        className="text-link"
        href={`/sign-in?next=${encodeURIComponent(safeReturnPath(next))}`}
      >
        Sign in to continue
      </Link>
      <Link className="text-link" href="/">
        Back to Explore
      </Link>
    </section>
  );
}
