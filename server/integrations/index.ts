export type Unavailable = {
  ok: false;
  reason: "DISABLED" | "BUDGET_NOT_APPROVED" | "NOT_IMPLEMENTED";
};
export type ProviderResult<T> = { ok: true; data: T } | Unavailable;
export interface PlacesProvider {
  search(
    query: string,
  ): Promise<ProviderResult<readonly { placeId: string }[]>>;
}
export interface BusinessProfileProvider {
  verifyManagement(
    placeId: string,
  ): Promise<ProviderResult<{ authorized: boolean }>>;
}
export interface AiProvider {
  recommend(query: string): Promise<ProviderResult<{ businessIds: string[] }>>;
}
export interface WhatsAppProvider {
  notify(input: {
    confirmedNumber: string;
    conversationUrl: string;
  }): Promise<ProviderResult<void>>;
}
export interface EmailProvider {
  sendVerification(input: {
    email: string;
    code: string;
  }): Promise<ProviderResult<void>>;
}
export interface StorageProvider {
  put(input: {
    key: string;
    content: Uint8Array;
    contentType: string;
  }): Promise<ProviderResult<{ key: string }>>;
}

// M0 deliberately has no transport or real provider implementation.
function unavailable(
  env: Record<string, string | undefined>,
  prefix: string,
): Unavailable {
  if (env[`${prefix}_ENABLED`] !== "true")
    return { ok: false, reason: "DISABLED" };
  const cap = Number(env[`${prefix}_SPEND_CAP_USD`] ?? 0);
  if (!Number.isFinite(cap) || cap <= 0)
    return { ok: false, reason: "BUDGET_NOT_APPROVED" };
  return { ok: false, reason: "NOT_IMPLEMENTED" };
}
export function createProviders(
  env: Record<string, string | undefined> = process.env,
): {
  places: PlacesProvider;
  businessProfile: BusinessProfileProvider;
  ai: AiProvider;
  whatsapp: WhatsAppProvider;
  email: EmailProvider;
  storage: StorageProvider;
} {
  return {
    places: { search: async () => unavailable(env, "GOOGLE_PLACES") },
    businessProfile: {
      verifyManagement: async () => unavailable(env, "GOOGLE_BUSINESS_PROFILE"),
    },
    ai: { recommend: async () => unavailable(env, "AI") },
    whatsapp: { notify: async () => unavailable(env, "WHATSAPP") },
    email: { sendVerification: async () => unavailable(env, "EMAIL") },
    storage: { put: async () => unavailable(env, "STORAGE") },
  };
}
