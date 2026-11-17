# M2.5 Slice 2 — GBP OAuth and Verification Boundary

17 November 2026. **Code delivered for Slice 2 acceptance; live GBP approval/configuration and shared deployment remain pending.** This is not final M2.5 acceptance.

## 1. Milestone and baseline

M2.5 Slice 2 only, on `feat/m25-business-onboarding`, building on accepted Slice 1 `a196a093ee78f5487a7c10414b83139a323b6525`. The feature remote was fetched and matched the accepted baseline before committing. Staging remains `77f65819741fbeefa30abd3b386a026829fd6ad9`, main `7abb9f6ebb4b84e51ad443be3a4f26ac5a7d682b`. No merge, shared database modification or deployment is included. The delivery commit SHA is supplied with this report.

## 2. User-facing outcome

A genuinely verified Jado account can resume its private business draft and see an accurate GBP approval-pending state. No Google calls, OWNER grant, fake verification, badge or public listing is produced by pending mode. Private details remain editable and persisted after refresh and sign-in.

When actual API access and separate OAuth credentials are approved/configured, the implemented boundary starts dedicated Google business consent, lists actual manageable account/location pages, checks the selected canonical location and Voice of Merchant, and applies scoped role/verification policy. API errors have distinct unavailable, permission, quota, temporary and reauthorization responses. Successful checks remain **private**; this slice cannot publish. Connecting ordinary Google login is separate from authorizing GBP.

Live Google success is **not demonstrated**: Google API/quota approval is pending, project ID is unconfirmed, OAuth/email setup remains external, and shared migrations have not been authorized. Positive provider cases are explicitly isolated automated tests.

## 3. Files changed

| Paths | Purpose |
| --- | --- |
| `server/gbp/contracts.ts`, `config.ts`, `google.ts` | Replaceable real HTTP provider, explicit approval/configuration, field mapping, paginated lists, Google OIDC validation, stable authority chain, VoM, error categories and bounded safe retries. |
| `server/gbp/vault.ts`, `service.ts`, `runtime.ts` | Context-bound versioned encryption, one-use OAuth/session/cookie/PKCE state, credential lifecycle, serialized refresh, canonical claims, role policy, private eligibility, explicit rechecks, revocation retry and transactional audit. Runtime factory always constructs the real provider. |
| `app/api/my-business/[id]/gbp/`, `app/api/gbp/oauth/callback/`, `next.config.ts` | Private authenticated strict APIs, origin/input/rate gates, dedicated callback and callback-specific no-referrer policy. |
| `db/schema.ts`, `db/migrations/0004_m25_gbp_boundary.sql`, metadata | Additive consent/relationship/proof schema extending singular business storage. |
| `components/gbp-status.tsx`, `gbp-connection.tsx`, workspace/draft form, design gallery | Existing-token private connection states, account/location pagination, explicit retries, canonical identity locking and preserved private draft interaction. No public redesign. |
| `server/business-drafts.ts` | Read-only selected canonical identity; safe Jado-only edits remain resumable; removing required profile data withholds eligibility until recheck. |
| `tests/unit/gbp.test.ts`, `tests/integration/gbp.test.ts`, `tests/e2e/gbp.spec.ts`, integration runner and migration count | Crypto/provider/OAuth/authority/security/concurrency tests and additive upgrade preservation. Doubles only in automated tests. |
| `.env.example`, README, AGENTS, approved contract, standing specs, configuration guide, decision log and evidence | Current authorization, setup, rollback, external blockers, screenshot and test evidence. |

Existing fixture definitions/assets, historical SQL migrations 0000–0003, M0 authentication and public M0.5 screen implementation are unchanged. `jose` is now a direct exact dependency (already present transitively); no Google SDK, heavy service or paid integration was added.

## 4. Database changes and rollback

Migration 0004 creates `gbp_connections`, `gbp_oauth_states`, `gbp_business_connections` and `business_gbp_locations`; adds nullable proof timestamps to `business` and nullable connection/location/VoM/role evidence to existing `business_verifications`. Existing canonical unique indexes protect GBP location and optional Place ID. Tokens use encrypted columns; no Google identity payload cache is stored. Better Auth account/session tables are not GBP credential storage.

Applied and repeated only against guarded disposable **local** databases. An actual 0003 draft with profile text/version/audit and populated ten-business/twenty-post fixtures survives 0004 (seven explicit checks). Legacy pre-0003 records also survive the full chain (five checks). Namespaced fixture undo/reseed cannot mutate new real records.

