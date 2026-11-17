import "server-only";
import { getRuntime } from "../runtime";
import { requirePrincipal } from "../authorization";
import { AppError } from "../errors";
import { readGbpConfig } from "./config";
import { GbpFailure } from "./contracts";
import { GoogleGbpProvider } from "./google";
import { GbpService, type Actor } from "./service";
export function getGbpService() {
  const config = readGbpConfig();
  return new GbpService(getRuntime().db, config, new GoogleGbpProvider(config));
}
export async function gbpActor(headers: Headers): Promise<Actor> {
  const { db, auth } = getRuntime();
  const principal = await requirePrincipal(db, auth, headers);
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  if (!session || session.user.id !== principal.id)
    throw new AppError(401, "UNAUTHENTICATED", "Sign in to continue.");
  return { principal, sessionId: session.session.id };
}
export async function safeGbp<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (!(error instanceof GbpFailure)) throw error;
    const messages: Record<string, string> = {
      ACCESS_PENDING:
        "Google Business Profile API approval is pending. Your private draft is safe.",
      NOT_CONFIGURED:
        "Google Business Profile connection is not configured. Your private draft is safe.",
      API_DISABLED:
        "Google Business Profile API access is not enabled for Jado. No verification has been granted.",
      PERMISSION_DENIED:
        "Google denied this request. Check the selected account and its business permissions.",
      AUTH_REVOKED:
        "Google authorization must be renewed. Reconnect your Google account.",
      TOKEN_EXPIRED: "Google authorization expired. Reconnect and try again.",
      TEMPORARY_FAILURE:
        "Google is temporarily unavailable. Your draft and verification history are preserved. Retry shortly.",
      RATE_LIMITED: "Google is limiting requests. Wait and retry.",
      QUOTA_EXHAUSTED:
        "Google API quota is exhausted. Try again after quota is restored.",
      INVALID_REQUEST:
        "Google could not accept this request. Reconnect and try again.",
      INVALID_RESPONSE:
        "Google returned an unexpected response. Verification was not granted.",
      LOCATION_UNAVAILABLE:
        "Google did not return that location. Check your Google account access and retry.",
    };
    throw new AppError(
      error.code === "RATE_LIMITED" ? 429 : 503,
      `GBP_${error.code}`,
      messages[error.code],
    );
  }
}
