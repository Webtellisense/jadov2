# M0.5 acceptance report

16 November 2026 · Webtellisense Consult · **Engineering checks complete; founder visual approval pending.**

## 1. Milestone

**M0.5 — Interactive UI/UX Prototype only.** The clean task checkout was advanced to `4556151` (`feat/m0-5-ux`), which includes M0 implementation `9c830df`. AGENTS.md and all seven referenced specifications were read in full. The milestone document now records the existing precedence correction: PostgreSQL throughout; no AI/Learn navigation or implementation; private fictional data only. No M1–M4 backend, paid provider or deployment has been enabled.

## 2. User-facing outcome

A visitor chooses an area without signing in, including after declining GPS. Public Explore shows honest empty results because no genuine verified public profiles exist in M0. An authenticated development identity can open the restricted preview, search PostgreSQL-backed businesses/products/posts, filter by area/category/type/current offers, inspect profiles and posts, and compare two or three businesses. Query/filter/selection URLs can be refreshed, revisited and shared. Message/Follow/Like preserve the intended business/post through real M0 authentication, then show an accurate unavailable state rather than fabricating a write.

The design gallery, public navigation, account, notifications/messages, owner workspace and protected admin shell use the same tokens/components. Owner operations and real notifications remain unavailable. The development dataset contains **exactly ten fictional profiles**, seven categories and twenty structured posts, including one expired offer. The separate existing M0 pending-claim fixture is preserved and never used as a public or prototype listing.

## 3. Files changed

| Paths                                                                                                                                                        | Purpose                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `styles/tokens.css`, `app/globals.css`, `public/fonts/`                                                                                                      | Placeholder identity, responsive tokens, local licensed fonts and naira-only glyph fallback.                                                                     |
| `components/ui/`, `components/discovery-*.tsx`, `components/comparison-context.tsx`, `components/area-link.tsx`, `components/app-chrome.tsx`                 | Gallery primitives, native focus-trapped sheets, cards, comparison table/tray, area/GPS choice, sharing, data saver, navigation and offline notice.              |
| `app/design/`, `app/dev/`, explicit public routes, `app/owner/`, `app/account/`, `app/admin/`, `features/discovery/`                                         | Restricted gallery/preview and coherent interactive screen assembly; honest later-feature shells.                                                                |
| `lib/discovery.ts`, `lib/preview-policy.ts`, `lib/dialog-focus.ts`, `lib/use-hydrated.ts`, `server/preview.ts`, `server/prototype-repository.ts`, `proxy.ts` | Validated filters/IDs, preview policy, server session enforcement, bounded SQL reads, keyboard behavior and pre-stream preview denial.                           |
| `app/api/discovery/`, `app/api/dev/discovery/`                                                                                                               | Public empty verified-only contract and authenticated development reads, with no-store responses.                                                                |
| `db/schema.ts`, `db/migrations/0001_*`, `db/prototype-*.ts`                                                                                                  | Three dedicated development tables, explicit migration, guarded idempotent seed/undo and schema rollback.                                                        |
| `components/sign-in-form.tsx`, `components/account-form.tsx`, `app/sign-in/`                                                                                 | Preserve M0 persistence/authentication; explicit native POST and hydration readiness prevent accidental credential submission in URLs; safe action continuation. |
| `tests/`, `scripts/`, `.github/workflows/checks.yml`, package files                                                                                          | Retained M0 regressions, prototype tests, four-width screenshots, contrast checks, standalone public assets and performance measurement.                         |
| `README.md`, `.env.example`, `docs/DECISION_LOG.md`, milestone/Brain clarifications, `docs/SECURITY.md`, `docs/evidence/m05/`                                | Setup, precedence, technical decisions, security boundaries and actual acceptance evidence.                                                                      |

No credentials or `.env` are committed. No production database was accessed or reset.

## 4. Database changes and rollback

`0001_steep_spacker_dave.sql` adds `development_category`, `development_business`, and `development_post`, with foreign keys, indexes, unique slugs, a fixed seed namespace, allowed post types and nonnegative prices. M0 tables and constraints are retained. Prototype records have no Google Place ID, sanctioned ownership proof or verified state.

