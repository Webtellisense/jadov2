# M2.5 Phase 0 — audit and implementation proposal

17 November 2026 · Webtellisense Consult · **Historical Phase 0 proposal, approved with corrections.**

The founder approved Phase 0 and Slice 1. [M25_APPROVED_CONTRACT.md](M25_APPROVED_CONTRACT.md) supersedes the proposals/stop point below, including optional Place ID, ownership policy, baseline integration and Slice 3 identity fallbacks. Preserve this audit as history, not current permission to bypass the approved contract.

## 1. Scope, precedence and Git baseline

The founder's M2.5 handoff in this conversation is the latest scope instruction: combine the former M1/M2 into inverted GBP onboarding, verified real-business profiles, My Business, structured publishing and a first-visit guide. Better Auth stays; Supabase provides PostgreSQL and Storage. No Places, Maps SDK, scraping, fabricated verification, new engagement backend, M3 redesign, messaging, AI or Learn implementation is authorised.

Read AGENTS, PRD, Screen Map, Architecture, Milestones, Codex Handoff, UI/UX Brain, Decisions Addendum, Decision Log, schema/migrations and M0.5 acceptance reports. Repository precedence remains: Decisions Addendum for policy/stack; Brain for presentation within approved scope. The new explicit founder handoff supersedes older instructions to start M1 separately and the old Places-first journey. Before implementation, record the approved M2.5 contract in the PRD/addendum/milestone/screen documents; no implementation exception may silently bypass those updates.

Fetched `origin/staging` and created **`feat/m25-business-onboarding` from `1147e29b3a7d46333bc493c7cdcc6b1ade022841`**. Staging and main were not modified. Important baseline gap:

- Approved visual polish is commit `ce9864e2c099094decf3f6ef112b82119fca2baa` on `feat/m05-visual-polish`.
- Its pool-timeout follow-up is `5b8c28fc180d1d406353ed1339ef7bff5aace1a7`.
- Neither is in current remote staging. Staging has migrations 0000/0001; the accepted feature also has `0002_m05_visual_media.sql`, enriched media/components and 15-second pool timeout.
- No merge/cherry-pick was performed. **Before Slice 1, integrate the approved baseline through a separately authorised staging merge, then update this branch.** Otherwise the requested preservation of accepted M0.5 cannot be guaranteed. Migration numbers below reserve 0002 and start at 0003; regenerate against the integrated baseline, never overwrite migration history.

M0.5 approval is accepted from the current founder instruction. Earlier reports saying approval pending are historical, not a reason to ask for M0.5 approval again. The older D12 allowance for local evidence was specific to the earlier code branch: M2.5 explicitly requires working staging evidence before final acceptance.

## 2. Audit findings

| Area | Current evidence | M2.5 consequence |
| --- | --- | --- |
| Framework / ORM | Next.js 16.4.6, React 19.3.1, TypeScript 6.0.3, Drizzle 0.45.4, pg 8.23.1, Node 24 in package.json | Preserve App Router, modular services and explicit PostgreSQL migrations. |
| Authentication | Better Auth 1.7.25; `server/auth.ts`, Drizzle adapter; secure production cookies, 8-hour DB sessions, hourly renewal, no cookie-cache authorization | Extend this implementation. No Supabase Auth migration or Supabase login tokens. |
| Auth tables | `auth_user`, `auth_account`, `auth_session`, `auth_verification`, `auth_rate_limit` | Keep IDs, passwords, sessions and provider identities. `auth_account` supports encrypted OAuth tokens already; it is not the GBP credential store. |
| Registration / verification | Email/password enabled but public signup disabled; verification required; no sender/reset callback; Google social provider empty | Implement genuine registration/OTP/recovery with Better Auth; Google login only when configured. No delivery-success placeholders. |
| Auth routing | `app/api/auth/[...all]/route.ts` permits only get-session, email sign-in and sign-out | Configuration alone will not enable signup/OAuth. Extend the explicit route/method allowlist alongside complete tested flows; keep unrelated auth endpoints closed. |
| Account checks | `requirePrincipal` rereads current user; active-account/fixture rules; Principal currently omits emailVerified | Add a fresh verified-account gate for every onboarding mutation, including callbacks. Never trust a browser/session-only verification flag. |
| Business authorization | `requireBusinessAccess` requires active membership AND legacy verified_active | Keep public eligibility separate from private draft permissions. Existing gate cannot simply be loosened globally. Scope each action to a real business, current member/applicant, lifecycle and role. |
| Security primitives | Same-origin checks, 4 KB JSON limit, Zod strict input, transactional account-state recheck, DB abuse limits and audit inserts | Reuse; add a distinct bounded multipart path for images. Account JSON limits must stay intact. |
| Real business foundation | `business`: unique non-null Place ID, slug, legacy state, is_fixture; `business_membership`: owner/manager + active | No complete real profile/post model. Place ID must become nullable for genuine pre-approval drafts while retaining uniqueness when present. Preserve these tables/relationships. |
| Existing states | pending, verified_active, disputed, suspended, closed | None is sufficient to model all seven M2.5 states. Add an explicit lifecycle, reason and provenance; no legacy status may become new verified evidence automatically. |
| Fixtures | Dedicated development_category/business/post; namespace jado-m05-v1; 10 stable business IDs / 20 posts; M0 also seeds a separate pending fixture in business | Keep fixtures isolated. The M0 fixture is not one of the ten public prototype businesses and must not be upgraded into a real business. |
| Discovery / Feed | `server/prototype-repository.ts`, `app/api/discovery/route.ts`, DiscoveryScreen read only development tables. Bound SQL, escaped search, filters, post expiry | Add a real repository and one public eligibility predicate, then compose read models. Never copy real records into development tables. |
| Compare | URL authoritative, max three, current ID parser accepts only demo-* | Extend validated identifiers for real IDs while keeping all existing fixture URLs/selections valid. Enforce canonical uniqueness and no scores. |
| Profiles | Shared six-tab profile/cards; richer cover/logo/gallery components on accepted visual branch | Reuse approved visual components with typed real read models, provenance labels and safe external links. Existing fixture-only media path contracts cannot validate uploads. |
| Publishing | Only seeded development posts exist; no operational publishing endpoints | New real tables/services; existing Like/Follow/Message remain gated/unavailable until their milestones. |
| Owner workspace | Account has Add your business; /owner routes are honest shells | Resumable private workspace, no fabricated analytics; Explore entry remains below useful content; desktop account/business menu is additive. |
| Providers | M0 `server/integrations/index.ts` always returns unavailable; boolean verifyManagement(placeId) contract is too weak | Replace/extend GBP contract with typed paginated evidence and error states. Do not activate Places. No test double selected by runtime environment. |
| Database connection | Global per-process runtime caches one pool and logs safe pool errors; CLI ends pools in finally. Staging max=5/connect=5s/idle=10s; accepted follow-up connect=15s | Preserve follow-up after baseline integration. Evaluate serverless pool budget from actual instance count; no claim that timeout alone solved remote failures. Keep TLS verification. |
| Supabase | Shared PostgreSQL session-pooler configuration exists in ignored staging environment, targeting jado_preview per founder | Only read-only inspection attempted; DNS failed EAI_AGAIN. Live schema/history/counts cannot be confirmed now. No migration/seed/reset performed in Phase 0. |
| Storage | Capability confirmed by founder; no Storage SDK/transport, bucket config, migrations or secrets found | Bucket existence/policies/limits are unverified, not assumed absent. Configure Storage without changing authentication. |
| Environment | `.env` local PostgreSQL; ignored `.env.staging.local` has database/auth/origin variables only; no Google, storage or email credentials found there | No secret values printed. Presence of an environment file is not proof of actual Vercel settings. |
| Vercel | Docs name jadov2/staging; founder says staging is its current Production Branch. No .vercel linkage or authenticated Vercel config/log access in workspace | NODE_ENV/VERCEL_ENV=production does not identify the future main deployment. Use explicit application environment and separate DB credentials; verify actual deployment settings before activation. |
| First visit | Area selection and Data Saver exist; no persistent welcome guide | Add compact non-modal guide below search/discovery, local dismissal version, Help reopen. No new mandatory step before browsing. |

