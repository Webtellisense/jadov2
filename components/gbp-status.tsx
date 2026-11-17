import { Badge } from "./ui/core";
export function GbpStatus({
  state,
  reason,
}: {
  state: string;
  reason?: string | null;
}) {
  const title =
    state === "verified_eligible"
      ? "Google checks passed · Private"
      : state === "reverification_required"
        ? "Google reauthorization required · Private"
        : state === "gbp_unverified"
          ? "Google verification required · Private"
          : "Google authorization pending · Private";
  const explanations: Record<string, string> = {
    ROLE_AUTHORITY_UNRESOLVED:
      "The authority required for this Jado claim could not be confirmed. Ownership remains pending.",
    GOOGLE_VERIFICATION_REQUIRED:
      "Complete Google Business Profile verification, then re-check status.",
    GOOGLE_VERIFICATION_PROCESSING:
      "Google is still processing verification. Re-check later.",
    GOOGLE_OWNERSHIP_CONFLICT:
      "Resolve the ownership conflict in Google Business Profile before continuing.",
    GOOGLE_GUIDELINES_REQUIRED:
      "Google requires action on its business guidelines. Check your Google Business Profile.",
    GOOGLE_AUTHORIZATION_REVOKED:
      "Google authorization has been revoked. Reconnect to continue.",
    OWNER_AUTHORITY_LOST:
      "Required owner-level Google authority changed. Reauthorization or a protected ownership review is required.",
    GBP_DISCONNECTED:
      "The Google authority has been disconnected. Your private business data is preserved.",
    PROFILE_INCOMPLETE:
      "Complete the required business information, then re-check status.",
    PROFILE_RECHECK_REQUIRED:
      "Required profile information changed. Complete it and re-check before continuing.",
  };
  const explanation = reason ? explanations[reason] : undefined;
  return (
    <div>
      <Badge tone="warning">{title}</Badge>
      {explanation && <p className="small muted">{explanation}</p>}
    </div>
  );
}
