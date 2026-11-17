import { authEndpointAllowed } from "@/server/auth-surface";
import { assertSameOrigin, readJson } from "@/server/http";
import { getRuntime } from "@/server/runtime";
import { json, route } from "@/server/http";
import { requirePrincipal } from "@/server/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Keep an explicit configured auth surface. GBP OAuth and account linking are separate.
const handle = route(async (request) => {
  const endpoint = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  if (!authEndpointAllowed(request.method, endpoint))
    return json(
      {
        error: "AUTH_FLOW_UNAVAILABLE",
        message: "This sign-in or delivery option is not configured.",
      },
      404,
    );
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
  if (request.method === "POST") {
    assertSameOrigin(request, getRuntime().config.APP_ORIGIN);
    const input = await readJson(request.clone());
    if (!input || typeof input !== "object" || Array.isArray(input))
      return json({ error: "INVALID_INPUT" }, 400);
    if (
      endpoint === "/email-otp/send-verification-otp" &&
      (!("type" in input) || input.type !== "email-verification")
    )
      return json({ error: "AUTH_FLOW_UNAVAILABLE" }, 404);
    if (
      endpoint === "/sign-in/social" &&
      (!("provider" in input) || input.provider !== "google")
    )
      return json({ error: "AUTH_FLOW_UNAVAILABLE" }, 404);
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