**Shared 0003/0004 migration remains pending**; do not silently apply it. After separate approval, inspect history/backups and use `npm run db:migrate` with the intended normal `DATABASE_URL`; no seed is required. Rollback disables new provider writes and retains drafts, canonical reservations, vault keys and audit records. Do not drop tables/credentials, restore Place ID NOT NULL or use destructive local rollback scripts on shared infrastructure. Complete/retry remote revocation before discarding encryption keys. See the [operational guide](M25_SLICE2_CONFIGURATION.md).

## 5. Tests run

All final commands exit 0. Machine-readable results are in [checks.json](evidence/m25-slice2/checks.json).

| Command | Result and exercised behavior |
| --- | --- |
| `npm run typecheck` | TypeScript passes. |
| `npm run lint` | Zero errors/warnings. |
| `npm run test -- --reporter=dot` | **84 unit tests, 7 files passed**. Includes 23 new config/vault/provider/JWT/role tests. |
| `npm run test:integration` | **71 PostgreSQL tests passed**: retained 32 foundation/prototype + 9 Slice 1 + 30 Slice 2. Additionally **12 explicit upgrade-preservation checks** passed. All databases are isolated loopback tests, created/dropped by the guarded harness. |
| `npm run test:e2e -- tests/e2e/gbp.spec.ts tests/e2e/foundation.spec.ts` | **19 passed**: account/auth/security regressions and new pending connection/private draft screens. |
| Focused browser regression command below | **13 passed**: updated UI, search/filter/back-forward, comparison limits/selection, share URLs, protected draft persistence and database failure/recovery. Seven overlap the previous run. |
| Final callback/capture command below | **5 passed** after callback-header hardening and capture framing correction. Checks callback no-referrer plus four-width captures. |
| `npm run test:e2e -- tests/e2e/gbp.spec.ts --grep 'component state gallery'` | **4 passed**: one explicitly illustrative GBP state gallery, four refreshed gallery captures, no business verification implied. |
| `npm run build` | Optimized Next production build and standalone preparation pass. |
| Built-bundle security scan | No configured local server secrets or GBP secret-setting names in client JS; no automated provider-double markers in runtime bundles. Counts recorded in bundle-security.json. |
| `git diff --check` | Passes. |

Exact focused browser commands (runs above are recorded separately; repeated cases are not additional unique tests):

```bash
npm run test:e2e -- tests/e2e/gbp.spec.ts tests/e2e/prototype.spec.ts tests/e2e/m25.spec.ts --grep 'GBP|Slice 2|pending Google|M25 private|SQL-backed|comparison selection|selected profile|share preserve'
npm run test:e2e -- tests/e2e/gbp.spec.ts --grep 'endpoints|Slice 2 and preserved'
```

The final suites have no failed tests. An additional browser assertion exposed the global referrer header overriding the callback header; a callback-specific Next header rule fixed it. That failed run also exposed a non-idempotent browser setup on worker restart; setup now reuses its verified isolated account/draft. The subsequent five-test run passed. Earlier unused-import lint warnings were removed. Dev-mode LCP image hints and NO_COLOR warnings remain informational; no M0.5 image-loading redesign is included.

## 6. Screens reviewed

[28 screenshot index](evidence/m25-slice2/index.md): private GBP pending/draft, workspace, Explore, Feed, profile, three-business Compare and component gallery at **320, 390, 768 and 1280 px**. Each automated capture checks visible images, document overflow and axe WCAG A/AA. All record zero broken images, horizontal page overflow and axe violations. Existing intentional horizontal carousels are retained. Mobile draft/pending, desktop workspace and mobile comparison captures were also inspected visually. Keyboard access and separate Message/Compare actions passed browser regression. Human screen-reader/founder visual acceptance remains a review step.

Screen Definition of Done within this boundary: existing mobile navigation/tokens/type preserved; real DB saves/resume work; pending/loading/error/unauthorized/retry states exist; actions are named and keyboard reachable; no fabricated counts, Google reviews or verified fixture badges; no new public Google content; responsive captures supplied. Live account/location UI can only receive genuine runtime responses after configuration; no fake live screenshots are supplied.

## 7. External integration status

