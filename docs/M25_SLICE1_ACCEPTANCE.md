# M2.5 Slice 1 — verified accounts and private business foundation

17 November 2026 · **Implementation delivered for Slice 1 review; external account configuration pending.**

## 1. Milestone and baseline

M2.5 Slice 1 only. Founder-approved policy is recorded in [M25_APPROVED_CONTRACT.md](M25_APPROVED_CONTRACT.md), referenced by the PRD, architecture, addendum, milestone, Brain, screen and agent instructions before implementation. The Phase 0 proposal is retained as history with its approval/corrections noted.

Explicit remote ref fetch found staging already reconciled at `77f65819741fbeefa30abd3b386a026829fd6ad9`, including visual polish and timeout commit `5b8c28f`. The feature branch was fast-forwarded to that baseline without a duplicate integration, history rewrite or main change. M2.5 work stays on `feat/m25-business-onboarding`; no M2.5 staging/main merge or deployment is included.

## 2. User-facing outcome

An active, genuinely verified Jado account can open My Business, create a private real-business draft, save provisional details and resume them after refresh and re-authentication. An applicant receives no OWNER/MANAGER membership, verified badge or public listing from draft creation. Google authorization is visibly pending. Different businesses can be saved independently without an account-level business-count cap.

Better Auth now supports configured Google identity login and genuine email/password signup, six-digit verification and password recovery. These controls show truthful unavailable states until credentials are supplied. Existing credential sign-in, consumer action gates and the accepted M0.5 discovery/Compare experience remain operational. Ordinary Google login does not request business.manage or grant GBP authorization.

## 3. Changed files

| Paths | Purpose |
| --- | --- |
| `db/schema.ts`, `db/migrations/0003_m25_business_foundation.sql`, migration metadata | Additive singular-business foundation, provisional provenance, nullable canonical identity, lifecycle, private profile/onboarding, verification and append-only audit. |
| `server/business-drafts.ts`, `lib/business-draft.ts`, `app/api/my-business/` | Fresh verified non-fixture account checks, applicant/member authorization, strict input, rate limits, locked transactional saves, optimistic version and private reads. |
| `server/auth.ts`, `server/email.ts`, `server/auth-surface.ts`, auth catch-all route | Better Auth Google/email extensions, replaceable real mail transport, request-local delivery-failure reporting and explicit configured endpoint allowlist. |
| `app/my-business/`, `components/business-workspace.tsx`, `components/business-draft-form.tsx`, `components/workspace-retry.tsx` | Private/noindex workspace, pending state, persisted details, loading and safe retry. |
| Account/auth pages and components | Registration/OTP/recovery/reset forms, configured availability, safe return destinations, native POST and hydration protection. |
| `server/fixture-policy.ts`, prototype repository, layout/chrome, `.env.example` | Approved simple server-only visibility flag; production denies fixtures, staging opts in; disclosure clarifies that development records are fictional without classifying every real draft as fictional. |
| Explore/Account/chrome, design gallery, tokens/styles | Entry points, additive desktop business menu, preserved mobile tabs, gallery form/state example and existing-token styling. |
| `scripts/isolated-database.ts`, `scripts/test-integration.ts`, tests | Historical migration rollback on disposable baseline DB, upgrade preservation, independent real-business suite, auth/security/browser evidence. |
| PRD, architecture, milestones, addendum, Brain, Screen Map, AGENTS, decision/configuration/acceptance documents | Approved decisions, slice boundaries, setup and evidence. Slice 3 identity fallback scope is recorded; no early identity implementation. |

Fixture datasets, logo/photo files and original fixture IDs are unchanged. No storage upload, GBP OAuth, post publishing, real public discovery projection, first-visit guide or M3 implementation is included.

## 4. Database and rollback

Migration `0003_m25_business_foundation.sql` extends `business` and `business_membership`, preserving original IDs/FKs/statuses. Place ID is nullable and unique when present; canonical GBP location ID is also nullable/unique. New tables: `business_onboarding`, `business_profile`, `business_verifications`, `verification_audit_logs`. Private applicant details carry `pre_approval_draft` provenance; Jado profile data has its own source. Every successful draft mutation writes a minimal audit event transactionally.

