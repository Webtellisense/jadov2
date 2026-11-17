import { GbpConnection } from "./gbp-connection";
import { WorkspaceRetry } from "./workspace-retry";
import { headers } from "next/headers";
import Link from "next/link";
import { getRuntime } from "@/server/runtime";
import { requirePrincipal } from "@/server/authorization";
import {
  readBusinessDraft,
  listBusinessDrafts,
} from "@/server/business-drafts";
import { AppError } from "@/server/errors";
import { BusinessDraftForm } from "./business-draft-form";
import { BackLink, StateCard } from "./ui/core";
export async function BusinessWorkspace({ id }: { id?: string }) {
  let rows: Awaited<ReturnType<typeof listBusinessDrafts>> = [];
  let current: Awaited<ReturnType<typeof readBusinessDraft>> | null = null;
  let failure: unknown;
  try {
    const { db, auth } = getRuntime();
    const principal = await requirePrincipal(db, auth, await headers());
    rows = await listBusinessDrafts(db, principal);
    current = id ? await readBusinessDraft(db, principal, id) : null;
  } catch (error) {
    failure = error;
  }
  if (failure) {
    const known = failure instanceof AppError ? failure : null;
    const signedOut = known && known.status === 401;
    const unverified = known && known.code === "EMAIL_VERIFICATION_REQUIRED";
    return (
      <div className="narrow">
        <BackLink />
        <StateCard
          title={
            signedOut
              ? "Sign in to add your business"
              : unverified
                ? "Verify your email first"
                : "Business workspace unavailable"
          }
          href={
            signedOut
              ? `/sign-in?next=${encodeURIComponent(id ? `/my-business/${id}` : "/my-business")}`
              : unverified
                ? "/verify-email"
                : "/account"
          }
          action={
            signedOut
              ? "Sign in"
              : unverified
                ? "Verify email"
                : "Back to account"
          }
        >
          {known
            ? known.message
            : "We could not load your workspace. Please try again."}
          {!known && <WorkspaceRetry />}
        </StateCard>
      </div>
    );
  }
  return (
    <div className="narrow">
      <BackLink
        href={id ? "/my-business" : "/account"}
        label={id ? "Back to My Business" : "Back to account"}
      />
      <h1>{current ? current.details.name : "My Business"}</h1>
      {current ? (
        <>
          <GbpConnection id={current.id} />
          <section className="panel section">
            <h2>Business details</h2>
            <p>
              Save your provisional details here. Brand identity, media,
              offerings and the full profile preview are not available yet.
            </p>
            <BusinessDraftForm
              id={id}
              initial={current.details}
              version={current.version}
              identityLocked={current.identityLocked}
            />
          </section>
        </>
      ) : (
        <>
          <p>
            Add a business or return to a private draft. Each business needs its
            own Google authorization before publication.
          </p>
          <section className="panel section">
            <h2>Your businesses</h2>
            {rows.length ? (
              <ul>
                {rows.map((row) => (
                  <li key={row.id}>
                    <Link href={`/my-business/${row.id}`}>
                      {row.details.name}
                    </Link>
                    <p className="small muted">
                      {row.state === "pending_gbp_approval"
                        ? "Google authorization pending · Private"
                        : "Private workspace"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No business drafts yet.</p>
            )}
          </section>
          <section className="panel section">
            <h2>Add your business</h2>
            <p>
              Start a private draft. Creating it does not assign ownership or
              verify your business.
            </p>
            <BusinessDraftForm />
          </section>
        </>
      )}
    </div>
  );
}
