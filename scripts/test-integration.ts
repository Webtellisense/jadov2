import { Client } from "pg";
import assert from "node:assert/strict";
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
    [
      "exec",
      "--",
      "vitest",
      "run",
      "--project",
      "integration",
      "tests/integration/foundation.test.ts",
      "tests/integration/prototype.test.ts",
    ],
    env,
  );
}, 3);

await withIsolatedDatabase(async (env) => {
  await run(
    "npm",
    [
      "exec",
      "--",
      "vitest",
      "run",
      "--project",
      "integration",
      "tests/integration/m25.test.ts",
    ],
    env,
  );
});

await withIsolatedDatabase(async (env) => {
  const legacy = new Client({ connectionString: env.DATABASE_URL });
  await legacy.connect();
  try {
    await legacy.query(
      "insert into business (id,slug,google_place_id,status) values ('legacy-authority','legacy-authority','legacy-test-place','verified_active'),('legacy-closed','legacy-closed','legacy-closed-place','closed')",
    );
    await run(process.execPath, ["--import", "tsx", "db/migrate.ts"], env);
    const result = await legacy.query(
      "select id,lifecycle_state,reason_code,google_place_id,archived_at from business order by id",
    );
    assert.equal(result.rows.length, 2);
    assert.equal(result.rows[0].lifecycle_state, "reverification_required");
    assert.equal(result.rows[0].google_place_id, "legacy-test-place");
    assert.equal(result.rows[1].reason_code, "LEGACY_CLOSED");
    assert(result.rows[1].archived_at);
    console.log(
      "M2.5 upgrade preservation: 5 checks passed; no legacy business was published.",
    );
  } finally {
    await legacy.end();
  }
}, 3);
