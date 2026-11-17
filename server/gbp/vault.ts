import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { GbpConfig } from "./contracts";
export function digest(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}
export function sameDigest(left: string, right: string) {
  const a = Buffer.from(left),
    b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function encrypt(config: GbpConfig, value: string, context: string) {
  const key = config.keys[config.keyVersion];
  if (!key) throw new Error("GBP encryption configuration unavailable");
  const nonce = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(`${config.keyVersion}:${context}`));
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    config.keyVersion,
    nonce.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    body.toString("base64url"),
  ].join(".");
}
export function decrypt(config: GbpConfig, value: string, context: string) {
  try {
    const [version, nonce, tag, body, extra] = value.split(".");
    const key = config.keys[version];
    if (!key || extra !== undefined || !nonce || !tag || !body)
      throw new Error();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(nonce, "base64url"),
    );
    decipher.setAAD(Buffer.from(`${version}:${context}`));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(body, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("GBP credentials could not be decrypted");
  }
}
