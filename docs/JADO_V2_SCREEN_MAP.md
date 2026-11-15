# Jado v2 — Screen Map and Interaction Contracts

**Status:** Implementation handoff draft, 15 November 2026  
**Related:** JADO_V2_MASTER_PRD.md, JADO_V2_MILESTONES_ACCEPTANCE.md

## 1. Navigation rules

- **Public:** Explore, Feed, Compare, Learn, and Account access. Public profiles, details, offers and educational content do not require account creation.
- **Owner:** Business Dashboard appears after sign-in and ownership activation. An applicant sees a pending/recovery area instead.
- **Staff:** Separate protected /admin experience; not exposed via public navigation.
- **Location:** First entry prompts "Use current location" or "Choose city/area." Selection is required for locally scoped defaults. GPS sharing is **not** required. A city/area control remains visible so visitors can search other places.
- **Protected actions:** Message, Follow, Like, business claiming/editing and subscriptions prompt sign-in, preserving return destination.
- **All navigations:** Functional browser back/forward and shareable URLs. Never trap visitors in a modal.
- **Mobile-first:** Bottom tabs are a conceptual pattern; responsive desktop layouts use top/side navigation. No native app required.

## 2. Map overview

Public:

- L01 Location welcome/select
- P01 Explore / Discover home
- P02 Search results and filters
- P03 Category/area listing
- P04 Business detail
- P05 Offer/product/service detail
- P06 Feed
- P07 Compare builder
- P08 Comparison result
- P09 AI assistant
- P10 Learn index
- P11 Learn article/lesson
- P12 Verification meaning / trust explanation
- P13 Help/contact/support / report listing

Shared account:

- A01 Sign in/register
- A02 Email verification/account recovery
- A03 Personal account / selected area
- A04 Following / saved businesses
- A05 Consumer inbox
- A06 Conversation detail
- A07 Notifications

Business onboarding and owner:

- O01 Add business / search Google
- O02 Google match selection/details
- O03 Google authorize and verify access
- O04 Access unavailable / claim assistance
- O05 Claim pending/status
- O06 Business profile completion
- O07 Brand identity & media
- O08 Owner overview
- O09 Business profile editor
- O10 Business posts list
- O11 Post composer
- O12 Owner inbox
- O13 Analytics
- O14 Competitor comparison
- O15 Share/QR business profile
- O16 Social connections
- O17 Owner settings / membership
- O18 Pro hub (later)
- O19 Audit report / account-manager chat (later)

Admin and editorial:

- S01 Admin dashboard
- S02 Verification queue and ownership dispute
- S03 Business directory/state editor
- S04 Content/moderation queue
- S05 Abuse reports and support
- S06 Categories/featured/ordering controls
- S07 Learn article editor
- S08 Audit and account-manager workbench (later)
- S09 Platform analytics
- S10 Staff roles/audit log

## 3. Detailed public screens

### L01 — Choose where to look

**Who:** Everyone. **Route concept:** /location or first-visit location sheet.  
**Essential elements:** Current-area button, city/area selector, permission explanation, fallback text for denied GPS.  
**Actions:** Select location; continue Explore; later revise from global selector.  
**Validation:** Uyo can be manually chosen. Denying GPS must not block the product if an area is selected. Do not imply a manually chosen city proves user's physical residence.

### P01 — Explore / Discover

**Who:** Anonymous and signed-in. **Route:** /  
**Components:** Search input with product/service/business queries; selected location; categories; "Recently added", "Latest offers", "Recently active", "Most viewed this week", "Trending"; verified business cards; snippets from structured offers; optional labeled featured strip.  
**Actions:** Search, change area, open business/offer, compare selections, open AI, follow (login gate), message (login gate).  
**Empty state:** "We don't have verified Jado businesses matching this search in [area] yet"; refine area/category.  
**Data labels:** Most viewed = observed Jado visits; Highly Reviewed = Google rating + total rating count, not Jado customer reviews. No unconfirmed "latest reviewed" feed.

### P02 — Search results

**Route:** /search?q=...&area=...  
**Components:** Query, business/result count, service/product hits in context, filters for area/category/offer type, explicit sort labels, loading/no-result states.  
**Actions:** Result detail, compare checkbox, follow, message.  
**Rule:** Search only verified active Jado business content. Product keyword matched in post does not imply inventory is currently in stock.

