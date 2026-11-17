import { z } from "zod";
export const manageScope = "https://www.googleapis.com/auth/business.manage";
export const accountName = z.string().regex(/^accounts\/[A-Za-z0-9_-]{1,100}$/);
export const locationName = z
  .string()
  .regex(/^locations\/[A-Za-z0-9_-]{1,100}$/);
export const cursor = z.string().max(4096).optional();
export const readMask =
  "name,title,phoneNumbers,categories,storefrontAddress,regularHours,websiteUri,serviceArea,metadata";
export const accountSchema = z.object({
  name: accountName,
  accountName: z.string().max(300).default("Google business account"),
  type: z.string().max(50),
  role: z.string().max(50).default("UNKNOWN"),
});
export type GbpAccount = z.infer<typeof accountSchema>;
export type GbpLocation = {
  name: string;
  title: string;
  category: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  serviceArea: boolean;
  hours: unknown;
  placeId: string | null;
  mapsUri: string | null;
  hasVoiceOfMerchant: boolean | null;
};
export type Page<T> = { items: T[]; nextPageToken?: string };
export type RoleEvidence = {
  role: "owner" | "manager" | "unknown";
  source: "location_account_chain" | "unresolved";
};
export type VoiceEvidence = {
  hasVoiceOfMerchant: boolean;
  reason: string | null;
};
export type Grant = {
  subject: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
};
export type Token = Omit<Grant, "subject">;
export type FailureCode =
  | "ACCESS_PENDING"
  | "NOT_CONFIGURED"
  | "API_DISABLED"
  | "PERMISSION_DENIED"
  | "AUTH_REVOKED"
  | "TOKEN_EXPIRED"
  | "TEMPORARY_FAILURE"
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "INVALID_REQUEST"
  | "INVALID_RESPONSE"
  | "LOCATION_UNAVAILABLE";
export class GbpFailure extends Error {
  constructor(
    public code: FailureCode,
    public retryable = false,
    public retryAfterMs?: number,
  ) {
    super(code);
    this.name = "GbpFailure";
  }
}
export interface GbpProvider {
  exchange(code: string, verifier: string, nonceHash: string): Promise<Grant>;
  refresh(refreshToken: string): Promise<Token>;
  revoke(token: string): Promise<void>;
  accounts(accessToken: string, page?: string): Promise<Page<GbpAccount>>;
  account(accessToken: string, name: string): Promise<GbpAccount>;
  locations(
    accessToken: string,
    account: string,
    page?: string,
  ): Promise<Page<GbpLocation>>;
  location(accessToken: string, name: string): Promise<GbpLocation>;
  voice(accessToken: string, location: GbpLocation): Promise<VoiceEvidence>;
  role(
    accessToken: string,
    account: GbpAccount,
    location: string,
  ): Promise<RoleEvidence>;
}
export type GbpConfig = {
  available: boolean;
  oauthConfigured: boolean;
  reason: "ACCESS_PENDING" | "NOT_CONFIGURED" | null;
  origin: string;
  callback: string;
  clientId: string;
  clientSecret: string;
  keyVersion: string;
  keys: Record<string, Buffer>;
};
