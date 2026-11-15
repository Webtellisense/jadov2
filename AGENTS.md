# AGENTS.md — Jado v2 standing rules

Jado v2 is built by Webtellisense Consult. Codex reads this file automatically. Keep it in the repo root.

## Source of truth (read in full before any milestone)
Docs live in `/docs`. Read in this order, then check the decisions file last because it wins on any conflict:
1. JADO_V2_MASTER_PRD.md
2. JADO_V2_SCREEN_MAP.md
3. JADO_V2_ARCHITECTURE.md
4. JADO_V2_MILESTONES_ACCEPTANCE.md
5. JADO_V2_CODEX_HANDOFF.md
6. JADO_V2_DECISIONS_ADDENDUM.md (overrides the others)

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
