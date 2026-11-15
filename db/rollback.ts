import { connectDatabase } from "./connection";
import { assertLocalDevelopmentDatabase } from "./dev-guard";
assertLocalDevelopmentDatabase();
if (process.env.CONFIRM_INITIAL_ROLLBACK !== "true")
  throw new Error(
    "This drops the M0 tables. Set CONFIRM_INITIAL_ROLLBACK=true on a disposable local database only.",
  );
const { pool } = connectDatabase(process.env.DATABASE_URL!);
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const { rows } = await client.query(
    "SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations",
  );
  if (rows[0].count !== 1)
    throw new Error(
      "Rollback supports exactly the initial migration; inspect migration history.",
    );
  await client.query(
    "DROP TABLE mutation_limit, audit_log, business_membership, business, auth_verification, auth_session, auth_rate_limit, auth_account, auth_user",
  );
  await client.query(
    "DROP TYPE member_role, business_state, account_state, platform_role",
  );
  await client.query("DELETE FROM drizzle.__drizzle_migrations");
  await client.query("COMMIT");
  console.log(
    "Initial M0 migration rolled back. Local application data was removed.",
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
