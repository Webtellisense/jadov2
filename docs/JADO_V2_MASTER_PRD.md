# Jado v2 — Master Product Requirements Document

**Status:** Founder-approved product direction; implementation design subject to milestone gates  
**Version:** 2.0 handoff draft, 15 November 2026  
**Owner:** Webtellisense Consult  
**Initial market:** Uyo, Akwa Ibom, Nigeria  
**Platform:** Mobile-first web application; native apps are not part of the pilot  
**Pilot objective:** Target 100 owner-verified, usable business profiles by 31 December 2026  
**Primary principle:** Discover, compare, connect; simplify what businesses already do elsewhere.

## 1. Executive decision record

This document supersedes the earlier Jado AI-first website-auditing prototype as the **product-direction source of truth**. The November 2026 Jado v1 vision remains supporting context. Jado is now principally a verified local-business discovery, structured commercial feed, comparison, messaging, and business-growth platform.

Founder decisions:

1. Public visitors can explore without an account; meaningful interactions such as messaging, following, and post likes require authentication.
2. Discover/Explore and Feed are the public core, not a website-audit landing page.
3. All industries may qualify if their business has an existing Google Business Profile. Recruitment starts with solar installers in Uyo and expands across other sectors.
4. Only appropriately **owner-authorized** Jado businesses become activated, publicly verified Jado profiles. Google search matching or generic Google login is insufficient proof of authority.
5. A business's Google-derived name, address, primary phone, hours, rating, and reviews remain controlled by Google. Jado has separate owner-editable supplementary data.
6. Jado neither solicits nor hosts its own customer reviews; link customers to Google if they want to review.
7. Business content is structured by commercial purpose. It is not an unrestricted personal-status feed.
8. Jado-to-business messaging is the primary contact action. Call, WhatsApp, directions, and social links are alternatives.
9. Customer-facing conversational AI search/recommendations should be a **limited but real** capability in the initial launch; it must retrieve only real, verified Jado records and abstain when evidence is insufficient.
10. A location context is required for local discovery, but browser GPS permission is optional: a user may manually select a city or area.
11. Learn is a permanent product module, introduced first as editorial business-education content and expanded later.
12. Jado Pro initially provides **human-delivered** website, social, branding, and business-growth audits and account-manager messaging, not unreliable automatic audits.
13. The previous prototype will not be the development base. Start a fresh project.
14. Development spending is zero until explicitly approved. Cloud AI is subject to a configurable approximately USD 30/month ceiling once activated; third-party billing is not silently authorized.

**Terminology:** A "Google-listed business" exists on Google. A "Jado-verified business" has passed Jado's explicit proof-of-management gate. Verification proves authorized control; it **does not** guarantee service quality, regulatory licensing, or trustworthiness. The public must see this distinction.

## 2. Product positioning

### Consumer promise

Find relevant verified businesses nearby, inspect current products and offers, compare available evidence, and start a conversation.

### Business-owner promise

Make the existing business easier to discover and choose: reuse Google-established identity, showcase products and updates in a searchable format, receive intent-led customer inquiries, see Jado-specific engagement, and access optional support.

### Early sales language

Do not promise instant customers or claim Jado already has significant traffic. Say: "Join Uyo's growing directory of owner-verified businesses, publish what you sell, receive inquiries and share a Jado profile. We're inviting our first businesses for free and will improve the platform from their feedback."

### Position not claimed

Jado does **not** claim to be the first directory, first business feed, first AI local search tool, or first comparison platform. The commercial hypothesis is that their integration into a low-friction, locally active and transparent experience creates more value than disconnected tools.

## 3. Product goals and explicit non-goals

### Pilot goals

- Prove a complete **search → inspect → compare → message** consumer path.
- Prove a complete **Google match → authorized ownership → usable profile → first post → first inquiry** owner path.
- Obtain 100 *target*, not promised, verified, active business profiles by 31 December 2026; each should ideally have one commercial post and working contact channel.
- Measure actual business inquiries and repeat activity, not registrations alone.
- Keep a working public beta discoverable on mobile browsers by Christmas campaign timing, subject to Google/API gates.
- Validate what owners and customers value through interviews and measurable behavior.

### Out of scope for initial public beta

