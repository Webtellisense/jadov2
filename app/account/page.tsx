import { headers } from "next/headers";
import { AreaLink as Link } from "@/components/area-link";
import { AccountForm, SignOutButton } from "@/components/account-form";
import { PageState } from "@/components/page-state";
import { requirePrincipal } from "@/server/authorization";
import { getRuntime } from "@/server/runtime";
import { AppError } from "@/server/errors";
import { DataSaver } from "@/components/discovery-interactions";
import { BackLink, ButtonLink, PageHeading } from "@/components/ui/core";
import { previewEnabled } from "@/lib/preview-policy";
export const dynamic = "force-dynamic";
export default async function Account() {
  const requestHeaders = await headers();
  let principal;
  try {
    const { db, auth } = getRuntime();
    principal = await requirePrincipal(db, auth, requestHeaders);
  } catch (error) {
    if (error instanceof AppError && error.status === 401)
      return (
        <div className="narrow">
          <BackLink />
          <PageHeading title="Your Jado account" />
          <section className="panel">
            <h2>A place for your connections.</h2>
            <p>
              Sign in when you want to message, follow or like. You can explore
              without an account.
            </p>
            <ButtonLink href="/sign-in?next=/account">Sign in</ButtonLink>
            <DataSaver />
            <Link className="text-link" href="/help">
              Get help
            </Link>
          </section>
        </div>
      );
    return (
      <PageState title="Account unavailable">
        We couldn’t open your account. Please try signing in again.
      </PageState>
    );
  }
  return (
    <section className="panel narrow">
      <BackLink />
      <p className="eyebrow">Your account</p>
      <h1>A little about you.</h1>
      <p>Your account does not grant business management or verification.</p>
      {principal.isFixture && (
        <p className="notice">
          <strong>Development fixture</strong> · This is a local test identity.
        </p>
      )}
      <AccountForm initialName={principal.name} />
      <DataSaver />
      <div className="stack section">
        <Link className="text-link" href="/following">
          Following
        </Link>
        <Link className="text-link" href="/notifications">
          Notifications
        </Link>
        <Link className="text-link" href="/owner/onboarding">
          Add your business
        </Link>
        <Link className="text-link" href="/privacy">
          Privacy and account help
        </Link>
      </div>
      {principal.isFixture && previewEnabled() && (
        <div className="notice preview-entry">
          <strong>Private prototype</strong>
          <p>Ten fictional businesses stored in local PostgreSQL.</p>
          <div className="flex-wrap">
            <ButtonLink href="/dev?area=Uyo" variant="secondary">
              Open development preview
            </ButtonLink>
            <ButtonLink href="/design" variant="secondary">
              Component gallery
            </ButtonLink>
          </div>
        </div>
      )}
      <div className="account-actions">
        {principal.role === "admin" && (
          <Link href="/admin">Open staff area</Link>
        )}
        <SignOutButton />
      </div>
    </section>
  );
}
