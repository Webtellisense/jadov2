# Technical decisions

## M2.5 Slice 2 — 17 November 2026

- Slice 1 accepted at a196a09; remain on feature branch. No shared database changes, deployment or merge. GBP access still pending; runtime defaults fail closed.
- Dedicated OAuth/credential domain, no Jado-session or auth_account linking. Vault uses AES-256-GCM with context binding/versioned keys; jose verifies signed OIDC issuer/audience/nonce/expiry.
- Current Google docs correct the VoM URL to /VoiceOfMerchantState. Account primaryOwner is input-only; display-name Admin matching is prohibited. Explicit stable account delegation chains or existing approved scoped grants are required for role decisions; ambiguous first claims remain pending.
- Google identity content remains request-scoped, private/no-store, with no snapshot cache/public projection until permitted use is confirmed. Minimal canonical references/proof metadata only. See approved contract/configuration/evidence for exact boundaries.


- Callback responses require no-referrer even on validation failure; Next's global header rule required a later callback-specific override, verified through the actual browser HTTP response.
- Connection refresh is serialized and proof writes recheck the credential version. Reconnect preserves omitted refresh credentials only for an existing connected subject; known revoked credentials cannot be resurrected. Local-first revocation checks every affected business and retains retryable encrypted credentials until remote completion.
- Optional Google role lookup permission errors preserve an earlier proof. Explicit owner-level authority loss/VoM failure triggers reverification without automatic ownership reassignment. Public freshness/grace enforcement remains Slice 5.
- Additive 0004 is tested against an actual Slice 1 private draft plus ten/twenty fixtures, preserving details/version/audit. No historical SQL/fixture definition is modified and no shared migration runs.


## M2.5 Slice 1 — 17 November 2026

- Phase 0 approved with founder corrections recorded in M25_APPROVED_CONTRACT.md before code. Pending Google approval does not block private foundation work; no runtime test double or verification shortcut.
- Explicit ref fetch found staging already reconciled at 77f6581 (including 5b8c28f). Fast-forwarded feature branch; no duplicate merge, main change or M2.5 staging push.
- Extend existing singular business/membership and preserve legacy states. New applicant relation permits safe private edits without assigning OWNER. Optional unique Place ID and GBP location ID, explicit lifecycle, append-only audit, verified account gate and optimistic editing.
- Email uses a replaceable server HTTP transport (Resend when configured), genuine OTP/recovery only, with test-only injected mailer. Better Auth remains session authority; Google login has identity scope only. No provider credentials or paid transport enabled here.
- Better Auth catches mail callback errors internally; per-request AsyncLocalStorage records delivery failure so the public handler returns unavailable rather than a false delivery-success response. Tests prove the account stays unverified. No process-global delivery status leaks between requests.
- Additive 0003 applied to existing local data: 10 fixture businesses / 20 posts unchanged. Integration harness retains original rollback coverage on disposable historical schemas, then tests the full upgrade and refuses destructive prototype rollback after 0003.
- Final local verification: 61 unit tests, 41 PostgreSQL integration tests, five legacy-upgrade checks and 14 focused browser tests pass; typecheck, lint and standalone build exit 0. Four-width evidence covers 28 captures. Live Google identity/email and actual M2.5 staging deployment remain pending configuration/acceptance. No M2.5 merge or shared database mutation performed.


## PostgreSQL connection timeout investigation — 16 November 2026

- The shared node-postgres pool allowed 5 seconds to connect or wait for a pool slot, while the founder's successful direct-client test allowed 15 seconds. Increased the pool timeout to 15 seconds for migrations and application reads; retained the maximum of five connections, idle timeout, URL-based TLS and existing pool lifecycle. This is a plausible explanation for the reported timeout, not a confirmed remote root cause: the workspace cannot resolve the Supabase pooler (EAI_AGAIN).
- A delayed TCP handshake regression verifies that the pool does not abort at five seconds and remains bounded. The existing integration suite exercises migrations and pool shutdown against disposable local PostgreSQL. The shared migration, seed and staging UI checks remain pending until the staging host is reachable; no shared database reset or seed was performed here.