The seed uses stable IDs, collision checks, a transaction and repeat-safe inserts. Undo removes only known namespaced records and dependent posts/categories. It does not remove M0 sessions, identities, audit records or the pending fixture.

```bash
ALLOW_DEV_SEED=true npm run db:prototype:seed
ALLOW_DEV_SEED=true npm run db:prototype:undo
# Destructive schema reversal: disposable local database only.
ALLOW_DEV_SEED=true CONFIRM_PROTOTYPE_ROLLBACK=true npm run db:prototype:rollback
npm run db:migrate
```

The schema rollback requires the two known migration hashes/history; it refuses production/nonlocal targets. Integration tests actually reverse M0.5, reverse M0, reapply both migrations and repeat migration. Production requires reviewed forward/compensating SQL and backups; these local rollback scripts are not production recovery procedures.

## 5. Tests run

| Command                                                         | Exit | Result                                                                                                                                                                    |
| --------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                             | 0    | Strict application, scripts, database and test types pass.                                                                                                                |
| `npm run lint`                                                  | 0    | Zero errors or warnings.                                                                                                                                                  |
| `npm test`                                                      | 0    | **57 passed, 0 failed, 0 skipped**; includes the 28 retained M0 tests and automated contrast checks.                                                                      |
| `npm run test:integration`                                      | 0    | **31 passed, 0 failed, 0 skipped** against isolated real PostgreSQL, including rollback/reapply, idempotence, reversal, collision refusal, permissions and SQL retrieval. |
| `npm run test:e2e`                                              | 0    | **30 passed, 0 failed, 0 skipped**; final full run took 8.8 minutes, including 128 screenshot/overflow/axe combinations.                                                  |
| `NEXT_TELEMETRY_DISABLED=1 npm run build`                       | 0    | Optimised standalone build, routing/proxy compilation, TypeScript and copied public assets.                                                                               |
| `npm run test:production`                                       | 0    | **14 production-runtime smoke checks passed**, plus four throttled browser measurements, against a disposable database deliberately containing all ten fictional records. |
| Prototype seed undo/seed/seed on the local development database | 0    | Known prototype records removed/recreated/repeated; M0 retained.                                                                                                          |
| PNG manifest validation                                         | 0    | All **128** PNGs exist and match their named viewport widths.                                                                                                             |
| `git diff --check`                                              | 0    | No whitespace errors.                                                                                                                                                     |

The final automated suites total **118 passing tests**; runtime smoke checks are counted separately. CI configuration is updated, but GitHub-hosted CI and a new Docker image build were not run in this task. No deployment was performed.

Browser checks exercise ordinary and negative flows, unauthorised reads/writes, fixture/public isolation, GPS/manual fallback, SQL filters, comparison bounds, safe auth continuation, clipboard/WhatsApp URL contracts without a provider call, offline preference/error states, genuine database wait/failure/retry, and a JavaScript-disabled POST safety boundary. No application test/demo endpoint is added to force success/error states.

Earlier failures were corrected: insufficient contrast for teal-on-tint (white-on-teal passes), pre-hydration handler races and unsafe native form defaults, per-card comparison transition races, implicit select labels, modal focus wrapping/history, soft 404s from an overly broad route, and a seed post-type mapping regression. One early run was interrupted (exit 130); a dev-server lock caused a startup failure. These are not reported as passing runs. No assertion was disabled to hide a product failure.

## 6. Screens reviewed

Screenshots cover location, public empty Explore, sign-in, account, populated private Explore/search/category, profile (including selection/reviews/details), active/expired posts, Feed, compare builder/results, messages, notifications, Following, seven owner-shell routes, admin, verification, help, privacy, not-found and the design gallery at **320, 390, 768 and 1280 pixels**.

See the [128-capture visual index](evidence/m05/index.md), [route/file manifest](evidence/m05/screens.json), [mobile overview](evidence/m05/mobile-overview.png), [font glyph evidence](evidence/m05/font-glyphs.json), [production smoke evidence](evidence/m05/production-smoke.json) and [performance data](evidence/m05/performance.json). All four contact-sheet summaries and key full-size views were inspected. No remaining page overflow, clipped primary controls or overlapping profile/comparison bars were observed; contained horizontal category/carousel/card scrolling is intentional.

