import { connectDatabase } from "./connection";
import { seedDevelopment, undoDevelopmentSeed } from "./seed-data";
import { assertLocalDevelopmentDatabase } from "./dev-guard";
assertLocalDevelopmentDatabase();
const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
try {
  if (process.argv.includes("--undo")) {
    await undoDevelopmentSeed(db);
    console.log("Development fixtures removed.");
  } else {
    await seedDevelopment(db);
    console.log(
      "Labeled development fixtures seeded. No business is verified.",
    );
  }
} finally {
  await pool.end();
}
