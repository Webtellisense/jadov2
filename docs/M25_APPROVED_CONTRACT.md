# M2.5 approved implementation contract

17 November 2026. Phase 0 and six slices approved by the founder. Slice 1 at a196a093ee78f5487a7c10414b83139a323b6525 is accepted for progression. Implement **Slice 2 only**, then stop for acceptance. This supersedes conflicting M1/M2, Places-first and mandatory Place ID instructions. Better Auth remains Jado authentication; GBP authorization is separate. No Places/Autocomplete/Maps SDK, scraping, paid activation or mock verification in runtime.

## Approved policy

- Extend singular business/business_membership additively; preserve real records and the exact ten-business/twenty-post fixture dataset. Fixtures cannot be claimed or verified.
- Initial OWNER requires reliable owner-level evidence. Authorized Google managers may receive MANAGER; ambiguous authority remains pending. No arbitrary business-count limit. Support/admin cannot manufacture Google proof.
- Unique canonical GBP location ID suffices without Place ID if genuine management, Voice of Merchant, approved roles, no conflict and required profile completeness pass. Optional Place ID stays unique when present; never synthesize it.
- Required profile: verified Google identity, name, category, location **or service area**, About, valid contact. Website/logo/cover/social/photos optional. Keep provenance separate; Google content cannot be publicly republished/cached/indexed before permitted use is confirmed.
- Daily authority rechecks; proposed grace: a last successful proof is fresh for 24h, transient-only failures allow up to a further 24h grace with retry, then public eligibility is withheld with PROOF_STALE (not revoked). Confirmed loss/revocation/VoM failure requires reverification immediately. Final live timing is documented/tested in Slice 5 with quota; Slice 1 cannot activate proof.
- Disputes freeze transfers/sensitive governance, allow safe private drafts. Transfers require recent authentication, both-party authorization and fresh authority. No manual verified badge.
- Supabase private Storage with server authorization/validated processing/cleanup approved, Better Auth retained. Genuine transactional mail only; unavailable credentials must not fake delivery. Paid services remain off. Frontline CTA hidden until configured.
- JADO_FIXTURES_VISIBLE: staging true, future real production false; separate production DB mandatory. No old Preview/Basic auth/dev-route infrastructure. VERCEL_ENV is not the production-supply boundary.

## Slice boundaries

1. Verified account + private business foundation: Better Auth Google login, email/password/verification OTP/recovery configured behind honest availability; fresh verified-account gates; additive real-business lifecycle, private applicant drafts, memberships and append-only audit; My Business list/private resumable shell. No provider proof or public real-business supply.
2. Dedicated GBP OAuth/vault/account/location/VoM/canonical claim and provider error contracts, gated until live access approved.
3. Wizard, media, offerings and **business visual identity**: uploaded official logo > selected Jado category identity (approximately 5–8 original options/category) > deterministic name monogram. Persist identity configuration in real profile, retain selected fallback after upload. Generated monograms use CSS/SVG, not uploaded files; accessible name/contrast and Data Saver. Appropriate branded cover fallback, consistent across cards/Feed/search/profile/Compare/workspace/posts. Existing fixture logos unchanged. Extend gallery before screens; capture all four widths.
4. My Business dashboard + six real post draft/edit/publish/unpublish/delete workflows; existing media limits, offer expiry and event timezone.
5. Eligible public real+fixture integration, scoped agency governance/disputes/transfers, rechecks and first-visit guide. No M3 comparison redesign/engagement backend.
6. Hardening, full regression/responsive/security/performance and actual staging evidence. No final M2.5 acceptance without applicable live criteria. Test doubles only in automated tests.

Every slice requires independent founder acceptance before the next slice. M2.5 must not merge into staging/main without explicit approval. Main stays untouched. Live GBP access pending; independently testable unavailable-mode work proceeds.

## Slice 1 implementation contracts

