# Jado v2 — Decisions Addendum

**Date:** 15 November 2026
**Rule:** Where this file conflicts with the PRD, Screen Map, Architecture, Milestones or Handoff, this file wins. Codex must read it last.

## 1. Founder decisions recorded

| # | Decision | Effect |
|---|---|---|
| D1 | **No manual-verification fallback.** Jado's verified badge depends on Google Business Profile (GBP) API approval. | If approval is delayed or refused, M1 stays externally blocked. Nobody assigns a verified badge by hand. |
| D2 | **Owners get new-message alerts on WhatsApp**, sent by Jado, with a link that opens the conversation (same idea as LinkedIn's email alerts). | Replaces "in-app notifications only" in PRD MES-04 for owners. See section 3. |
| D3 | **Owners always join from their own devices.** | Applies to sign-in, Google authorization and onboarding. Staff may guide in person or on a call but never operate the owner's account. Add to Screen Map O01 to O03. |
| D4 | **Consumer sign-in: Google, or email and password.** Email sign-ups verify with a one-time code sent to their email, then continue. | Needs a transactional email provider (section 2). Sign-in with Google is separate from the Google Business Profile authorization owners do later. |
| D5 | **Low-cost, efficient production stack** is wanted. | Section 2 is the recommended setup. Approval of each paid item is still required. |
| D6 | **Confirmed: the launch cut is M0 to M4.** M5 (Jado AI) and M6 (Learn) come after launch. | PRD beta gates 5 (live AI) and the Learn mention in the Milestones beta definition no longer apply to launch. Codex must not start M5 or M6 until the founder opens them. |
| D7 | **Confirmed: PostgreSQL from M0**, locally and in production. SQLite is not used. | Replaces the SQLite instruction in Architecture section 1, M0 and the Handoff master prompt. |
| D8 | **Domain jado.com and support@jado.com are planned but not yet set up.** | Until they exist, use the temporary hosting URL and a placeholder support address in config. Do not hard-code either. |
| D9 | **Hosting: free tiers first** (Vercel or better), moving to a paid setup once the product is validated. | See section 2a. The app must stay portable so that move is easy. |

## 2. Recommended production stack (low cost)

**Principle:** one small server, one database, few vendors. Add services only when usage demands them.

| Need | Recommendation | Rough cost | Why |
|---|---|---|---|
| App framework | Next.js (App Router) and TypeScript | Free | Already decided. |
| Database | **PostgreSQL from M0**, locally and in production (approved, D7) | Included in server | Starting on SQLite and moving later means rewriting migrations and search. Postgres also gives built-in full-text search and typo-tolerant matching (pg_trgm), so no separate search service is needed. |
| Hosting (target, after validation) | One small VPS running the app, Postgres and a reverse proxy, with Cloudflare (free plan) in front for DNS, caching and DDoS protection | About USD 6 to 15 per month | Predictable price. Hosted platforms with free tiers often restrict commercial use. Verify current terms before choosing. |
| Image storage | Cloudflare R2 (or similar S3-compatible store) | Free tier first, then cents | No charge for downloads. Resize images on upload to keep pages light on mobile data. |
| Background jobs | Postgres-based job queue (for example pg-boss) | Free | Handles WhatsApp alerts and view-count rollups without adding Redis. |
| Transactional email | Resend or Brevo free tier | Free at pilot volume | Account verification, password reset, fallback alerts. |
| Errors and uptime | Sentry free tier and a free uptime monitor | Free | Enough for a pilot. |
| Backups | Nightly Postgres dump copied to object storage, with a tested restore | Cents | A pilot with real business data must be restorable. |
| AI (when approved) | One provider behind an adapter, USD 30 per month hard cap | Up to USD 30 | Already in the PRD. Off until approved. |
| WhatsApp alerts | Meta's WhatsApp Business Platform (Cloud API), used directly | See section 3 | No middleman markup. |

**Also needed:** a domain name, a support email address, and privacy and terms pages.

**Notes for Codex:** keep every vendor behind an adapter, keep the app deployable as a single container, and record the final choices in `DECISION_LOG.md` during M0. Prisma or Drizzle are both acceptable for the ORM, provided the same database engine is used locally and in production.

## 2a. Hosting plan: free tiers first, then move

**Phase A, pilot and validation (free tiers):**
- App on Vercel's free tier or an equivalent. Vercel's free Hobby plan is, to my knowledge, for non-commercial use. Check the current terms before putting real businesses on it, and move to a paid plan or another host if the pilot is commercial.
- Free hosted Postgres (for example Neon or Supabase). Free databases can pause when idle and have storage limits, so expect slow first loads and plan for upgrades.
- Free object storage tier for images, free-tier email provider, free error monitoring.
- Temporary URL until jado.com is secured. Email verification codes need a sending domain, so email sign-up is fully testable only once the domain exists. Until then Codex builds against a mock mailer and Google sign-in.

**What Codex must do so the move is painless:**
1. Standard Postgres only. No vendor-specific database features.
2. Do not rely on a long-running server process. Run background work (WhatsApp alerts, view-count rollups) from a jobs table processed by a scheduled endpoint, and keep it runnable by any scheduler. Free-tier schedulers are limited, so record the limits in `DECISION_LOG.md`.
3. Keep file storage, email, WhatsApp and AI behind adapters.
4. Provide a Dockerfile so the same app can run on a small VPS later.
5. Keep every setting in environment variables, with a documented example file.

**Move trigger (founder decides):** the first paying client, sustained real traffic, or free-tier limits hit, whichever comes first.

## 3. WhatsApp owner alerts (replaces owner-side MES-04)

**What the owner receives:** a short WhatsApp message such as "You have a new message on Jado about [post or business]. Open it here: [link]". **Never include the customer's message text or name in the WhatsApp alert.** The link opens the owner inbox after sign-in.

**Rules:**
1. **Opt-in.** The owner adds a WhatsApp number in onboarding and confirms it with a one-time code before any alert is sent.
2. **Message type.** Alerts must be approved *utility* templates, strictly informational. Promotional wording gets classified as marketing, which costs several times more and can get the template rejected.
3. **Throttle.** At most one alert per conversation within a set window (default 30 minutes), then a digest. Admin-editable.
4. **Cost control.** Disabled by default, with a monthly spend cap and a kill switch, like AI. Meta charges per delivered template message. Reported rates for Nigerian numbers are roughly USD 0.01 for utility messages, but check Meta's current rate card before budgeting.
5. **Fallbacks.** If WhatsApp is unconfigured, over cap or fails, send an email alert, and always show the in-app notification.
6. **Setup the founder must do first:** a Meta business account with verification, a WhatsApp Business Platform account, a dedicated phone number for Jado, and approved message templates. Codex builds the adapter and tests it against mocks until these exist.
7. **Opt-out.** Every owner can switch alerts off in settings.

**Acceptance tests (add to M4):**
- [ ] New customer message triggers exactly one alert to the owner's confirmed number.
- [ ] No alert is sent to an unconfirmed number or after opt-out.
- [ ] Alert text contains no customer message content.
- [ ] Rapid messages in one conversation are throttled.
- [ ] Spend cap or provider failure falls back to email and no WhatsApp call is made when disabled.

## 4. Google Business Profile API: do this now

Everything in Jado verification depends on this. Google reviews each request itself and gives no timeline or guarantee, so start before M0 finishes. Reported waits run from days to a few weeks, and a refusal is possible.

**Checklist (confirm each against Google's current prerequisites page before submitting):**
- [ ] A Google Business Profile that is **verified and active for 60+ days**, either Webtellisense's own or a client's you manage, with a website listed on it. Applicants report that the applying email must have held owner or manager access on that profile for 60+ days too, so check the People tab.
- [ ] A Google Cloud project, with the **Project Number** recorded.
- [ ] An **Organization account** set up through the Business Profile help center.
- [ ] Submit the Business Profile API contact form and choose **Application for Basic API Access**. Describe the real use case: verifying that a business owner has management access to their listing before activating a Jado profile.
- [ ] Configure the OAuth consent screen with the Business Profile scope at the same time. Expect Google to review this before production use.
- [ ] After approval, enable the APIs and **check the actual quota value** (zero means access is not yet granted).

**Rule:** until quota is confirmed, Codex builds M1 against contract tests and marks live verification **blocked**. It does not substitute anything else.

## 5. Screen Map and PRD patches

- **Screen Map O01 to O03:** add "The owner signs in and authorizes Google on their own device. Assisted onboarding means a Webtellisense staff member guides the owner, who holds the device."
- **PRD MES-04:** replace with "Owner alerts via WhatsApp (utility template), with email fallback and in-app notifications always on. Consumer notifications are in-app at launch."
- **PRD BUS-07 and Handoff M1 prompt:** add "No manual or staff-assigned verified badge exists in this release."
- **Milestones M4:** add the WhatsApp acceptance tests from section 3.
- **Architecture section 1, M0 deliverables and Handoff master prompt:** replace "local SQLite initially" with PostgreSQL locally and in production. M0 must include a documented local Postgres setup (Docker or a free hosted dev database) and migrations that run against it.
- **Milestones beta definition and PRD release gate 5:** launch is M0 to M4. Live AI (M5) and Learn (M6) are post-launch.
- **Handoff section 3:** after M4 is accepted, do not offer M5 or M6 to Codex until the founder says so.

## 6. Still open

1. Secure jado.com and set up support@jado.com. Check the domain is actually available before relying on it, and use a temporary URL until then.
2. Meta business verification, WhatsApp Business Platform account and a dedicated number (section 3).
3. Google Business Profile API application (section 4). This is the critical path.
4. Founder confirmation of the monthly budget once free tiers are outgrown (suggest USD 15 to 25 per month for infrastructure, excluding WhatsApp).

## 7. Historical M0.5 private Preview exception (superseded by D11)

**D10 — 16 November 2026, founder-approved M0.5 follow-up:** Protected Vercel Preview fixture reads are allowed only with both `VERCEL_ENV=preview` and `JADO_STAGING_PREVIEW_ENABLED=true`, visible Development data labels, server-side reviewer authentication and a separate Preview database. Production remains fixture-free. A separately opted-in seed must refuse production deployment/database contexts. This narrow exception supersedes the earlier blanket staging ban; M1 and production verification rules are unchanged. See PRD section 13 and `VERCEL_PREVIEW.md`.

## 8. D11 — permanent staging workflow (supersedes D10)

Founder-approved: feature branch -> staging -> main; staging is permanent review/integration, main is future production. Normal staging routes read DATABASE_URL and render labelled namespaced fixtures without Preview flags or Basic auth. Production uses separate unseeded infrastructure/credentials. Seed requires ALLOW_DEV_SEED=true; targeted undo preserves real records. See PRD section 14 and DEPLOYMENT.md. M1 remains closed.

**D12 — founder acceptance clarification, 16 November 2026:** Local implementation and verification suffice for feat/staging-workflow code completion. Remote database verification is an operational deployment step outside Codex; EAI_AGAIN is an accepted execution-environment limitation, not a code acceptance blocker. Commit the feature branch; do not merge main or start M1.

## 9. D13 — approved M0.5 visual refinement

PRD15 supersedes repeated per-card Development data labels: retain one quiet staging/demo disclosure outside main content and internal fixture provenance. Preserve stable IDs, additive migrations and genuine records. Image-led identities, galleries and post-type media limits are approved only for the prototype. No real business publishing, engagement, Google verification/reviews or M1. Feature branch requires founder visual approval before staging merge.

## 10. D14 — M2.5 founder decisions

17 November 2026: [M25_APPROVED_CONTRACT.md](M25_APPROVED_CONTRACT.md) records the founder-approved scope, policy corrections, slice gates and identity fallback addition. It supersedes conflicting Places-first onboarding, unconditional Place ID, private-draft restrictions and fixture gating rules above. M0.5 is accepted. Preserve its visual design and fixture logos. Implement Slice 1 only now; no M3 or M2.5 staging/main merge is authorised.
