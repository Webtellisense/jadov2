import { getRuntime } from "@/server/runtime";
import { requirePrincipal } from "@/server/authorization";
import { updateName } from "@/server/account";
import { assertSameOrigin, json, readJson, route } from "@/server/http";
export const PATCH = route(async (request, requestId) => {
  const { db, auth, config } = getRuntime();
  const principal = await requirePrincipal(db, auth, request.headers);
  assertSameOrigin(request, config.APP_ORIGIN);
  return json(
    await updateName(db, principal, await readJson(request), requestId),
  );
});
