import { getGbpService, gbpActor, safeGbp } from "@/server/gbp/runtime";
import { bindingCookie } from "@/server/gbp/service";
import { assertSameOrigin, json, readJson, route } from "@/server/http";
import { getRuntime } from "@/server/runtime";
import { AppError } from "@/server/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = route(async (request, requestId) =>
  safeGbp(async () => {
    const origin = getRuntime().config.APP_ORIGIN;
    assertSameOrigin(request, origin);
    const body = await readJson(request);
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length
    )
      throw new AppError(
        400,
        "INVALID_INPUT",
        "This action takes no parameters.",
      );
    const service = getGbpService(),
      actor = await gbpActor(request.headers),
      id = new URL(request.url).pathname.split("/").at(-3)!;
    const result = await service.start(actor, id, requestId);
    if (result.pending) return json(result);
    const response = json({ url: result.url });
    response.headers.append(
      "Set-Cookie",
      `${bindingCookie(result.state)}=${result.cookie}; HttpOnly; SameSite=Lax; Path=/api/gbp/oauth/callback; Max-Age=600${origin.startsWith("https:") ? "; Secure" : ""}`,
    );
    return response;
  }),
);
