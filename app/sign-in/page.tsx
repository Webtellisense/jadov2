import type { Metadata } from "next";
import { SignInForm } from "@/components/sign-in-form";
import { safeReturnPath } from "@/lib/navigation";
export const metadata: Metadata = { title: "Sign in" };
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <section className="panel narrow">
      <p className="eyebrow">Your Jado account</p>
      <h1>Welcome back.</h1>
      <p>Sign in to manage your account.</p>
      {process.env.NODE_ENV !== "production" && (
        <div className="notice">
          <strong>Development preview</strong>
          <p>
            Local seed accounts are labeled development fixtures. They do not
            represent real businesses or Google verification.
          </p>
        </div>
      )}
      <SignInForm next={safeReturnPath(next)} />
    </section>
  );
}