Legacy verified_active rows become reverification_required rather than published; disputed/suspended/closed records retain their appropriate private restriction and reasons. Backfill events are audited. Audit UPDATE/DELETE/TRUNCATE is rejected by triggers. No verification outcome is manufactured or accepted from the client.

The migration was applied to the existing **local** database with `npm run db:migrate`; pre/post counts both showed **10 fictional businesses and 20 fixture posts**. No shared Supabase migration, seed, reset or undo was performed. Automated destructive rollback/seed tests only operate on guarded disposable local databases.

For an approved staging deployment: back up and inspect the target, then `npm run db:migrate` using its normal DATABASE_URL. **No fixture reseeding is required by Slice 1.** Roll application features back by disabling new writes/providers and retaining additive schema/data. Do not drop drafts/audits, reimpose Place ID NOT NULL or use local destructive rollback scripts against staging.

## 5. Tests and results

Final command evidence is in [checks.json](evidence/m25-slice1/checks.json). Counts below refer to executed local tests, not live Google or email proof.

- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, zero warnings.
- `npm test`: exit 0, **61 passed**.
- `npm run test:integration`: exit 0, **41 passed** (32 retained foundation/prototype + 9 M2.5), plus **5 upgrade-preservation checks**.
- `npm run test:e2e -- --grep 'M25|SQL-backed|comparison selection|gate preserves|consumer cannot|mutation checks'`: exit 0, **14 passed**; covers new workspace/account states and retained SQL search, Compare, auth gates and security.
- `NEXT_TELEMETRY_DISABLED=1 npm run build`: exit 0; optimised standalone bundle and copied public assets, local dotenv files excluded.
- `DISCOVERY_EVIDENCE_DIR=/tmp/jado-m25-existing-local DISCOVERY_EVIDENCE_CONTEXT='Existing local PostgreSQL after M2.5 migration; not shared staging' npm run verify:staging`: exit 0, **12 checks pass** against the existing local DB, not shared staging.

No failing final checks remain. Runtime verification opens all ten profiles, populated Feed/post links, SQL search and two/three-business comparisons without reseeding.

PostgreSQL tests exercise genuine Better Auth credential/OTP/session/recovery contracts with a sender injected only into automated tests. Wrong/replayed OTPs fail, stored OTP values are hashed, failed delivery cannot set verification, old/reused recovery tokens fail, old passwords fail after recovery, and Google identity initiation uses no management scope. Unsolicited callback state is rejected before network use.

Private-draft tests cover unverified/suspended/fixture accounts, unrelated users, revoked membership, stale versions, no automatic OWNER, optional Place IDs, canonical collisions, invalid lifecycle SQL, append-only audits, fixture undo/reseed preservation and exclusion from public fixture discovery. HTTP browser tests add cross-origin denial, strict privileged-field rejection and private persistence across refresh/re-authentication.

Earlier iterations exposed a swallowed email callback failure, JSX/type issues, an over-broad test URL predicate matching the sign-in query, and rate-limit state shared across screenshot tests. Application fixes preserve mail failure honesty. Tests now await the actual pathname and reset only their isolated test rate-limit state between tests; production rate limits are retained. No live provider success or skipped test is substituted for acceptance.

## 6. Screens reviewed

[Four-width screenshot index](evidence/m25-slice1/index.md) covers My Business, a private draft, unavailable registration/verification/recovery/reset and populated Explore at **320/390/768/1280 px**. Keyboard/automated Axe and page-overflow checks accompany captures. Mobile draft and desktop workspace layouts were manually inspected. Native bottom navigation remains present; long forms scroll above it. Approved fixture media are unchanged.

Human screen-reader certification, real-device testing and live provider screens are not claimed. These are local application captures with isolated persisted test accounts/private drafts, not deployed staging or Google verification. Existing M0.5 performance evidence remains historical; this slice does not claim new live or populated-production performance measurements.

## 7. External configuration status

