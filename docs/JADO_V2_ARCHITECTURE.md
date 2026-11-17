# Jado v2 — Technical Architecture and Data Contracts

**Status:** Engineering baseline proposal. Founder product decisions are fixed; unspecified provider choices and costs require milestone verification.  
**Date:** 15 November 2026  
**Companions:** JADO_V2_MASTER_PRD.md, JADO_V2_SCREEN_MAP.md

## 1. Constraints and technology direction

- New project; do not refactor the discarded website-audit prototype into this system.
- Next.js App Router, TypeScript, mobile-first responsive frontend; local development first.
- SQLite for local development, PostgreSQL as the proposed production relational database; migration readiness is a required gate. Use one well-supported ORM and explicit migrations (candidate: Prisma; confirm supported versions in M0).
- Server-authorized APIs/handlers; never rely on client-side role checks for security.
- Zero paid development services or API requests unless Ephraim expressly approves spend.
- Google Places/Business Profile, social integrations, AI, email and object storage must have replaceable adapters so absent external credentials do not break local nonintegrated flows.
- At launch, GBP API approval and authorized ownership validation may be a **hard launch gate** because founder rules prohibit activating profiles without it. Implement honest pending states; don't silently use weak evidence.
- PWA installability is optional later. No native app delivery in beta.
- A browser location *selection* is required for local results, but GPS permission is not.

## 2. Logical components

### Frontend

1. Public Explore, Feed, Compare, AI, Learn, business profile and post pages.
2. Authenticated consumer account and messaging.
3. Business onboarding and owner dashboard.
4. Staff administration and eventual Pro workbench.

### Backend services/modules (initially within modular Next.js backend)

- Auth & RBAC
- Business records, Google ID matching and source attribution
- Google Places read adapter
- GBP OAuth, profile membership and approved access verification adapter
- Owner claims/disputes and activation state machine
- Jado-authored content/media management
- Location-aware discovery/search/compare
- Follows, reactions, view events and trending aggregation
- Messaging/notifications/moderation
- AI retrieval/orchestration with hard budget limits
- Learn editorial content
- Admin audit events
- Future Pro service orders/reports/payments

Keep domain modules independent enough to extract later, but do not create premature microservices.

## 3. Source-of-truth rules — critical

| Field | Source of truth | Editable inside Jado? | Persistence approach |
|---|---|---|---|
| Google Place ID | Google | No | Stable identifier, retained per Google policies |
| Google name/address/primary phone/hours | Google via permitted API | No | Fetch or cache only as allowed, with Google attribution |
| Google rating/review count/review text | Google | No | Compliant read/display; not Jado user reviews |
| Google photo references | Google | No | Render according to photo API and attribution terms; no arbitrary permanent copying |
| Logo / own supplementary images | Owner | Yes | Original owner-uploaded licensed files |
| Extra phone/WhatsApp/social links | Owner | Yes | Jado database |
| Business product/service classification | Jado + owner | Yes | Jado database |
| Offers/posts, product descriptions | Owner | Yes | Jado database |
| Verified management relationship | GBP authorized membership evidence | No direct manual override | Protected verification state with audit log |
| Jado views/follows/messages | Jado | Event-sourced/operational | Jado database and aggregate tables |
| Pro audit findings | Human Webtellisense analyst | Role-limited | Jado database/object storage |

Google Places policies restrict long-term caching, copying and independently indexing Google data; do not architect an unlicensed cloned Google directory. Owner-authored business information can be maintained separately after explicit owner submission, but make sure it is genuinely owner-supplied rather than a disguised bulk copy of Google content.

**Public display approach:** Jado stores only activated, owner-authorized profile/membership and Jado-owned data for its internal discovery index. Refresh relevant Google fields on compliant reads. Display missing Google fields as unavailable; the Jado page remains useful through owner-created products, photos and posts.

**Important distinction:** Google Sign-In verifies the user's Google identity. Jado can only verify management rights by evaluating actual permitted GBP access to the matching location and its verified state. Never equate the two.