### P03 — Category / area

**Route:** /explore/[category]?area=...  
**Components:** Category summary, location scope, verified cards, activity.  
**Rule:** Any Google-listed category may onboard; categories shown in nav can emphasize locally populated categories without rejecting others.

### P04 — Business profile

**Route:** /b/[business-slug] (persistent unique ID behind slug)  
**Top:** Jado-verification badge with accurate explanation, Google-controlled name/address/contact/hours as available, owner logo (if supplied), 0–5 permitted Google photos with attribution, Jado media gallery.  
**Tabs/sections:** About, Products & Services, Offers/Posts, Gallery, Google Reviews (only permitted display and Google link), Details/Contact.  
**Primary CTA:** Message on Jado. Secondary: WhatsApp, call, directions, website and supported social links.  
**Additional:** Follow, compare, share/QR, report, "last data refresh" where valid.  
**Permissions:** No public owner-edit control. Never expose a pending applicant as verified.

### P05 — Structured post/product detail

**Route:** /posts/[post-id]  
**Content:** Type badge, title, media, description, service/product tags, optional clearly owner-declared price, relevant expiry/date, source business and contact CTA.  
**Actions:** Message business with post context, share, like (login gate), view business.  
**States:** Active, expired promotion, archived/not found, flagged/taken down.

### P06 — Feed

**Route:** /feed  
**Components:** Recent business-only structured posts, category/area filters, Following feed if signed in, clear content type and business attribution.  
**Actions:** View detail, like, follow, message seller, filter.  
**Rules:** No consumer text/status posting. Personal content is moderated.

### P07 — Compare builder

**Route:** /compare  
**Components:** Up to 3 slots, search verified businesses by category/area, prevent exact duplicates; explain that comparisons require sufficient common fields.  
**Actions:** Add/remove businesses, view comparison.  
**States:** 0/1 selected, mismatched categories, cannot compare because data insufficient.

### P08 — Comparison result

**Route:** /compare?ids=...  
**Components:** Transparent side-by-side table, review average **and sample size**, available offers/prices, owner-verification, published business activity, hours, distance if usable, response-time signal only if threshold met. Show available/unavailable/unknown distinctly.  
**Actions:** View individual business, Message on Jado, change businesses, share comparison.  
**Rules:** No unqualified universal "best" label. No invented quality/price claims or hidden paid preference.

### P09 — Jado AI

**Route:** /ask  
**Components:** Location context, conversation input, suggested queries, answer summaries, cited/linked verified business cards, clarification prompts, explicit uncertainty, quota/availability indicator.  
**Actions:** Ask, refine area/category, open compare, open business, message.  
**Zero-result state:** Honest "Jado doesn't yet have enough verified listings for this request in [area]."  
**Blocked provider state:** Clearly label AI as temporarily unavailable; offer ordinary Explore search rather than a simulated AI.

### P10 / P11 — Learn

**Routes:** /learn and /learn/[slug]  
**Components:** Topic categories (Google profiles, brand, SEO, social, customer acquisition, sales/conversion), featured lessons, reading time, article body, related lessons.  
**MVP:** Read-only public content; administrative publishing can follow. No forced purchase or login.

### P12 / P13 — Trust and support

**Routes:** /verification and /help  
**Components:** Exact meaning of Jado verification, Google's review attribution, how to report a business, contact support, owner claim issues and abuse.  
**Rule:** Do not say verification means government registration, endorsement or quality guarantee.

## 4. Shared account screens

### A01 Sign in / register

Minimal friction (Google login and/or email, final provider to be selected at M0); sign-in required for messaging/following/likes, but browsing remains open. Preserve next route. Never equate Google OAuth identity with access to a GBP location.

### A02 Verification/recovery

Verify email/session as required; rate limit OTP and password reset; useful errors. Paid SMS is not assumed.

### A03/A04 Profile and Following

Selected default area, profile basics, communication preferences, followed businesses, account deletion and privacy access.

### A05/A06 Consumer inbox and chat

Conversation list; participant and business name; associated post context; messages with timestamps; reply status; report/block; no public access without signed-in membership. Empty, sending, failed-delivery and retry states.

