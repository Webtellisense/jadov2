# Jado v2 — Milestones, Acceptance Criteria and Release Gates

**Status:** Product scope frozen, milestone sequence proposed  
**Date:** 15 November 2026  
**Pilot focus:** Public beta plus 100 target verified, active Uyo business profiles by 31 December 2026  
**Rule:** Each milestone has one demonstrable end-to-end slice and must be accepted before Codex advances.

## 1. How to use this plan

At the beginning of every milestone, Codex must:

1. Read the current PRD, Screen Map, Architecture, milestone contract and current repo implementation.
2. State the existing baseline and *only* the in-scope deliverables.
3. Identify missing external access/cost decisions; do not secretly turn on paid APIs.
4. Implement the smallest complete user flow and tests.
5. Run lint/typecheck/unit/integration/e2e tests applicable to the slice, including mobile viewport checks.
6. Produce an evidence-based handoff: implemented, tested, externally blocked, consciously deferred, decisions needed.
7. **Stop** and await milestone acceptance before proceeding.

An attractive screen with fake numbers is not equivalent to working functionality. Test fixtures may use explicitly marked invented data in development/test; public production must not.

## 2. Milestone summary

| ID | Goal | Launch priority | Depends on |
|---|---|---|---|
| M0 | Project architecture, security and reliable local setup | Must | None |
| M0.5 | Responsive interactive public UI prototype | Must | M0 |
| M1 | Real business search, claim, GBP authorization and verification | Hard gate | M0.5 + Google approvals |
| M2 | Owner profiles, media, business posts and public Feed | Must | M1 for verified production publishing |
| M3 | Search, Explore rankings, follows, analytics and comparisons | Must | M2 |
| M4 | Signed-in Jado messaging and inbox | Must | M1/M3 |
| M5 | Limited functional, grounded consumer Jado AI | Founder-requested beta | M3 + approved provider/budget |
| M6 | Learn reading and editorial publishing | Early post-beta / lightweight pre-beta | M0.5 |
| M7 | Jado Pro: manual audits, reports, account-manager chat and billing | After validation | M1/M4 + service economics |
| M8 | Advanced social connections, notifications, badges, native apps | Future | Usage validation and APIs |

**Beta definition:** M0–M5 functional gates plus basic Learn visibility when content ready. Release timing is a target, not authority to bypass a failed Google verification gate or spend money without approval.

## 3. Global Definition of Done (applies to all milestones)

- Tested on local setup from clean documented instructions.
- All new code TypeScript typed, validated at boundaries, access-controlled server-side.
- No fake success state, empty placeholder presented as operational, or unapproved external bill.
- Relevant automated tests pass; failures noted with reproduced reason.
- Loading, empty, error, unauthorized and retry states implemented.
- Mobile-first navigation usable at 320px, 390px and 768px; desktop at 1280px and above.
- Responsive touch targets, keyboard behavior and basic accessibility checked.
- Documentation and any new migrations/configuration examples updated.
- Security and privacy review of any new data/API scope; no secrets committed.
- Clear acceptance demo with instructions and actual observations.
- Stop after meeting agreed milestone. Do not start future items opportunistically.

## 4. M0 — Foundation

**Outcome:** A stable local Next.js web application and testable architecture, not the full Jado product.

Deliver:

- Fresh Next.js App Router/TypeScript repo, sensible folder structure, design tokens and basic mobile layout.
- Local SQLite schema/migrations/seed infrastructure; documented design path to PostgreSQL production.
- Authentication and authorization skeleton; roles/membership schema and session guards.
- Environment-variable template, provider interfaces and disabled-by-default paid integrations.
- Unit/integration/e2e scaffolding; reproducible local scripts.
- Error handling, basic logs, no secret leakage.
- Short architecture decision records for ORM, auth and production DB readiness.

Acceptance tests:

- [ ] Clean setup starts with documented commands on a new machine.
- [ ] Typecheck, lint and baseline automated tests pass.
- [ ] A database migration and reversible dev seed execute without errors.
- [ ] A protected route cannot be accessed by anonymous or wrong-role account.
- [ ] No network call to paid APIs occurs when integration flags are disabled.
- [ ] Test fixtures are unmistakably nonproduction.
- [ ] Source contains no hard-coded credentials; example env is safe.

