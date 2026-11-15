import "server-only";
import { connectDatabase } from "@/db/connection";
import { readConfig } from "@/lib/config";
import { createAuth } from "./auth";

function createRuntime() {
  const config = readConfig();
  const connection = connectDatabase(config.DATABASE_URL);
  connection.pool.on("error", () =>
    console.error(JSON.stringify({ event: "database_pool_error" })),
  );
  return { ...connection, config, auth: createAuth(connection.db, config) };
}
const globals = globalThis as unknown as {
  jadoRuntime?: ReturnType<typeof createRuntime>;
};
export function getRuntime() {
  return (globals.jadoRuntime ??= createRuntime());
}