| Integration | Status |
| --- | --- |
| Dedicated GBP OAuth/HTTP/vault | **Real implementation; disabled/pending in runtime.** No live token/API call was made in this task. |
| Google accounts/locations/VoM/roles/refresh/revoke | **Mocked-for-tests only** for positive/adversarial cases; live approval/quota/credentials remain blocked. |
| Ordinary Google identity and transactional email | Existing Slice 1 implementations preserved; genuine live configuration still pending. No fake email verification runtime. |
| PostgreSQL | **Real local integration and browser databases**. Shared Supabase untouched; migration remains separately authorized operational work. TLS/pool settings unchanged. |
| Supabase Storage / scheduler | Not activated; Slice 3 / Slice 5 configuration respectively. |
| Vercel deployment | Not initiated or reconfigured. No staging/main merge. |

Required external setup: actual GBP API/quota approval, confirmed Google project ID, separate Web OAuth client/secret/registered HTTPS callback, dedicated encryption key/version and optional rotation keys, correct application origin, existing Better Auth secret/database connection, genuine email delivery configuration and explicit shared migration/deployment approval. [Exact setup guide](M25_SLICE2_CONFIGURATION.md).

## 8. Security/privacy

Tested normal/negative/unauthorized paths: fresh verified non-fixture accounts, per-business access, unrelated/revoked membership isolation, strict body/query schemas, same-origin mutation guards, rate limits, single-use session/user/cookie-bound state, expiry/cancellation/replay, PKCE, signed OIDC issuer/audience/signature/nonce/expiry, encrypted access/refresh tokens, context/tamper/key rotation, canonical uniqueness/concurrent claims, absent Place ID, ambiguous/manager/owner evidence, loss of authority/VoM, token refresh races, stale proof after disconnect, and local-first multi-business revocation/retry. A manager cannot enumerate another member's Google grant or disconnect a primary authority. Generic provider failures, including optional role lookup 403, preserve existing proof rather than fabricate revocation.

No Google access token, refresh token, ID token, client secret or database URL is returned in APIs, client JS or application logs. State hashes and minimal proof/audit/canonical references persist; Google identity fields remain private request-scoped responses pending permitted-use confirmation. Canonical selection locks provisional identity without falsely relabeling it as Google-synced. Test doubles are absent from built runtime bundles.

Remaining boundaries: accepted individual Admin names cannot prove OWNER. Personal/name-only or otherwise ambiguous cases remain pending; actual live role representations must be demonstrated after access approval. Daily scheduling/grace enforcement, disputes, protected transfers/invitations, public real-business projection and media are later slices. Before public supply, implement those approved guards and confirm permitted Google data usage. No administrator or client can manufacture verification through this slice.

## 9. Acceptance checklist

| Criterion | Result / evidence |
| --- | --- |
| Dedicated GBP OAuth separate from Jado Google login (handoff 6–7) | **PASS implementation/contracts**, separate callback/vault/scopes; live consent **BLOCKED** by configuration/approval. |
| Pre-approval private draft/resume (8) | **PASS**, real browser/database pending path, no outbound request or fake grant. |
| Paginated real provider, selection, VoM (9–11) | **PASS automated contracts** and real adapter paths/read mask; live Google response evidence **BLOCKED**. |
| Unique canonical identities, optional Place ID, provenance (12–13) | **PASS local PostgreSQL**, transactional conflicts, private reservations and minimal provider relationships. |
| Revocation and transient failures (14–15) | **PASS automated integration/security**; no immediate ownership loss from outages/generic 403/429; live revocation **BLOCKED**. |
| OWNER/MANAGER and fixture isolation | **PASS scoped tests**, reliable chain only; unknown first claims pending, no automatic ownership transfer. |
| Token/callback/audit protections | **PASS** crypto/JWT/state/concurrency/browser/bundle checks and append-only DB tests. |
| Preserve Slice 1/M0.5 and ten/twenty dataset | **PASS** regression/upgrade/fixture tests; prior SQL/assets unchanged. |
| Four widths/accessibility/private states | **PASS** 28 measured captures, keyboard and error recovery. |
| Typecheck/lint/unit/integration/browser/build | **PASS**, final results above. |
| Shared migration, live email/Google and staging deployment | **BLOCKED/pending separate authorization/configuration**, not attempted or faked. |
| Scope and delivery | **PASS**, Slice 2 only; no Slice 3+, M3, staging/main merge or paid activation. |

## 10. Next proposed slice

**M2.5 Slice 3 — Profile Wizard, Media and Offerings**, including the approved official-logo > category identity > monogram priority and cover fallback, only after founder acceptance of Slice 2. Stop here; no Slice 3 implementation or merge is included.