Stop point: present screenshots/log summaries of working local skeleton and test output.

## 5. M0.5 — Interactive public experience

**16 November 2026 precedence amendment:** AGENTS.md, the UI/UX Brain and Decisions Addendum D6/D7 supersede the older shell list below. M0.5 excludes AI/Learn navigation and screens. It preserves M0 and adds a restricted local interactive PostgreSQL prototype with exactly ten fictional businesses, an idempotent/reversible seed, SQL-backed search/filter/feed/comparison, a development-only design gallery, honest future-feature shells, and four-width visual/accessibility evidence. No Google authorization, publishing, engagement/analytics or messaging backend is activated. Public production/staging excludes fictional records and shows an honest empty state until genuine authorized supply exists. Visual acceptance is still required before M1.

**Outcome:** Explore-first UX approved before deep integrations.

Deliver:

- Location selection (GPS permission + manual city/area) with permission-denied fallback.
- Public Explore, Search, Category, Business Profile, Feed, Compare, AI and Learn screen shells with complete navigation.
- Sign-in gate behavior preserved across attempted Message/Follow/Like action.
- Business Dashboard and admin shells, visually coherent but clearly empty/not configured.
- Design feels app-native on mobile and works on desktop.

Acceptance tests:

- [ ] Anonymous visitor selects Uyo manually and enters Explore without GPS.
- [ ] Denying location permission still permits manual selection.
- [ ] All major routes and back/forward/share navigation work; no dead-end CTA.
- [ ] Business cards and comparison are displayed with **labeled development fixtures** only in dev.
- [ ] Message/Follow/Like navigate to sign-in and return to intended action appropriately.
- [ ] Empty state and screen-reader/keyboard semantics are present.
- [ ] Mobile viewports and desktop have no major overflow or unusable controls.
- [ ] UI sign-off recorded before M1.

Stop point: ask for visual UX acceptance.

## 6. M1 — Google identity, owner onboarding and verification

**Outcome:** The first real authorized business can become a Jado-verified active profile, subject to API approval.

Deliver:

- Google Places business lookup using approved provider with controlled field mask/cost/error handling.
- Unique Google Place ID resolution, duplicate prevention and ownership dispute state.
- Google OAuth flow separate from generic sign-in.
- Verified access check against correct GBP location; no activation on OAuth sign-in alone.
- Claim assistance/recovery and pending application dashboard.
- Business activation state machine, Google/Jado source boundaries and user-appropriate attributions.
- Support escalation path and authorization revocation behavior.

Acceptance tests:

- [ ] A real owner-authorized test location reaches VERIFIED_ACTIVE through sanctioned API access.
- [ ] Wrong Google account, canceled OAuth, expired token, missing API approval and unverified location **cannot** gain owner privileges.
- [ ] Two simultaneous claims for same Place ID cannot create two active records.
- [ ] Pending applicant sees recovery instructions and can return to claim status.
- [ ] Jado cannot edit Google-controlled name/address/primary phone.
- [ ] Another logged-in user cannot access claimed business data.
- [ ] Admin claim/security actions produce audit records.
- [ ] Google display/storage/attribution requirements reviewed and implemented.

**Hard blocker:** If GBP API access has not been granted, M1 may pass local contract/unit tests but must be marked **externally blocked for real production verification**. It must **not** be marked production complete, nor replaced with a manual badge assignment without founder approval.

## 7. M2 — Business dashboard, profile, structured posts and Feed

**Outcome:** A verified owner can publish business content that consumers can discover.

Deliver:

- Owner-managed profile/brand kit, logo/media upload, secondary contacts/social links, products/service tags.
- Canonical profile URL, functional copy/share and QR generation.
- Typed post composer for Product/Service, Offer, New Arrival, Update, Event, Portfolio.
- Publish/edit/archive/expire and basic moderation.
- Public business pages and Feed using real verified Jado content and helpful empty states.
- Manual owner-controlled post entry; social automatic importing deferred.