Real photography is absent: category and no-logo illustrations are intentional placeholders, identified as illustrations. No Google rating, photo or review is fabricated. Native browser geolocation tests use browser-supplied test coordinates/permission denial, not a hidden application mode.

Performance was measured on the **optimised public empty-data routes**, at 390×844, a fresh browser context per route, 4× CPU slowdown, 150 ms latency and 200,000 download bytes/second:

| Route                | LCP    | CLS    | Requested JavaScript, estimated gzip |
| -------------------- | ------ | ------ | ------------------------------------ |
| Explore `/?area=Uyo` | 640 ms | 0.0083 | 174,351 bytes (170.3 KiB)            |
| Location             | 736 ms | 0      | 174,351 bytes (170.3 KiB)            |
| Search               | 668 ms | 0.0121 | 174,351 bytes (170.3 KiB)            |
| Compare              | 768 ms | 0      | 170,310 bytes (166.3 KiB)            |

LCP <2.5 s and CLS <0.1 pass in this local lab profile. JavaScript is close to the Brain's approximate 170 KB guide (174.4 KB decimal at the upper bound); this is not a strict 170,000-byte pass. Requested-script accounting includes automatically fetched chunks. All four pages made **zero third-party browser requests**. Populated production performance remains unverified because fictional preview records are deliberately inaccessible in production; these measurements do not predict performance with real verified supply, photos or eventual providers. There are no raster owner images to compress/lazy-load yet.

## 7. External integration status

| Integration                                                                          | Status                                                                                                         |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Local PostgreSQL and M0 credential/session/name persistence                          | **Real**, tested locally.                                                                                      |
| Prototype businesses/posts/search/filter/comparison                                  | **Real database-backed private prototype**, explicitly fictional data.                                         |
| Browser GPS and clipboard                                                            | **Real browser capabilities**, with denied/unavailable states; coordinates never transmitted/stored.           |
| WhatsApp comparison sharing                                                          | **URL share intent only**; tested with intercepted browser popup. No Business API request or message delivery. |
| Google Places/GBP/OAuth; AI; email; WhatsApp alerts; object storage                  | **Disabled/unconfigured**. Existing no-network adapter tests retained.                                         |
| Actual Google verification, publishing, engagement, analytics, messaging, moderation | **Deferred to approved milestones**; no fake completion.                                                       |
| Production hosting, external accounts, domain, spend                                 | **Not accessed, purchased or deployed**.                                                                       |

## 8. Security/privacy

The private preview requires explicit local configuration, a loopback application origin and development/test PostgreSQL database, a nonproduction/nonstaging runtime, and an active fixture identity. Proxy/page/API/service layers fail closed; public routes cannot opt into fictional records through query parameters. Fixture sessions remain rejected in production. Data reads are bounded and parameterised; filter sizes/values and comparison IDs are validated.

M0 account mutations retain server authentication, current account state, origin/CSRF protection, input limits, database-backed abuse limits and audit logging. Native auth/account forms use POST and wait for hydration. No new state-changing business/engagement/message endpoints exist. Coarse area is carried in URLs; the only added browser storage is the data-saver boolean. Precise coordinates are temporary client input only. Fonts/illustrations are local.

Unresolved release work: live Google approval/ownership evidence and account providers, formal legal/privacy content, production TLS/proxy and least-privilege DB configuration, backup/restore, and later abuse/moderation workflows. These remain launch gates, not shortcuts. Axe/accessibility-tree and keyboard checks are not a full human screen-reader certification.

## 9. Acceptance checklist and Screen Definition of Done

