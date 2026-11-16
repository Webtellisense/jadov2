import { run, withIsolatedDatabase } from "./isolated-database";
await withIsolatedDatabase(async (env) => {
  await run(process.execPath, ["--import", "tsx", "db/prototype-rollback.ts"], {
    ...env,
    CONFIRM_PROTOTYPE_ROLLBACK: "true",
  });
  await run(process.execPath, ["--import", "tsx", "db/rollback.ts"], {
    ...env,
    CONFIRM_INITIAL_ROLLBACK: "true",
  });
  await run(process.execPath, ["--import", "tsx", "db/migrate.ts"], env);
  await run(process.execPath, ["--import", "tsx", "db/migrate.ts"], env);
  await run(
    "npm",
    ["exec", "--", "vitest", "run", "--project", "integration"],
    env,
  );
});
