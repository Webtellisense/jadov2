import { run, withIsolatedDatabase } from "./isolated-database";
await withIsolatedDatabase(async (env) => {
  await run(process.execPath, ["--import", "tsx", "db/seed.ts"], env);
  await run("npm", ["exec", "--", "playwright", "test"], {
    ...env,
    NODE_ENV: "development",
    APP_ORIGIN: "http://localhost:3100",
  });
});