## M0.5 visual polish — 16 November 2026

- Created feat/m05-visual-polish from staging 1147e29; no staging/main merge or deployment. PRD15/D13 records the founder-approved imagery, fixture-field and disclosure changes before implementation.
- Preserve the existing relational seed namespace and stable IDs. Add nullable presentation fields and validate deterministic seed content, including type-specific media limits; update only known namespaced fixtures and never genuine records.
- Populated performance traces identified a mobile image URL replacement during hydration and a streamed Feed footer shift. Local image variants now use canonical tier URLs with mobile device sizes; the loading/main region reserves one viewport so the outside-main disclosure/footer cannot jump out of view during streaming. Fixed contact grid tracks prevent a font-swap profile-header wrap.
- Original vector logos and generated local photographs carry a provenance manifest. Responsive WebP variants avoid third-party browser requests; shared media components use fixed aspect ratios, accessible galleries and Data Saver. No paid service integration, verification or engagement backend is introduced.
- Final checks: typecheck/lint/standalone build exit 0; 55 unit, 32 PostgreSQL integration, 21 focused browser tests and 12 optimised discovery checks pass. Sixty captures cover fifteen views at 320/390/768/1280 px; all recorded zero broken images, page overflow and Axe violations. Intentional image failure/reload recovery is captured separately.
- Populated local production-build measurements (390 px, 4× CPU, throttled connection) show LCP 0.720–1.064 s and CLS 0–0.01219. Initial JavaScript is 184,616 gzip bytes, above the Brain's approximate 170 KB guide; human screen-reader/visual approval remains pending. See M05_VISUAL_POLISH_ACCEPTANCE.md and evidence/m05-visual-polish/index.md for commands, scope and limits.
- No shared Supabase migration/seed/reset or Vercel deployment was performed. The remote read attempt failed DNS in this environment. Under D12, shared enrichment/deployed confirmation is an operational step after visual approval, not a claim made from local captures. Leave additive columns in place for application rollback; never reset staging as a shortcut. Main and M1 remain untouched.


## Verification runner shutdown fix — 16 November 2026

- `verify:staging` loads `.env` automatically. Existing process environment takes precedence; no database migration or seed is part of verification. Removed the anonymous PATCH probe so all HTTP verification is GET-only.
- Register exit/error listeners before signalling the child, return immediately for already-exited/failed-spawn processes, and bound shutdown with SIGTERM/grace/SIGKILL/deadline. Print the concise success summary only after cleanup settles. Always close the SQL pool even on query failure.
- Regression coverage exercises normal shutdown, already-exited child, failed spawn and SIGTERM refusal. No application, verification eligibility or M1 changes.


## Permanent staging workflow — 16 November 2026

- D12: founder explicitly accepted local verification for code completion and requested all changes committed on feat/staging-workflow. No main merge or M1 work; remote database verification remains an operational step outside Codex.

- Founder decision PRD14/D11 supersedes the protected Preview follow-up below. feature branch -> staging -> main. No branch merge or deployment is implied by local implementation.
- Use DATABASE_URL for all discovery reads. Normal anonymous routes render namespaced fixtures actually present in that database; no Vercel gates, HTTP Basic, separate fixture URL or reserved database names. Main must use separate production infrastructure/credentials with no fixture seed.
- ALLOW_DEV_SEED=true is the explicit CLI control; no automatic build/request seeding. Namespaced idempotent seed and targeted undo preserve genuine application records and never confer verification. M0 auth/mutation guards remain.
- Validation: 48 unit, 31 real PostgreSQL integration, 8 focused browser and 12 optimised discovery checks pass locally; 20 captures at four widths. Types/lint/build pass. The founder-supplied shared Supabase hostname fails DNS (EAI_AGAIN, including enabled network/elevated lookup); no successful remote migration/seed or actual-staging UI verification is claimed. No staging merge, push or Vercel mapping change occurred; the founder subsequently accepted this as an execution-environment limitation (D12): code acceptance is complete on local evidence; remote verification is an operational deployment step outside Codex. See STAGING_WORKFLOW_ACCEPTANCE.md.


