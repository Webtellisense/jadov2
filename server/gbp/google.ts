import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { z } from "zod";
import {
  accountName,
  accountSchema,
  GbpFailure,
  locationName,
  manageScope,
  readMask,
  type GbpAccount,
  type GbpConfig,
  type GbpLocation,
  type GbpProvider,
  type Token,
} from "./contracts";
import { requireLive } from "./config";
import { digest, sameDigest } from "./vault";
const accountsHost = "https://mybusinessaccountmanagement.googleapis.com/v1/";
const locationsHost =
  "https://mybusinessbusinessinformation.googleapis.com/v1/";
const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const text = z.string().max(10000);
const locationSchema = z.object({
  name: locationName,
  title: text,
  categories: z
    .object({ primaryCategory: z.object({ displayName: text }).optional() })
    .optional(),
  phoneNumbers: z.object({ primaryPhone: text.optional() }).optional(),
  websiteUri: text.optional(),
  storefrontAddress: z
    .object({
      addressLines: z.array(text).optional(),
      locality: text.optional(),
      administrativeArea: text.optional(),
      regionCode: text.optional(),
    })
    .optional(),
  regularHours: z.unknown().optional(),
  serviceArea: z
    .object({
      businessType: z.string().optional(),
      places: z
        .object({ placeInfos: z.array(z.unknown()).optional() })
        .optional(),
    })
    .optional(),
  metadata: z
    .object({
      placeId: text.optional(),
      mapsUri: text.optional(),
      hasVoiceOfMerchant: z.boolean().optional(),
    })
    .optional(),
});
export function normalizeLocation(input: unknown): GbpLocation {
  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) throw new GbpFailure("INVALID_RESPONSE");
  const v = parsed.data,
    a = v.storefrontAddress;
  return {
    name: v.name,
    title: v.title,
    category: v.categories?.primaryCategory?.displayName || null,
    phone: v.phoneNumbers?.primaryPhone || null,
    website: v.websiteUri || null,
    address: a
      ? [
          ...(a.addressLines || []),
          a.locality,
          a.administrativeArea,
          a.regionCode,
        ]
          .filter(Boolean)
          .join(", ") || null
      : null,
    serviceArea: !!(
      v.serviceArea &&
      (["CUSTOMER_LOCATION_ONLY", "CUSTOMER_AND_BUSINESS_LOCATION"].includes(
        v.serviceArea.businessType || "",
      ) ||
        v.serviceArea.places?.placeInfos?.length)
    ),
    hours: v.regularHours ?? null,
    placeId: v.metadata?.placeId || null,
    mapsUri: v.metadata?.mapsUri || null,
    hasVoiceOfMerchant: v.metadata?.hasVoiceOfMerchant ?? null,
  };
}
export function googleFailure(
  status: number,
  data: unknown,
  retryAfter?: string | null,
) {
  // Never retain Google's free-text error (it can contain identifiers/credentials).
  const record = data as {
    error?:
      | {
          status?: string;
          details?: { reason?: string; metadata?: { reason?: string } }[];
        }
      | string;
  };
  const error = record?.error;
  const reasons =
    typeof error === "object"
      ? [
          error?.status,
          ...(Array.isArray(error?.details) ? error.details : []).map(
            (d) => d?.reason || d?.metadata?.reason,
          ),
        ]
      : [error];
  const has = (...codes: string[]) =>
    reasons.some((r) => r && codes.includes(r));
  if (has("invalid_grant")) return new GbpFailure("AUTH_REVOKED");
  if (has("SERVICE_DISABLED", "ACCESS_NOT_CONFIGURED", "API_DISABLED"))
    return new GbpFailure("API_DISABLED");
  if (has("QUOTA_EXCEEDED", "DAILY_LIMIT_EXCEEDED", "QUOTA_EXHAUSTED"))
    return new GbpFailure("QUOTA_EXHAUSTED");
  if (status === 401) return new GbpFailure("TOKEN_EXPIRED");
  if (status === 403) return new GbpFailure("PERMISSION_DENIED");
  if (status === 404) return new GbpFailure("LOCATION_UNAVAILABLE");
  const seconds = Number(retryAfter);
  if (status === 429)
    return new GbpFailure(
      "RATE_LIMITED",
      true,
      Number.isFinite(seconds) && seconds > 0
        ? Math.min(seconds * 1000, 2000)
        : 250,
    );
  if (status >= 500) return new GbpFailure("TEMPORARY_FAILURE", true);
  return new GbpFailure("INVALID_REQUEST");
}
export class GoogleGbpProvider implements GbpProvider {
  constructor(
    private config: GbpConfig,
    private fetcher: typeof fetch = fetch,
  ) {}
  private async request(
    url: string,
    init: RequestInit,
    retry = false,
    revocation = false,
  ): Promise<unknown> {
    if (revocation) {
      if (!this.config.oauthConfigured) throw new GbpFailure("NOT_CONFIGURED");
    } else requireLive(this.config);
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await this.fetcher(url, {
          ...init,
          redirect: "error",
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        const raw = await response.text();
        if (raw.length > 2_000_000) throw new GbpFailure("INVALID_RESPONSE");
        let data: unknown;
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          throw new GbpFailure("INVALID_RESPONSE");
        }
        if (!response.ok)
          throw googleFailure(
            response.status,
            data,
            response.headers.get("retry-after"),
          );
        return data;
      } catch (error) {
        const failure =
          error instanceof GbpFailure
            ? error
            : new GbpFailure("TEMPORARY_FAILURE", true);
        if (!retry || !failure.retryable || attempt >= 2) throw failure;
        await new Promise((r) =>
          setTimeout(
            r,
            failure.retryAfterMs ??
              150 * 2 ** attempt + Math.floor(Math.random() * 100),
          ),
        );
      }
    }
  }
  private get(url: string, token: string) {
    return this.request(
      url,
      { headers: { Authorization: `Bearer ${token}` } },
      true,
    );
  }
  private async token(
    body: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    return (await this.request("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        ...body,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    })) as Record<string, unknown>;
  }
  private normalizeToken(
    data: Record<string, unknown>,
    requireScope = true,
  ): Token {
    const parsed = z
      .object({
        access_token: z.string().min(1).max(20000),
        refresh_token: z.string().min(1).max(20000).optional(),
        token_type: z.literal("Bearer"),
        expires_in: z.number().int().positive().max(86400),
        scope: z.string().optional(),
      })
      .safeParse(data);
    if (!parsed.success) throw new GbpFailure("INVALID_RESPONSE");
    const v = parsed.data,
      scopes = v.scope?.split(" ").filter(Boolean) || [];
    if (requireScope && !scopes.includes(manageScope))
      throw new GbpFailure("PERMISSION_DENIED");
    return {
      accessToken: v.access_token,
      refreshToken: v.refresh_token,
      expiresAt: new Date(Date.now() + v.expires_in * 1000),
      scopes,
    };
  }
  async exchange(code: string, verifier: string, nonceHash: string) {
    const data = await this.token({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: this.config.callback,
    });
    if (typeof data.id_token !== "string")
      throw new GbpFailure("INVALID_RESPONSE");
    try {
      const subject = await verifyGoogleIdentity(
        data.id_token,
        this.config.clientId,
        nonceHash,
      );
      return { ...this.normalizeToken(data), subject };
    } catch (error) {
      if (error instanceof GbpFailure) throw error;
      throw new GbpFailure("INVALID_RESPONSE");
    }
  }
  async refresh(refreshToken: string) {
    return this.normalizeToken(
      await this.token({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      false,
    );
  }
  async revoke(token: string) {
    // Explicit revocation remains possible if GBP quota access is later disabled.
    await this.request(
      "https://oauth2.googleapis.com/revoke",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }),
      },
      false,
      true,
    );
  }

  async accounts(token: string, page?: string) {
    const url = new URL(`${accountsHost}accounts`);
    url.searchParams.set("pageSize", "20");
    if (page) url.searchParams.set("pageToken", page);
    const data = await this.get(url.href, token);
    const parsed = z
      .object({
        accounts: z.array(accountSchema).default([]),
        nextPageToken: z.string().max(4096).optional(),
      })
      .safeParse(data);
    if (!parsed.success) throw new GbpFailure("INVALID_RESPONSE");
    return {
      items: parsed.data.accounts,
      nextPageToken: parsed.data.nextPageToken,
    };
  }
  async account(token: string, name: string) {
    accountName.parse(name);
    const result = accountSchema.safeParse(
      await this.get(`${accountsHost}${name}`, token),
    );
    if (!result.success || result.data.name !== name)
      throw new GbpFailure("INVALID_RESPONSE");
    return result.data;
  }
  async locations(token: string, account: string, page?: string) {
    accountName.parse(account);
    const url = new URL(`${locationsHost}${account}/locations`);
    url.searchParams.set("readMask", readMask);
    url.searchParams.set("pageSize", "100");
    if (page) url.searchParams.set("pageToken", page);
    const data = z
      .object({
        locations: z.array(z.unknown()).default([]),
        nextPageToken: z.string().max(4096).optional(),
      })
      .safeParse(await this.get(url.href, token));
    if (!data.success) throw new GbpFailure("INVALID_RESPONSE");
    return {
      items: data.data.locations.map(normalizeLocation),
      nextPageToken: data.data.nextPageToken,
    };
  }
  async location(token: string, name: string) {
    locationName.parse(name);
    const url = new URL(`${locationsHost}${name}`);
    url.searchParams.set("readMask", readMask);
    const data = normalizeLocation(await this.get(url.href, token));
    if (data.name !== name) throw new GbpFailure("INVALID_RESPONSE");
    return data;
  }
  async voice(token: string, location: GbpLocation) {
    if (location.hasVoiceOfMerchant === true)
      return { hasVoiceOfMerchant: true, reason: null };
    const data = await this.get(
      `https://mybusinessverifications.googleapis.com/v1/${location.name}/VoiceOfMerchantState`,
      token,
    );
    const parsed = z
      .object({
        hasVoiceOfMerchant: z.boolean().default(false),
        waitForVoiceOfMerchant: z.unknown().optional(),
        verify: z.unknown().optional(),
        resolveOwnershipConflict: z.unknown().optional(),
        complyWithGuidelines: z.unknown().optional(),
      })
      .safeParse(data);
    if (!parsed.success) throw new GbpFailure("INVALID_RESPONSE");
    const v = parsed.data;
    return {
      hasVoiceOfMerchant: v.hasVoiceOfMerchant,
      reason: v.hasVoiceOfMerchant
        ? null
        : v.resolveOwnershipConflict
          ? "GOOGLE_OWNERSHIP_CONFLICT"
          : v.complyWithGuidelines
            ? "GOOGLE_GUIDELINES_REQUIRED"
            : v.waitForVoiceOfMerchant
              ? "GOOGLE_VERIFICATION_PROCESSING"
              : "GOOGLE_VERIFICATION_REQUIRED",
    };
  }
  async role(token: string, account: GbpAccount, location: string) {
    // Google display names and input-only primaryOwner are deliberately not identity evidence.
    const unknown = { role: "unknown", source: "unresolved" } as const;
    if (account.type !== "LOCATION_GROUP") return unknown;
    locationName.parse(location);
    const raw = await this.get(`${accountsHost}${location}/admins`, token);
    const parsed = z
      .object({
        admins: z
          .array(
            z.object({
              account: accountName.optional(),
              role: z.string(),
              pendingInvitation: z.boolean().default(false),
            }),
          )
          .default([]),
      })
      .safeParse(raw);
    if (!parsed.success) throw new GbpFailure("INVALID_RESPONSE");
    const admin = parsed.data.admins.find(
      (a) => a.account === account.name && !a.pendingInvitation,
    );
    if (!admin) return unknown;
    const owners = ["OWNER", "PRIMARY_OWNER"],
      managers = [...owners, "MANAGER", "SITE_MANAGER"];
    if (owners.includes(account.role) && owners.includes(admin.role))
      return { role: "owner", source: "location_account_chain" } as const;
    if (managers.includes(account.role) && managers.includes(admin.role))
      return { role: "manager", source: "location_account_chain" } as const;
    return unknown;
  }
}

export async function verifyGoogleIdentity(
  token: string,
  audience: string,
  nonceHash: string,
  keys: JWTVerifyGetKey = jwks,
) {
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "sub", "nonce"],
      maxTokenAge: 600,
      clockTolerance: 30,
    });
    if (
      !payload.sub ||
      payload.sub.length > 255 ||
      typeof payload.nonce !== "string" ||
      !sameDigest(digest(payload.nonce), nonceHash)
    )
      throw new Error();
    return payload.sub;
  } catch {
    throw new GbpFailure("INVALID_RESPONSE");
  }
}
