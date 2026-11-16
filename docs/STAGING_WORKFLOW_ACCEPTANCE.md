# M0.5 staging workflow simplification — code complete

16 November 2026. **Code complete on founder-approved local evidence (D12). Remote database verification is an operational deployment step outside Codex. M1 has not started.**

## 1. Scope and outcome

PRD14/D11 records the founder's permanent workflow: **feature branch -> staging -> main**. Work is isolated on `feat/staging-workflow`; main was not modified. No merge/push/deployment mapping change has been made; the founder requested a feature commit and merge commands, not execution of the merge.

Normal anonymous Explore/Search/Feed/Profile/Post/Compare now read DATABASE_URL and display labelled fixtures actually present there. Removed the private `/dev` discovery/page/API, proxy, runtime Preview flags, separate fixture database URL, reviewer Basic auth/capability and special database-name enforcement. Production separation now depends on separate unseeded infrastructure/credentials, as instructed. M0 auth, account authorization, CSRF/input/abuse controls and provider defaults are retained. The gallery uses normal database reads. M1 and real publishing/engagement/messaging remain deferred.

## 2. Changed files

- `features/discovery/screens.tsx`, `server/prototype-repository.ts`, `app/api/discovery/route.ts`: normal routes query the existing relational dataset without a fixture-authentication gate.
- `components/app-chrome.tsx`, `components/ui/core.tsx`, `app/account/page.tsx`, `app/design/page.tsx`: normal navigation and Development data labels; removed private review entry flow.
- Removed `proxy.ts`, `lib/preview-policy.ts`, `server/preview.ts`, `app/dev/[[...path]]/page.tsx`, `app/api/dev/discovery/route.ts` and the uncommitted protected-Preview modules/tests/scripts they supersede.
- `db/prototype-guard.ts`, `db/prototype-data.ts`, `db/prototype-seed.ts`: explicit ALLOW_DEV_SEED opt-in, ordinary DATABASE_URL, same ten-business dataset, collision checks, idempotent inserts and targeted undo. Undo refuses unrelated posts and preserves categories still in use.
- `tests/unit/prototype.test.ts`, `tests/integration/prototype.test.ts`, `tests/e2e/prototype.spec.ts`: updated requirements, real-record coexistence, normal-route interaction tests.
- `scripts/test-discovery.ts`, `scripts/verify-discovery.ts`, `scripts/isolated-database.ts`, `scripts/test-e2e.ts`, `scripts/measure-ui.ts`, `package.json`, CI: normal-route verification and evidence; obsolete production runtime-denial script removed. `test:production` now explicitly aliases `test:discovery`, not production-isolation proof.
- AGENTS, PRD/Addendum, Brain, decision/security logs, README, `.env.example`, `docs/DEPLOYMENT.md`: permanent workflow and infrastructure responsibilities. `VERCEL_PREVIEW.md` points to its replacement; earlier evidence is historical.

## 3. Database changes / exact commands

No schema migration was added. Existing migrations remain. Configure the actual shared staging DATABASE_URL in ignored `.env`, then:

```bash
npm run db:migrate
ALLOW_DEV_SEED=true npm run db:prototype:seed
```

Targeted reversal:

```bash
ALLOW_DEV_SEED=true npm run db:prototype:undo
```

The unchanged dataset has ten businesses, seven categories and twenty structured posts covering all six types, three comparable solar businesses, varied names/neighbourhoods, a missing price, active offers and one expired offer. Reruns recreate missing known records without duplicating them. Real businesses/auth records are not deleted or modified. No verification status is granted. Do not seed production; the CLI cannot infer infrastructure classification from arbitrary credentials.

## 4. Local tests / observed results

- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, zero warnings.
- `npm test`: exit 0, **48 passed**.
- `npm run test:integration`: exit 0, **31 passed**, real disposable PostgreSQL. SQL business/category/service/post-content search, filter/sort/expiry, idempotence, collision rollback, targeted undo and genuine business coexistence.
- `NEXT_TELEMETRY_DISABLED=1 npm run build`: exit 0, optimised standalone app.
- `npm run test:e2e -- --grep 'normal discovery|SQL-backed|comparison selection|gate preserves|consumer cannot|mutation checks'`: exit 0, **8 passed**. Anonymous fixtures, browser history/filters, comparison bounds, preserved intended actions through M0 sign-in, staff denial and mutation security checks.
- `npm run test:discovery`: exit 0, **12 optimised runtime/browser checks**, all ten profile routes, twenty posts, populated Feed/post navigation, four search modes, selection refresh, two/three-business comparison values, account denial, **20 screenshots** across 320/390/768/1280px with no page overflow and visible labels.
- `git diff --check`: exit 0.

[Normal-route local screenshots and verification JSON](evidence/staging-workflow-local/index.md). These exercise an optimised local application against a **disposable local database**, not shared staging. The full original browser suite and hosted CI were not rerun. Initial failures were corrected: a search assertion used a nonexistent fixture phrase, the new browser runner needed the installed Chromium path, the optimised runner needed HTTPS APP_ORIGIN, and navigation assertions needed to await client route transitions. No failed assertion was removed to claim success.

## 5. Remote staging verification — operational deployment step

The founder supplied the shared Supabase pooler connection for Vercel project `jadov2`, permanent branch `staging`. It was stored only in ignored, mode-0600 `.env.staging.local`; no connection secret appears in source/evidence. Direct connection/migration/seed attempts fail with **EAI_AGAIN** resolving the supplied pooler hostname. Retrying with network permissions enabled also failed; an elevated hostname lookup exited 2 with no resolved address. No successful shared database migration, seed or read is claimed. A separate local migration success is not remote evidence.

Explore/Feed/Search/Profile/Compare on the **actual shared database remain UNVERIFIED**, and the shared Vercel branch/deployment mapping remains unconfigured here. Under the founder's D12 clarification, the local implementation and verification are sufficient for completion of this code branch. Remote migration/seed and flow verification must be performed as operational deployment steps outside Codex; EAI_AGAIN is not a code acceptance blocker. No shared database undo/reset or production access occurred. See [DEPLOYMENT.md](DEPLOYMENT.md) for the exact command to verify the real configured database once reachable and the subsequent accepted-feature merge/deploy workflow.

## 6. Acceptance matrix

| Requirement                                                                    | Status                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Remove Preview controls, Basic auth, special DB URL/name and private discovery | PASS — absent from active application/config code                   |
| Normal database-backed Explore/Search/Feed/Profile/Compare                     | PASS locally — 12 runtime checks / 8 browser tests                  |
| Ten fixtures with all types, labels, optional data and compatible comparisons  | PASS locally — actual SQL assertions / screenshots                  |
| Explicit seed opt-in, idempotence and targeted undo preserving genuine records | PASS — integration tests                                            |
| M0 account gates/security and paid providers unchanged                         | PASS — existing security tests / no provider activation             |
| Permanent workflow and exact commands documented                               | PASS — AGENTS/README/DEPLOYMENT/PRD14/D11                           |
| Actual shared staging seeded and all five flows demonstrated                   | OPERATIONAL — outside Codex; not a code blocker                     |
| Accepted feature merged into staging; continuous Vercel mapping verified       | OPERATIONAL — founder merges/deploys separately                     |
| Main production isolation                                                      | Infrastructure release requirement; no production database accessed |

## 7. Next step

Merge the committed feature into staging using the documented commands. Outside Codex, configure staging DATABASE_URL, run migration/seed and verify the actual database flows and Vercel deployment. **Do not begin M1.**