Shared database audit attempted a connection before a read-only transaction to inspect table names, migration count and aggregate fixture/real-business counts. It exited 1 with EAI_AGAIN before executing those queries. Storage buckets and actual deployed environment therefore remain **unverified**, not broken or missing by inference.

Historical acceptance evidence reviewed: M05_ACCEPTANCE, M05_STAGING_ACCEPTANCE (superseded Preview model), STAGING_WORKFLOW_ACCEPTANCE, VERIFIER_FIX_ACCEPTANCE, and visual-polish report from its feature ref. Recorded tests are historical, not new Phase 0 test runs. The visual report has 60 captures and good lab LCP/CLS; its ~185 KB initial gzip JavaScript exceeds the approximate guide and a human screen-reader audit remains outstanding.

## 3. Proposed domain and migrations — not generated/applied

**Naming recommendation:** extend existing singular physical `business` and `business_membership`, rather than create competing plural copies or rename tables under M0. These are the requested businesses/memberships domain concepts. New related tables use descriptive names below. Founder approval should confirm this convention.

Use opaque real IDs, timestamps with time zone, foreign keys, validated JSON only for structured non-relational fields, optimistic version columns for editors and server-controlled lifecycle values. No user-supplied status, author, member role or canonical identifier in ordinary profile PATCH payloads.

### Migration sequence

| Proposed migration | Slice | Changes / safety |
| --- | --- | --- |
| 0003_m25_business_foundation | 1 | Extend business/membership; create real categories, private onboarding/profile, verification and append-only audit tables. No existing table replacement. |
| 0004_m25_gbp_connections | 2 | Encrypted GBP connections, single-use OAuth states, connection/location relationships, expiring provider snapshots; canonical-claim constraints. No API calls in migration. |
| 0005_m25_business_media_offerings | 3 | Media registry/links and offerings; private bucket configuration handled separately through reviewed Storage setup. No uploaded bytes in SQL migrations. |
| 0006_m25_business_posts | 4 | Real typed posts and post-media links, publication/moderation/date constraints and indexes. |
| 0007_m25_governance_jobs | 5 | Membership invitations, protected transfer requests, disputes and idempotent bounded background-job records; audit-governed operations. |
| Hardening adjustments only if needed | 6 | Reviewed forward fixes, not an automatic extra migration or destructive cleanup. |

Exact names/order may change after the approved baseline and live schema preflight. Inspect Drizzle history first. Do not reuse 0002, edit applied SQL, run Drizzle push, reset tables or call fixture undo to deploy M2.5.

Create foreign keys only when both tables exist: foundation verification rows initially have a nullable connection reference, with its FK added in 0004 after gbp_connections exists. Add the business primary-authority FK in that same migration. No dependency on a later-slice table is allowed to make an earlier migration fail.

### Proposed table contracts