| M0.5 criterion                                                            | Status and evidence                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preserve M0 architecture, auth, RBAC and persistence                      | **Pass** — retained 28 unit/20 integration/12 browser foundations; real name/session and denial regressions exercised.                                                                                     |
| Design system/gallery before screen assembly                              | **Pass** — token and primitive/gallery work preceded screen assembly; guarded `/design` includes relevant states and database-backed components.                                                           |
| Exactly ten development businesses; reversible/idempotent PostgreSQL seed | **Pass** — ten profiles, seven categories, twenty typed posts; repeat/undo/reseed, FK/constraints and collision tests.                                                                                     |
| GPS optional; Uyo manual choice; denied permission fallback               | **Pass** — real browser capability and permission tests, no coordinate persistence.                                                                                                                        |
| Search, filters, profile/post navigation and 2–3 comparisons              | **Pass** — actual SQL results; invalid/empty/expired/mismatched/duplicate/over-limit states.                                                                                                               |
| Message/Follow/Like sign-in return                                        | **Pass** — real authentication returns to exact business/post; later writes stay explicitly unavailable.                                                                                                   |
| Public verified-only boundary and no production fiction                   | **Pass** — public empty reads, nonfixture/suspended/anonymous denials, staging/production policy tests and actual production HTTP 404/403 checks despite populated fixture DB and an enabled preview flag. |
| Major routes, back/forward, refresh and sharing                           | **Pass** — public routes, private deep links, real clipboard, intercepted WhatsApp share intent, filter URL history, unavailable/deleted states and real HTTP 404.                                         |
| Four-width layout, keyboard and accessible states                         | **Pass for automated scope** — 128 axe/overflow/capture checks, keyboard focus loops, skip link/input order, sticky-bar separation and observed loading/error/offline/retry states.                        |
| No paid/later integration enabled                                         | **Pass** — unavailable adapter regressions and no third-party browser requests; no deployment/account/billing action.                                                                                      |
| Founder visual acceptance before M1                                       | **Pending** — no sign-off is inferred.                                                                                                                                                                     |

**Screen Definition of Done** — applies to each of the 32 named states in the linked visual index; the shared components and tests are the evidence for every applicable screen:

1. **Pass:** Explore at 390px shows search, location and the first explicitly fictional database card within the initial viewport. Public no-supply views show a genuine empty state.
2. **Pass:** All 128 layouts pass document-overflow checks; selected-profile bars are separately checked for nonoverlap at four widths. Screenshots were inspected. Contained swipe rows are deliberate.
3. **Pass:** Screens reuse the gallery's components/patterns and shared tokens. Naira fallback is restricted to U+20A6; original font licences are retained.
4. **Pass:** Shared skeleton/empty/error/unauthorised/suspended/not-found components exist. Real SQL lock/failure/retry and offline tests observe the operational states; no fake public mode is used.
5. **Pass for tested layouts:** Main actions use 44–48px minimum target patterns, labelled checkbox targets and safe space above navigation/trays.
6. **Pass:** Plain copy and explicit fictional descriptions; no Lorem text, fake quality ratings or unsupported claims.
7. **Pass:** Safe sign-in destinations and business/post intent are retained. No message, like or follow is written automatically in this milestone.
8. **Pass:** Stored sample prices/post dates and offer expiry remain labelled fictional. Google values/verification and real usage metrics are absent.
9. **Pass for automated scope:** Keyboard, accessibility-tree semantics, axe WCAG checks and CI contrast tests pass. This is not a full manual assistive-technology certification.
10. **Partial / bounded evidence:** Four optimised public-route measurements are above; populated production media/data performance is unverified. Local fallback illustrations have no remote/raster image payload.
11. **Pass:** Browser history, refresh/deep links, copy and share contracts are exercised. Native sheets support Escape and back with trapped/restored focus.
12. **Pass:** Four-width screenshots are supplied for every named state. Deliberate deviations: future provider/registration/QR/message capabilities are truthful blocked shells; category illustrations replace absent owner photography; no activity badge/Google rating/AI/Learn/PWA install lifecycle is manufactured. PWA remains optional later under the PRD.

**Failed checks outstanding:** none in the final commands. **External blockers for this local prototype:** none. **Still required:** founder visual acceptance; the bounded performance/manual testing limitations above are recorded honestly.

## 10. Next proposed milestone

**M1 — Google identity, claim and sanctioned owner verification**, only after explicit acceptance of this M0.5 visual experience. The live Google/GBP gate still requires founder-approved eligibility, API approval/quota, credentials, sanctioned ownership evidence and any billing approval. Stop here.
