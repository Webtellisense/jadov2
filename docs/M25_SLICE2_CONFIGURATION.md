# M2.5 Slice 2 — GBP configuration and operational boundary

17 November 2026. Slice 1 is accepted; Slice 2 is delivered separately. **This task does not authorize a shared migration, deployment, merge or live provider activation.** Better Auth, its auth tables, email transport and ordinary Google sign-in remain unchanged. No Places, Maps SDK, paid API, scraping or runtime Google test provider exists.

## Current safe mode

Keep `GBP_PROVIDER_MODE=pending` and `GBP_API_ACCESS_APPROVED=false`. Verified Jado accounts can retain and resume private drafts. Connect returns an explicit pending response; no OAuth state, Google calls, membership or verification is manufactured. Missing live configuration produces `NOT_CONFIGURED`, distinct from an individual business's verification status.

Shared Supabase migration 0003 from Slice 1 remains pending. Slice 2 adds reviewed migration `0004_m25_gbp_boundary.sql`. Neither has been run on shared infrastructure here. All migration/security tests create and remove guarded loopback disposable databases. The existing shared ten businesses/twenty posts must be preserved; no reseed is needed for Slice 2.

## Configuration contract

All variables are server-side secrets/settings, never `NEXT_PUBLIC_*`.

| Variable | Required behavior |
| --- | --- |
| `DATABASE_URL` | Existing staging Supabase PostgreSQL URL, unchanged. Future production uses separate credentials/database. Keep supported TLS validation; no TLS bypass introduced. |
| `APP_ORIGIN` | Exact origin, no path/trailing slash; HTTPS on staging. Must match Better Auth and the dedicated GBP callback. Localhost HTTP is supported only for local testing. |
| `BETTER_AUTH_SECRET` | Existing Jado session secret; do not rotate for GBP or reuse as the GBP key. |
| `AUTH_GOOGLE_ENABLED`, `AUTH_GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_CLIENT_SECRET` | Existing optional Google **login** client, callback `/api/auth/callback/google`; no business.manage scope. Genuine email verification/recovery configuration remains in the [Slice 1 guide](M25_SLICE1_CONFIGURATION.md). |
| `GBP_PROVIDER_MODE` | `pending` by default; only literal `live` can enable provider calls. No mock mode. |
| `GBP_API_ACCESS_APPROVED` | `false` until Google actually grants required API access/quota and the founder approves activation. Setting a flag cannot grant Google access. Both this flag and live mode are required. |
| `GBP_OAUTH_CLIENT_ID`, `GBP_OAUTH_CLIENT_SECRET` | Separate Google Web OAuth client for GBP consent, distinct from the ordinary login client. Same approved Cloud project may be used. No credentials hardcoded. |
| `GBP_OAUTH_REDIRECT_URI` | Exact `APP_ORIGIN/api/gbp/oauth/callback`, registered with Google. No wildcards or client-controlled redirect destination. |
| `GBP_TOKEN_ENCRYPTION_KEY` | Dedicated randomly generated 32-byte standard-base64 key. Generate offline with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Store in secret settings, not git/chat. |
| `GBP_TOKEN_ENCRYPTION_KEY_VERSION` | Stable version identifier, default `1`. New writes encrypt with this version. |
| `GBP_PREVIOUS_ENCRYPTION_KEYS` | Optional JSON object of old version-to-key values during rotation. Retain previous keys until all credentials are re-encrypted or revoked. Do not lose historical keys. |
| `APP_ENV`, `JADO_FIXTURES_VISIBLE` | Existing simple policy: staging / true; future production / false plus database isolation. No Preview authentication or special fixture routes. |

Google project **number is known**, project **ID unconfirmed**, and GBP API access review/quota is still pending. The project ID is an operator setup requirement, not a fabricated code default or runtime project identifier requirement. Dedicated OAuth client/secret, consent-screen configuration, redirect registration, encryption key and genuine email settings remain external dependencies. Storage and cron settings belong to later approved slices; Slice 2 does not activate them.

## Google setup after separate approval

1. Confirm the Google Cloud project ID and the actual GBP API access/quota approval. Configure Account Management, Business Information and Verifications access in that approved project. Do not enable Places, Maps billing or paid services.
2. Configure the consent screen and permitted test users/verification appropriate to the project's Google publishing status. An external consent screen in Testing can impose short-lived refresh tokens; configure/test the real consent lifecycle before live acceptance.
3. Create a separate **Web application** OAuth client for GBP. Register the exact deployed HTTPS callback above. This does not replace the Better Auth Google login client or callback.
4. Configure the secrets and dedicated key in the intended deployment scope. Keep provider pending until approval and all secrets are confirmed. No flags belong in browser storage or URLs.
5. After explicit deployment/database authorization, inspect migration history and backup/restore readiness, then apply the reviewed additive chain with `npm run db:migrate` using the intended `DATABASE_URL`. Do not use Drizzle push, reset, fixture undo or automatic build/request migration. Do not seed.
6. After separate live activation approval, set the two provider flags. From a genuinely verified Jado account, open My Business, select its private draft and connect GBP on the owner's device. Google consent requests `openid` plus `https://www.googleapis.com/auth/business.manage`, offline access, account selection, state, nonce and PKCE.
7. Select from actual accessible account/location pages. Check wrong account, no locations, ambiguous roles, duplicates, missing optional Place ID, no Voice of Merchant, revoked consent and temporary failures. No account is granted OWNER solely from management access. Nothing publishes in Slice 2.