- **business (extend):** existing id/slug/is_fixture/legacy status preserved; nullable unique google_place_id; nullable unique gbp_location_id (bare stable location ID, normalized from locations/{id}); lifecycle_state with the seven specified values; reason_code; created_by_user_id; primary_gbp_connection_id; published_at; last_verified_at; proof_valid_until; archived_at; version. Empty canonical identifiers rejected. Slug collisions with fixture slugs must also be prevented under a transaction/namespace lock because separate tables cannot share an ordinary unique index.
- **business_membership (extend):** existing composite user/business key and owner/manager role retained; explicit grant source, granted_by, accepted_at, revoked_at, version. Active Jado membership grants only approved per-business actions. Google account role alone never grants OWNER. Business-level locks prevent concurrent last-owner removal/transfer races.
- **business_categories:** Jado taxonomy independent of development_category; stable category keys compatible with existing Compare labels. Preserve raw Google category separately with provenance; mapping requires explicit rules, never mislabel Google-derived data as Jado-authored.
- **business_onboarding:** business_id unique; applicant_user_id; current step; completed steps; provisional identity JSON; reason; last saved/version; created/updated timestamps. Applicant relation permits private draft edits, not membership management or public publication. Save each major wizard step transactionally. No tokens in wizard JSON.
- **business_profiles:** business_id unique; tagline, description, service_area, supplementary contacts/social/custom links, owner-confirmed rights metadata, category_key and updated_by/version. Jado-managed data is separate from provisional identity and Google snapshots.
- **business_verifications:** id, real business_id, connection_id when available, location ID, check outcome, observed VoM (true/false/unknown), authority outcome, role-evidence reference, policy version, checked_at, valid_until, reason, provider correlation reference. Minimized evidence; no full Google payload or token in audits. A check result and a business lifecycle are distinct concepts.
- **verification_audit_logs:** id, business_id where applicable, actor/user or system, event, prior/next state, sanitized reason, request/correlation ID, time and limited structured metadata. Append-only application behavior plus DB UPDATE/DELETE rejection/role privileges. No cascading deletion of evidence. Logs cover all events requested in handoff section 18, including failed attempts where appropriate.
- **gbp_connections:** id, Jado user_id, Google subject, consented scopes, encrypted refresh/access tokens, token expiry, encryption key version, connection status/reason, connected/reconnected/revoked times, refresh lease/version. Store no GBP credentials in auth_account. Multiple independent business authorities may reference a connection; disconnect impact must be confirmed and audited for all affected businesses.
- **gbp_oauth_states:** random-state hash, initiating user/session binding, onboarding reference, exact redirect/allowlisted return target, encrypted PKCE verifier, nonce hash if OIDC used, expiry, consumed_at. Consume once atomically, including failure handling. Session expiry requires a safe restart, never attach consent to another logged-in user.
- **business_gbp_locations:** business/connection/account resource relationships, normalized location ID and observed access/role/source/timestamps. Deduplicate the same location found through several groups/accounts. This does not create multiple Jado businesses.
- **business_google_snapshots:** minimal selected identity fields with source=gbp_oauth, fetched_at/expires_at and provider location reference. No ratings, reviews, Google media or permanent search document built from this cache. Proposed maximum TTL <=30 days is a ceiling, not permission for public republication; see policy gate below. Expired snapshots are not rendered as fresh and must be purged even if scheduled execution was missed.
- **business_media:** id, business_id, uploader, immutable generated object key, MIME, bytes, dimensions, variants, alt text, rights attestation, pending/ready/failed/deleting state and timestamps. Profile/offer/post ordered links reference ready media of the same business through constraints and service checks. No fixture asset may be reassigned here.
- **offerings:** id, business_id, product/service kind, title, description, tags, optional nonnegative NGN price in integer kobo, currency=NGN, draft/visible/archived state, author/version/timestamps; ordered offering_media links. Exact money conversion to current UI is explicit, not floating-point arithmetic.
- **business_posts:** id, real business_id, author_user_id, six existing type keys; title/description/tags; draft/published/unpublished/deleted state; separate moderation_state; published/edited/deleted timestamps; optional price_kobo/currency; offer_start_at/offer_end_at; event_start_at/event_end_at, original IANA event timezone and location. Ordered post_media links. SQL CHECKs for type, valid date ranges and nonnegative amounts; media-count/type limits enforced in transaction with post lock. Soft delete hides content and preserves minimal audit, not a visible archive of private drafts.
- **business_invitations / business_ownership_transfers:** hashed expiring single-use invitation tokens, invited verified identity, role, inviter/recipient/approvals and consumed_at; last-owner invariants; recent authentication for governance. Transfers are requests, never arbitrary role PATCHes.
- **business_disputes:** claimant, canonical references, existing business reference where authorized, case type/access request/evidence, status, reviewer and timestamps. Do not reveal another claimant's private data. Admin review does not confer GBP verification or automatically transfer ownership.
- **domain_jobs:** kind/entity/idempotency key, due_at/attempt count/lease, sanitized status. Bounded server scheduled processing for authority checks, cleanup and revocation retries; no always-on worker assumption or new vendor. Test-mode jobs stay in isolated test databases.

### Backfill and constraints

