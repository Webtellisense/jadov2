# M0 acceptance report

Date: 15 November 2026. Scope: **M0 — Foundation only**, pending founder acceptance. No M0.5+ functionality has been implemented.

## 1. Milestone

M0 — Project architecture, security and reliable local setup. PostgreSQL replaces the older SQLite text, following the Decisions Addendum and the founder's explicit confirmation in this task.

## 2. User-facing outcome

A visitor can open the mobile-friendly welcome screen. An opted-in, clearly labeled development user can sign in with a real hashed credential and database session, update their own display name, reload to see it persisted, and sign out. Consumer access to the staff area is denied; an actual administrator session reaches a protected foundation screen. These are local development identities, not real businesses or Google verification. Production rejects them.

Explore, area/GPS selection, Feed, comparisons, Google authorization, business publishing, messages, AI, Learn and Pro are not implemented. Public sign-up, Google login, email OTP and password recovery remain unavailable.

## 3. Files changed

| Paths                                                                                 | Purpose                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`, `components/`                                                                 | Welcome, sign-in, account and protected staff screens; local design tokens; loading/error/not-found states; guarded API routes.                                                               |
| `server/`, `lib/`                                                                     | Better Auth integration, current-account and membership authorization, bounded/validated name mutation, audit and rate limits, safe configuration and redirect handling, provider interfaces. |
| `db/`, `drizzle.config.ts`                                                            | PostgreSQL schema, initial SQL migration and history, reversible guarded seed and initial rollback.                                                                                           |
| `scripts/`, `tests/`, test configs                                                    | Local environment setup, standalone packaging, isolated database runners, unit/integration/browser checks.                                                                                    |
| `package.json`, `package-lock.json`, `.node-version`, tool configs                    | Pinned dependencies, Node 24 toolchain and reproducible commands.                                                                                                                             |
| `Dockerfile`, `.dockerignore`, `compose.yaml`, `.github/workflows/checks.yml`         | Nonroot standalone packaging, local PostgreSQL and CI definition. CI has not been run on GitHub in this task.                                                                                 |
| `.env.example`, `.gitignore`, `README.md`, `docs/DECISION_LOG.md`, `docs/SECURITY.md` | Secret-free configuration template, setup, technical decisions and security/operational limits.                                                                                               |
| `docs/JADO_V2_MASTER_PRD.md`                                                          | Records the confirmed M0/PostgreSQL/auth boundary before implementation; does not authorize new integrations.                                                                                 |
| `AGENTS.md`                                                                           | Next.js automatically appended its installed-version guidance block during `next dev`; original standing rules are retained.                                                                  |
| `docs/evidence/`                                                                      | Actual browser screenshots from the passing M0 tests.                                                                                                                                         |

Generated `.env`, dependencies, caches and browser reports are ignored. No credentials are included in source, screenshots or the packaged standalone/Docker artifacts.

## 4. Database changes

Initial migration `db/migrations/0000_loving_ser_duncan.sql` creates nine tables: auth users, sessions, accounts, verification tokens and auth rate limits; businesses and memberships; audit log and account mutation limits. PostgreSQL enums, foreign keys, unique Place ID/slug/provider identity constraints and lookup indexes are explicit.

`npm run db:migrate` is repeatable. The integration runner tested the initial migration, explicit local rollback, reapplication and repeated migration against a newly created disposable database. Seed/undo/reseed also ran against the actual local development database. The opt-in seed creates two labeled accounts and one pending fixture business, with no membership or verified activation.

`db:seed:undo` removes known labeled fixtures and their dependent data. `db:rollback` drops the initial M0 tables and data only when the loopback/dev target, explicit opt-in, extra confirmation and single-migration history checks pass. Do not use it against production; production migration rollback needs separate reviewed forward/compensating SQL and backups.

## 5. Tests run

| Command/check                                         | Outcome                            | What it exercised                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                   | Pass                               | Strict application, database, script and test types.                                                                                                                                                                                                                                                |
| `npm run lint`                                        | Pass                               | ESLint/Next.js checks, zero warnings.                                                                                                                                                                                                                                                               |
| `npm test`                                            | **28 passed, 0 failed, 0 skipped** | Auth predicates, production fixture exclusion, local seed guards, input/config/origin/body limits, safe redirects/errors and no-network provider defaults.                                                                                                                                          |
| `npm run test:integration`                            | **20 passed, 0 failed, 0 skipped** | Real PostgreSQL migrations/rollback, unique IDs, seed idempotence/reversal, credential sessions and cookies, wrong password, cross-site rejection, expiry/revocation/suspension, production fixture rejection, staff/membership isolation, persistent rate limits and transactional audited writes. |
| `npm run test:e2e`                                    | **12 passed, 0 failed, 0 skipped** | Anonymous browsing and denials; actual UI sign-in/edit/reload/sign-out; wrong password and offline errors; role/origin/input/size checks; suspension; four viewport/keyboard/accessibility checks; 404 and security headers.                                                                        |
| `npm run build`                                       | Pass                               | Optimized standalone Next.js build and TypeScript checking; static assets prepared and traced dotenv files removed.                                                                                                                                                                                 |
| Docker build with the session CA as a BuildKit secret | Pass                               | Fresh frozen dependency install and production build on the pinned Node image, TLS verification enabled.                                                                                                                                                                                            |
| Production HTTP smoke checks                          | Pass                               | Homepage and PostgreSQL health, anonymous rejection and refusal of seeded fixture login. This is local runtime validation, not deployment or a production integration.                                                                                                                              |
| Docker runtime checks                                 | Pass                               | Same functional checks on the standalone nonroot image; no embedded `.env` or build CA.                                                                                                                                                                                                             |
| `docker compose config --quiet`, `git diff --check`   | Pass                               | Compose structure and whitespace integrity.                                                                                                                                                                                                                                                         |

Failures encountered and corrected: scripts initially needed explicit ESM configuration; Next.js environment types required appropriately typed test fixtures; two browser error assertions also matched Next.js's announcer; screenshot review found an unsupported arrow glyph; a default auth test-mode origin-check relaxation was overridden explicitly; repeated Turbopack dev reloads were addressed with supported Webpack mode and a fresh generated cache. Docker initially rejected the session proxy CA and succeeded after a temporary trusted CA mount, without disabling verification. Next's standalone startup warning led to using the generated server directly and excluding traced dotenv files from packaged output. The latest relevant runs pass; assertions were not disabled or skipped.

## 6. Screens reviewed

Welcome, sign-in, account and staff screens were checked at **320, 390, 768 and 1280 pixels**. All 16 page/viewport combinations passed horizontal-overflow and axe WCAG 2 A/AA + WCAG 2.1 AA checks. Keyboard checks covered the skip link and sign-in field/button order. Automated checks are a baseline, not a full human screen-reader audit. Screenshot review found no remaining overflow, clipped controls or missing glyphs.

- [320px welcome](evidence/m0-home-320.png)
- [1280px welcome](evidence/m0-home-1280.png)
- [390px account](evidence/m0-account-390.png)

Full generated screenshots and the Playwright report remain in ignored `test-results/` and `playwright-report/` in this workspace.

## 7. External integration status

| Integration                                              | Status                                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local PostgreSQL, credential sessions                    | **Real**, exercised with local development data.                                                                                                                   |
| Google Places / Google Business Profile / Google sign-in | **Unconfigured and disabled**. Live authorization and Google approval/quota checks belong to their integration milestones. No manual-verification fallback exists. |
| AI, WhatsApp, transactional email, object storage        | **Unconfigured and disabled**. Typed unavailable adapters only; no real or simulated success.                                                                      |
| Provider contract behavior                               | Tested unavailable/no-network boundaries; live response contracts remain future work.                                                                              |
| Production hosting, domain and support email             | Not configured, purchased, accessed or deployed.                                                                                                                   |

No paid API call, provider account creation or production account access occurred. Future Google API approval/OAuth, email delivery and WhatsApp prerequisites remain external launch dependencies, not blockers for the local M0 foundation.

## 8. Security/privacy

Verified protections include HttpOnly/SameSite session cookies, active account checks, expiry/revocation, wrong-role and per-business denials, fixture exclusion in production, strict input validation, same-origin mutation and credential checks, bounded payloads, database-backed limits, transactional audit records and sanitized errors. Production configuration requires HTTPS and Secure cookies. Secrets are generated locally into ignored configuration and never printed by setup. Google-controlled fields and customer messages are not copied, stored or displayed.

Before launch: configure trusted reverse-proxy IP handling and production TLS; provision least-privilege database/migration roles; add scheduled retention cleanup, backup/restore validation and approved privacy/consent content; implement real consumer sign-up/OTP and approved integrations. The local passwordless loopback database and fixture identities are never production configuration. See `docs/SECURITY.md` for details.

## 9. M0 acceptance checklist

| Criterion                                   | Result/evidence                                                                                                                                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean documented setup starts               | **Pass** — locked install and build from a clean Node Docker stage; PostgreSQL bootstrap/migrations/startup and runtime checks; README commands provided. Fresh future cloud-task restoration has not been independently tested. |
| Typecheck, lint and baseline tests          | **Pass** — 28 unit, 20 integration, 12 browser tests; no current failures/skips.                                                                                                                                                 |
| Migration and reversible dev seed           | **Pass** — initial migration/rollback/reapply/repeat plus seed/undo/reseed.                                                                                                                                                      |
| Protected route blocks anonymous/wrong role | **Pass** — `/api/me`/staff APIs return 401/403; pages redirect or show unavailable; tests exercise real sessions.                                                                                                                |
| Paid APIs are not called when disabled      | **Pass** — all six adapter boundaries return unavailable and make no network call. Enabled flags cannot activate an M0 transport.                                                                                                |
| Fixtures are unmistakably nonproduction     | **Pass** — database markers, `[DEV FIXTURE]` names, visible notices, no verified seed, guarded seed, production rejection tests.                                                                                                 |
| No hard-coded credentials; safe example env | **Pass** — `.env.example` contains no credential values, local secrets are generated, `.env` is ignored and omitted from packaged output.                                                                                        |

## 10. Next proposed milestone

Cloud `install_script` and `start_skill` were updated, executed where applicable and read back to verify persistence. The install refresh preserved local configuration and reapplied migrations successfully. The draft is saved; publication and fresh-task restoration have not been performed. Source changes remain in the working tree and have not been committed or pushed.

**M0.5 — Interactive public experience**, only after founder acceptance of M0. Stop here. Google/GBP production approval and all later milestone gates remain in force.
