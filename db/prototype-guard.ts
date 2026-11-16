// Fixture operations are explicit CLI actions. Deployment/database isolation is infrastructure-owned.
export function assertPrototypeSeedAllowed(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.ALLOW_DEV_SEED !== "true")
    throw new Error("Fixture seed/undo requires ALLOW_DEV_SEED=true.");
  const url = new URL(env.DATABASE_URL ?? "");
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    url.pathname.length < 2
  )
    throw new Error(
      "DATABASE_URL must identify the intended development/staging PostgreSQL database.",
    );
}