- **Local PostgreSQL/auth/draft persistence:** real and exercised.
- **Google identity:** implemented/gated; live credentials/consent configuration absent. Automated initiation/callback-security checks do not prove a live Google sign-in.
- **Transactional email:** replaceable Resend HTTP transport; disabled without real credentials and sender. Tests inject a sender only into isolated test execution. No external email sent here. Actual delivery/recovery demonstration remains pending.
- **GBP:** application pending per founder; dedicated connection/verification is Slice 2. No Places API, management call, fake token or verified business activated.
- **Supabase Storage:** approved for Slice 3; not implemented/activated in Slice 1. No media or identity fallback changes to fixtures.
- **Shared staging/Vercel:** no M2.5 deployment or configuration change; actual staging evidence remains a later acceptance gate, not inferred from localhost.

[Configuration guide](M25_SLICE1_CONFIGURATION.md) gives exact variables, callback URLs, migration instructions and live dependencies. Set JADO_FIXTURES_VISIBLE=true on staging and false on future real production, with separate production DB isolation. Do not enable paid service usage or the unset Frontline CTA.

## 8. Security and privacy

Private APIs recheck the current account's active/verified/non-fixture state and current per-business authorization. Mutations require same origin, strict bounded JSON, transactional rate limits and locks. Client fields cannot set status, roles, provenance, canonical IDs or verification. Only the server creates draft -> pending_gbp_approval transitions in this slice. Private routes are noindex, use dynamic authenticated reads and no-store APIs; unknown database errors stay generic and retryable.

No Google tokens, secrets, database URLs, passwords or OTPs are logged or included in client props. Ordinary Better Auth OAuth token encryption remains enabled; GBP credentials will require a separate vault in Slice 2. HTML/links do not fetch arbitrary owner URLs. Uploaded media is not accepted yet.

Open live gates: genuine identity/email configuration and delivery proof, final privacy/terms/retention review before public account activation, Google public-use policy confirmation and later live verification evidence. Administrator database privileges are an operational responsibility; append-only triggers protect application behavior, not a claim that a database superuser cannot alter schema.

## 9. Slice 1 acceptance checklist

| Criterion | Status / evidence |
| --- | --- |
| Correct accepted baseline; main preserved | PASS — fetched staging 77f6581 includes 5b8c28f; feature fast-forward, no duplicate merge. |
| Approved contracts updated before implementation | PASS — approved contract referenced from source documents, with Place ID/role/provenance/storage/fixture corrections and Slice 3 identity addition. |
| Better Auth retained; configured Google/email account flows | CODE/CONTRACT PASS — genuine external login/delivery remains pending configuration. |
| Unverified/suspended/fixture accounts denied real onboarding | PASS — unit/integration/browser authorization tests; no shortcut flag. |
| Applicant can save/resume own private real draft | PASS locally — PostgreSQL persistence, reload and re-authentication tests. |
| No automatic OWNER or public eligibility | PASS — zero assigned membership on creation; no verified/public transition endpoint. |
| Server validation, rate limits, current permission/version checks | PASS — ordinary/negative/unauthorized tests. |
| Lifecycle and append-only audit; legacy data preservation | PASS — DB constraints/triggers and five legacy-upgrade assertions. |
| Fixture IDs/media/counts and real-record safety | PASS — existing local counts preserved; namespaced undo/reseed tests; fixture visibility server policy. |
| Responsive/accessible local application; build | See final evidence summary; no manual assistive-technology certification claimed. |
| Live Google/email and deployed staging proof | PENDING — credentials/setup and later deployment gate; no fabricated demonstration. |
| Later slice boundaries | PASS — identity fallbacks recorded for Slice 3; GBP/media/posts/public integration/guide remain later work. |

Screen Definition of Done: useful existing Explore preserved; four-width layout/Axe evidence; shared tokens/gallery; loading/empty/error/unauthorized/unavailable states; primary save/contact actions; provisional copy; safe sign-in return; sourced fictional/private labels; keyboard checks; existing lazy media retained; URL/back/refresh tested; screenshots indexed. Performance and full human screen-reader review remain explicitly unverified for the new pages.

## 10. Next step

Founder acceptance of **Slice 1** and provision of identity/email configuration where a genuine external demonstration is required. Do not start Slice 2 or merge M2.5 into staging/main until explicitly accepted. Slice 3 retains the approved official logo -> selected category identity -> deterministic monogram and cover fallback requirements; no new milestone is created. M3 remains unstarted.
