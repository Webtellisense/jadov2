import { run, withIsolatedDatabase } from "./isolated-database";
await withIsolatedDatabase(async (env) => {
  await run(process.execPath, ["--import", "tsx", "db/prototype-seed.ts"], env);
  await run(
    process.execPath,
    ["--import", "tsx", "scripts/verify-discovery.ts"],
    env,
  );
});
