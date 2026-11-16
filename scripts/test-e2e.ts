import { run, withIsolatedDatabase } from "./isolated-database";
await withIsolatedDatabase(async (env) => {
  await run(process.execPath, ["--import", "tsx", "db/seed.ts"], env);
  await run(process.execPath, ["--import", "tsx", "db/prototype-seed.ts"], {
    ...env,
    APP_ENV: "local",
  });
  await run(
    "npm",
    ["exec", "--", "playwright", "test", ...process.argv.slice(2)],
    {
      ...env,
      NODE_ENV: "development",
      APP_ENV: "local",
      DEV_PREVIEW_ENABLED: "true",
      APP_ORIGIN: "http://localhost:3100",
    },
  );
});