1. Inventory existing real rows without exporting personal data; take an approved staging backup and prove restore procedures before production rollout.
2. Add columns/tables without dropping legacy fields. Map legacy pending to draft; verified_active to **reverification_required**, never published; disputed to reverification_required + OWNERSHIP_DISPUTED write hold; suspended to suspended; closed to an archived private row with LEGACY_CLOSED reason. Preserve original statuses for rollback/audit. Existing fixture rows remain fixtures and are never backfilled into real verified state.
3. Keep the existing Place ID uniqueness while allowing NULL; unique GBP location ID when non-NULL. Concurrent claims recheck provider evidence and reserve both identifiers in one DB transaction; constraint violations become conflict flow, never a second publication. Claimed IDs are retained on unpublish/suspension; release/transfer requires the protected workflow.
4. Validate that all new real workflows reject business.is_fixture and development-table identifiers, including a maliciously submitted demo-* ID. No auth fixture can create real verification. Real-table FKs never reference development tables.
5. Publish only through server services that lock current business/account/membership, check verification freshness/completeness/canonical conflicts and append an audit event in the same transaction. Non-published businesses' posts remain private regardless of stored post status.
6. Keep migrations deployable before code; empty new columns must not break M0.5. Existing fixture seed/reseed/undo counts and genuine-record preservation must pass after every schema slice.

### Rollback risks

Nullable Place IDs and new real records make old code unsafe as a complete operational rollback. Disable M2.5 writes/providers before rollback; preserve new tables/data/keys and use a compatible read-only build or reviewed forward fix. Do not reimpose NOT NULL while drafts have NULL IDs, drop new columns/tables, reverse enum history or run M0's destructive local rollback scripts on staging. Schema backups do not include Storage objects; retain object versions/keys separately. Revocation and sent email cannot be undone by SQL. Key loss prevents token decryption: retain old encryption keys through a reviewed rotation window. Concurrent migrations must have a single deployment runner; never auto-migrate or seed on application requests/builds.

## 4. Provider architecture proposal

Keep adapters server-only and dependency-injected into domain services. Better Auth handles Jado login; GBP OAuth never creates a Jado session, auth_account link or automatic OWNER. Supabase Auth is not introduced. Replace the M0 boolean GBP verification stub; retain unrelated adapters disabled.

The following are **design contracts in this document**, not implementation files:

```ts
type GbpFailureCode =
  | 'ACCESS_PENDING' | 'NOT_CONFIGURED' | 'API_DISABLED'
  | 'PERMISSION_DENIED' | 'TOKEN_EXPIRED' | 'AUTH_REVOKED'
  | 'TEMPORARY_FAILURE' | 'RATE_LIMITED' | 'QUOTA_EXHAUSTED'
  | 'INVALID_REQUEST' | 'INVALID_RESPONSE';
type GbpResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: GbpFailureCode; retryable: boolean;
      retryAfterMs?: number; correlationId: string };
type Page<T> = { items: T[]; nextPageToken?: string };
interface GbpProvider {
  availability(): { mode: 'unavailable' | 'live'; reason?: string };
  listAccounts(connectionId: string, pageToken?: string): Promise<GbpResult<Page<GbpAccount>>>;
  listLocations(connectionId: string, accountName: string, pageToken?: string): Promise<GbpResult<Page<GbpLocation>>>;
  getLocation(connectionId: string, locationName: string): Promise<GbpResult<GbpLocation>>;
  checkVoiceOfMerchant(connectionId: string, locationName: string): Promise<GbpResult<VoiceOfMerchantEvidence>>;
  getRoleEvidence(connectionId: string, locationName: string): Promise<GbpResult<RoleEvidence>>;
  revoke(connectionId: string): Promise<GbpResult<void>>;
}
interface GbpOAuthProvider {
  authorizationUrl(input: OAuthAttemptReference): Promise<{ url: string }>;
  complete(input: ValidatedCallback): Promise<GbpResult<ServerOnlyGrant>>;
  refresh(connectionId: string): Promise<GbpResult<void>>;
}
interface CredentialVault {
  encrypt(value: Uint8Array, context: CredentialContext): EncryptedEnvelope;
  decrypt(value: EncryptedEnvelope, context: CredentialContext): Uint8Array;
}
interface BusinessMediaStore {
  putValidated(input: ValidatedMedia): Promise<StoredMedia>;
  open(key: string): Promise<ReadableStream>;
  remove(keys: string[]): Promise<void>;
}
interface TransactionalEmail {
  availability(): { available: boolean; reason?: string };
  send(input: VerificationOrRecoveryOrInvitation): Promise<DeliveryAccepted>;
}
```

Named normalized contracts GbpAccount/GbpLocation/VoiceOfMerchantEvidence/RoleEvidence contain only validated fields specified below, with explicit absent/unknown values. ServerOnlyGrant can never appear in a client DTO, log or serialized React prop. OAuth service receives server-owned attempt references, not unvalidated arbitrary callback URLs.

### OAuth and credentials

- Better Auth Google login uses minimal identity scopes at `/api/auth/callback/google`. Email/password requires genuine verification; use its email OTP plugin with hashed OTP storage, expiry, attempt/resend limits and real sender. Keep implicit account linking disabled; an existing email identity is not silently merged with a Google identity.
- GBP uses dedicated `/api/gbp/oauth/callback`, initiated by a same-origin authenticated POST with fresh emailVerified check. State is random, hashed, single-use, time-limited, bound to user/session/onboarding and secure HttpOnly SameSite=Lax cookie. Enforce the configured callback/origin and safe relative return target; reject replay, wrong session, changed account and unsolicited callback.
- Confidential authorization-code exchange, PKCE S256, offline access, intentional account selection. Request business.manage; propose `openid` additionally only to bind Google's signed subject/nonce to the consent (no profile scope; email scope only if separately necessary/approved). Validate issuer/audience/signature/nonce for any ID token. Do not mistake this subject for a business owner role.
- Prefer separate OAuth client credentials for ordinary sign-in and GBP, subject to founder setup. Keep a valid encrypted refresh token when reconnect response omits a replacement; never erase it with NULL. Missing refresh capability becomes an honest reconnect-required state where background access is needed.
- Dedicated 32-byte key, authenticated AES-256-GCM envelopes with unique nonce, tag, version and AAD binding to connection/user. Key outside DB/git; rotation supports previous keys. Encrypt stored access tokens as well as refresh tokens. Serialize refresh per connection to prevent rotation races; no token in browser storage, query errors, telemetry or audit payload.
- Disconnect revokes the Google grant where possible, invalidates local authority immediately and queues safe remote-revocation retry if Google fails. Display affected businesses; never let a manager silently disconnect primary authority. Do not sign the person out of Jado as a shortcut.

