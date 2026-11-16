import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { run } from "./isolated-database";
const origin = "http://localhost:3200";
const server = spawn(process.execPath, [".next/standalone/server.js"], {
  env: {
    ...process.env,
    PORT: "3200",
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    APP_ENV: "production",
    APP_ORIGIN: "https://localhost:3200",
    DEV_PREVIEW_ENABLED: "true",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.resume();
server.stderr.resume();
const checks: { name: string; status?: number; pass: boolean }[] = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      ready = (await fetch(`${origin}/api/health`)).ok;
    } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert(ready, "Production health did not become ready.");
  checks.push({ name: "real PostgreSQL health", status: 200, pass: true });
  for (const path of [
    "/dev?area=Uyo",
    "/dev/b/amber-roof?area=Uyo",
    "/design",
    "/api/dev/discovery?area=Uyo",
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 404, `Private route status: ${path}`);
    assert(!(await response.text()).includes("Amber Roof Solar"));
    checks.push({
      name: `production denies ${path}`,
      status: response.status,
      pass: true,
    });
  }
  const publicResponse = await fetch(`${origin}/?area=Uyo&demo=true`);
  assert(publicResponse.ok);
  const html = await publicResponse.text();
  assert(html.includes("No matching businesses yet"));
  assert(!html.includes("Amber Roof Solar"));
  checks.push({
    name: "public HTML remains empty despite fixture records and demo query",
    status: publicResponse.status,
    pass: true,
  });
  const result = await fetch(`${origin}/api/discovery?area=Uyo&demo=true`);
  assert.deepEqual((await result.json()).businesses, []);
  checks.push({
    name: "public API excludes all fixtures",
    status: result.status,
    pass: true,
  });
  const auth = await fetch(`${origin}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      origin: "https://localhost:3200",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "consumer@example.invalid",
      password: process.env.DEV_SEED_PASSWORD,
    }),
  });
  assert.equal(auth.status, 403, "Production fixture login must be denied.");
  checks.push({
    name: "production rejects valid fixture credentials",
    status: auth.status,
    pass: true,
  });
  for (const name of [
    "inter.woff2",
    "bricolage.woff2",
    "inter-currency.woff2",
    "bricolage-currency.woff2",
  ]) {
    const response = await fetch(`${origin}/fonts/${name}`);
    assert.equal(response.status, 200);
    checks.push({
      name: `standalone font asset ${name}`,
      status: 200,
      pass: true,
    });
  }
  assert(
    !readdirSync(".next/standalone").some(
      (name) => name === ".env" || name.startsWith(".env."),
    ),
  );
  checks.push({
    name: "standalone contains no local dotenv files",
    pass: true,
  });
  function inspect(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) inspect(path);
      else if (path.endsWith(".js")) {
        const source = readFileSync(path, "utf8");
        assert(
          ![
            "Amber Roof Solar",
            "Pocket Beam Supply",
            "Daybreak Power Studio",
          ].some((name) => source.includes(name)),
          "Fixture identity found in public JavaScript.",
        );
      }
    }
  }
  inspect(".next/static");
  checks.push({
    name: "public JavaScript has no fixture business names",
    pass: true,
  });
  mkdirSync("docs/evidence/m05", { recursive: true });
  writeFileSync(
    "docs/evidence/m05/production-smoke.json",
    JSON.stringify(
      {
        environment:
          "Local optimised production runtime over loopback HTTP; HTTPS configured for auth policy, actual deployment/TLS is not claimed.",
        fixtureDatabase:
          "Disposable local PostgreSQL with genuine fixture credentials and all ten fictional businesses.",
        previewFlagIntentionallyTrue: true,
        checks,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Production smoke: ${checks.length} checks passed.`);
  await run(process.execPath, ["--import", "tsx", "scripts/measure-ui.ts"], {
    ...process.env,
    PERF_ORIGIN: origin,
  });
} finally {
  server.kill("SIGTERM");
  if (server.exitCode === null)
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        server.kill("SIGKILL");
        resolve();
      }, 5000);
      server.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
}
