import { readMigrationFiles } from "drizzle-orm/migrator";
import { connectDatabase } from "./connection";
import { assertLocalDevelopmentDatabase } from "./dev-guard";
assertLocalDevelopmentDatabase();
if (process.env.CONFIRM_PROTOTYPE_ROLLBACK !== "true")
  throw new Error(
    "Set CONFIRM_PROTOTYPE_ROLLBACK=true on a disposable local database only.",
  );
const { pool } = connectDatabase(process.env.DATABASE_URL!);
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const history = await client.query(
    "SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at",
  );
  const migrations = readMigrationFiles({
    migrationsFolder: "./db/migrations",
  });
  if (history.rows.length !== 2 || history.rows[1].hash !== migrations[1].hash)
    throw new Error(
      "Prototype rollback requires exactly the known M0 and M0.5 migrations.",
    );
  await client.query(
    "DROP TABLE development_post, development_business, development_category",
  );
  await client.query("DELETE FROM drizzle.__drizzle_migrations WHERE hash=$1", [
    migrations[1].hash,
  ]);
  await client.query("COMMIT");
  console.log("Prototype schema rolled back. M0 tables and data preserved.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