## 4. Core data model

Tables/entities, with suggested fields. M0 should finalize constraints, indices, retention and migrations before dependent features.

### Identity and business

| Entity | Essential fields |
|---|---|
| User | id, primary auth identity, email/verification status, name, created_at, account_state |
| UserLocationPreference | user_id or temporary session, area/city, optional approximate coordinates, selected_at |
| Business | id, google_place_id UNIQUE, slug UNIQUE, status, jado_category_id, created_at, activated_at |
| BusinessProfile | business_id, owner-supplied description, logo_media_id, tagline, optional extra_contacts, website_override_policy, service_area, brand_kit_id |
| BusinessMembership | user_id, business_id, role, status, granted_at, revoked_at; UNIQUE appropriate relation |
| BusinessClaim | id, business_id/place_id, applicant_user_id, selected_google_account_ref, status, access_evidence_reference, created_at, updated_at |
| GoogleAuthorization | id, user_id, Google external account ID, encrypted token reference, approved scopes, expiry, revoked_at |
| VerificationEvent | claim_id, method, matching location ID, verified_location_state, decision, approved_at, actor, evidence_pointer |
| ClaimSupportCase | claim_id, type, reason, owner communications, resolution, audit timestamps |
| BrandKit | business_id, logo/media, palette, tagline, tone/voice, optional font fields |
| BusinessMedia | id, business_id, owned_upload_key, rights_confirmed, alt_text, type, status |
| Category | id, name, slug, parent_id, visibility |
| BusinessTag | business_id, tag_id |

Prefer opaque internal IDs; business slugs may change, so links resolve by stable ID or maintained redirect.

### Feed/search and social

| Entity | Essential fields |
|---|---|
| BusinessPost | id, business_id, author_user_id, type ENUM, title, description, status, published_at, expiry_at, edited_at |
| PostStructuredData | post_id, price, currency, offer_start/end, event_start/end/location, product/service tags, CTA type |
| PostMedia | post_id, media_id, position |
| Follow | user_id, business_id UNIQUE, created_at |
| PostLike | user_id, post_id UNIQUE, created_at |
| ViewEvent | actor_key/privacy-safe anonymous key, business_id, session_id, timestamp, bot_filter flags, source |
| BusinessMetricDaily | business_id, date, unique_approx_views, profile_contacts, follows, posts, inquiries |
| FeaturedPlacement | business_id, start/end, clearly labelled, type and approved operator (later) |

Avoid indefinite raw IP address retention. Distinct view counts need documented, privacy-conscious deduplication.

### Messaging

| Entity | Essential fields |
|---|---|
| Conversation | id, consumer_user_id, business_id, contextual_post_id optional, created_at, last_message_at, status |
| Message | id, conversation_id, sender_user_id, body, created_at, delivery_state, moderation_state |
| ConversationRead | conversation_id, user_id, last_read_at |
| MessageReport | reporter_user_id, message/conversation_id, reason, created_at, status |
| Block | actor_user_id/business_id, subject_user_id, scope, created_at |
| Notification | recipient_user_id, type, reference_id, created_at, read_at, delivery_status |

Do not mix consumer/business conversations and private paid account-manager advice in the same authorization namespace; future ProConversation and ProMessage can share primitives but require separate access control.

### AI, Learn, Pro, admin

| Entity | Essential fields |
|---|---|
| AiRequestLog | user/session key, requested_area, request_type, model/provider, token and estimated cost, outcome, latency, safe redacted log |
| AiBudgetLedger | budget_period, provider, spent_usd, limit_usd, paused_at |
| LearnArticle | id, slug, title, content, topic/category, author_id, review_state, published_at, updated_at |
| LearnContributor | user_id, editorial_permissions, approval_status |
| ProPlan | id, name, service_limits, billing_state, active flag |
| ProSubscription | business_id, plan_id, state, period and billing references |
| AuditWorkOrder | business_id, service_type, assigned_staff, status, due_date, created_at |
| AuditReport | work_order_id, evidence/media, findings JSON, summary, reviewed_by, published_at |
| ProConversation | business_id, assigned_staff, service-period access, status |
| SupportTicket | actor, business_id optional, case_type, status, assigned_staff |
| AuditLog | actor_id, entity, entity_id, action, old/new state pointers, timestamp, reason |

