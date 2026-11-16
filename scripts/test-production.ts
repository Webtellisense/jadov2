import { run, withIsolatedDatabase } from "./isolated-database";
if (!process.env.DATABASE_URL)
  throw new Error("A local test database configuration is required.");
await withIsolatedDatabase(async (env) => {
  await run(process.execPath, ["--import", "tsx", "db/seed.ts"], env);
  await run(process.execPath, ["--import", "tsx", "db/prototype-seed.ts"], env);
  await run(
    process.execPath,
    ["--import", "tsx", "scripts/verify-production.ts"],
    env,
  );
});
