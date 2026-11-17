export function fixturesVisible(
  env: Record<string, string | undefined> = process.env,
) {
  if (
    env.APP_ENV === "production" ||
    (!env.APP_ENV && env.NODE_ENV === "production")
  )
    return false;
  if (env.JADO_FIXTURES_VISIBLE !== undefined)
    return env.JADO_FIXTURES_VISIBLE === "true";
  return (
    env.APP_ENV === "local" ||
    (env.NODE_ENV !== "production" && env.APP_ENV !== "staging")
  );
}
