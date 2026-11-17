import { GbpFailure, type GbpConfig } from "./contracts";
export function readGbpConfig(
  env: Record<string, string | undefined> = process.env,
): GbpConfig {
  const origin = env.APP_ORIGIN || "http://localhost:3000";
  const callback =
    env.GBP_OAUTH_REDIRECT_URI || `${origin}/api/gbp/oauth/callback`;
  const keys: Record<string, Buffer> = Object.create(null);
  let valid = true;
  const keyVersion = env.GBP_TOKEN_ENCRYPTION_KEY_VERSION || "1";
  try {
    const previous: unknown = JSON.parse(
      env.GBP_PREVIOUS_ENCRYPTION_KEYS || "{}",
    );
    if (!previous || typeof previous !== "object" || Array.isArray(previous))
      throw new Error();
    for (const [version, key] of Object.entries({
      ...previous,
      [keyVersion]: env.GBP_TOKEN_ENCRYPTION_KEY,
    })) {
      if (typeof key !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(key))
        throw new Error();
      const decoded = Buffer.from(key, "base64");
      if (decoded.length !== 32 || !/^[A-Za-z0-9_-]{1,30}$/.test(version))
        throw new Error();
      keys[version] = decoded;
    }
    const url = new URL(origin);
    if (
      url.origin !== origin ||
      callback !== `${origin}/api/gbp/oauth/callback` ||
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)
        ))
    )
      throw new Error();
  } catch {
    valid = false;
  }
  const configured =
    valid &&
    !!env.GBP_OAUTH_CLIENT_ID &&
    !!env.GBP_OAUTH_CLIENT_SECRET &&
    env.GBP_OAUTH_CLIENT_ID !== env.AUTH_GOOGLE_CLIENT_ID;
  const pending =
    env.GBP_PROVIDER_MODE !== "live" || env.GBP_API_ACCESS_APPROVED !== "true";
  return {
    available: !pending && configured,
    oauthConfigured: configured,
    reason: pending ? "ACCESS_PENDING" : configured ? null : "NOT_CONFIGURED",
    origin,
    callback,
    clientId: env.GBP_OAUTH_CLIENT_ID || "",
    clientSecret: env.GBP_OAUTH_CLIENT_SECRET || "",
    keyVersion,
    keys,
  };
}
export function requireLive(config: GbpConfig) {
  if (!config.available)
    throw new GbpFailure(config.reason || "NOT_CONFIGURED");
}