## 5. State machines

### Business claim and activation

1. DRAFT — owner starts application, Google match chosen.
2. GOOGLE_AUTH_PENDING — user consent needed.
3. GBP_ACCESS_CHECK — app checks OAuth scope, matching verified location and authorization.
4. PENDING_ACCESS_RECOVERY — correct GBP manager/owner access not available; link to Google recovery and support.
5. VERIFIED_ACTIVE — positive authorization and matching unique Place ID established.
6. DISPUTED — conflicting claim or lost authorization, privileged editing halted.
7. SUSPENDED — fraud/abuse/manual admin with audit.
8. CLOSED — rejected/withdrawn application.

No state transition directly from a Google place lookup to VERIFIED_ACTIVE. Google API failure must not be treated as successful verification. An operator cannot simply check a box to bypass the founder's chosen GBP authorization requirement.

### Posts

DRAFT → PUBLISHED → (EDITED | EXPIRED | ARCHIVED | MODERATION_HOLD | REMOVED).

Expired offers should stay navigable as expired, unless owner archives/removes them. Do not surface expired offers as active bargains.

### Messages

OPEN → USER_BLOCKED/BUSINESS_BLOCKED/CLOSED; messages are authored by an authenticated participant only. Server validates membership in the conversation on every read and write.

## 6. API and route contracts (illustrative; finalize in M0)

### Public reads

- GET /api/explore?area=&category=&sort=&cursor=
- GET /api/search?q=&area=&category=&cursor=
- GET /api/businesses/:id
- GET /api/businesses/:id/posts
- GET /api/posts/:id
- GET /api/compare?ids=...
- GET /api/learn and GET /api/learn/:slug
- POST /api/ai/ask (rate limited; no successful response if live AI inactive)

### Authenticated consumer

- POST/DELETE /api/businesses/:id/follow
- POST/DELETE /api/posts/:id/like
- GET/POST /api/conversations
- GET/POST /api/conversations/:id/messages
- POST /api/messages/:id/report
- GET/POST /api/me/location-preference

### Business owner

- POST /api/claims/search-google
- POST /api/claims/choose-business
- GET /api/google/oauth/start and GET /api/google/oauth/callback
- POST /api/claims/:id/verify-manager-access
- GET /api/claims/:id/status
- PATCH /api/owner/businesses/:id/profile (Jado fields only)
- GET/POST /api/owner/businesses/:id/posts
- PATCH /api/owner/posts/:id
- GET /api/owner/businesses/:id/analytics
- GET /api/owner/businesses/:id/conversations
- GET /api/owner/businesses/:id/qr

### Admin

- GET/PATCH /api/admin/claims/:id
- GET/PATCH /api/admin/businesses/:id
- GET/PATCH /api/admin/reports/:id
- GET/PATCH /api/admin/posts/:id/moderation
- GET/POST/PATCH /api/admin/learn
- GET /api/admin/metrics

All mutating endpoints require CSRF-aware authentication/session checks and server-side authorization. Never expose Google/AI API keys in browser bundles. Validation is schema-based, inputs escaped, uploads checked for type/size, and mutations logged.

## 7. Search, recommendation and ranking logic

### MVP deterministic retrieval

Search owner-managed business categories, services, product/offer posts, normalized descriptions, city/area and Jado profile tags. Do not treat a phrase in a post as proof of stock/availability. Give businesses equal organic eligibility when query-relevant.

### Explore ranking sections

Separate index queries rather than inventing one opaque universal score:

- **Newest:** activated_at DESC.
- **Latest offers:** valid published offer date DESC; expired omitted.
- **Recently active:** last qualifying Jado post time DESC.
- **Most viewed:** privacy-respecting deduped Jado views during selected window, bot-filtered.
- **Trending:** bounded combination of recent unique views, qualified follows and contact inquiries; anti-gaming caps, recency decay and clear label.
- **Highly reviewed:** Google rating plus total review count as visible signals, not a trust guarantee; source attribution required.
- **Following:** posts from followed verified businesses.

Do not build a global latest-Google-reviews sort: public Places New serves only a small selection of relevant reviews, not a complete chronological log.

### Comparison

Facts side-by-side, reasoned qualifiers, unknowns displayed. If implementing a confidence-adjusted rating later, publish methodology, sampling assumptions and weights. No business can pay to improve an organic position.

## 8. AI execution design

Pipeline:

1. Authenticate/rate-limit session or anonymous request as appropriate.
2. Resolve selected user area. Parse intent into typed query; do not assert the GPS physical position if only manual area selected.
3. Retrieve eligible, owner-verified candidates from **Jado database** via a bounded server-side search tool.
4. Send only authorized, redacted candidate data to model provider; mark descriptions and posts as untrusted third-party content.
5. Require constrained structured answer: candidate IDs, matched attributes, evidence, uncertainty, follow-up prompt.
6. Server independently validates returned IDs and claims; reject fabricated entries, unsupported price/review/stock.
7. Render linked business cards and an honest explanatory summary; provide "we don't have enough information" where necessary.
8. Record cost, latency, errors and user feedback without unnecessarily retaining sensitive raw prompts.

**Budget hard stop:** Provider disabled by default. Activation only after explicit founder approval, with capped daily/total budgets and monthly ~USD 30 maximum; admin pause control and no background requests that can run away. If budget exhausted or model unavailable, return typed "AI_UNAVAILABLE" while ordinary search remains functional.

Do not call the deterministic search fallback "AI" if it did not use AI. No unauthorized local model installation or hidden model billing.

## 9. Integrations and boundaries

### Google Places (New)

Use approved search/details/photo methods and field masks to minimize paid fields. Google Place ID is allowed as a persistent key subject to provider policies. Respect logo, map, review and third-party attribution. Do not scrape Google Maps. Public business fields are available only when provider permits.

### Google Business Profile APIs

App/provider approval and correct OAuth scopes required. Check current user-accessible verified locations and match to selected Google Place ID. Provide recovery when business belongs to a different Google account. Never ask the owner for their password or silently access agency-held profiles. Refresh authorization, revoke tokens on disconnect and handle loss of access.

### Social

MVP = profile links plus owner-uploaded/original Jado posts. Importing historic Facebook/Instagram/TikTok/LinkedIn posts requires official platform authorization, rights handling and a separate milestone; no scraping or invented engagement.

### Notifications

Start with in-app notification rows; optional email/push provider after credentials, usage and cost approval. Messaging delivery must not rely solely on push.

### Media

Locally simulate upload during development; production needs secure managed object storage approved and configured. Use signed upload flows, MIME/type/size validation, metadata/rights attestation, resizing when safe and orphan cleanup.

### Pro payments

Do not select a chargeable provider, invent price or collect real money until founder approves the plan and terms. Implement status/UI skeleton only if needed for later Pro milestone.

## 10. Security, compliance and operational practices

- Separate authentication, authorization and verified GBP management access.
- Role scopes per business and per staff function; row-level ownership checks on all data access.
- Rate-limit signups, AI, claims, post publishing and messages; anti-abuse heuristics are explainable.
- Sanitize user-generated content; image rights attestation and reporting; no executable HTML in posts.
- Encrypt/restrict third-party OAuth tokens; avoid storing user credentials or screenshots of business profiles.
- Protect message privacy; admin review only within audited support/report cases and appropriate policy.
- Data retention, deletion/export, breach-response and privacy notice reviewed against Nigerian Data Protection Act.
- Production operational dashboards for API latency, errors, Google quota/billing, AI spend, failed claims and message delivery.
- Structured logs with correlation IDs but no secret tokens or unnecessary personal location history.
- Public content has SEO-compatible metadata, sitemap for Jado-owned pages, canonical URLs and appropriate robots directives. Do not clone prohibited Google material for indexing.

