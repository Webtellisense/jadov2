import type { Metadata } from "next";
import { SignInForm } from "@/components/sign-in-form";
import { safeReturnPath } from "@/lib/navigation";
import { AuthGate } from "@/components/ui/auth-gate";
export const metadata: Metadata = { title: "Sign in" };
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; area?: string }>;
}) {
  const { next, area } = await searchParams;
  const destination = new URL(safeReturnPath(next), "https://jado.invalid");
  if (
    (area === "Uyo" || area === "Eket") &&
    !destination.searchParams.has("area")
  )
    destination.searchParams.set("area", area);
  return (
    <AuthGate>
      <section className="auth-content">
        <p className="eyebrow">Your Jado account</p>
        <h1>Welcome back.</h1>
        <p>
          {next?.includes("kind=message")
            ? "Sign in to message the business. We'll bring you right back."
            : next?.includes("kind=follow")
              ? "Sign in to follow the business. We'll bring you right back."
              : next?.includes("kind=like")
                ? "Sign in to like this post. We'll bring you right back."
                : "Sign in to manage your account. We'll bring you right back."}
        </p>
        <button className="button secondary full" disabled>
          Continue with Google
        </button>
        <p className="small muted">
          Google sign-in is not connected. Registration and email verification
          are not open yet.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <div className="notice">
            <strong>Development preview</strong>
            <p>
              Local seed accounts are labeled development fixtures. They do not
              represent real businesses or Google verification.
            </p>
          </div>
        )}
        <SignInForm
          next={destination.pathname + destination.search + destination.hash}
        />
      </section>
    </AuthGate>
  );
}
