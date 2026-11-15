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
    <PageState title="Staff access confirmed">
      Your administrator permission was checked on the server. Staff operations
      will be introduced in later milestones.
    </PageState>
  );
}
