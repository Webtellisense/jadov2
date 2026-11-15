export function assertLocalDevelopmentDatabase(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.NODE_ENV === "production" || env.ALLOW_DEV_SEED !== "true") {
    throw new Error(
      "Development data operations require ALLOW_DEV_SEED=true and a nonproduction runtime.",
    );
  }
  const url = new URL(env.DATABASE_URL ?? "");
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/^\/jado_(dev|test(?:_[a-z0-9_]+)?)$/.test(url.pathname)
  ) {
    throw new Error(
      "Development data operations require a loopback jado_dev or jado_test database.",
    );
  }
}
