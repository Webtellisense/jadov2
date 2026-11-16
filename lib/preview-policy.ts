import { assertLocalDevelopmentDatabase } from "@/db/dev-guard";
export function previewEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  if (
    env.DEV_PREVIEW_ENABLED !== "true" ||
    env.APP_ENV !== "local" ||
    env.NODE_ENV === "production" ||
    env.VERCEL ||
    env.CI_PREVIEW
  )
    return false;
  try {
    assertLocalDevelopmentDatabase({ ...env, ALLOW_DEV_SEED: "true" });
    return ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(env.APP_ORIGIN ?? "").hostname,
    );
  } catch {
    return false;
  }
}
