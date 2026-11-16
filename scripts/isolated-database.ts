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
    await run(process.execPath, ["--import", "tsx", "db/migrate.ts"], env);
    await work(env);
  } finally {
    await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await admin.end();
  }
}
