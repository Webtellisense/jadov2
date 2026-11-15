import { getRuntime } from "@/server/runtime";
import { requirePrincipal } from "@/server/authorization";
import { json, route } from "@/server/http";
export const dynamic = "force-dynamic";
export const GET = route(async (request) => {
  const { db, auth } = getRuntime();
  const principal = await requirePrincipal(db, auth, request.headers);
  return json({
    user: {
      id: principal.id,
      name: principal.name,
      role: principal.role,
      isFixture: principal.isFixture,
    },
  });
});
