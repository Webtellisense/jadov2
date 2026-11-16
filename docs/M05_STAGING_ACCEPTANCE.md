> Historical protected-Preview evidence, superseded by PRD14/D11 and [current staging workflow status](STAGING_WORKFLOW_ACCEPTANCE.md). This is not evidence for the new normal-route staging acceptance.

# M0.5 protected Preview acceptance report

16 November 2026 · **Implementation verified locally; live Preview configuration and founder visual approval pending.**

## 1. Milestone

**M0.5 follow-up — secure Vercel Preview for founder review.** The existing M0/M0.5 application and ten-business dataset are retained. The founder-approved exception was recorded in PRD section 13, Addendum D10 and the decision log before implementation. M1 has not started.

## 2. User-facing outcome

On an explicitly enabled Vercel Preview, a reviewer can authenticate with a separate server-only reviewer password and browse the existing PostgreSQL-backed fictional profiles, structured posts, offers, categories, search, filters and comparisons under `/dev`. Every fixture surface retains **Development data** labels. The design gallery remains available under `/design` with the same protection.

Access requires **both** `VERCEL_ENV=preview` and `JADO_STAGING_PREVIEW_ENABLED=true`. Correct credentials cannot override a disabled flag or a production deployment. `/` and `/api/discovery` retain their genuine, verified-only empty state, including on Preview. Reviewer access grants no Jado identity, owner/admin permissions, engagement writes or business verification. Action destinations explain that this is read-only review.

The [Preview setup guide](VERCEL_PREVIEW.md) documents the exact environment variables, guarded seed/undo commands and actual Preview URL workflow. No live Preview URL is claimed: this task did not configure or deploy Vercel.

## 3. Files changed