- Native iOS/Android builds; unrestricted general-purpose social networking.
- Jado-authored customer star ratings or reviews.
- Ecommerce checkout, Jado-mediated consumer purchases, bookings, escrow, or delivery.
- Automatic social publishing/synchronization without approved API scope.
- Automated technical audits or invented SEO/PageSpeed scores.
- Full owner-facing AI agents, automatic business recommendations published without evidence.
- Cash prizes, pay-to-rank, and unlabelled promotional ranking boosts.
- Unlimited Pro support and claims of guaranteed leads.

## 4. Users and permissions

| Actor | Anonymous browse | Message business | Publish business posts | Audit operations | Admin |
|---|---|---|---|---|---|
| Public visitor | Yes, after location choice | No | No | No | No |
| Registered consumer | Yes | Yes | No | No | No |
| Owner applicant, pending | Yes | As consumer | No | No | No |
| Verified business manager | Yes | Yes | Yes for authorized business | Submit Pro requests | No |
| Webtellisense account manager | Role-specific | Assigned client conversations | No unless explicitly delegated | Assigned audits/reports | Limited |
| Moderator | Yes | Support-only access as authorized | Moderate | No | Moderation |
| Platform admin | Yes | Audited support access | Manage abuse | Assign/manage work | Full role-specific |

One person may simultaneously be a consumer and an owner of multiple businesses. Business privileges are tied to explicit active memberships, not just a global "owner" role.

## 5. Primary journeys

### Consumer discovery

1. Opens Jado; selects current GPS location **or** city/area. Does not need an account.
2. Sees Explore: searchable Jado-verified businesses; categories; latest offers; recent activity; trending and most-viewed sections with clear ranking labels.
3. Searches "ring light", "solar installer", or "restaurant" within selected location.
4. Results search **business profiles, services/products, and tagged structured posts**; only active Jado-verified records are eligible.
5. Opens profile; sees Google-attributed business details and ratings where allowed, owner content, verified-control explanation, and available contact routes.
6. Optionally selects two or three comparable businesses; reads fact-based comparison with unknowns shown as unknown.
7. Taps "Message on Jado"; signs in if needed; sends message, receives response and notification.
8. Can follow a business or like a post when signed in; feeds later prioritize followed businesses.

### Business onboarding

1. Owner registers/signs in and chooses "Add my business."
2. Searches Google and selects correct match; persist only identifiers and information permitted by relevant Google terms.
3. Google Business Profile authorization is requested. Jado must verify the signed-in Google account has acceptable access to the selected **verified** Business Profile location, using approved APIs.
4. If authorized, activate one unique Jado record per Google Place ID. Prevent a second active claim. Manage branch profiles according to unique Google IDs.
5. If owner lacks access, present "Recover/Request access" guide and support; save application as **pending**, but do not activate owner privileges or display a verified badge.
6. Owner uploads Jado logo/brand kit, extra photos, optional extra contact details, service/product tags, WhatsApp/social URLs, service areas and first post.
7. Owner can share the Jado profile URL or download its QR code.
8. Owner receives inbox notifications and sees a basic dashboard.

### Owner content and growth

1. Chooses type of structured post, supplies necessary fields and uploads permitted imagery.
2. Publishes a truthful business-related post; platform indexes title, description, categories, product/service tags, geographic context and any declared price.
3. Owner sees Jado views, follows, post engagement and conversation counts with clear definitions.
4. Owner sees relevant competitor comparisons **only where evidence is comparable**.
5. May read Learn content, or later purchase Jado Pro assistance.

### Pro service

1. Owner requests a clearly scoped plan or audit.
2. System creates work order, assignment, due date and finite deliverables.
3. Webtellisense analyst performs human website/social/branding review using stated methodology.
4. Owner receives report with findings, evidence, priority, actionable recommendations and next-review date.
5. Owner can message assigned manager asynchronously, subject to plan limits and service hours.
6. Pro financial details, SLA, billing implementation and exact audit cadence are **not founder-approved** and must be confirmed before activation.

## 6. Detailed functional requirements

### EXP — Explore and discovery

