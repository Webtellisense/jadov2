import { cpSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const output = ".next/standalone";
cpSync(".next/static", join(output, ".next/static"), { recursive: true });
// Next.js traces local dotenv files into standalone output. Runtime secrets
// belong in the deployment environment, never in the packaged artifact.
for (const entry of readdirSync(output)) {
  if (entry === ".env" || entry.startsWith(".env."))
    rmSync(join(output, entry), { force: true });
}
console.log("Standalone assets prepared; local dotenv files excluded.");
