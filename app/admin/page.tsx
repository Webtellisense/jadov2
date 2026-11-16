import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageState } from "@/components/page-state";
import { assertRole, requirePrincipal } from "@/server/authorization";
import { getRuntime } from "@/server/runtime";
import { AppError } from "@/server/errors";
export const dynamic = "force-dynamic";
export default async function Admin() {
  const requestHeaders = await headers();
  try {
    const { db, auth } = getRuntime();
    assertRole(await requirePrincipal(db, auth, requestHeaders), "admin");
  } catch (error) {
    if (error instanceof AppError && error.status === 401)
      redirect("/sign-in?next=/admin");
    return (
      <PageState title="Access unavailable">
        This area requires an active staff account with administrator access.
      </PageState>
    );
  }
  return (
    <>
      <PageState title="Staff access confirmed">
        Your administrator permission was checked on the server. Staff
        operations will be introduced in later milestones.
      </PageState>
      <nav className="owner-nav" aria-label="Staff sections">
        {["Claims", "Businesses", "Moderation", "Support", "Security"].map(
          (x) => (
            <a className="chip" href={`#${x.toLowerCase()}`} key={x}>
              {x}
            </a>
          ),
        )}
      </nav>
      <div className="gallery-grid">
        {["Claims", "Businesses", "Moderation", "Support", "Security"].map(
          (x) => (
            <section className="panel" id={x.toLowerCase()} key={x}>
              <h2>{x}</h2>
              <p>
                No operational records are connected in this milestone. No
                verification, moderation or role changes can be made here.
              </p>
            </section>
          ),
        )}
      </div>
    </>
  );
}