- POST /api/my-business creates a real private draft for an active, verified non-fixture Jado account. No OWNER assigned by creation. GET lists only own applicant or authorized member records. GET/PATCH /api/my-business/[id] recheck account and per-business authorization; strict provisional-detail schema, optimistic version, same-origin, bounded bodies and DB rate limits. Safe applicant edits cannot set canonical IDs/lifecycle/roles.
- /my-business and /my-business/[id] are private/noindex/no-store. Save/reset/reload/back/reauth preserve DB progress. Connect GBP is an honest unavailable state, not a live or fake OAuth flow. Publication and brand/media steps indicate later-slice boundaries.
- Lifecycle states: draft, pending_gbp_approval, gbp_unverified, verified_eligible, published, reverification_required, suspended. Slice 1 only creates draft -> pending_gbp_approval with GBP_ACCESS_PENDING; no API can assign verified/published. Existing verified_active rows backfill reverification_required, never verified proof. Audit transitions in transaction; append-only DB behavior. Preserve original legacy statuses.
- Email transport is replaceable, disabled by default. Resend HTTP is the first configurable transport; no new SDK required. EMAIL_ENABLED=true + EMAIL_PROVIDER=resend + EMAIL_API_KEY + EMAIL_FROM are needed for real signup/OTP/recovery; positive paid cap is not required to use an approved free-tier account. No external sends in tests or this implementation session. Test transport injected only by automated tests.
- Ordinary Google identity uses AUTH_GOOGLE_ENABLED, AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET; callback APP_ORIGIN/api/auth/callback/google. No business.manage scope. Keep implicit account linking disabled. Missing credentials yield explicit unavailable state, not fake sign-in.
- Existing DB/auth origin/secret variables remain; APP_ENV explicit, fixture visibility server-only (default local true, staging true if configured, production false). CLI seed remains explicit and unchanged; no seed on builds/requests.

## Baseline and database safety

Fetched explicit remote refs: staging already contains 77f65819741fbeefa30abd3b386a026829fd6ad9, which includes visual polish ce9864e and timeout 5b8c28f. Feature branch fast-forwarded to that baseline; no duplicate staging merge or main update. Phase 0 proposal remains historical except where corrected here.

Migration 0003 adds nullable canonical identity/lifecycle/provenance/version fields and private tables, preserves existing IDs/FKs/legacy states. Additive app rollback leaves new tables/columns intact and disables new writes; never drop real drafts, reimpose Place ID NOT NULL or use local destructive rollback against shared staging. No shared DB migration/seed in Slice 1 without an explicit deployment step. Test migrations use disposable local databases.

## Slice 2 authorised boundary — 17 November 2026

Dedicated GBP OAuth uses business.manage plus openid for signed-subject binding, not ordinary login scopes/session or auth_account storage. Requires GBP_PROVIDER_MODE=live, explicit GBP_API_ACCESS_APPROVED=true (confirmed actual access/quota, not inferred from configuration), separate OAuth credentials/callback and a dedicated encryption key; pending defaults make no calls. No runtime mock provider. No shared migration, reset, seed, database write, deployment or staging/main merge is authorised by Slice 2. Migration 0004 is tested only on guarded local databases.

Primary documentation correction: use `/v1/locations/{id}/VoiceOfMerchantState`, not the earlier proposal's colon-style path. Account primaryOwner is input-only, not caller ownership evidence. Accepted individual Admin records expose display names rather than a reliable signed subject: never match those names. A matching stable location-group admin account reference AND the caller's account role can provide an explicit owner/manager delegation chain; otherwise keep role unknown/pending unless a separately authorised active Jado membership provides the required grant. Account access alone cannot create OWNER. VoM belongs to a location, not the individual caller.

Canonical reservations use unique GBP location ID and optional unique Place ID with transactional conflict handling. No public profile/badge is activated. Fresh Google location data is private, no-store and request-scoped; no Google identity payload/cache is persisted pending permitted-use confirmation. Only canonical relationship references and minimal proof/audit metadata persist. Provisional draft details remain intact; selecting a location locks their identity fields, while safe private Jado edits remain resumable.

OAuth state is hashed/single-use/session+cookie bound, PKCE encrypted, nonce verified against signed Google ID token. Refresh/access tokens use a dedicated versioned AES-GCM vault, serialized refresh and reconnect subject binding. Disconnect invalidates authority locally first; failed Google revocation remains encrypted/retryable, never reported as a completed remote revocation. Managers cannot disconnect a primary authority; shared-connection impact is checked across linked businesses. Provider failures preserve uncertainty: generic 403/429 do not mean pending approval or ownership revocation; confirmed invalid_grant/revocation or explicit VoM failure triggers reverification. Scheduled rechecks/jobs and full governance remain Slice 5; explicit recheck/revocation retry is available now.
