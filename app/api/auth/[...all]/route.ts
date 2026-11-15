import { getRuntime } from "@/server/runtime";
import { json, route } from "@/server/http";
import { requirePrincipal } from "@/server/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Limit M0's public auth surface. Registration, linking, password reset and all
// profile mutations remain closed until their product flows are implemented.
const handle = route(async (request) => {
  const endpoint = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  const allowed =
    request.method === "GET"
      ? ["/get-session"]
      : ["/sign-in/email", "/sign-out"];
  if (!allowed.includes(endpoint))
    return json({ error: "AUTH_FLOW_UNAVAILABLE" }, 404);
  const { db, auth } = getRuntime();
  if (endpoint === "/get-session") {
    const current = await requirePrincipal(db, auth, request.headers);
    return json({
      user: {
        id: current.id,
        name: current.name,
        role: current.role,
        isFixture: current.isFixture,
      },
    });
  }
  const response = await auth.handler(request);
  if (response.status >= 500)
    return json(
      {
        error: "UNAVAILABLE",
        message: "Sign-in is unavailable. Please try again.",
      },
      503,
    );
  return response;
});
export const GET = handle;
export const POST = handle;
