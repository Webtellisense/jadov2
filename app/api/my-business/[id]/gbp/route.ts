import { z } from "zod";
import { accountName, locationName, cursor } from "@/server/gbp/contracts";
import { getGbpService, gbpActor, safeGbp } from "@/server/gbp/runtime";
import { assertSameOrigin, json, readJson, route } from "@/server/http";
import { getRuntime } from "@/server/runtime";
import { AppError } from "@/server/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const action = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("select"),
      account: accountName,
      location: locationName,
      page: cursor,
    })
    .strict(),
  z.object({ action: z.enum(["recheck", "disconnect"]) }).strict(),
]);
const idFrom = (request: Request) =>
  new URL(request.url).pathname.split("/").at(-2)!;
export const GET = route(async (request, requestId) =>
  safeGbp(async () => {
    const service = getGbpService(),
      actor = await gbpActor(request.headers),
      id = idFrom(request),
      params = new URL(request.url).searchParams;
    const query = z
      .object({
        kind: z.enum(["accounts", "locations"]).optional(),
        account: accountName.optional(),
        page: cursor,
      })
      .strict()
      .safeParse(Object.fromEntries(params));
    if (!query.success)
      throw new AppError(
        400,
        "INVALID_INPUT",
        "Check the Google account selection.",
      );
    if (query.data.kind === "accounts")
      return json(
        await service.accounts(actor, id, query.data.page, requestId),
      );
    if (query.data.kind === "locations") {
      if (!query.data.account)
        throw new AppError(
          400,
          "INVALID_INPUT",
          "Choose a Google business account.",
        );
      return json(
        await service.locations(
          actor,
          id,
          query.data.account,
          query.data.page,
          requestId,
        ),
      );
    }
    return json(await service.status(actor, id));
  }),
);
export const POST = route(async (request, requestId) =>
  safeGbp(async () => {
    assertSameOrigin(request, getRuntime().config.APP_ORIGIN);
    const actor = await gbpActor(request.headers),
      parsed = action.safeParse(await readJson(request));
    if (!parsed.success)
      throw new AppError(
        400,
        "INVALID_INPUT",
        "Check the Google connection action.",
      );
    const service = getGbpService(),
      id = idFrom(request),
      data = parsed.data;
    if (data.action === "select")
      return json(
        await service.select(
          actor,
          id,
          data.account,
          data.location,
          data.page,
          requestId,
        ),
      );
    return json(
      data.action === "recheck"
        ? await service.recheck(actor, id, requestId)
        : await service.disconnect(actor, id, requestId),
    );
  }),
);