- EXP-01 Public Explore page with Search, Feed, Compare, Learn, Account/Business navigation; desktop layout is usable, mobile navigation feels app-native.
- EXP-02 Require an initial **selected area**, not precise GPS permission; allow changing it at any time and searching other areas.
- EXP-03 Search normalized business name, owner-supplied products/services, category, tags, descriptions and structured posts; avoid returning false inventory claims.
- EXP-04 Filter location, category, relevant offers and business status; optional distance when coordinates legitimately available.
- EXP-05 Sections: New on Jado, Recent Offers, Recently Active, Most Viewed (e.g. past 7/30 days), Trending, Highly Reviewed, and Following for registered users.
- EXP-06 A sorting/filter label must reveal the reason (e.g. "Most viewed on Jado in 7 days") and distinguish popularity from quality.
- EXP-07 Do not ship platform-wide "most recently Google-reviewed" ordering unless a permitted, reliably chronological source is confirmed.
- EXP-08 Paid featured placements, if later introduced, must be visibly marked and kept separate from organic quality/comparison scores.
- EXP-09 Display an honest empty state and next-step suggestions when Jado has no verified businesses for query/area.

### BUS — Business profiles, Google identity and verification

- BUS-01 Each active Jado business has one unique Google Place ID; collisions create a dispute/pending state, not duplicate public records.
- BUS-02 Google-controlled fields: business name, address, primary phone where available, operating hours, primary category where available, Google rating/review count and applicable Google photos; these are read-only within Jado and refresh only through approved methods.
- BUS-03 Jado-controlled fields: logo, brand colors, tagline, owner descriptions, secondary numbers, social handles/links, additional original photos, products/services, offers, portfolio and display preferences.
- BUS-04 Allow a profile with no website; missing website is never automatically evidence of poor quality.
- BUS-05 Show source, attribution, "last refreshed" where appropriate, and "Unavailable" if data absent; never invent Google photo, logo, review, phone or price.
- BUS-06 Show *Jado owner-verified* badge only after authorized management rights verified through permitted Google APIs; Google sign-in alone never earns badge.
- BUS-07 Pending onboarding supports access recovery, admin contact, retry and application status; protected publishing unavailable until verified.
- BUS-08 Claim dispute suspends dangerous writes, preserves audit history and provides support resolution workflow.
- BUS-09 Generate durable canonical public URLs and QR code assets that encode those URLs; support one-tap sharing.
- BUS-10 Google-dependent fields must not be independently stored/indexed contrary to Google terms. Maintain clean source separation and attribution.

### FEE — Structured business feed

- FEE-01 Post type is required: Product/Service, Offer/Promotion, New Arrival, Business Update, Event, or Portfolio/Completed Work.
- FEE-02 Common fields: business ID, author, type, title, description, media, timestamps, moderation status and tags.
- FEE-03 Typed fields: price/currency optional for Product; start/end date for Offer; event date/location for Event; service and project description for Portfolio; expiry enforced when set.
- FEE-04 Limit content to genuine commercial/business updates. Personal diaries, unrelated politics/spam, stolen imagery and misleading offers are subject to moderation.
- FEE-05 Owner can create, edit, archive and remove own posts; audit trail retained for moderation.
- FEE-06 Public Feed sorted by recent eligible posts, relevance and (once useful) followed businesses; do not use manipulated engagement as evidence of service quality.
- FEE-07 Initial external social support = owner-provided links and optional owner-controlled manual reposting with rights; direct Facebook/Instagram/TikTok/LinkedIn importing needs separate permission and integration gate.
- FEE-08 Signed-in users can like/unlike posts; owners can view authentic like counts. Business following is separate from post likes.

### CMP — Compare

- CMP-01 Compare 2–3 businesses of a comparable class/area.
- CMP-02 Explainable dimensions: Google average rating **with review volume**, verification, opening hours, owner-supplied product/service availability, recent Jado post activity, available price, distance where appropriate and Jado messaging responsiveness when enough data exists.
- CMP-03 Do not conclude a business with 5 ratings at 5.0 is automatically better than one with hundreds at 4.2; show sample size and uncertainty.
- CMP-04 Explicitly display unknown/missing/not-comparable values. Review count is not equivalent to verified service quality.
- CMP-05 A candidate "better" summary must be attributed to specific user-selected dimensions, not universal superiority.
- CMP-06 Owner view may compare 2–3 competing verified businesses and see actionable factual gaps, without accessing their private analytics.

### MES — Messaging and notifications