## M0.5 — protected Vercel Preview follow-up, 16 November 2026

- The founder explicitly authorised protected Vercel Preview reads, superseding the prior blanket staging ban; recorded in PRD section 13 and Addendum D10 before code changes. Production's verified-only empty discovery and all Google/business activation rules are retained.
- `VERCEL_ENV=production` takes precedence over every local/preview flag. Preview requires the exact pair `VERCEL_ENV=preview` and `JADO_STAGING_PREVIEW_ENABLED=true`; NODE_ENV=production is expected for optimised Preview builds. Request input never selects the mode. The pair is also necessary for local fixture UI; DEV_PREVIEW_ENABLED alone cannot expose data. Local session-backed access remains available only with the pair plus the original local/database guards.
- Preview uses a high-entropy server-only HTTP Basic reviewer credential, constant-time comparison, no-store/noindex responses and a private `/dev`/`/design` namespace. This gives read-only prototype access without opening fixture Jado logins or granting owner/admin privileges. Vercel Deployment Protection may additionally protect the deployment; no paid protection tier is required by the code.
- Fixtures use `JADO_STAGING_DATABASE_URL`, never an implicit production DATABASE_URL fallback. A reserved `jado_preview`/`jado_preview_*` database name, explicit matching seed confirmation, actual PostgreSQL identity checks and rejection of real users/businesses protect the staging seed. Runtime and seed both fail closed on production context. Existing local seeding and M0 data remain unchanged.
- Final local validation: 91 unit, 37 PostgreSQL integration and 10 focused browser regressions passed; 39 optimised staging/runtime checks and 14 existing production checks passed. Sixteen new screenshots cover four widths. Types, lint and production build passed. All hosted environment checks use a local optimised runtime and disposable database; no actual Vercel configuration/deployment, production access or spend occurred. See `M05_STAGING_ACCEPTANCE.md` and `VERCEL_PREVIEW.md`; live Preview setup and visual acceptance remain pending.

## M0.5 — 16 November 2026

- Baseline: fast-forwarded the clean task checkout to `origin/feat/m0-5-ux` (4556151), including M0 (9c830df); no reset or database replacement.
- Precedence: the approved Brain controls visual interactions within M0.5; Addendum D6/D7 controls launch scope and PostgreSQL. The milestone shell list is amended to exclude AI/Learn. This records existing approved instructions, not new product scope.
- Design: one CSS token file, self-hosted Bricolage Grotesque/Inter via next/font/local, Lucide icons, accessible native dialogs and a local authenticated `/design` gallery before screen assembly. Fictional media use clearly identified local category illustrations; no Google imagery, ratings or verification is invented.
- Preview isolation: dedicated development tables and a separate `/dev` namespace. Preview requires explicit local opt-in, a loopback development database and application origin, a nonproduction/nonstaging runtime, and an active development-identity session. Every read rechecks this boundary. Public services never query development tables. No query parameter enables demo data.
- Prototype state: area, filters, selection and safe intended actions are shareable URLs; data-saver is a local browser preference. The seed has stable IDs, collision checks, a namespace, transactions and targeted undo. It leaves M0 identities/pending fixture and auth/RBAC intact. Message/follow/like continuation shows a truthful milestone-blocked state without creating engagement or sending a message.

## M0 — 15 November 2026