### Google calls and normalized fields

- Account Management `GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts`: page size <=20, consume nextPageToken, preserve account resource name/type/available role. Page limits and continuation are bounded; a partial list must not look like all accessible businesses. Support accessible organizations/groups as documented, de-duplicate location IDs across accounts and retain relationship evidence.
- Business Information `GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{id}/locations`: page size <=100, consume nextPageToken; explicit readMask:
  `name,title,phoneNumbers,categories,storefrontAddress,regularHours,websiteUri,metadata`.
- Mapping: name -> canonical `locations/{id}` and location ID; title -> Google display name; phoneNumbers.primaryPhone -> primary phone; categories.primaryCategory.{name,displayName} -> raw Google category; storefrontAddress -> structured address/city/region; regularHours.periods -> structured hours; websiteUri -> website; metadata.placeId/mapsUri/hasVoiceOfMerchant -> optional Place ID/Maps link/observed VoM. Do not assume locality is present or infer distance/GPS from address text. Service-area businesses can legitimately lack storefrontAddress.
- False VoM invokes `GET https://mybusinessverifications.googleapis.com/v1/locations/{id}:getVoiceOfMerchantState` for reason/action. Missing or contradictory metadata requires explicit verification, not a true default. Preserve true/false/unknown and the provider action/reason; no Google verification-start/create/update operation is in M2.5.
- Role evidence records scope and source. An accessible account/location and an account-level role do not prove individual location OWNER. Even the locations.admins response may not reliably identify the connected person by stable subject. If mapping is ambiguous, keep applicant access/governance restricted and request owner authority; do not match on display name.

