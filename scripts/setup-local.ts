import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (existsSync(".env")) console.log("Preserved existing .env.");
else {
  const example = readFileSync(".env.example", "utf8");
  writeFileSync(
    ".env",
    example
      .replace(
        "BETTER_AUTH_SECRET=\n",
        `BETTER_AUTH_SECRET=${randomBytes(32).toString("base64url")}\n`,
      )
      .replace(
        "DEV_SEED_PASSWORD=\n",
        `DEV_SEED_PASSWORD=${randomBytes(24).toString("base64url")}\n`,
      ),
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    "Created ignored .env with generated local auth and seed secrets. Seed opt-in remains disabled.",
  );
}
