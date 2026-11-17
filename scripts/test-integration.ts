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
  await run(
    "npm",
    [
      "exec",
      "--",
      "vitest",
      "run",
      "--project",
      "integration",
      "tests/integration/gbp.test.ts",
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

// Upgrade an actual Slice 1 draft plus populated M0.5 fixtures, without reseeding after 0004.
await withIsolatedDatabase(async (env) => {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    await run(
      process.execPath,
      ["--import", "tsx", "db/prototype-seed.ts"],
      env,
    );
    await client.query(
      "insert into auth_user(id,name,email,email_verified) values ('slice1-upgrade-user','Slice 1 applicant','slice1-upgrade@example.invalid',true)",
    );
    await client.query(
      "insert into business(id,slug,lifecycle_state,reason_code) values ('slice1-upgrade-business','slice1-upgrade-business','pending_gbp_approval','GBP_ACCESS_PENDING')",
    );
    const details = {
      name: "Preserved Slice 1 draft",
      description: "Original private content",
      serviceArea: "Uyo",
    };
    await client.query(
      "insert into business_onboarding(business_id,applicant_user_id,details,version) values ('slice1-upgrade-business','slice1-upgrade-user',$1,4)",
      [JSON.stringify(details)],
    );
    await client.query(
      "insert into business_profile(business_id,description,service_area) values ('slice1-upgrade-business','Original private content','Uyo')",
    );
    await client.query(
      "insert into verification_audit_logs(id,business_id,actor_id,event,request_id) values ('slice1-upgrade-audit','slice1-upgrade-business','slice1-upgrade-user','draft.saved','upgrade-test')",
    );
    await run(process.execPath, ["--import", "tsx", "db/migrate.ts"], env);
    const saved = (
      await client.query(
        "select b.lifecycle_state,o.details,o.version,p.description from business b join business_onboarding o on b.id=o.business_id join business_profile p on p.business_id=b.id where b.id='slice1-upgrade-business'",
      )
    ).rows[0];
    assert.equal(saved.lifecycle_state, "pending_gbp_approval");
    assert.deepEqual(saved.details, details);
    assert.equal(saved.version, 4);
    assert.equal(saved.description, "Original private content");
    assert.equal(
      (
        await client.query(
          "select count(*)::int as n from development_business",
        )
      ).rows[0].n,
      10,
    );
    assert.equal(
      (await client.query("select count(*)::int as n from development_post"))
        .rows[0].n,
      20,
    );
    assert.equal(
      (
        await client.query(
          "select count(*)::int as n from verification_audit_logs where id='slice1-upgrade-audit'",
        )
      ).rows[0].n,
      1,
    );
    console.log(
      "Slice 1 -> Slice 2 additive upgrade: 7 checks passed; private content, version, audit and ten businesses/twenty posts preserved.",
    );
  } finally {
    await client.end();
  }
}, 4);