Official account/location pagination and masks: [accounts.list](https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts/list), [accounts.locations.list](https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list). Field and VoM references: [Location/Metadata](https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations), [VoM](https://developers.google.com/my-business/reference/verifications/rest/v1/locations/getVoiceOfMerchantState), [location admins](https://developers.google.com/my-business/reference/accountmanagement/rest/v1/locations.admins). Reviewed 17 November 2026; revalidate against the installed adapter before live use.

### Provider availability, failures and retries

Provider mode is configured unavailable/live, distinct from connection health (connected/reauthorization required/revoked) and business state. Default unavailable means pre-approval drafts, no outbound GBP calls. A live flag with incomplete credentials fails closed; it is not evidence Google approved quota.

Inspect structured Google error status/reason and operation scope. Do not map HTTP status alone: 403 may be API disabled, insufficient permission or quota; 429 may be retryable throttling or exhausted quota. Unknown errors stay unknown, not ACCESS_PENDING. 401 permits one serialized refresh; invalid_grant/confirmed revocation requires reconnect. Permission denial for an optional role lookup must not revoke the whole business. Confirm actual loss of access through an authoritative check rather than absence from an incomplete page.

Retry safe reads on transport/5xx or transient throttling using bounded exponential jitter and Retry-After; propose maximum three total attempts within a 15-second operation budget, with later retry job instead of holding a serverless request indefinitely. Do not retry consent denial/invalid requests/permanent permission errors blindly. Persistent quota exhaustion pauses calls and surfaces retry timing. Provider outages preserve the last evidence/status; freshness expiry may hide public supply under the approved policy without falsely claiming ownership was revoked.

Test doubles exist only under tests, supplied through explicit test dependency injection. No mock mode variable, request parameter, public test route or staging module can create verified evidence. Live claims require actual provider results. Test cases use isolated PostgreSQL; staged users never see fake verification.

### Policy gate for Google content

[GBP API policies](https://developers.google.com/my-business/content/policies) restrict permitted API use and caching/indexing; limited stored content has a maximum 30-day period and other constraints. This is **not blanket permission to build a public directory from GBP responses**. The proposed cache/public-display/search design needs confirmation for Jado's intended use before live public integration. Do not disguise copied Google fields as owner-authored data. Keep canonical/provider references and minimized audit evidence subject to confirmed retention rules; do not assume a Places-specific identifier exemption applies to all GBP data. No Places endpoint or scraping is a fallback. Private drafts and Jado-authored content can proceed while this live gate is resolved.

## 5. Lifecycle, privacy and permissions

| From / event | Server outcome |
| --- | --- |
| Verified Jado user starts onboarding | draft; private applicant relationship; no public membership entitlement |
| Provider unavailable/access pending | pending_gbp_approval + specific reason; save wizard/posts privately |
| Authoritative provider check finds location not VoM | gbp_unverified + provider reason/recovery; no badge |
| Management proof + VoM + canonical policy + conflict checks + approved role policy + required profile fields pass | verified_eligible; no automatic publish |
| Authorized explicit Publish with fresh successful proof | published; audit; public eligibility predicate applies |
| Provider access revoked/lost or confirmed VoM loss | reverification_required; verified indicator/public eligibility removed; preserve data |
| Temporary outage / quota failure | retain state, record retry reason/time; no false revoked verdict |
| Moderator/admin abuse action | suspended; reason/audit; no manual verified transition |
| Remediation/reconnect after loss/suspension | fresh provider recheck -> eligible where policy permits; explicit publication required again |

Do not bulk-publish when provider flag changes. Recheck each application's selected location. Any explicit unpublish of a business returns it to private eligible/draft as appropriate without deleting identity/history. Post-level unpublish never changes business authority.

A shared public predicate must require real business, published lifecycle, valid current proof, approved canonical policy, no suspension/dispute/closure and a publishable profile. Post reads additionally require published/non-deleted/approved post state and appropriate time bounds. Expired offers remain navigable as expired when the business is eligible; remove them from current offers/active bargains. Do not leak private drafts via direct ID, slug, media URL, search, Compare, post endpoints, metadata, sitemap, response counts or caches. Recheck authority immediately before publication and schedule/session-triggered rechecks where configured.

OWNER can govern profile/media/offerings/posts/invitations/managers and request protected transfer. MANAGER can perform permitted operational edits/posts but cannot remove owner, change own role, transfer or disconnect primary authority. A private applicant can save its own draft and preview; it cannot publish or manage governance. Suspended accounts are always denied. Admin can review disputes and suspend; it cannot mint Google proof. Proposed conservative write hold for unresolved ownership disputes applies to sensitive actions and publication, with exact freeze scope requiring approval.

## 6. Media and first-visit design

Use the approved M0.5 visual components and post limits: service/offer/arrival <=3, update <=2, event/portfolio <=5. Preserve mobile navigation and Message primary. New business entry points: below discovery content on Explore; Account; desktop account/business menu. My Business lists every independently authorized business without an arbitrary account-level cap. Draft previews stay authenticated and noindex, not accessible through public slugs.

**Storage proposal:** private business-media bucket; server-mediated upload/download authorization using Better Auth and current DB permissions. Supabase service credentials bypass RLS, so the server must enforce all membership/object checks. No Supabase browser session or assumed auth.uid() mapping. No service key in browser code. Public reads go through an eligibility-checked media route (or short-lived scoped read grant after that check); private previews use authenticated no-store delivery. Avoid permanent public URLs for draft media. See [Storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [bucket models](https://supabase.com/docs/guides/storage/buckets/fundamentals).

Proposed upload constraints: JPEG/PNG/WebP only, <=3 MB input, <=8000 px per dimension and <=40 megapixels; verify decoded bytes/MIME, reject SVG/animated/executable payloads, strip EXIF, re-encode <=1600 px long edge with responsive variants. No Vercel local-file persistence; bounded in-memory processing. Generated immutable object keys under business/{id}/{mediaId}/, never trusted filenames or arbitrary remote URL fetching. Recheck authorization on finalize/delete; replacing first uploads/validates new media, commits references, then queues unreferenced old objects for deletion. Never delete a still-referenced object. Reconcile failed uploads/orphans through bounded leased jobs with an initial 24-hour grace proposal. Test injected upload failures and membership removal mid-upload. No paid image transformation service.

First-visit guide: inline, non-modal, after usable search/first discovery content; concise Explore/Feed/Compare/Add a business links. Dismiss button keyboard reachable; versioned localStorage boolean persists; storage errors do not block browsing. Help can reopen it deliberately. It must not move focused elements, obscure useful content or change area/Compare URL state. Verify dismissal after reload/new navigation and signed-out use. No metrics invented to populate the workspace; completeness is a deterministic list of real required/optional fields, not a quality score.

Keep static fixture media paths/loaders intact. Real-media read models reference validated stored variants through the authorized media route; they must not pass upload paths through the fixture-only smallPhoto filename conversion. Shared visual geometry and Data Saver behavior remain the same, with distinct source-aware loading contracts.

## 7. Configuration contract (proposed; no values enabled)

All secrets are server-only; none needs NEXT_PUBLIC_. APP_ORIGIN remains the explicit Better Auth baseURL; do not introduce a conflicting second origin. Register exact callbacks per environment, not wildcard feature URLs.

| Variable(s) | Purpose / default / dependency |
| --- | --- |
| DATABASE_URL | Existing normal DB URL; staging session pooler + jado_preview per founder; future production separate. No URL/credential change proposed. |
| APP_ORIGIN, BETTER_AUTH_SECRET, APP_ENV, SUPPORT_EMAIL | Existing auth/origin/environment contract; staging/main secrets separate. APP_ENV must be explicit local/staging/production, independent of Vercel deployment label. |
| AUTH_GOOGLE_ENABLED=false | Ordinary Better Auth Google login feature gate. |
| AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET | Google identity Web OAuth client; callback `${APP_ORIGIN}/api/auth/callback/google`. No business.manage requested here. |
| GBP_PROVIDER_MODE=unavailable | Sole GBP mode selector: unavailable/live. No mock option. Replace/deprecate overlapping GOOGLE_BUSINESS_PROFILE_ENABLED semantics explicitly. |
| GBP_OAUTH_CLIENT_ID, GBP_OAUTH_CLIENT_SECRET, GBP_OAUTH_REDIRECT_URI | Dedicated management OAuth client; exact `${APP_ORIGIN}/api/gbp/oauth/callback`. No call if disabled or incomplete. |
| GBP_TOKEN_ENCRYPTION_KEY, GBP_TOKEN_ENCRYPTION_KEY_VERSION | Dedicated random 32-byte key (base64) and active version; never reuse Better Auth secret. Prior key versions via a documented server-only rotation keyring when needed. |
| GBP_PROJECT_NUMBER, GBP_PROJECT_ID | Operational diagnostics/configuration records, not substitutes for OAuth credentials or approval. Project ID pending does not prevent unavailable-mode work; do not invent it. |
| GBP_RECHECK_ENABLED=false, GBP_RECHECK_INTERVAL_HOURS, GBP_PROOF_MAX_AGE_HOURS | Scheduled checks/freshness; proposed 24-hour interval/max age pending founder decision, runtime bounded by quota. No background calls until configured/authorised. |
| STORAGE_PROVIDER=disabled, SUPABASE_URL, SUPABASE_STORAGE_SERVICE_KEY, SUPABASE_BUSINESS_MEDIA_BUCKET | Replaceable disabled/supabase transport. Separate staging bucket/project credentials, private bucket, never expose service key; verify provider key format/privileges at setup. |
| STORAGE_ENABLED=false, STORAGE_SPEND_CAP_USD=0 | Keep explicit storage activation/cost contract; free-tier usage only when approved/configured, no paid upgrade inferred. Consolidate legacy adapter behavior in Slice 3 so a free tier is not falsely rejected as NOT_IMPLEMENTED. |
| EMAIL_PROVIDER=disabled, EMAIL_ENABLED=false, EMAIL_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO | Chosen real transactional provider + verified sender; no assumed provider selection. Signup/recovery/invitations needing delivery remain unavailable if absent. |
| EMAIL_SPEND_CAP_USD=0 | Free-tier-only until explicit paid spend approval. A zero paid budget must not be mistaken for a fake successful mail transport. |
| CRON_SECRET | Protect leased, bounded internal recheck/cleanup endpoint; separate from auth/encryption secrets. No configured scheduler means no claimed periodic automation. |
| JADO_FIXTURES_VISIBLE | **Proposal requiring approval:** explicit server config true on staging/false on future production plus existing separate DB isolation. No VERCEL_ENV gate/client switch. Missing value fails closed outside local development. Does not enable fixture claims or fixture logins. |
| ALLOW_DEV_SEED=false, DEV_SEED_PASSWORD | Preserve existing CLI-only opt-in/local identity rules. Never set seed opt-in permanently on deployment. No real business workflow invokes seed/undo. |
| FRONTLINE_ASSISTANCE_URL | Optional founder-approved assistance CTA; unset means hidden. Safe HTTPS URL validation; no automatic outreach. |
| GOOGLE_PLACES_ENABLED=false and existing AI/WhatsApp flags/caps | Remain off; M2.5 code has no Places/Maps call path. No M3/M4/M5 functionality enabled. |

There is no Supabase Auth anon/publishable key requirement for this server-mediated design. Supabase Storage permissions and serving policy must be reviewed before using any service credential. Do not assume a project number confirms API quota, OAuth consent verification or API enablement.

### Missing configuration / external status

- Founder reports GBP application submitted, approximately 7–10 days expected review; **pending, not approved**. Actual quota and API enablement remain unconfirmed. Record project number securely when supplied; project ID not confirmed. No live GBP credentials found in workspace.
- Separate Google sign-in and GBP Web OAuth client credentials, exact redirect registration, consent-screen test users/production verification, privacy policy and allowed scopes need setup. Login can be configured independently of GBP API approval.
- Supabase Storage capability available per founder; project URL/service credential, bucket policy/name/limits and permitted free-tier usage not configured/verified here.
- Genuine transactional email provider, verified sending identity/domain, test recipients and delivery/abuse limits absent. No fake verification bypass. Lack of email can block new email-account live onboarding but not audited private-domain implementation or configured Google-verified accounts.
- Vercel environment access/logs/deployed SHA and actual env scoping not inspectable with current workspace linkage. No deployment or settings change occurred. Actual staging DB audit failed DNS; no successful live schema/count check claimed.
- Scheduler deployment/configuration, cron secret, final support/Frontline URL, privacy/terms/retention copy and infrastructure cost approval remain operational setup items.

## 8. Six vertical slices and acceptance gates

Each slice stops for founder acceptance. Every slice must boot locally, include ordinary/negative/unauthorized tests, preserve earlier flows, list migration/rollback notes and avoid activating unconfigured providers. Later-slice columns/services do not get implemented opportunistically.

| Slice | Workflow / endpoints / components | Acceptance and rollback |
| --- | --- | --- |
| **1. Verified account + private business foundation** | Extend Better Auth login/signup/OTP/recovery and guarded route allowlist; verified-account gate; POST /api/my-business, GET/PATCH private onboarding; /my-business list/draft shell; migration 0003. Gallery states for verification/pending/wizard shell first. | Google login when configured; email registration only with real mail; unverified/suspended users denied. Own draft saves/reloads/reauthenticates; another user denied; no fixture mutation/public leakage. State transition/audit concurrency tested. Rollback disables new auth/draft entry, retains tables/credentials. External auth delivery gates explicitly reported, not faked. |
| **2. GBP authorization and verification boundary** | Dedicated POST connect, GET callback, paginated accounts/locations/select and POST recheck/disconnect; vault, normalization, canonical reservation, reason taxonomy; migration 0004. | State replay/wrong session/token tamper/missing scope/duplicate simultaneous claims/role ambiguity/VoM false/revocation/transient quota tests. Unavailable mode saves private draft without OAuth failure. Live Google call/demo stops at boundary until approval and credentials; test doubles isolated. Rollback disable adapter/new callbacks, preserve encrypted credentials and authority state. |
| **3. Profile wizard + media + offerings** | Business Details -> Brand Identity -> Products & Services -> Social & Contact -> Preview; private step PATCHes; media POST/finalize/delete/read; profile/offering endpoints; migration 0005 + reviewed bucket setup. | All fields persist per step; Google fields replace provisional only on verified successful sync, read-only afterward; conflicts reviewed, missing values honest. Real Supabase upload/replace/delete/private read tests when configured; invalid MIME/size/dimensions/other-business refs and revoked-member tests. Four-width profile preview uses accepted components; no public draft media. Rollback disable upload/edit, retain object references and data. |
| **4. My Business + six post workflows** | Scoped dashboard/completeness, post list/composer/preview; POST/PATCH post; POST publish/unpublish; DELETE own post; offering/media linking; migration 0006. | Six types and approved image limits; drafts/private previews work pending GBP; eligible publication is locked server-side; dates/prices/expiry/timezone/negative permissions/concurrent edits tested. No fake engagement. Rollback disable post writes, retain drafts/media/audit. |
| **5. Public integration + governance + guide** | Composed real+fixture discovery repository on existing routes; all public reads share eligibility filter; My Business membership invitations, transfer requests, disputes/admin review, sync/recheck jobs; Help guide; migration 0007. | Published real supply appears only with real proof; no live verified supply invented while pending. SQL/contract/browser tests prove coexistence, fixture undo safety, private leakage denial, OWNER/MANAGER boundaries, multiple businesses, safe transfers/conflicts and retry behavior. Preserve all fixture URLs/Compare limits/actions. Guide dismissal/Help/mobile/keyboard tests. Rollback disable real public projection/governance/jobs, keep fixture UI and real data. |
| **6. Hardening + staging evidence** | Full quality/security suites, deploy/config guide, actual staging schema/Storage/provider status and screenshots/performance; no speculative features. | Types/lint/unit/PostgreSQL/browser/build pass; 320/390/768/1280; no overflow/broken images; audit/secret/callback/upload regressions; baseline fixture counts preserved. Real configured account/draft/storage/publishing evidence on staging. Live GBP proof remains separately blocked until granted. No final M2.5 acceptance with a failed applicable live criterion. No merge without explicit founder instruction. |

Acceptance traceability to handoff section 20: criteria **1–5 -> Slice 1**; **6–15 -> Slice 2**; **16–21 -> Slice 3**; **22–26 -> Slices 1/5**; **27–32 -> Slices 4/5**; **33–41 -> Slice 5**; **42–45 -> every schema/public slice**; **46–57 -> every slice and final Slice 6**. A test-double pass is never evidence for criteria requiring a live provider or staging deployment. Slice 4 public effects cannot be accepted until Slice 5 exposes the eligible real projection; local slice demos must state that dependency.

## 9. Founder decisions required

These recommendations are proposals, not permissions already granted:

1. **Baseline integration:** authorise the approved M0.5 feature (through 5b8c28f) to enter staging, then update this branch before Slice 1; or specify another approved integration route. No merge has occurred here.
2. **Naming:** approve extending existing singular business/business_membership and the new tables above, avoiding duplicate real business stores.
3. **Role/agency authority:** define who may become first Jado OWNER when Google only proves management, and the permitted behavior if an agency is first to connect. Recommend applicant/private access on ambiguous proof; MANAGER only through an approved role grant; never infer OWNER from account-level role or display name. Define whether a Google manager can publish with an independently authorised Jado OWNER and whose retained GBP authority is required.
4. **Missing Place ID:** recommend keep private with CANONICAL_PLACE_ID_MISSING even if VoM is true, until an explicit policy permits publication using unique GBP location ID alone. Never synthesize a Place ID.
5. **Publication requirements/provenance:** approve required profile checklist (suggest verified/canonical identity + business name/category + honest location/service area + About + at least one functioning contact; logo/website optional). Decide treatment of manual/Google differences and legitimately missing storefront fields; no silent merging of old provisional fields into Google-controlled identity. Resolve Google's public-use/storage/indexing policy gate before live republication; founder preference cannot override provider terms.
6. **Freshness/recovery/governance:** approve proof freshness/recheck interval and public behavior after expiry (suggest 24-hour proof validity/recheck, subject to quota; transient errors do not assert revocation). Approve sensitive-write freeze during disputes, transfer reauthentication + both-party confirmation + fresh authority, last-owner protection, and evidence/PII retention/deletion periods. No automatic ownership transfer by support.
7. **Storage/email/free-tier setup:** select real email transport/sender, confirm Storage setup and permitted free-tier use; approve private serving/upload limits and orphan cleanup proposal. Paid use remains separately prohibited without approval. Confirm optional Frontline CTA destination; leave hidden otherwise.
8. **Fixture visibility:** new handoff calls for fixture visibility configuration, while D11 explicitly removed runtime fixture switches. Approve the proposed simple server-only JADO_FIXTURES_VISIBLE flag (staging=true, future production=false) plus infrastructure separation, or retain D11 and amend the new contract to infrastructure-only exclusion. No Vercel Preview/Basic auth/dev-route complexity is proposed.

The Phase 0 plan can be approved while credentials/GBP review remain pending; unresolved decisions gate their dependent implementation only. Approval of this document must not be interpreted as paid spending, Google quota approval, a staging merge or acceptance of any later slice.

## 10. Phase 0 evidence and stop point

Performed: clean status/ref inspection, fetch staging, branch creation, full specification/code/schema/migration/acceptance audit, secret-safe variable-name inventory, primary-document review and one read-only shared connection attempt (exit 1 EAI_AGAIN). No database mutations, bucket changes, implementation code, executable migration files, external configuration changes or deployments. No implementation tests/build/screenshots were run for this documentation-only phase; historical counts above are explicitly identified.

Deliverables in this document: audit, proposed migration/table contracts and rollback, provider/security contracts, normalized Google mapping, six slice gates, environment contract, missing configuration and founder decision list. Stop for Phase 0 approval. **Next authorised action only after approval: reconcile the accepted baseline and implement Slice 1.** Each later slice requires its own acceptance. Do not begin M3.
