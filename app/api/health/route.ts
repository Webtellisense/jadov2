import { sql } from "drizzle-orm";
import { getRuntime } from "@/server/runtime";
import { json, route } from "@/server/http";
export const dynamic = "force-dynamic";
export const GET = route(async () => {
  await getRuntime().db.execute(sql`select 1`);
  return json({ status: "ok" });
});