- MES-01 Sign-in required to initiate messaging; public browsing remains open.
- MES-02 Single customer-to-business conversation per relevant thread/context; multiple messages and read/unread states supported.
- MES-03 Business dashboard inbox, conversation list, basic attachments **later**; message text and support/report features at launch.
- MES-04 Basic notifications in-app at launch; email/push subject to separately approved provider and deliverability testing.
- MES-05 Rate limiting, spam flags, blocking, moderation escalation and role-scoped access required.
- MES-06 Optional typical first response time uses actual Jado messages over a defined window and minimum sample. Do not infer external WhatsApp/Instagram response time.
- MES-07 Secondary contact actions: WhatsApp, call, directions, relevant social channels; log click events without claiming a completed sale.

### SOC — Follows, engagement, activity ranking

- SOC-01 Follow/unfollow requires account; feed may emphasize followed businesses.
- SOC-02 Post likes require account; no separate Jado business-review or star-rating feature.
- SOC-03 Track Jado profile views using privacy-conscious events, duplicate suppression and bot filtering.
- SOC-04 Popularity windows 7-day/30-day/all-time can be introduced progressively, always labeled.
- SOC-05 Rankings and recommendations must disclose key factors, distinguish organic from sponsored and avoid being permanently dominated by historic views.

### AI — Customer-facing launch AI

- AI-01 Conversational assistant understands request, relevant city/area and optional constraints.
- AI-02 Retrieve candidate records **only** from active Jado-verified businesses and their permitted/owner-supplied data; do not generate arbitrary business names or silently fetch external listings.
- AI-03 Results show real business cards, links, evidence signals and explicit unknowns; never fabricate ratings, prices, opening hours, inventory or availability.
- AI-04 When no supported match: say Jado does not yet have sufficient information and offer search adjustments (area/category) or return later.
- AI-05 Clarify ambiguity before recommending when critical fields such as destination area are absent; respect visitor-selected location.
- AI-06 Tool/citation grounding, prompt-injection resistance for untrusted business text, safe output and logging/redaction.
- AI-07 Spend controls: provider adapter, per-user/session quota, maximum output, timeouts, server-side keys, budget dashboard and hard stop; no paid calls before founder approval.
- AI-08 If no approved AI budget/provider, expose explicitly unavailable/beta state or an accurately labeled deterministic search assistant; do **not** present simulated generated answers as a real AI feature.
- AI-09 Owner-facing AI content drafting is later phase, with explicit owner approval prior to publishing.

### LRN — Learn

- LRN-01 Read-only public knowledge centre for SEO, Google Business Profile, branding, social content, customer acquisition, conversion, growth and basic business operations.
- LRN-02 Categories, browse/search, article/lesson page, relevant next-lesson suggestions.
- LRN-03 Admin/editor can create drafts, review, publish and archive articles; editorial permissions are distinct from business posting.
- LRN-04 Later: approved external experts/contributors, tutorials/series, business-gap-linked lessons, reading progress; no unmoderated guest publication.
- LRN-05 Content can link to Webtellisense expertise with transparent commercial labeling.

### PRO — Expert services

- PRO-01 Paid plan concept: finite manual website, social, branding and business-growth audits; no "automated audit" claim.
- PRO-02 Work orders, assigned staff, report templates, prioritized findings, evidence, completion status, owner dashboard delivery.
- PRO-03 Owner-to-assigned-account-manager asynchronous chat distinct from consumer/business inbox.
- PRO-04 Review cadence, price, workload limits, messaging SLA, refunds and payment provider remain TBD until validated and founder approved.
- PRO-05 Webtellisense CRM lead handoff captures consent, business, issue, service category and source; do not automatically contact owners with unsolicited sales messages.

### ADM — Admin/support

- ADM-01 Role-based business claims, statuses, disputes, reports and account suspensions.
- ADM-02 Moderate structured posts, images and reported conversations.
- ADM-03 Manage categories, featured editorial selections, Learn content, owner invitations, service requests and assignments.
- ADM-04 Metrics: application-to-verified conversion, time to activate, active businesses, search-to-profile, profile-to-contact, first reply, repeat owner posting, customer return, AI usage and errors.
- ADM-05 Staff access to private messages limited to report handling or explicit support workflow, logged and auditable.
- ADM-06 Protected audit log for state changes, authentication/verification, security actions and Google integration failures.

## 7. Business data and review semantics