## Provider and ownership contracts

Account/location lists are paginated using Google's page tokens and explicit field mask: `name,title,phoneNumbers,categories,storefrontAddress,regularHours,websiteUri,serviceArea,metadata`. Selected locations are checked against a fresh manageable page and fetched again. IDs are canonical `locations/{id}`; optional `metadata.placeId` remains nullable and unique. A duplicate is a conflict requiring protected review, never an automatic transfer. Dispute submission/governance UI is Slice 5.

`metadata.hasVoiceOfMerchant=true` is a positive location signal. False/unknown invokes `GET /v1/locations/{id}/VoiceOfMerchantState` on the Verifications service. False never qualifies. Google business authority is not individual ownership. Account `primaryOwner` is input-only; accepted Admin `admin` names are not signed identity evidence. A stable, accepted location-admin **account** reference matching the caller's LOCATION_GROUP and effective account/location role chain supplies owner/manager evidence. Unresolvable personal/name-only cases stay pending. Separately approved invitation/transfer grants may supply a Jado role; no runtime admin bypass or transfer endpoint is added. Confirmed loss of owner-level evidence requires reverification, not silent ownership reassignment.

Private eligible proof is fresh for 24 hours. Daily scheduling and the approved transient-only additional 24-hour grace/PROOF_STALE policy are deferred to Slice 5, before public real supply. Explicit recheck is available now. A generic 403/404 or quota/outage error cannot prove revocation. Such errors retain previous state/evidence and produce truthful retry guidance. Invalid refresh grant or explicit VoM/required-authority loss invalidates eligibility. No public Google content cache/index/projection exists: title/address/hours/contact responses are request-scoped, private and no-store. Canonical references, minimal authority/proof metadata and audit events persist; provisional Jado-supplied details retain their provenance.

## Credentials and revocation

AES-256-GCM encrypts access and refresh credentials with random IVs, versioned keys and user/connection/purpose-bound authenticated data. PKCE verifiers are encrypted separately; state and nonce/session/cookie bindings are hashed. Consumed verifiers are erased, expired states are cleaned on the user's next start. A callback is single-use and bound to the current verified account/session and HttpOnly SameSite cookie. Signed Google ID tokens validate issuer, audience, RS256 signature, expiry and nonce; only stable subject is retained. No OAuth tokens reach client JavaScript or logs.

Refresh is serialized per connection. An omitted refresh token preserves an existing valid connection's refresh credential; reconnecting a different subject creates a separate connection, not a credential overwrite. Concurrent disconnect/reconnect invalidates stale in-flight proof results by version check. GET retries are bounded; invalid requests/permissions are not retried. Audit records are append-only at database level.

Disconnect first removes local authorization eligibility across affected businesses. A MANAGER cannot disconnect a primary authority; OWNER authorization is checked across every business sharing the credential. Google revocation failures remain `revocation_pending`, encrypted and retryable; the UI never reports them as completed remote revocation. Explicit revocation can call Google's OAuth endpoint when GBP quota access is disabled, provided OAuth/key configuration is still valid. Removing credentials/old keys before revocation prevents remote cleanup; retain them or revoke directly in Google security settings. Revoking a Google grant may affect other connections to the same Google OAuth project/client; it is separate from Jado logout.

## Rollback

Disable new GBP starts/checks, preserve private drafts/canonical reservations and audit history, and retain encryption keys. Finish/retry outstanding remote revocations before removing credentials. Use the Slice 1-compatible private/read-only application or a reviewed forward fix. Do not drop token/relationship tables, erase audit history, restore NOT NULL Place IDs or run destructive local rollback commands on shared databases. No rollback SQL is shipped because it would destroy real consent/claim records. External consent/revocation cannot be rolled back with SQL.

## Primary references consulted

- [Google web-server OAuth, offline/refresh/PKCE/state](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OIDC token verification](https://developers.google.com/identity/openid-connect/openid-connect)
- [Account model and roles](https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts)
- [accounts.list](https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts/list)
- [locations.list and readMask](https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list)
- [Location metadata](https://developers.google.com/my-business/reference/businessinformation/rest/v1/locations)
- [Location Admin model](https://developers.google.com/my-business/reference/accountmanagement/rest/v1/locations.admins)
- [Voice of Merchant endpoint](https://developers.google.com/my-business/reference/verifications/rest/v1/locations/getVoiceOfMerchantState)
- [GBP policies](https://developers.google.com/my-business/content/policies)

Reviewed 17 November 2026. Live consent, Google API approval/quota, actual role representations, email delivery and staging verification remain externally unproven. Automated provider doubles are confined to test files and are never a claim of live success.
