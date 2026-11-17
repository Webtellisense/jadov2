import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { assertLocalDevelopmentDatabase } from "@/db/dev-guard";

export function run(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with status ${code}`)),
    );
  });
}
export async function withIsolatedDatabase(
  work: (env: NodeJS.ProcessEnv) => Promise<void>,
  legacyMigrationCount?: number,
) {
  assertLocalDevelopmentDatabase({ ...process.env, ALLOW_DEV_SEED: "true" });
  const url = new URL(process.env.DATABASE_URL!);
  const name = `jado_test_${randomBytes(6).toString("hex")}`;
  url.pathname = "/postgres";
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    url.pathname = `/${name}`;
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      DATABASE_URL: url.toString(),
      ALLOW_DEV_SEED: "true",
      DEV_SEED_PASSWORD: randomBytes(24).toString("base64url"),
      NODE_ENV: "test",
      APP_ENV: "local",
    };
    if (legacyMigrationCount) {
      // Test harness only: exercise the original guarded rollback chain before full upgrade.
      const folder = mkdtempSync(join(tmpdir(), "jado-migration-history-"));
      const client = new Client({ connectionString: env.DATABASE_URL });
      try {
        mkdirSync(join(folder, "meta"));
        const journal = JSON.parse(
          readFileSync("db/migrations/meta/_journal.json", "utf8"),
        );
        journal.entries = journal.entries.slice(0, legacyMigrationCount);
        writeFileSync(
          join(folder, "meta/_journal.json"),
          JSON.stringify(journal),
        );
        for (const entry of journal.entries)
          copyFileSync(
            `db/migrations/${entry.tag}.sql`,
            join(folder, `${entry.tag}.sql`),
          );
        await client.connect();
        await migrate(drizzle(client), { migrationsFolder: folder });
      } finally {
        await client.end();
        rmSync(folder, { recursive: true, force: true });
      }
    } else
      await run(process.execPath, ["--import", "tsx", "db/migrate.ts"], env);
    await work(env);
  } finally {
    await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await admin.end();
  }
}
