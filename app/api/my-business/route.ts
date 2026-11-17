import { getRuntime } from "@/server/runtime";
import { requirePrincipal } from "@/server/authorization";
import { assertSameOrigin, json, readJson, route } from "@/server/http";
import {
  createBusinessDraft,
  listBusinessDrafts,
} from "@/server/business-drafts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = route(async (request) => {
  const { db, auth } = getRuntime();
  return json({
    businesses: await listBusinessDrafts(
      db,
      await requirePrincipal(db, auth, request.headers),
    ),
  });
});
export const POST = route(async (request, requestId) => {
  const { db, auth, config } = getRuntime();
  assertSameOrigin(request, config.APP_ORIGIN);
  const principal = await requirePrincipal(db, auth, request.headers);
  return json(
    await createBusinessDraft(
      db,
      principal,
      await readJson(request),
      requestId,
    ),
    201,
  );
});
