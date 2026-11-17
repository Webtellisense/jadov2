import { getRuntime } from "@/server/runtime";
import { requirePrincipal } from "@/server/authorization";
import { assertSameOrigin, json, readJson, route } from "@/server/http";
import { readBusinessDraft, saveBusinessDraft } from "@/server/business-drafts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function idFrom(request: Request) {
  return new URL(request.url).pathname.split("/").at(-1)!;
}
export const GET = route(async (request) => {
  const { db, auth } = getRuntime();
  return json(
    await readBusinessDraft(
      db,
      await requirePrincipal(db, auth, request.headers),
      idFrom(request),
    ),
  );
});
export const PATCH = route(async (request, requestId) => {
  const { db, auth, config } = getRuntime();
  assertSameOrigin(request, config.APP_ORIGIN);
  const principal = await requirePrincipal(db, auth, request.headers);
  return json(
    await saveBusinessDraft(
      db,
      principal,
      idFrom(request),
      await readJson(request),
      requestId,
    ),
  );
});