- **Scope:** Foundation only. The six supplied specifications remain the source of truth; the Decisions Addendum wins conflicts. M0.5 and later work require separate acceptance.
- **Database:** PostgreSQL 17 locally and in production, reconfirmed by the founder in this task. No SQLite migration path is needed. Drizzle ORM with reviewed SQL migrations provides standard PostgreSQL portability; migration history is owned by Drizzle. Development rollback is explicitly guarded and limited to the initial migration.
- **Runtime:** Node.js 24 LTS, Next.js App Router, React and strict TypeScript. Exact dependency versions are recorded in package.json/package-lock.json. Development and production builds use supported Webpack mode; production uses two workers to bound memory. Browser traces exposed repeated reloads under the initial Turbopack dev configuration between runs; Webpack avoids depending on that cloud cache state. Next.js's generated guidance block in AGENTS.md is retained, and the installed routing/auth/error-handling guides are consulted.
- **Auth:** Better Auth with its Drizzle PostgreSQL adapter owns credentials, password hashing, sessions, cookies, CSRF and auth rate limits. Public registration is closed in M0; only opt-in development seed accounts have credential access. Production rejects fixture sessions. Google identity and email OTP delivery remain unconfigured. Neither authentication nor a platform staff role confers verified business membership.
- **Authorization:** Read current account state and active per-business membership on the server, never trust roles or business IDs supplied by the browser. Protected name updates provide a small authenticated persistence slice with schema validation, same-origin checks, database-backed rate limits and an audit record.
- **Providers:** Typed interfaces return explicit unavailable results in M0. Flags default to false, spending caps to zero, and a true flag cannot activate an unimplemented adapter. No network-capable provider SDK is installed.
- **Fixtures:** Local-only, opt-in seeds are labeled in database rows and the sign-in screen, cannot activate businesses, are reversible, and are rejected by production authentication and application guards. Integration/E2E suites create isolated temporary PostgreSQL databases and tear them down.
- **Portability:** A standalone Docker image and loopback-only development Compose service are provided. No production host, mail provider, object store, background daemon or paid plan is selected. The app requires a bounded database connection pool; future background work must use scheduled jobs, as specified in Addendum 2a.
- **UI:** System fonts and local CSS tokens avoid third-party font requests. This milestone contains a minimal welcome, sign-in, account and protected staff screen, with error/loading/not-found states. Explore/Feed/Compare/product shells are M0.5 work.

- Contrast verification found teal text on the specified pale teal at 4.19:1, below AA. VerifiedBadge therefore uses the unchanged teal-600 fill with white text, which passes AA. Development cards never use it.

- Browser tests exposed pre-hydration interaction races. Authentication/account forms now explicitly use POST, and JS-dependent controls stay disabled until hydrated, preventing credential submission in a URL. Comparison selection uses React optimistic transitions with the URL as its authoritative state. Unknown public paths use explicit App Router routes to retain genuine 404 responses. The preserved sign-in route hosts a native accessible sheet rather than replacing M0 auth.

- Binary font cmap inspection found U+20A6 absent in both Latin subsets and present in their original Latin-extended files. Those unmodified OFL files provide a CSS unicode-range U+20A6 fallback only; Inter and Bricolage remain the normal next/font/local families. No system-font assumption is needed for naira prices.
- Preview routes also fail closed before streaming through a narrowly matched Next.js proxy; page/API/service guards remain authoritative. Disabled previews receive HTTP 404 without rendering fixture content. Area links preserve the coarse area in the URL without adding location storage. Native dialog focus loops, shared comparison transitions and stacked profile/tray offsets were exercised in browser checks.
- Desktop comparisons use the same fictional evidence in a semantic table; mobile uses contained swipeable cards. Category icons provide explicit no-logo/no-photo placeholders. Prices and offer dates are read from database records and formatted for Africa/Lagos; no fictional Google review, contact number, quality signal or response metric is supplied.

- Final validation: 57 unit, 31 real PostgreSQL integration and 30 browser tests pass; 128 captures at four widths. Optimised local production tests deny fixture pages/API/login even with fixtures present and the preview flag true. Public empty-route lab metrics are recorded separately from the private populated preview; no populated production performance claim is made. No paid transport or deployment was activated.