Do not assume an owner who appears on Google possesses management access. Distinguish: Google-listed, Jado-pending, Jado-verified, suspended, disputed. An owner may manage multiple branch locations, each with its own Google ID.

Google Places (New) supports name, address, phone, ratings, review count and photo references where present, but its review text selection is capped and sorted by relevance; it cannot support a globally comprehensive "newest Google review" feed. Google Business Profile API may access fuller reviews for explicitly authorized verified locations, subject to approvals and terms. Do not silently copy/scrape Google business data into a permanent independent directory. See Architecture reference section.

## 8. User experience principles

- Mobile-first web app with responsive desktop screens; installable PWA may come later.
- Inspired by familiar app interaction patterns, without copying proprietary app designs.
- A visitor gets to useful verified businesses in minimal steps; only selected location needed to start.
- Location may be device GPS **or** manual city/area; allow later changes and searches elsewhere.
- Show clear reasons for organic order, freshness and missing information.
- In-app prompts must be plain-language and accessible to nontechnical business owners.
- Touch-friendly, keyboard-accessible, high contrast, descriptive alt text, usable in low bandwidth.
- In every dashboard, prefer "What should I do next?" and evidence over unexplained technical metrics.

## 9. Privacy, safety and trust

- Transparent privacy notice/terms, minimum necessary personal data and consent/appropriate legal basis under Nigerian law.
- Do not require persistent precise GPS history for local search; prefer city/area preference and short-lived coordinates if necessary.
- Server-side keys; secure sessions; prevent unauthorized read/write of another business's data.
- Restrict messaging to signed-in users; moderate spam, scams, impersonation and unsafe content.
- Clear badge copy: "Business management access verified" — not "Jado guarantees quality."
- Review source attribution and Google brand/rights requirements mandatory.
- No fabricated screenshots, revenue metrics, customer testimonials or AI outputs.

## 10. Release, measurement and external gates

### Public beta release gates

1. At least one genuine end-to-end Google owner-authorized claim and public activation in a compliant environment.
2. At least one real business publishes a structured offer, which becomes searchable and appears in Feed.
3. Public search and side-by-side comparison work without login.
4. A registered visitor sends a Jado message and the business receives/responds.
5. AI assistant returns grounded real records, handles zero matches honestly and has cost limits, **if live AI is approved and activated**.
6. Staff can report, suspend and resolve abusive content/accounts.
7. No deceptive demo data in production, no hidden paid API activity, no unverified verification badges.

### KPIs

- Verified businesses (goal 100 by Dec 31); activated businesses with first post; weekly active business owners.
- Median time to first published useful post; percent receiving at least one customer inquiry.
- Explore searches; search-to-profile CTR; profile-to-Jado-message conversion; profile-to-external-contact click.
- Answered inquiries and median business response time when sample sufficient.
- 7-day returning consumers; 7-day returning owners; posts per active business.
- AI intent coverage, grounded-answer rate, honest-abstention rate, cost per request.
- Interviews: reasons to join, reasons to abandon, missing features and willingness to pay.

### Dependencies to track as explicit blockers, not silently work around

- Google Maps Places terms, access/billing/attribution; approved Business Profile API access and OAuth review.
- Secure production hosting, storage, database and notifications; paid tiers require approval.
- Google and social platform policies; human support capacity for onboarding and Pro work.
- Actual production domain, email/OTP delivery, AI provider budget and payment provider.

## 11. Source references reviewed, 15 November 2026

- Google Places API policy: https://developers.google.com/maps/documentation/places/web-service/policies
- Google Places API fields: https://developers.google.com/maps/documentation/places/web-service/place-details
- Google Business Profile basic setup: https://developers.google.com/my-business/content/basic-setup
- Google Business Profile owner/manager access: https://support.google.com/business/answer/3403100
- Google request ownership: https://support.google.com/business/answer/4566671
- Google Business Profile review API: https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
- Browser geolocation: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Nigerian Data Protection Act: https://ndpc.gov.ng/wp-content/uploads/2024/03/Nigeria_Data_Protection_Act_2023.pdf

**Document boundary:** This PRD sets product requirements. Screen-level contracts, data/API architecture, verified acceptance tests and Codex execution prompts are defined in the companion documents. Any unapproved implementation decision belongs in a decision log, not silently in the codebase.
