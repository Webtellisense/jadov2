import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountForm, SignOutButton } from "@/components/account-form";
import { PageState } from "@/components/page-state";
import { requirePrincipal } from "@/server/authorization";
import { getRuntime } from "@/server/runtime";
import { AppError } from "@/server/errors";
export const dynamic = "force-dynamic";
export default async function Account() {
  const requestHeaders = await headers();
  let principal;
  try {
    const { db, auth } = getRuntime();
    principal = await requirePrincipal(db, auth, requestHeaders);
  } catch (error) {
    if (error instanceof AppError && error.status === 401)
      redirect("/sign-in?next=/account");
    return (
      <PageState title="Account unavailable">
        We couldn’t open your account. Please try signing in again.
      </PageState>
    );
  }
  return (
    <section className="panel narrow">
      <p className="eyebrow">Your account</p>
      <h1>A little about you.</h1>
      <p>Your account does not grant business management or verification.</p>
      {principal.isFixture && (
        <p className="notice">
          <strong>Development fixture</strong> · This is a local test identity.
        </p>
      )}
      <AccountForm initialName={principal.name} />
      <div className="account-actions">
        {principal.role === "admin" && (
          <Link href="/admin">Open staff area</Link>
        )}
        <SignOutButton />
      </div>
    </section>
  );
}
