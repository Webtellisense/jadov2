import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { connectDatabase } from "@/db/connection";
import { stopChild } from "./stop-child";
const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
try {
  const counts = await db.execute(
    sql`select (select count(*)::int from development_business where seed_key='jado-m05-v1' and presentation is not null) as businesses, (select count(*)::int from development_post where seed_key='jado-m05-v1' and presentation is not null) as posts`,
  );
  assert.equal(
    counts.rows[0].businesses,
    10,
    "Performance requires all ten enriched fixtures.",
  );
  assert.equal(counts.rows[0].posts, 20);
} finally {
  await pool.end();
}
const server = spawn(process.execPath, [".next/standalone/server.js"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: "3300",
    HOSTNAME: "127.0.0.1",
    APP_ORIGIN: "https://localhost:3300",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.resume();
server.stderr.resume();
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    assert(
      server.exitCode === null && server.signalCode === null,
      "Performance server exited.",
    );
    try {
      ready = (
        await fetch("http://localhost:3300/api/health", {
          signal: AbortSignal.timeout(5000),
        })
      ).ok;
    } catch {}
    if (ready) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  assert(ready, "Performance server not ready.");
  const check = await (
    await fetch("http://localhost:3300/api/discovery?area=Uyo")
  ).json();
  assert.equal(check.businesses.length, 10);
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/measure-ui.ts"],
    {
      env: {
        ...process.env,
        PERF_ORIGIN: "http://localhost:3300",
        PERF_OUTPUT_DIR: "docs/evidence/m05-visual-polish",
      },
      stdio: "inherit",
    },
  );
  const [code] = await once(child, "exit");
  assert.equal(code, 0);
} finally {
  await stopChild(server);
}