| Files                                                                                                                                                                   | Purpose                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/preview-policy.ts`, `proxy.ts`, `server/preview.ts`                                                                                                                | Exact server-environment gate; private page authentication before rendering. Local fixture sessions retain their original guards plus the new required flag pair. |
| `server/staging-preview-access.ts`                                                                                                                                      | Separate high-entropy HTTP Basic reviewer authentication, constant-time credential comparison, server-created read-only capability and private response headers.  |
| `db/staging-guard.ts`, `server/prototype-runtime.ts`                                                                                                                    | Dedicated Preview database target, actual identity/real-record checks and isolated connection pool without a production URL fallback.                             |
| `server/prototype-repository.ts`, `app/api/dev/discovery/route.ts`                                                                                                      | Independently enforce the mode and authenticated capability on fixture reads.                                                                                     |
| `features/discovery/screens.tsx`, `app/design/page.tsx`                                                                                                                 | Use the selected private database; distinguish read-only review from a real Jado session.                                                                         |
| `db/prototype-data.ts`, `db/staging-seed.ts`, `package.json`                                                                                                            | Reuse the unchanged ten-business dataset through guarded, idempotent seed and targeted undo commands. No dependency added.                                        |
| `tests/unit/staging-preview.test.ts`, `tests/integration/staging-preview.test.ts`                                                                                       | Deployment truth table, credentials, target/seed refusals, actual PostgreSQL reads, idempotence and genuine-record protection.                                    |
| `tests/unit/prototype.test.ts`, `tests/integration/prototype.test.ts`, `scripts/isolated-database.ts`                                                                   | Preserve local regression coverage while explicitly configuring the new required pair.                                                                            |
| `scripts/isolated-preview-database.ts`, `scripts/test-staging.ts`, `scripts/verify-production.ts`                                                                       | Disposable database/optimised runtime matrix, browser captures and production regression with the flag deliberately true.                                         |
| `.github/workflows/checks.yml`, `.env.example`, `.gitignore`                                                                                                            | CI check/evidence upload, safe defaults and ignored local Vercel metadata.                                                                                        |
| `AGENTS.md`, `docs/JADO_V2_MASTER_PRD.md`, `docs/JADO_V2_DECISIONS_ADDENDUM.md`, `docs/JADO_V2_UI_UX_BRAIN.md`, `docs/DECISION_LOG.md`, `docs/SECURITY.md`, `README.md` | Record the approved exception, security boundaries and local compatibility requirements.                                                                          |
| `docs/VERCEL_PREVIEW.md`, this report, `docs/evidence/m05-staging/`                                                                                                     | Reproducible setup instructions and new acceptance evidence. Original M0.5 evidence is preserved.                                                                 |

Core M0 authentication, authorization, account mutation, schema, development identity seed and public discovery API have no changes.

## 4. Database changes

**No new schema migration.** The staging CLI applies the existing reviewed migrations to a separately provisioned `jado_preview` or `jado_preview_<suffix>` PostgreSQL database, then seeds exactly ten businesses, seven categories and twenty posts in the existing development tables. It creates no users, memberships, claims or verified businesses.

Seed and undo require the enabled Preview context, `JADO_STAGING_SEED_ENABLED=true`, a dedicated `JADO_STAGING_DATABASE_URL` and exact `JADO_STAGING_DATABASE_CONFIRMATION`. The actual database name must match, and genuine users/businesses or activated businesses cause refusal. Unsupported URL target overrides are rejected. Undo removes only the known dataset; it does not roll back schema or remove unrelated data. The existing local M0 seed is unchanged. See the [exact commands and target limitations](VERCEL_PREVIEW.md#3-exact-seed-command).

## 5. Tests run

All final commands below exited **0**.

| Command                                   | Final result / exercised behavior                                                                                                                                                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                       | Passed; strict TypeScript.                                                                                                                                                                                                                               |
| `npm run lint`                            | Passed; zero warnings allowed.                                                                                                                                                                                                                           |
| `npm test`                                | **91 passed**, zero failed/skipped; includes environment matrix, reviewer capability and staging target/seed guards.                                                                                                                                     |
| `npm run test:integration`                | **37 passed**, zero failed/skipped; real isolated PostgreSQL, ten-business/twenty-post reads, SQL search, denial paths, repeat seed/undo and real-record refusal.                                                                                        |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | Optimised Next.js/standalone build passed.                                                                                                                                                                                                               |
| `npm run test:staging`                    | **39 checks passed** across production, disabled Preview and authenticated enabled Preview. Real CLI seed twice, refusal contexts, undo/reseed, public isolation, request-switch attacks, no account access/writes, 16 four-width browser/a11y captures. |
| `npm run test:production`                 | **14 production runtime checks passed**, plus four throttled public-route performance measurements. The isolated database deliberately contains fixtures and the Preview flag is true; production still denies them.                                     |
| Focused local E2E command below           | **10 passed**, zero failed; M0 auth/RBAC/mutations and local discovery/search/history/compare/action-return regressions.                                                                                                                                 |
| `git diff --check`                        | Passed.                                                                                                                                                                                                                                                  |

Exact focused E2E command:

```bash
npm run test:e2e -- --grep 'anonymous browse|consumer cannot|mutation checks|suspension|private records|SQL-backed|comparison selection|gate preserves'
```

Representative actual final output:

```text
Preview seeded: ten fictional businesses and twenty posts. No Jado users, memberships or verification were created.
Only the confirmed Preview's M0.5 fixtures were removed.
Staging runtime: 39 checks passed across production, disabled Preview and authorised Preview.
Production smoke: 14 checks passed.
10 passed (1.5m)
```

The focused E2E selection is not a claim that the full original browser suite was rerun. CI is configured for the full suite; hosted CI was not run here. No failing final check remains. Earlier runs exposed a teardown race from forced database removal and a contrast audit during a CSS transition; teardown now uses normal database drop, and screenshot/a11y contexts use the existing reduced-motion support to inspect settled UI. Both corrected suites passed cleanly without omitting assertions or suppressing violations.

## 6. Screens reviewed

[Sixteen new captures](evidence/m05-staging/index.md) cover protected Explore, business profile, comparison and the new read-only action state at **320, 390, 768 and 1280 px**. Each passed automated accessibility and page-overflow checks. A mobile contact sheet was visually inspected: labels are prominent, navigation remains usable and the new read-only message is explicit. Intentional category/carousel scrolling stays contained.

The existing [128-screen M0.5 evidence](evidence/m05/index.md) is retained. This follow-up changes access/data selection and adds a read-only state; it does not redesign those screens. Keyboard/action continuation remains covered by the focused local browser regressions. Screenshots use a local optimised Preview runtime and real disposable PostgreSQL, not an actual Vercel deployment.

## 7. External integration status

| Integration                                                                  | Status                                                                                                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL seed/undo, discovery repository and optimised application runtime | **Real**, exercised against disposable local databases.                                                                                  |
| Vercel deployment environment                                                | **Locally exercised contract** with trusted server variables; live Preview configuration/deployment is **pending**.                      |
| Reviewer password                                                            | Real server authentication implementation; random test credentials used only in isolated tests. Founder must configure their own secret. |
| Google/GBP/OAuth, AI, email, WhatsApp transport, object storage              | **Disabled/unconfigured**, unchanged.                                                                                                    |
| Production site/database, provider account or paid deployment                | **Not accessed or changed**. No spend enabled.                                                                                           |

## 8. Security/privacy

- Production denial is enforced by the proxy, page/API guards and repository policy. Tests use valid reviewer credentials, the enabled flag and forged request switches in a production runtime and still receive denial.
- Hosted reviewer authentication does not create a Jado session or bypass M0 auth. Account read/write attempts with reviewer credentials return 401. Production fixture-login rules and verified-only public listing rules are unchanged.
- Successful private responses are `private, no-store` and `noindex`; authentication challenges also avoid caching. Secrets remain server-only and are not placed in URLs, browser switches or Git.
- The seed checks its deployment/target/confirmation before connecting and checks actual database identity and genuine records before migrations/writes. Runtime reads independently check the dedicated database. No main `DATABASE_URL` fallback supplies fixture reads.
- Database classification cannot be inferred perfectly from a connection string. Dedicated Preview provisioning/credentials, the reserved database name and correct Vercel environment scoping remain operator responsibilities; do not rename or relabel a production database to bypass guards. TLS/HTTPS are required for hosted secrets. This task did not inspect a live provider configuration.

## 9. Acceptance checklist

| Requirement                                                       | Result / evidence                                                                                                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production unchanged and fixture-free for `VERCEL_ENV=production` | **PASS locally:** production runtime matrix and 14 existing regression checks; public API/M0 security modules unchanged.                                                    |
| Explicit `JADO_STAGING_PREVIEW_ENABLED=true` setting available    | **PASS:** default false in `.env.example`; exact Preview-only configuration documented.                                                                                     |
| Both server-side values required                                  | **PASS:** unit truth table, database repository negatives and optimised runtime denial without the flag.                                                                    |
| Existing ten fictional businesses readable                        | **PASS:** real SQL seed/reads, 10 businesses/20 posts, search and rendered pages.                                                                                           |
| Development labels visible                                        | **PASS:** runtime assertions and four-width screenshots.                                                                                                                    |
| No query, cookie or client switch enables access                  | **PASS:** hostile request matrix and forged-capability tests; no client mode control.                                                                                       |
| Staging-safe seed provided                                        | **PASS:** real CLI seed/reseed/undo against an isolated Preview database.                                                                                                   |
| Explicit seed opt-in; production deployment/database refused      | **PASS:** unit, integration and CLI negative paths including actual identity/genuine-record checks.                                                                         |
| Exact variables, seed command and URL workflow documented         | **PASS:** [VERCEL_PREVIEW.md](VERCEL_PREVIEW.md). Actual hosted deployment remains pending.                                                                                 |
| Three required production/Preview test cases                      | **PASS:** [39-check matrix](evidence/m05-staging/runtime-matrix.json) and unit/integration coverage.                                                                        |
| M0/production verification preserved; no M1/paid providers        | **PASS:** unchanged core security/schema/provider boundaries and regression tests.                                                                                          |
| Live protected Preview and founder visual acceptance              | **PENDING:** configure a dedicated Preview database/secrets, seed and deploy a non-production branch, then founder reviews the actual Preview URL. No live success claimed. |

## 10. Next proposed step

Configure and deploy this protected **M0.5 Preview** using the setup guide, then obtain founder visual approval. Stop here; **do not begin M1**.