### A07 Notifications

Message replies, verified business activity from follows where supported, account/security notices; granular preferences.

## 5. Business onboarding and dashboard screens

### O01 Search Google

Search field with candidate name/location/category; possible matches; no-result support; never create arbitrary "verified" record.

### O02 Match confirmation

Show selected Google candidate and visible details with attribution. Confirm correct business. Prevent another active claim of same Place ID.

### O03 Authorized business verification

Connect Google Business Profile account, show requested access, detect membership to matching verified location via approved API, grant active management only upon positive evidence. Handle canceled OAuth, expired tokens, wrong account, unavailable API and listing already claimed.

### O04/O05 Access recovery and status

Explain options: switch account; ask existing GBP owner/manager to invite; use Google's ownership request process; contact Jado support. Save application ID, place ID, claimant contact, history/status. No premature verified profile or posting rights.

### O06 Profile completion

Owner uploads original logo, categories/tags, business description, product/service offerings, supplementary contacts. Google name/address/primary phone are visibly read-only.

### O07 Brand kit

Logo, palette (hex values), typography preferences (optional), tagline, brand voice and original imagery. Do not claim that merely filling fields confirms a professional brand identity.

### O08 Owner overview

Business name/state, next-action card, recent Jado profile views, follows, published posts, received/responded messages, basic comparison links, "Share profile" and "Create post." Counts clearly defined.

### O09 Profile editor

Jado-editable owner data only. Google-sourced fields visibly link to Google change instructions. Draft/publish validation; preview before save.

### O10/O11 Posts list/composer

List by active/draft/expired/archived; create post with required type; adapt form fields by post type; upload owner media; validate dates/pricing; preview, publish/edit/archive; message-link preview.

### O12 Owner inbox

Incoming customer conversations with source post, time and unread badge; replies, blocking/reporting and notifications. Pro manager chat is a **separate** later screen.

### O13 Analytics

Views, followers, engagement, inquiries and changes over selected windows. Explain what is measured and show "insufficient data" if appropriate. Never infer actual sales from clicks.

### O14 Competitors

Comparison builder and owner-specific factual gaps. Explicitly separate public competitor facts from owner's private analytics.

### O15 Share business

Canonical link, Copy Link, share via available browser feature, download QR code; QR target opens public profile without sign-in.

### O16 Social connections

Initially verified/owner-declared social links only; connection state and supported API scopes are truthful. "Connected" must not imply automatic monitoring/import unless implemented.

### O17 Business users/settings

Business membership, role display, logout, ownership recovery, transfer request, privacy, preferences and deactivation.

### O18/O19 Pro (later)

Plan details and agreed limits, request form, audits with dates and evidence, assigned manager chat, next review, billing status. Never show unperformed "automatic" audit results.

## 6. Admin/operational screens

| ID | Screen | Minimum actions |
|---|---|---|
| S01 | Admin overview | View registrations, pending claims, active profiles, post reports, messages needing support |
| S02 | Claim/dispute queue | View authorization evidence, request more proof, approve only against approved proof policy, reject/suspend and log |
| S03 | Business management | Find by internal ID/Place ID, freeze, activate/deactivate, trace duplicate links and protected status |
| S04 | Content moderation | Review flagged posts/media, remove, restore, warn/suspend |
| S05 | Support and abuse | Triage claim/reported-message cases, limited audited conversation access |
| S06 | Taxonomy/featured | Manage categories, editorial sections and later clearly labeled promos |
| S07 | Learn CMS | Draft/review/publish/archive content with roles |
| S08 | Pro workbench | Assign analysts, create manual reports, message assigned customers |
| S09 | Analytics | Acquisition, onboarding, searches, contacts, owner retention, AI budgets/errors |
| S10 | Security | Roles/permissions, audit log and high-risk actions |

## 7. Error and accessibility requirements for every screen

Every route must handle loading, empty, no-connection, unauthorized, suspended account, deleted entity, API unavailable and retry states. Interfaces need keyboard operation, responsive layout, accessible focus and labels, and no fake metrics or dummy successes in production.

**Implementation order:** Follow JADO_V2_MILESTONES_ACCEPTANCE.md. Do not create every screen at once merely because this map lists them.
