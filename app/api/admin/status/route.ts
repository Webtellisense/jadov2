import { getRuntime } from "@/server/runtime";
import { assertRole, requirePrincipal } from "@/server/authorization";
import { json, route } from "@/server/http";
export const dynamic = "force-dynamic";
export const GET = route(async (request) => {
  const { db, auth } = getRuntime();
  const principal = await requirePrincipal(db, auth, request.headers);
  assertRole(principal, "admin");
  return json({ status: "authorized" });
});