Acceptance tests:

- [ ] Verified owner adds logo/colors/service tags and sees them on public profile.
- [ ] Changes to owner fields persist, while Google source fields cannot be edited.
- [ ] Owner creates each typed post; invalid dates, missing required type and bad media are rejected.
- [ ] Published product/service appears under correct verified business in Feed; expired offer no longer appears as current.
- [ ] Other businesses and anonymous visitors cannot edit the owner's posts.
- [ ] A share URL/QR opens correct public profile on another device/browser.
- [ ] Moderation hold removes reported post from appropriate public surfaces.

## 8. M3 — Search, ranking, comparisons and social engagement

**Outcome:** Jado supports meaningful business discovery and explainable choice.

Deliver:

- Search across business owner-supplied categories, products/services and structured posts; location filter.
- Explore sections: new businesses, latest offers, recent activity, most viewed and trending.
- Authenticated business follows and post likes; following-aware Feed.
- Basic visit/click metrics with deduplication/bot filtering and clear definitions.
- Compare 2–3 businesses with Google rating and review count *where legally/technically available*; unknown values remain unknown.
- Truthful source attribution and no fabricated newest-Google-review sort.

Acceptance tests:

- [ ] "Ring light in Uyo" finds a verified Uyo business with a matching product/offer but not an unrelated profile.
- [ ] No verified results produces honest empty state.
- [ ] Views counted under defined dedup rules; most viewed 7-day section changes after valid events.
- [ ] Anonymous user can compare; sign-in required to follow or like; duplicate follows/likes do not inflate counts.
- [ ] Comparison displays both rating average and review count and does not infer guaranteed quality.
- [ ] Expired offers and suspended businesses disappear from eligible search/ranking results.
- [ ] Organic ranking excludes paid manipulation; labels reveal sorting logic.

## 9. M4 — Customer/business messaging

**Outcome:** Signed-in customers can message businesses within Jado; owners can reply.

Deliver:

- Consumer inbox and owner inbox; conversation details and post-context deep links.
- Message send/reply/history, unread state, notifications and basic delivery-error UX.
- Rate limits, report/block and moderated support escalation; server authorization for every read/write.
- External WhatsApp, call and directions as secondary CTAs.
- Response-time stats only when enough actual Jado messages exist, with transparent window and definition.

Acceptance tests:

- [ ] Public user tapping Message is directed to login and returns to relevant business/message composer.
- [ ] Registered user sends message from offer; owner receives it; owner replies; user sees reply.
- [ ] A second customer cannot read, alter or enumerate first customer's private conversation.
- [ ] Messages cannot be sent to suspended/unavailable business; errors are honest.
- [ ] Reporting/blocking works and creates auditable moderation case.
- [ ] If insufficient data, "typical response time" is omitted.
- [ ] External contact links operate and are not mislabeled as Jado message delivery.

## 10. M5 — Grounded conversational Jado AI

**Outcome:** A bounded, useful AI recommends real Jado businesses and abstains honestly.

Deliver:

- Provider adapter, secure key handling, approval/budget gate and per-session quotas.
- Intent parser, typed Jado search/retrieval, grounded response generation, validation and business cards.
- Conversational clarification for ambiguous location, category and need.
- Honest zero-result and missing-data responses; user can continue with normal search.
- Monitoring, cost ledger, prompt-injection controls, model timeout and hard spend stop.

Acceptance tests:

- [ ] With provider approved/configured, ask "solar installer near Uyo" and return only eligible verified businesses with real Jado IDs.
- [ ] No Jado matches: response states insufficient coverage; AI cannot manufacture a store.
- [ ] Attempted prompt injection in malicious business post cannot override assistant policies or return fake candidates.
- [ ] Response cards link to existing business detail; claimed attributes match retrieved records.
- [ ] No API call if approval flag disabled or budget exhausted.
- [ ] Monthly budget cap and per-user limits are enforced server-side.
- [ ] UI distinguishes model offline from an actual generated recommendation.

