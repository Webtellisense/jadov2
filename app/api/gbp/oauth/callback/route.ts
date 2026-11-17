import { z } from "zod";
import { getGbpService, gbpActor, safeGbp } from "@/server/gbp/runtime";
import { bindingCookie } from "@/server/gbp/service";
import { route } from "@/server/http";
import { AppError } from "@/server/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handle = route(async (request, requestId) =>
  safeGbp(async () => {
    const params = new URL(request.url).searchParams;
    // Google's optional scope/authuser/prompt fields are never trusted or persisted.
    for (const key of ["state", "code", "error"])
      if (params.getAll(key).length > 1)
        throw new AppError(
          400,
          "OAUTH_STATE_INVALID",
          "This Google callback is invalid. Start again from My Business.",
        );
    const parsed = z
      .object({
        state: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
        code: z.string().min(1).max(4096).optional(),
        error: z.string().max(200).optional(),
      })
      .safeParse({
        state: params.get("state"),
        code: params.get("code") || undefined,
        error: params.get("error") || undefined,
      });
    if (!parsed.success)
      throw new AppError(
        400,
        "OAUTH_STATE_INVALID",
        "This Google callback is invalid. Start again from My Business.",
      );
    const actor = await gbpActor(request.headers),
      service = getGbpService(),
      name = bindingCookie(parsed.data.state);
    const values = (request.headers.get("cookie") || "")
      .split(";")
      .map((v) => v.trim())
      .filter((v) => v.startsWith(`${name}=`));
    const cookie =
      values.length === 1 ? values[0].slice(name.length + 1) : undefined;
    const result = await service.callback(
      actor,
      parsed.data.state,
      cookie,
      parsed.data.code,
      !!parsed.data.error,
      requestId,
    );
    const response = new Response(null, {
      status: 303,
      headers: {
        Location: `${service.config.origin}/my-business/${encodeURIComponent(result.businessId)}?gbp=${result.result}`,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
    response.headers.append(
      "Set-Cookie",
      `${name}=; HttpOnly; SameSite=Lax; Path=/api/gbp/oauth/callback; Max-Age=0${service.config.origin.startsWith("https:") ? "; Secure" : ""}`,
    );
    return response;
  }),
);

export async function GET(request: Request) {
  const response = await handle(request);
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
