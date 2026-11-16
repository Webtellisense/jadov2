import { connectDatabase } from "./connection";
import { seedPrototype, undoPrototype } from "./prototype-data";
import { assertLocalDevelopmentDatabase } from "./dev-guard";
assertLocalDevelopmentDatabase();
const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
try {
  if (process.argv.includes("--undo")) {
    await undoPrototype(db);
    console.log("M0.5 fictional dataset removed; M0 data preserved.");
  } else {
    await seedPrototype(db);
    console.log(
      "Exactly ten fictional businesses and twenty structured posts seeded. No verified businesses created.",
    );
  }
} finally {
  await pool.end();
}