**External blocker:** A working real AI MVP requires explicitly approved credentials/usage cost. Until then, complete adapter tests and mark live AI **blocked**, not delivered.

## 11. M6 — Learn and editorial

**Outcome:** Useful no-login owner education, eventually contributed by approved experts.

Deliver:

- Public Learn index/categories/article/related content and search.
- Article author, editorial review and publishing states.
- Admin/editor CMS with role checks; initial Webtellisense educational content.
- Optional later approved guest contributor workflow.

Acceptance tests:

- [ ] Anyone can browse Learn articles without login.
- [ ] Editors can draft/publish/archive; unauthorized owner cannot publish Learn material.
- [ ] Search/category filters work; article permalink remains stable.
- [ ] Draft/archived content is not exposed as published.
- [ ] Learn contains real approved educational content or clearly labeled beta placeholders.

## 12. M7 — Jado Pro and human audits

**Outcome:** A controlled, profitable human-led service delivered through Jado.

Preconditions: plan price, scope, audit cadence, staffing capacity, response SLA and payment terms signed off by founder.

Deliver:

- Plan selection and clearly bounded services; approved payment/billing or invoice workflow.
- Manual audit request, work order, staff assignment, evidence-based report and progress view.
- Owner/assigned account-manager private messaging with limits/service hours.
- Webtellisense lead handoff with owner knowledge/consent; admin status dashboard.

Acceptance tests:

- [ ] Owner sees exact scope and price before any payment.
- [ ] A real analyst submits a report with date, source, findings and actions; no automated fake health score.
- [ ] Owner receives and can view report; another owner cannot access it.
- [ ] Staff assignments and manager chat permissions remain scoped.
- [ ] Service quotas/SLA status correctly displayed.
- [ ] Financial operations tested in sandbox before real use; no unapproved chargeable integrations.

## 13. M8 — Growth and advanced capabilities

Not pre-approved for MVP. Candidate features to prioritize only from pilot evidence:

- Social imports and engagement analytics through approved official APIs.
- Post drafting AI for owners with human publishing approval.
- Meaningful badges/streaks for verified behavior, not pay-to-rank.
- Cross-city expansion, richer relevance signals and faster search.
- Push notifications, richer educational modules and contributor monetization.
- Native Android/iOS experiences only after mobile web validation.

## 14. Pilot campaign readiness and measurements

### Before Christmas Village outreach

- A shareable public Jado profile opens quickly on mobile.
- Assisted onboarding flow is understandable; Google-access recovery is clearly stated.
- A verified owner can publish one useful post and demonstrate working inbox.
- QR profile sharing works; admin can resolve reports and onboard applicants.
- Staff have consent-aware outreach pitch and short support instructions.

### Pilot dashboard (weekly)

| Metric | What counts | Why |
|---|---|---|
| Verified active businesses | Confirmed authorized owner management | Trust and real supply |
| Profiles with >=1 useful post | Actual business posts | Feed supply |
| Searches with at least one result | Real area/category matching | Market coverage |
| Profile-to-contact conversion | Message initiation or external contact click | Consumer intent |
| Business response rate | Replies to real Jado conversations | Merchant engagement |
| 7-day owner return | Returning owner activity | Retention |
| 7-day consumer return | Returning consumer activity | Habit |
| AI grounded/abstained | Correct support vs missing data | Reliability |

Goal of 100 verified businesses is ambitious, not a substitute for meaningful usage. A batch of dormant profiles is not marketplace success.

## 15. Handoff format after every milestone

Provide, in order:

1. **Outcome:** What end-to-end user workflow is now genuinely possible?
2. **Changed files/migrations:** What was created?
3. **Evidence:** Tests run, results, screenshots only when appropriate, example verified state.
4. **Limitations:** Stubs, external blockers, unapproved costs, missing integrations.
5. **Security/data notes:** Authorizations and source-right boundaries touched.
6. **Acceptance checklist:** Each checked/unchecked with reason.
7. **Next:** One recommended next milestone; stop pending instruction.

Never report "done" for a milestone that fails its stated live acceptance gate.
