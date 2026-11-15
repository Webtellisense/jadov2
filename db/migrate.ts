import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connectDatabase } from "./connection";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const { db, pool } = connectDatabase(process.env.DATABASE_URL);
try {
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("PostgreSQL migrations applied.");
} finally {
  await pool.end();
}
