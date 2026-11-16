# AGENTS.md — Jado v2 standing rules

Jado v2 is built by Webtellisense Consult. Codex reads this file automatically. Keep it in the repo root.

## Source of truth (read in full before any milestone)
Docs live in `/docs`. Read in this order. The decisions addendum wins on product scope, integration and policy; the Brain wins on look, feel and interaction patterns **only within approved milestone scope**:
1. JADO_V2_MASTER_PRD.md
2. JADO_V2_SCREEN_MAP.md
3. JADO_V2_ARCHITECTURE.md
4. JADO_V2_MILESTONES_ACCEPTANCE.md
5. JADO_V2_CODEX_HANDOFF.md
6. JADO_V2_UI_UX_BRAIN.md (binding for all look, feel, layout and UX behaviour **within the current milestone**)
7. JADO_V2_DECISIONS_ADDENDUM.md (overrides the others on product, stack and policy)

If a file is missing, ask. Never invent its contents.

## Product in one paragraph
Jado is an owner-verified local business discovery, structured feed, comparison, messaging and growth platform. It launches in Uyo, Akwa Ibom, starting with solar installers, and is open to any business with a Google Business Profile. It is not an auditing tool.

## Non-negotiable rules
1. Work on ONE milestone at a time. Start with the milestone the founder names. Stop after the acceptance report and wait for approval.
2. Never grant a verified badge from Google match or Google sign-in alone. Verification needs real, sanctioned Google Business Profile authorization for the matching location. If access is missing, keep the state pending and report the blocker. There is no manual-verification shortcut.
3. No paid API calls, billable service, purchase or production account access without explicit founder approval. Every paid integration (Google Places, AI, WhatsApp, email, storage) is disabled by default behind a flag, with a spend cap.
4. No fake data in production. Development fixtures must be labeled as such and excluded from production.
5. Google-controlled fields (name, address, primary phone, hours, rating, reviews, photos) are read-only in Jado. Check official Google docs before storing or showing any Google data.
6. Jado has no star-rating or review system of its own. Reviews stay on Google.
7. Jado AI recommends only real Jado-verified businesses and says so when it has no match. Never present a mock as working AI.
8. Every state-changing action is checked on the server for sign-in, permission, input validation and abuse limits. No secrets in git.
9. Owners must complete sign-in and Google authorization on their own device. Staff may guide, but never act as the owner.
10. If a consequential product decision is missing, ask. Do not invent it. Log every technical decision in `/docs/DECISION_LOG.md`.
11. **Verified-only public supply:** never automatically publish businesses discovered through Google Places. Google results can appear as potential matches during owner onboarding, not as Jado public listings. A public business must have authorized Google Business Profile management access verified for the matching location. The owner-claim flow must support alternate Google accounts, manager invitations, Google ownership requests and Jado help while retaining a pending application.
12. **Separate trust and activity:** every public business is verified, but a verification badge never indicates posting consistency, response speed, popularity or service quality. Any additional activity badge must use genuine defined metrics and have founder-approved thresholds; no invented or gamified badges in M0.5.
13. **Development data:** M0.5 includes exactly ten fictional business fixtures in a dedicated, reversible, idempotent **development-only PostgreSQL seed**. Load them through normal server/database pathways for interactive search, feed and compare prototypes. Demo records retain their fixture namespace and one quiet staging/demo disclosure outside main content (D13) and never be seeded into the separate production database. Never display them as actual Google-verified businesses or live customer activity. Without real verified records, public Explore has an honest empty state.

**Current founder-approved workflow (PRD section 14 / Addendum D11):** feature branch -> staging -> main. Staging is the permanent shared integration/review deployment. Normal routes use DATABASE_URL and display the ten namespaced fixtures with Development data labels without Preview runtime gates or reviewer authentication. This supersedes every earlier private/local-only fixture restriction in these documents. Production isolation is a separate unseeded database and separate credentials. Never seed production. Seed/undo require explicit ALLOW_DEV_SEED=true and only touch the known namespace; real records must survive. Account permissions and Google verification rules remain unchanged. M1 is not authorised. Founder clarification D12: local verification is sufficient for this code branch; remote staging migration/seed/flow verification is an operational deployment step outside Codex, not a code acceptance blocker.

## UI and UX rule
Before writing any UI, read `docs/JADO_V2_UI_UX_BRAIN.md`. Build tokens and a development-only `/design` component gallery **for components needed by the approved milestone**, then assemble screens from those components. Every milestone report must include screenshots at 320, 390, 768 and 1280 px plus the Screen Definition of Done checklist (UI/UX Brain section 11). Explore opens on search, location and business content when eligible records exist—not a marketing paragraph or sign-in prompt. M0.5 may use plainly marked fictional database records on normal staging routes; public launch must show genuine verified businesses only.

## M0.5 is an interactive prototype, not a reset
- Preserve M0 authentication, PostgreSQL, RBAC, security and tests. Do not restart the app from scratch, replace its architecture or reset/decommission existing databases.
- Work against the approved M0.5 acceptance contract: functional selection, filtering, comparison, navigation, sign-in-gate returns and accurate states over ten seeded fictional records in the shared staging development environment. Prototype interactions must truly work; avoid static screenshots and dead CTAs.
- Do not claim that Google ownership verification, live publishing, live analytics or Jado messaging are operational before M1, M2, M3 or M4 respectively. Demonstrate clear blocked/empty states instead.
- The existing milestone document mentions AI and Learn shells, but the later decisions addendum explicitly defers **M5 AI and M6 Learn**; do not expose their launch navigation or implement them without founder approval. If a milestone acceptance item conflicts, flag it explicitly and propose a documentation amendment before coding.
- Finish the current milestone, provide an evidence-based report and stop for the founder's visual acceptance.

## Way of working
- Before coding: state what exists, give a short plan (routes, data changes, tests, risks, external blockers).
- Build working vertical slices with empty, loading, error and unauthorized states.
- Write tests for normal, negative and unauthorized paths. Run them and report real commands and results.
- Check layouts at 320, 390, 768 and 1280 px, plus keyboard access.
- Report at the end using the template in JADO_V2_CODEX_HANDOFF.md section 4.

## Stack (see decisions addendum for detail)
Next.js App Router, TypeScript, PostgreSQL (locally and in production, no SQLite), a single ORM with explicit migrations, in-process modules (no microservices), replaceable adapters for Google, AI, WhatsApp, email and storage. Launch scope is M0 to M4. M5 (AI) and M6 (Learn) are post-launch and must not be started without founder approval. Hosting starts on free tiers and must stay portable: standard Postgres, no always-on server assumptions, Dockerfile included, all settings in environment variables.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Current M0.5 visual refinement

PRD15 / Addendum D13 supersede repeated fixture banners: exactly one quiet staging/demo disclosure outside main content. Preserve internal seed namespace and all verification/auth boundaries. Enrich only known fictional IDs; use additive migrations, original/licensed assets and no production fixture seeding. feat/m05-visual-polish must not merge into staging until founder visual approval. M1 remains closed.