## 11. Local setup, environment and test conventions

Proposed repo folders:

- app/ — routes/layouts
- components/ — shared UI and accessible controls
- features/ — explore, profiles, feed, compare, messages, ai, learn, admin
- server/ — domain services, authorization and integrations
- db/ — ORM schema, migrations, seeds
- lib/ — cross-cutting validated utilities
- tests/ — unit/integration/e2e
- docs/ — decisions, release notes, known blockers

Environment variables documented in a checked-in example with **no secrets**. In-memory/demo adapters must be explicitly labeled and never silently used for production verification or reviews.

Tests:

- Unit: search normalization, rank windows, comparability, authorization predicates, post expiry, response-time estimation.
- Integration: database ownership and unique Place ID, message permissions, draft moderation, budget hard-stop, Google adapter errors.
- E2E: anonymous browse; manual location; auth gate; claim pending; verified success with test fixture; post and search; compare; send/reply message; AI grounded/abstain.
- Contract: every Google/AI provider response validation.
- Accessibility/mobile: small viewport, touch, screen-reader labels, keyboard navigation, reduced motion.

## 12. Design decisions pending M0 verification (not permission to invent)

1. ORM and auth framework versions compatible with the installed environment.
2. Production Postgres provider, media store, deployment platform and their allowed costs.
3. Approval and quotas for Google Places/Business Profile APIs.
4. Auth method for consumer sign-in (Google/email), delivery mechanism for notifications and account recovery.
5. AI provider/model selection, approved active budget and quota policy.
6. Domain name, public support/contact email, privacy/terms copy and optional brand assets.

If external provider approval blocks implementation, build isolated adapters, honest pending states and deterministic tests; do not claim the end-to-end production integration works.

## 13. Technical primary-source references

- https://developers.google.com/maps/documentation/places/web-service/policies
- https://developers.google.com/maps/documentation/places/web-service/place-details
- https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
- https://developers.google.com/my-business/content/basic-setup
- https://developers.google.com/my-business/content/implement-oauth
- https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
- https://support.google.com/business/answer/4566671
- https://support.google.com/business/answer/3403100
- https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- https://ndpc.gov.ng/wp-content/uploads/2024/03/Nigeria_Data_Protection_Act_2023.pdf

## 14. M2.5 approved architecture

17 November 2026: [M25_APPROVED_CONTRACT.md](M25_APPROVED_CONTRACT.md) records the founder-approved scope, policy corrections, slice gates and identity fallback addition. It supersedes conflicting Places-first onboarding, unconditional Place ID, private-draft restrictions and fixture gating rules above. M0.5 is accepted. Preserve its visual design and fixture logos. Slice 1 is accepted at a196a09; Slice 2 only is now authorised. No Slice 3, M3, shared database write, deployment or M2.5 staging/main merge is authorised.

### Slice 2 provider boundary

`server/gbp` contains the real HTTP adapter, versioned encrypted vault, OAuth state service and private canonical verification service. Migration 0004 adds `gbp_connections`, `gbp_oauth_states`, per-applicant connection grants and selected canonical location relationships, extending existing business/proof tables additively. Better Auth tables are not GBP credential storage. Fresh normalized Google identity data is request-scoped/no-store, not a persisted public projection. See [Slice 2 configuration and ownership contract](M25_SLICE2_CONFIGURATION.md). Pending API access is the default; there is no runtime test provider. Explicit OAuth revocation remains possible after quota access is disabled; unsafe shared-primary disconnects are denied. Scheduled verification, public supply, governance and uploads remain later slices.
